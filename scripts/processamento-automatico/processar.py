#!/usr/bin/env python3
"""
🤖 PROCESSAMENTO AUTOMÁTICO DE PRODUTOS - CICLIK
================================================

Script executado pelo GitHub Actions para processar produtos pendentes
automaticamente na madrugada, aproveitando os 100 créditos diários da API Bluesoft.

Fluxo:
1. Conecta no Supabase
2. Busca produtos com status 'pendente'
3. Consulta API Render (que rotaciona tokens Bluesoft)
4. Atualiza status e dados no Supabase
5. Gera relatório detalhado

Autor: Sistema Ciclik
Data: 26/01/2026
"""

import os
import sys
import json
import time
import requests
from datetime import datetime
from typing import Dict, List, Optional

# ==================== CONFIGURAÇÃO ====================

SUPABASE_URL = os.environ.get('SUPABASE_URL')
SUPABASE_KEY = os.environ.get('SUPABASE_SERVICE_KEY')
API_RENDER_URL = os.environ.get('API_RENDER_URL', 'https://ciclik-api-produtos.onrender.com')
API_RENDER_TOKEN = os.environ.get('API_RENDER_TOKEN', 'ciclik_secret_token_2026')
LIMITE_PRODUTOS = int(os.environ.get('LIMITE_PRODUTOS', '100'))
MODO_TESTE = os.environ.get('MODO_TESTE', 'false').lower() == 'true'

# Validação de variáveis obrigatórias
if not SUPABASE_URL or not SUPABASE_KEY:
    print("❌ ERRO: Variáveis SUPABASE_URL e SUPABASE_SERVICE_KEY são obrigatórias!")
    print("Configure nos Settings > Secrets and variables > Actions do GitHub")
    sys.exit(1)

# Headers Supabase
SUPABASE_HEADERS = {
    'apikey': SUPABASE_KEY,
    'Authorization': f'Bearer {SUPABASE_KEY}',
    'Content-Type': 'application/json',
    'Prefer': 'return=representation'
}

# ==================== FUNÇÕES AUXILIARES ====================

def log(mensagem: str, nivel: str = 'INFO'):
    """Log formatado com timestamp"""
    timestamp = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
    icone = {
        'INFO': 'ℹ️',
        'SUCCESS': '✅',
        'WARNING': '⚠️',
        'ERROR': '❌',
        'DEBUG': '🔍'
    }.get(nivel, 'ℹ️')
    
    print(f"[{timestamp}] {icone} {mensagem}")

def buscar_produtos_pendentes(limite: int = 100) -> List[Dict]:
    """Busca produtos com status 'pendente' ou 'acao_manual' no Supabase"""
    log(f"Buscando até {limite} produtos pendentes...")
    
    url = f"{SUPABASE_URL}/rest/v1/produtos_em_analise"
    params = {
        'status': 'in.(pendente,acao_manual)',
        'order': 'created_at.asc',
        'limit': limite,
        'select': 'id,ean_gtin,descricao,created_at'
    }
    
    try:
        response = requests.get(url, headers=SUPABASE_HEADERS, params=params, timeout=30)
        response.raise_for_status()
        produtos = response.json()
        
        log(f"Encontrados {len(produtos)} produtos para processar", 'SUCCESS')
        return produtos
    
    except requests.exceptions.RequestException as e:
        log(f"Erro ao buscar produtos: {e}", 'ERROR')
        return []

def validar_gtin(gtin: str) -> bool:
    """Valida formato do GTIN (8, 12, 13 ou 14 dígitos numéricos)"""
    if not gtin or not isinstance(gtin, str):
        return False
    
    # Remove espaços
    gtin = gtin.strip()
    
    # Verifica se é numérico
    if not gtin.isdigit():
        return False
    
    # Verifica tamanho (GTIN-8, GTIN-12, GTIN-13, GTIN-14)
    return len(gtin) in [8, 12, 13, 14]

