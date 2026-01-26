"""
Teste do Sistema de Rotação de Tokens Bluesoft
Verifica comportamento da rotação automática e uso dos 4 tokens
"""

import requests
import json
import time
from datetime import datetime

# Configuração
API_URL = "https://ciclik-api.onrender.com"
API_TOKEN = "ciclik_secret_token_2026"

# Produtos para testar (GTINs reais da sua lista)
GTINS_TESTE = [
    "7899710006531",  # LAMP KIAN LED BIV A60 6500K 9W
    "7896026306416",  # JARDIANCE BOEHRINGER 10MG C/30 CPR (PBM)
    "7896369617552",  # ADOCANTE LIO MARIZA N.QUALV STEVIA 80ML
    "7891962054124",  # BISC BAUDUCCO COOKIES MAXI 96g
    "7897705202753",  # GLP RVBELSUS 14MG C/30 NOVO NORDISK(PBM)
    "7896806700021",  # LEITE DE ROSAS 100ML
]

def print_header(texto):
    """Imprime cabeçalho formatado"""
    print("\n" + "="*70)
    print(f"  {texto}")
    print("="*70)

def print_section(texto):
    """Imprime seção formatada"""
    print(f"\n--- {texto} ---")

def get_token_status():
    """Consulta status dos tokens"""
    try:
        response = requests.get(f"{API_URL}/api/status/tokens", timeout=10)
        if response.status_code == 200:
            return response.json()
        else:
            print(f"❌ Erro ao consultar status: HTTP {response.status_code}")
            return None
    except Exception as e:
        print(f"❌ Erro de conexão: {e}")
        return None

def consultar_produto(gtin):
    """Consulta um produto pela API"""
    headers = {
        'Authorization': f'Bearer {API_TOKEN}'
    }
    
    try:
        inicio = time.time()
        response = requests.get(
            f"{API_URL}/api/produtos/{gtin}",
            headers=headers,
            timeout=10
        )
        tempo_resposta = time.time() - inicio
        
        return {
            'status_code': response.status_code,
            'data': response.json() if response.status_code == 200 else None,
            'tempo_resposta': round(tempo_resposta, 2)
        }
    except Exception as e:
        return {
            'status_code': None,
            'data': None,
            'erro': str(e),
            'tempo_resposta': None
        }

def print_status_tokens(status):
    """Imprime status dos tokens de forma formatada"""
    if not status:
        print("❌ Status não disponível")
        return
    
    print("\n📊 STATUS DOS TOKENS:")
    print("-" * 70)
    
    for token in status.get('tokens', []):
        token_id = token.get('token_id', 'N/A')
        usado = token.get('usado_hoje', 0)
        disponivel = token.get('disponivel', 0)
        limite = token.get('limite', 25)
        status_token = token.get('status', 'N/A')
        preview = token.get('token_preview', 'N/A')
        
        # Barra de progresso visual
        progresso = int((usado / limite) * 20) if limite > 0 else 0
        barra = "█" * progresso + "░" * (20 - progresso)
        
        emoji = "✅" if status_token == "disponível" else "🔴"
        print(f"{emoji} {token_id} {preview}")
        print(f"   [{barra}] {usado}/{limite} usado - {disponivel} disponível")
    
    print("-" * 70)
    resumo = status.get('resumo', {})
    print(f"📈 RESUMO:")
    print(f"   Total de tokens: {resumo.get('total_tokens', 0)}")
    print(f"   Total usado: {resumo.get('total_usado', 0)}")
    print(f"   Total disponível: {resumo.get('total_disponivel', 0)}")
    print(f"   Limite total: {resumo.get('limite_total', 0)}")
    print(f"   Último reset: {status.get('ultimo_reset', 'N/A')}")
    print(f"   Próximo reset: {status.get('proximo_reset', 'N/A')}")

