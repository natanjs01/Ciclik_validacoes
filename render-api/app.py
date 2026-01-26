"""
API Ciclik - Consulta de Produtos via Cosmos Bluesoft
Hospedagem: Render.com
Endpoint: GET /api/produtos/{gtin}

VERSÃO COM SISTEMA DE ROTAÇÃO DE TOKENS
- Suporta até 4 tokens (BLUESOFT_TOKEN_1, 2, 3, 4)
- Rotação automática quando atinge limite (25 consultas/dia por token)
- Reset diário às 00:00
- Endpoint de monitoramento: GET /api/status/tokens
"""

from flask import Flask, jsonify, request
from flask_cors import CORS
import urllib.request
import json
import ssl
import os
from datetime import datetime

app = Flask(__name__)
CORS(app)  # Permitir requisições do frontend Ciclik

# ==================== CONFIGURAÇÃO DE TOKENS ====================

# Token de autenticação para a API (proteção básica)
API_TOKEN = os.environ.get('API_TOKEN', 'ciclik_secret_token_2026')

# Carregar tokens do Bluesoft (suporta até 4)
TOKENS = [
    os.environ.get('BLUESOFT_TOKEN_1'),
    os.environ.get('BLUESOFT_TOKEN_2'),
    os.environ.get('BLUESOFT_TOKEN_3'),
    os.environ.get('BLUESOFT_TOKEN_4'),
]

# Remover tokens vazios (None ou '')
TOKENS = [t for t in TOKENS if t]

# Fallback para COSMOS_TOKEN (compatibilidade com versão antiga)
if not TOKENS:
    cosmos_token = os.environ.get('COSMOS_TOKEN')
    if cosmos_token:
        TOKENS = [cosmos_token]

if not TOKENS:
    print("⚠️  AVISO: Nenhum token Bluesoft configurado!")
    print("Configure pelo menos BLUESOFT_TOKEN_1 ou COSMOS_TOKEN")

# Limite diário por token (plano Basic = 25 consultas/dia)
TOKEN_DAILY_LIMIT = 25

# Controle de uso por token
token_usage = {}  # {token: count}
last_reset_day = datetime.now().day

print(f"✅ Sistema de rotação iniciado com {len(TOKENS)} token(s)")

# Contexto SSL (necessário para Cosmos)
ssl_context = ssl._create_unverified_context()


# ==================== FUNÇÕES DE CONTROLE DE TOKENS ====================

def get_current_day():
    """Retorna o dia atual (para detectar reset diário)"""
    return datetime.now().day


def reset_daily_counters():
    """Reseta contadores quando muda o dia"""
    global last_reset_day, token_usage
    current_day = get_current_day()
    
    if current_day != last_reset_day:
        print(f"🔄 Reset diário: {last_reset_day} -> {current_day}")
        token_usage.clear()
        last_reset_day = current_day


def get_available_token():
    """
    Retorna o próximo token disponível (que não atingiu o limite).
    Reseta contadores automaticamente se mudou o dia.
    """
    reset_daily_counters()
    
    for token in TOKENS:
        usado = token_usage.get(token, 0)
        if usado < TOKEN_DAILY_LIMIT:
            return token
    
    return None  # Todos os tokens esgotados


def increment_token_usage(token):
    """Incrementa o contador de uso de um token"""
    if token in token_usage:
        token_usage[token] += 1
    else:
        token_usage[token] = 1
    
    usado = token_usage[token]
    print(f"📊 Token ...{token[-6:]} usado {usado}/{TOKEN_DAILY_LIMIT}x hoje")


def get_token_status():
    """Retorna status de todos os tokens"""
    reset_daily_counters()
    
    status = []
    for i, token in enumerate(TOKENS, 1):
        usado = token_usage.get(token, 0)
        disponivel = TOKEN_DAILY_LIMIT - usado
        status.append({
            "token_id": f"BLUESOFT_TOKEN_{i}",
            "token_preview": f"...{token[-6:]}",
            "usado_hoje": usado,
            "disponivel": disponivel,
            "limite": TOKEN_DAILY_LIMIT,
            "status": "disponível" if disponivel > 0 else "esgotado"
        })
    
    total_usado = sum(token_usage.get(t, 0) for t in TOKENS)
    total_disponivel = sum(TOKEN_DAILY_LIMIT - token_usage.get(t, 0) for t in TOKENS)
    
    return {
        "tokens": status,
        "resumo": {
            "total_tokens": len(TOKENS),
            "total_usado": total_usado,
            "total_disponivel": total_disponivel,
            "limite_total": len(TOKENS) * TOKEN_DAILY_LIMIT
        },
        "ultimo_reset": f"Dia {last_reset_day}",
        "proximo_reset": "00:00 (meia-noite)"
    }


# ==================== FUNÇÕES DE VALIDAÇÃO E CONSULTA ====================