def consultar_api_render(gtin: str, retry: int = 3) -> Optional[Dict]:
    """Consulta a API Render com retry para cold start"""
    
    # Validar GTIN antes de consultar
    if not validar_gtin(gtin):
        log(f"  ⚠️ GTIN {gtin}: Formato inválido (apenas 8, 12, 13 ou 14 dígitos)", 'WARNING')
        return {
            'dados': {'encontrado': False, 'mensagem': 'GTIN inválido'},
            'tempo_resposta': 0,
            'sucesso': False,
            'erro': 'GTIN_INVALIDO'
        }
    
    url = f"{API_RENDER_URL}/api/produtos/{gtin}"
    headers = {
        'Authorization': f'Bearer {API_RENDER_TOKEN}',
        'Content-Type': 'application/json'
    }
    
    for tentativa in range(1, retry + 1):
        try:
            tempo_inicio = time.time()
            response = requests.get(url, headers=headers, timeout=90)  # 90s para cold start
            tempo_resposta = int((time.time() - tempo_inicio) * 1000)
            
            if response.status_code == 200:
                dados = response.json()
                log(f"  ✅ GTIN {gtin}: {dados.get('encontrado', False)} ({tempo_resposta}ms)", 'DEBUG')
                return {
                    'dados': dados,
                    'tempo_resposta': tempo_resposta,
                    'sucesso': True
                }
            
            elif response.status_code == 429:
                log(f"  🚫 GTIN {gtin}: Rate limit atingido (429)", 'WARNING')
                return {
                    'dados': None,
                    'tempo_resposta': tempo_resposta,
                    'sucesso': False,
                    'erro': 'RATE_LIMIT'
                }
            
            else:
                log(f"  ⚠️ GTIN {gtin}: HTTP {response.status_code}", 'WARNING')
                
        except requests.exceptions.Timeout:
            if tentativa < retry:
                log(f"  ⏱️ Timeout (tentativa {tentativa}/{retry}) - Cold start detectado", 'WARNING')
                time.sleep(5 * tentativa)  # Backoff exponencial
                continue
            else:
                log(f"  ❌ GTIN {gtin}: Timeout após {retry} tentativas", 'ERROR')
        
        except requests.exceptions.RequestException as e:
            log(f"  ❌ GTIN {gtin}: Erro de rede - {e}", 'ERROR')
    
    return None

def atualizar_produto_supabase(produto_id: str, dados_api: Dict, tempo_resposta: int) -> bool:
    """Atualiza produto no Supabase com dados da API"""
    if MODO_TESTE:
        log(f"  [TESTE] Produto {produto_id} seria atualizado", 'DEBUG')
        return True
    
    url = f"{SUPABASE_URL}/rest/v1/produtos_em_analise"
    params = {'id': f'eq.{produto_id}'}
    
    payload = {
        'dados_api': dados_api,
        'consultado_em': datetime.utcnow().isoformat(),
        'status': 'consultado',
        'updated_at': datetime.utcnow().isoformat()
    }
    
    try:
        response = requests.patch(url, headers=SUPABASE_HEADERS, params=params, json=payload, timeout=30)
        response.raise_for_status()
        return True
    
    except requests.exceptions.RequestException as e:
        log(f"  ❌ Erro ao atualizar produto {produto_id}: {e}", 'ERROR')
        return False

def registrar_log_consulta(admin_id: str, produto_id: str, gtin: str, sucesso: bool, tempo_resposta: int, resposta_api: Dict) -> bool:
    """Registra consulta no log_consultas_api (ignora duplicatas silenciosamente)"""
    if MODO_TESTE:
        log(f"  [TESTE] Log seria registrado para {gtin}", 'DEBUG')
        return True
    
    url = f"{SUPABASE_URL}/rest/v1/log_consultas_api"
    
    payload = {
        'admin_id': admin_id,
        'produto_id': produto_id,
        'ean_gtin': gtin,
        'sucesso': sucesso,
        'tempo_resposta_ms': tempo_resposta,
        'resposta_api': resposta_api,
        'erro_mensagem': None if sucesso else resposta_api.get('mensagem')
    }
    
    try:
        response = requests.post(url, headers=SUPABASE_HEADERS, json=payload, timeout=30)
        
        # Se for 409 (Conflict), significa que já existe log para este produto
        # Isso é NORMAL e esperado - não loga nada
        if response.status_code == 409:
            return True
        
        response.raise_for_status()
        return True
    
    except requests.exceptions.RequestException as e:
        # Apenas loga como debug se for erro diferente de 409
        log(f"  ⚠️ Erro ao registrar log para {gtin}: {e}", 'WARNING')
        return False

