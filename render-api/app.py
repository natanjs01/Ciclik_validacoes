"""
API Ciclik - Consulta de Produtos via Cosmos Bluesoft
Hospedagem: Render.com
Endpoint: GET /api/produtos/{gtin}
"""

from flask import Flask, jsonify, request
from flask_cors import CORS
import urllib.request
import json
import ssl
import os

app = Flask(__name__)
CORS(app)  # Permitir requisições do frontend Ciclik

# Token da API Cosmos (use variável de ambiente no Render)
COSMOS_TOKEN = os.environ.get('COSMOS_TOKEN', 'uptGgat1OvUO_fkHKD1pYQ')

# Token de autenticação para a API (proteção básica)
API_TOKEN = os.environ.get('API_TOKEN', 'ciclik_secret_token_2026')

# Contexto SSL (necessário para Cosmos)
ssl_context = ssl._create_unverified_context()


def validar_gtin(gtin):
    """Valida se o GTIN tem 13 dígitos numéricos"""
    if not gtin:
        return False, "GTIN não fornecido"
    if not gtin.isdigit():
        return False, "GTIN deve conter apenas números"
    if len(gtin) != 13:
        return False, f"GTIN deve ter 13 dígitos (recebido: {len(gtin)})"
    return True, "OK"


def consultar_cosmos(gtin):
    """Consulta a API Cosmos Bluesoft"""
    headers = {
        'X-Cosmos-Token': COSMOS_TOKEN,
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
        return data, None
    except urllib.error.HTTPError as e:
        if e.code == 404:
            return None, "Produto não encontrado na base Cosmos"
        return None, f"Erro HTTP {e.code}: {e.reason}"
    except urllib.error.URLError as e:
        return None, f"Erro de conexão: {str(e.reason)}"
    except Exception as e:
        return None, f"Erro inesperado: {str(e)}"


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
    if peso_liquido and isinstance(peso_liquido, str):
        # Tentar extrair número (ex: "1kg" -> 1000)
        peso_liquido = peso_liquido.replace('kg', '').replace('g', '').strip()
        try:
            peso_liquido = float(peso_liquido)
            if peso_liquido < 100:  # Provavelmente está em kg
                peso_liquido = peso_liquido * 1000
        except:
            peso_liquido = None
    
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
        "peso_liquido": peso_liquido,
        "peso_bruto": data.get('gross_weight'),
        "imagem_url": data.get('thumbnail'),
        "mensagem": "Produto encontrado com sucesso"
    }


@app.route('/')
def home():
    """Endpoint raiz - informações da API"""
    return jsonify({
        "nome": "Ciclik API - Consulta de Produtos",
        "versao": "1.0.0",
        "status": "online",
        "endpoints": {
            "consulta_produto": "GET /api/produtos/{gtin}",
            "health_check": "GET /health"
        },
        "documentacao": "https://github.com/natanjs01/Ciclik_validacoes"
    })


@app.route('/health')
def health():
    """Health check para monitoramento"""
    return jsonify({"status": "healthy", "timestamp": "2026-01-22"}), 200


@app.route('/api/produtos/<gtin>', methods=['GET'])
def consultar_produto(gtin):
    """
    Consulta produto por GTIN
    
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
    
    # Consultar Cosmos
    data, erro = consultar_cosmos(gtin)
    
    if erro:
        if "não encontrado" in erro.lower():
            return jsonify({
                "encontrado": False,
                "ean_gtin": gtin,
                "mensagem": erro
            }), 200
        else:
            return jsonify({
                "erro": "Erro na consulta",
                "mensagem": erro,
                "ean_gtin": gtin
            }), 500
    
    # Formatar e retornar resposta
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