def test_rotacao():
    """Teste principal de rotação de tokens"""
    
    print_header("🧪 TESTE DE ROTAÇÃO DE TOKENS - SISTEMA CICLIK")
    print(f"📅 Data/Hora: {datetime.now().strftime('%d/%m/%Y %H:%M:%S')}")
    print(f"🌐 API: {API_URL}")
    print(f"📦 Produtos a testar: {len(GTINS_TESTE)}")
    
    # 1. Status inicial
    print_header("1️⃣ STATUS INICIAL DOS TOKENS")
    status_inicial = get_token_status()
    print_status_tokens(status_inicial)
    
    if not status_inicial:
        print("\n❌ Não foi possível obter status inicial. Abortando teste.")
        return
    
    # 2. Teste de consultas
    print_header("2️⃣ REALIZANDO CONSULTAS DE PRODUTOS")
    
    resultados = []
    for i, gtin in enumerate(GTINS_TESTE, 1):
        print(f"\n🔍 Consulta {i}/{len(GTINS_TESTE)} - GTIN: {gtin}")
        
        resultado = consultar_produto(gtin)
        resultados.append(resultado)
        
        if resultado['status_code'] == 200:
            data = resultado['data']
            if data and data.get('encontrado'):
                desc = data.get('descricao', 'N/A')[:50]
                marca = data.get('marca', 'N/A')
                print(f"   ✅ Produto encontrado: {desc}...")
                print(f"   🏷️  Marca: {marca}")
            else:
                print(f"   ⚠️  Produto não encontrado na base Bluesoft")
        elif resultado['status_code'] == 429:
            print(f"   🔴 Rate limit atingido!")
        else:
            print(f"   ❌ Erro: {resultado.get('erro', 'Desconhecido')}")
        
        print(f"   ⏱️  Tempo de resposta: {resultado['tempo_resposta']}s")
        
        # Pequeno delay entre consultas
        time.sleep(0.5)
    
    # 3. Status após consultas
    print_header("3️⃣ STATUS APÓS CONSULTAS")
    status_final = get_token_status()
    print_status_tokens(status_final)
    
    # 4. Análise comparativa
    print_header("4️⃣ ANÁLISE COMPARATIVA")
    
    if status_inicial and status_final:
        usado_antes = status_inicial.get('resumo', {}).get('total_usado', 0)
        usado_depois = status_final.get('resumo', {}).get('total_usado', 0)
        consultas_realizadas = usado_depois - usado_antes
        
        print(f"\n📊 ESTATÍSTICAS:")
        print(f"   Consultas realizadas: {consultas_realizadas}")
        print(f"   Consultas bem-sucedidas: {sum(1 for r in resultados if r['status_code'] == 200)}")
        print(f"   Produtos encontrados: {sum(1 for r in resultados if r.get('data', {}).get('encontrado'))}")
        print(f"   Rate limits: {sum(1 for r in resultados if r['status_code'] == 429)}")
        print(f"   Erros: {sum(1 for r in resultados if r['status_code'] not in [200, 429])}")
        
        # Verificar rotação
        print(f"\n🔄 ROTAÇÃO DE TOKENS:")
        tokens_usados = []
        for token in status_final.get('tokens', []):
            if token.get('usado_hoje', 0) > 0:
                tokens_usados.append(token.get('token_id'))
        
        if len(tokens_usados) > 1:
            print(f"   ✅ ROTAÇÃO DETECTADA! Tokens usados: {', '.join(tokens_usados)}")
        elif len(tokens_usados) == 1:
            print(f"   ℹ️  Apenas 1 token usado: {tokens_usados[0]}")
            print(f"   (Normal para poucas consultas - rotação ocorre após 25 consultas)")
        else:
            print(f"   ⚠️  Nenhum token marcado como usado")
    
    # 5. Recomendações
    print_header("5️⃣ RECOMENDAÇÕES")
    
    if status_final:
        disponivel = status_final.get('resumo', {}).get('total_disponivel', 0)
        usado_total = status_final.get('resumo', {}).get('total_usado', 0)
        
        print(f"\n💡 CAPACIDADE ATUAL:")
        print(f"   {disponivel} consultas ainda disponíveis hoje")
        print(f"   {usado_total} consultas já utilizadas")
        
        if disponivel > 80:
            print(f"\n   ✅ Capacidade excelente! Pode processar muitos produtos.")
        elif disponivel > 50:
            print(f"\n   👍 Boa capacidade. Continue processando normalmente.")
        elif disponivel > 20:
            print(f"\n   ⚠️  Capacidade moderada. Use com moderação.")
        else:
            print(f"\n   🔴 Capacidade baixa! Economize consultas ou aguarde reset às 00:00.")
    
    print_header("✅ TESTE CONCLUÍDO")
    print(f"\n📁 Para ver logs completos, acesse:")
    print(f"   https://dashboard.render.com/")

if __name__ == "__main__":
    try:
        test_rotacao()
    except KeyboardInterrupt:
        print("\n\n⚠️  Teste interrompido pelo usuário")
    except Exception as e:
        print(f"\n\n❌ Erro durante teste: {e}")
        import traceback
        traceback.print_exc()