def obter_status_tokens() -> Optional[Dict]:
    """Consulta status dos tokens na API Render (suporta cold start)"""
    url = f"{API_RENDER_URL}/api/status/tokens"
    headers = {'Authorization': f'Bearer {API_RENDER_TOKEN}'}
    
    try:
        # Timeout de 90s para suportar cold start (Render pode demorar 30-60s)
        response = requests.get(url, headers=headers, timeout=90)
        response.raise_for_status()
        return response.json()
    
    except requests.exceptions.Timeout:
        log(f"⏱️ Timeout ao obter status dos tokens (cold start detectado - aguardando API acordar...)", 'WARNING')
        # Não é crítico, retorna None e continua processamento
        return None
    
    except requests.exceptions.RequestException as e:
        log(f"⚠️ Erro ao obter status dos tokens: {e}", 'WARNING')
        # Não é crítico, retorna None e continua processamento
        return None

def obter_admin_id() -> str:
    """
    Obtém ID de um admin para registrar logs.
    Usa a tabela 'profiles' (padrão Supabase Auth) ou ID genérico como fallback.
    """
    # Busca na tabela profiles (padrão Supabase Auth)
    url = f"{SUPABASE_URL}/rest/v1/profiles"
    params = {
        'limit': 1,
        'select': 'id'
    }
    
    try:
        response = requests.get(url, headers=SUPABASE_HEADERS, params=params, timeout=30)
        
        # Se a tabela existe e tem dados
        if response.status_code == 200:
            usuarios = response.json()
            if usuarios and len(usuarios) > 0:
                admin_id = usuarios[0]['id']
                log(f"✅ Admin ID encontrado: {admin_id[:8]}...", 'DEBUG')
                return admin_id
        
        # Se não encontrou ou tabela não existe, usa ID genérico
        log("⚠️ Tabela 'profiles' não encontrada ou vazia - usando ID genérico", 'WARNING')
        return '00000000-0000-0000-0000-000000000000'
    
    except requests.exceptions.RequestException as e:
        # Falha na requisição, usa ID genérico
        log(f"⚠️ Erro ao buscar admin: {e}", 'WARNING')
        return '00000000-0000-0000-0000-000000000000'

# ==================== FUNÇÃO PRINCIPAL ====================