def validar_gtin(gtin):
    """Valida se o GTIN tem 13 dígitos numéricos"""
    if not gtin:
        return False, "GTIN não fornecido"
    if not gtin.isdigit():
        return False, "GTIN deve conter apenas números"
    if len(gtin) != 13:
        return False, f"GTIN deve ter 13 dígitos (recebido: {len(gtin)})"
    return True, "OK"


def consultar_cosmos(gtin, token):
    """Consulta a API Cosmos Bluesoft usando um token específico"""
    headers = {
        'X-Cosmos-Token': token,
        'Content-Type': 'application/json',
        'User-Agent': 'Ciclik-API-v1.0'
    }
    
    try:
        req = urllib.request.Request(
            f'https://api.cosmos.bluesoft.com.br/gtins/{gtin}.json',
            None,
            headers
        )
        response = urllib.request.urlopen(req, context=ssl_context, timeout=10)
        data = json.loads(response.read())
        return data, None, response.getcode()
    
    except urllib.error.HTTPError as e:
        if e.code == 404:
            return None, "Produto não encontrado na base Cosmos", 404
        elif e.code == 429:
            return None, "Limite de requisições atingido", 429
        return None, f"Erro HTTP {e.code}: {e.reason}", e.code
    
    except urllib.error.URLError as e:
        return None, f"Erro de conexão: {str(e.reason)}", None
    
    except Exception as e:
        return None, f"Erro inesperado: {str(e)}", None


def consultar_bluesoft_com_rotacao(gtin):
    """
    Consulta Bluesoft com rotação automática de tokens.
    Se um token retorna 429 (rate limit), tenta o próximo.
    """
    tentativas = 0
    max_tentativas = len(TOKENS)
    
    while tentativas < max_tentativas:
        token = get_available_token()
        
        if not token:
            return None, f"Todos os {len(TOKENS)} tokens esgotaram o limite diário de {TOKEN_DAILY_LIMIT} consultas. Próximo reset: 00:00 (meia-noite)", 429
        
        # Tentar consulta com este token
        data, erro, status_code = consultar_cosmos(gtin, token)
        
        # Se retornou 429 (rate limit), marcar token como esgotado e tentar próximo
        if status_code == 429:
            print(f"⚠️  Token ...{token[-6:]} atingiu limite (429)")
            token_usage[token] = TOKEN_DAILY_LIMIT  # Marcar como esgotado
            tentativas += 1
            continue
        
        # Se chegou aqui, consulta foi bem sucedida (ou erro diferente de 429)
        if status_code == 200 or status_code == 404:
            increment_token_usage(token)
        
        return data, erro, status_code
    
    # Se chegou aqui, todos os tokens retornaram 429
    return None, "Todos os tokens atingiram o limite de consultas", 429


def formatar_resposta(data):
    """Formata os dados da Cosmos para o padrão Ciclik"""
    if not data:
        return None
    
    # Extrair NCM (apenas os 8 dígitos, SEM descrição)
    ncm_code = data.get('ncm', {}).get('code', None)
    if ncm_code:
        # Remover pontos e garantir 8 dígitos
        ncm_code = ncm_code.replace('.', '').replace('-', '')[:8]
    
    # Peso em gramas (converter se necessário)
    peso_liquido = data.get('net_weight')
    peso_liquido_gramas = None
    
    if peso_liquido:
        if isinstance(peso_liquido, str):
            # Tentar extrair número (ex: "1kg" -> 1000, "500g" -> 500)
            peso_str = peso_liquido.replace('kg', '').replace('g', '').strip()
            try:
                peso_num = float(peso_str)
                if peso_liquido.lower().endswith('kg') or peso_num < 100:  # Está em kg
                    peso_liquido_gramas = int(peso_num * 1000)
                else:  # Já está em gramas
                    peso_liquido_gramas = int(peso_num)
            except:
                peso_liquido_gramas = None
        elif isinstance(peso_liquido, (int, float)):
            # Se é número, assumir kg se < 100, senão gramas
            if peso_liquido < 100:
                peso_liquido_gramas = int(peso_liquido * 1000)
            else:
                peso_liquido_gramas = int(peso_liquido)
    
    # Peso bruto em gramas
    peso_bruto = data.get('gross_weight')
    peso_bruto_gramas = None
    
    if peso_bruto:
        if isinstance(peso_bruto, str):
            peso_str = peso_bruto.replace('kg', '').replace('g', '').strip()
            try:
                peso_num = float(peso_str)
                if peso_bruto.lower().endswith('kg') or peso_num < 100:
                    peso_bruto_gramas = int(peso_num * 1000)
                else:
                    peso_bruto_gramas = int(peso_num)
            except:
                peso_bruto_gramas = None
        elif isinstance(peso_bruto, (int, float)):
            if peso_bruto < 100:
                peso_bruto_gramas = int(peso_bruto * 1000)
            else:
                peso_bruto_gramas = int(peso_bruto)
    
    return {
        "encontrado": True,
        "ean_gtin": data.get('gtin'),
        "descricao": data.get('description'),
        "marca": data.get('brand', {}).get('name') if data.get('brand') else None,
        "fabricante": data.get('brand', {}).get('name') if data.get('brand') else None,
        "categoria_api": data.get('category', {}).get('description') if data.get('category') else None,
        "ncm": ncm_code,
        "ncm_completo": f"{ncm_code} - {data.get('ncm', {}).get('description')}" if ncm_code and data.get('ncm', {}).get('description') else None,
        "preco_medio": data.get('avg_price'),
        "peso_liquido_em_gramas": peso_liquido_gramas,
        "peso_bruto_em_gramas": peso_bruto_gramas,
        "imagem_url": data.get('thumbnail'),
        "mensagem": "Produto encontrado com sucesso"
    }