def main():
    """Função principal de processamento"""
    
    log("=" * 60)
    log("🤖 INICIANDO PROCESSAMENTO AUTOMÁTICO DE PRODUTOS", 'INFO')
    log("=" * 60)
    
    if MODO_TESTE:
        log("⚠️ MODO DE TESTE ATIVADO - Nenhuma alteração será feita no banco", 'WARNING')
    
    # Status inicial dos tokens
    log("\n📊 Status inicial dos tokens:")
    status_inicial = obter_status_tokens()
    if status_inicial:
        resumo = status_inicial.get('resumo', {})
        log(f"  Total usado: {resumo.get('total_usado', 0)}/100")
        log(f"  Disponível: {resumo.get('total_disponivel', 100)}")
    
    # Buscar admin ID
    admin_id = obter_admin_id()
    log(f"\n👤 Admin ID: {admin_id}")
    
    # Buscar produtos pendentes
    produtos = buscar_produtos_pendentes(LIMITE_PRODUTOS)
    
    if not produtos:
        log("\n✅ Nenhum produto pendente para processar!", 'SUCCESS')
        return
    
    # Estatísticas
    estatisticas = {
        'total': len(produtos),
        'sucesso': 0,
        'nao_encontrado': 0,
        'erro': 0,
        'gtin_invalido': 0,
        'rate_limit': 0,
        'tempo_total': 0
    }
    
    log(f"\n🔄 Processando {estatisticas['total']} produtos...\n")
    
    tempo_inicio_geral = time.time()
    
    # Processar cada produto
    for i, produto in enumerate(produtos, 1):
        produto_id = produto['id']
        gtin = produto['ean_gtin']
        descricao = produto.get('descricao', 'Sem descrição')[:50]
        
        log(f"[{i}/{estatisticas['total']}] Processando: {gtin} - {descricao}")
        
        # Consultar API
        resultado = consultar_api_render(gtin)
        
        if not resultado:
            estatisticas['erro'] += 1
            continue
        
        # Verificar GTIN inválido
        if resultado.get('erro') == 'GTIN_INVALIDO':
            estatisticas['gtin_invalido'] += 1
            # Ainda atualiza o produto para 'consultado' com erro
            atualizar_produto_supabase(produto_id, resultado['dados'], 0)
            continue
        
        # Verificar rate limit
        if resultado.get('erro') == 'RATE_LIMIT':
            estatisticas['rate_limit'] += 1
            log("  🚫 Limite diário atingido - Interrompendo processamento", 'WARNING')
            break
        
        # Processar resultado
        dados_api = resultado.get('dados', {})
        tempo_resposta = resultado.get('tempo_resposta', 0)
        encontrado = dados_api.get('encontrado', False)
        
        if encontrado:
            estatisticas['sucesso'] += 1
        else:
            estatisticas['nao_encontrado'] += 1
        
        # Atualizar no Supabase
        if atualizar_produto_supabase(produto_id, dados_api, tempo_resposta):
            # Registrar log
            registrar_log_consulta(admin_id, produto_id, gtin, encontrado, tempo_resposta, dados_api)
        
        estatisticas['tempo_total'] += tempo_resposta
        
        # Delay entre requisições (evitar sobrecarga)
        time.sleep(0.5)
    
    tempo_total_geral = time.time() - tempo_inicio_geral
    
    # Relatório final
    log("\n" + "=" * 60)
    log("📊 RELATÓRIO FINAL", 'SUCCESS')
    log("=" * 60)
    log(f"✅ Produtos encontrados: {estatisticas['sucesso']}")
    log(f"❌ Produtos não encontrados: {estatisticas['nao_encontrado']}")
    log(f"⚠️ GTINs inválidos: {estatisticas['gtin_invalido']}")
    log(f"⚠️ Erros de rede/API: {estatisticas['erro']}")
    log(f"🚫 Rate limit: {estatisticas['rate_limit']}")
    log(f"⏱️ Tempo total: {tempo_total_geral:.2f}s")
    
    # Calcula tempo médio apenas dos produtos que foram processados
    processados = estatisticas['sucesso'] + estatisticas['nao_encontrado']
    if processados > 0:
        log(f"⚡ Tempo médio por produto: {estatisticas['tempo_total'] / processados:.0f}ms")
    
    # Status final dos tokens
    log("\n📊 Status final dos tokens:")
    status_final = obter_status_tokens()
    if status_final:
        resumo = status_final.get('resumo', {})
        log(f"  Total usado: {resumo.get('total_usado', 0)}/100")
        log(f"  Disponível: {resumo.get('total_disponivel', 100)}")
    
    log("\n✅ PROCESSAMENTO CONCLUÍDO!", 'SUCCESS')
    log("=" * 60)
    
    # Exit code baseado no sucesso
    if estatisticas['erro'] > estatisticas['sucesso']:
        sys.exit(1)  # Mais erros que sucessos = falha
    else:
        sys.exit(0)  # Sucesso

# ==================== EXECUÇÃO ====================

if __name__ == '__main__':
    try:
        main()
    except KeyboardInterrupt:
        log("\n⚠️ Processamento interrompido pelo usuário", 'WARNING')
        sys.exit(130)
    except Exception as e:
        log(f"\n❌ ERRO FATAL: {e}", 'ERROR')
        import traceback
        traceback.print_exc()
        sys.exit(1)