# ==================== ROTAS DA API ====================

@app.route('/')
def home():
    """Endpoint raiz - informações da API"""
    return jsonify({
        "nome": "Ciclik API - Consulta de Produtos",
        "versao": "2.0.0 (com rotação de tokens)",
        "status": "online",
        "tokens_configurados": len(TOKENS),
        "endpoints": {
            "consulta_produto": "GET /api/produtos/{gtin}",
            "status_tokens": "GET /api/status/tokens",
            "health_check": "GET /health"
        },
        "documentacao": "https://github.com/natanjs01/Ciclik_validacoes"
    })


@app.route('/health')
def health():
    """Health check para monitoramento"""
    status = get_token_status()
    return jsonify({
        "status": "healthy",
        "timestamp": datetime.now().isoformat(),
        "tokens_disponiveis": status["resumo"]["total_disponivel"],
        "limite_total": status["resumo"]["limite_total"]
    }), 200


@app.route('/api/status/tokens', methods=['GET'])
def status_tokens():
    """
    Endpoint de monitoramento de tokens.
    Retorna uso de cada token e total disponível.
    
    Headers:
    - Authorization: Bearer {token} (opcional - recomendado em produção)
    """
    # Validar autenticação (opcional)
    auth_header = request.headers.get('Authorization')
    if auth_header and auth_header.startswith('Bearer '):
        token = auth_header.replace('Bearer ', '').strip()
        if token != API_TOKEN:
            return jsonify({
                "erro": "Token inválido",
                "mensagem": "Token de autorização não autorizado"
            }), 401
    
    status = get_token_status()
    return jsonify(status), 200


@app.route('/api/produtos/<gtin>', methods=['GET'])
def consultar_produto(gtin):
    """
    Consulta produto por GTIN com rotação automática de tokens.
    
    Parâmetros:
    - gtin: Código GTIN de 13 dígitos
    
    Headers:
    - Authorization: Bearer {token}
    """
    # Validar autenticação
    auth_header = request.headers.get('Authorization')
    if not auth_header or not auth_header.startswith('Bearer '):
        return jsonify({
            "erro": "Token de autorização não fornecido",
            "mensagem": "Use: Authorization: Bearer {token}"
        }), 401
    
    token = auth_header.replace('Bearer ', '').strip()
    if token != API_TOKEN:
        return jsonify({
            "erro": "Token inválido",
            "mensagem": "Token de autorização não autorizado"
        }), 401
    
    # Validar GTIN
    valido, mensagem = validar_gtin(gtin)
    if not valido:
        return jsonify({
            "erro": "GTIN inválido",
            "mensagem": mensagem,
            "ean_gtin": gtin
        }), 400
    
    # Consultar Bluesoft com rotação de tokens
    data, erro, status_code = consultar_bluesoft_com_rotacao(gtin)
    
    # Tratar erro de rate limit (todos os tokens esgotados)
    if status_code == 429:
        return jsonify({
            "erro": "Limite de consultas atingido",
            "mensagem": erro,
            "ean_gtin": gtin,
            "status_tokens": get_token_status()
        }), 429
    
    # Tratar produto não encontrado (404)
    if status_code == 404 or (erro and "não encontrado" in erro.lower()):
        return jsonify({
            "encontrado": False,
            "ean_gtin": gtin,
            "mensagem": erro or "Produto não encontrado na base Cosmos"
        }), 200
    
    # Tratar outros erros
    if erro:
        return jsonify({
            "erro": "Erro na consulta",
            "mensagem": erro,
            "ean_gtin": gtin
        }), 500
    
    # Formatar e retornar resposta de sucesso
    resposta = formatar_resposta(data)
    return jsonify(resposta), 200


@app.errorhandler(404)
def not_found(error):
    return jsonify({
        "erro": "Endpoint não encontrado",
        "mensagem": "Verifique a URL e tente novamente"
    }), 404


@app.errorhandler(500)
def internal_error(error):
    return jsonify({
        "erro": "Erro interno do servidor",
        "mensagem": "Entre em contato com o suporte"
    }), 500


if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    app.run(host='0.0.0.0', port=port, debug=False)
