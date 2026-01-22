"""
Script de teste local da API
Execute: python test_api.py
"""

import requests
import json

# Configurações
BASE_URL = "http://localhost:5000"  # Mudar para URL do Render após deploy
API_TOKEN = "ciclik_secret_token_2026"

def testar_health():
    """Testa o endpoint de health check"""
    print("\n" + "="*60)
    print("TESTE 1: Health Check")
    print("="*60)
    
    response = requests.get(f"{BASE_URL}/health")
    print(f"Status: {response.status_code}")
    print(f"Resposta: {json.dumps(response.json(), indent=2, ensure_ascii=False)}")
    
    return response.status_code == 200

def testar_produto_encontrado():
    """Testa consulta de produto existente"""
    print("\n" + "="*60)
    print("TESTE 2: Produto Encontrado (Açúcar União)")
    print("="*60)
    
    gtin = "7891910000197"
    headers = {
        "Authorization": f"Bearer {API_TOKEN}",
        "Content-Type": "application/json"
    }
    
    response = requests.get(f"{BASE_URL}/api/produtos/{gtin}", headers=headers)
    print(f"Status: {response.status_code}")
    print(f"Resposta: {json.dumps(response.json(), indent=2, ensure_ascii=False)}")
    
    data = response.json()
    assert data.get('encontrado') == True, "Produto deveria ser encontrado"
    assert data.get('ncm') is not None, "NCM deveria estar presente"
    assert len(data.get('ncm', '')) == 8, "NCM deveria ter 8 dígitos"
    
    return response.status_code == 200

def testar_produto_nao_encontrado():
    """Testa consulta de produto inexistente"""
    print("\n" + "="*60)
    print("TESTE 3: Produto NÃO Encontrado")
    print("="*60)
    
    gtin = "9999999999999"
    headers = {
        "Authorization": f"Bearer {API_TOKEN}",
        "Content-Type": "application/json"
    }
    
    response = requests.get(f"{BASE_URL}/api/produtos/{gtin}", headers=headers)
    print(f"Status: {response.status_code}")
    print(f"Resposta: {json.dumps(response.json(), indent=2, ensure_ascii=False)}")
    
    data = response.json()
    assert data.get('encontrado') == False, "Produto NÃO deveria ser encontrado"
    
    return response.status_code == 200

def testar_gtin_invalido():
    """Testa GTIN inválido"""
    print("\n" + "="*60)
    print("TESTE 4: GTIN Inválido")
    print("="*60)
    
    gtin = "123"
    headers = {
        "Authorization": f"Bearer {API_TOKEN}",
        "Content-Type": "application/json"
    }
    
    response = requests.get(f"{BASE_URL}/api/produtos/{gtin}", headers=headers)
    print(f"Status: {response.status_code}")
    print(f"Resposta: {json.dumps(response.json(), indent=2, ensure_ascii=False)}")
    
    return response.status_code == 400

def testar_token_invalido():
    """Testa autenticação com token inválido"""
    print("\n" + "="*60)
    print("TESTE 5: Token Inválido")
    print("="*60)
    
    gtin = "7891910000197"
    headers = {
        "Authorization": "Bearer token_errado",
        "Content-Type": "application/json"
    }
    
    response = requests.get(f"{BASE_URL}/api/produtos/{gtin}", headers=headers)
    print(f"Status: {response.status_code}")
    print(f"Resposta: {json.dumps(response.json(), indent=2, ensure_ascii=False)}")
    
    return response.status_code == 401

def testar_sem_token():
    """Testa requisição sem token"""
    print("\n" + "="*60)
    print("TESTE 6: Sem Token de Autenticação")
    print("="*60)
    
    gtin = "7891910000197"
    
    response = requests.get(f"{BASE_URL}/api/produtos/{gtin}")
    print(f"Status: {response.status_code}")
    print(f"Resposta: {json.dumps(response.json(), indent=2, ensure_ascii=False)}")
    
    return response.status_code == 401

def main():
    """Executa todos os testes"""
    print("\n" + "🚀 "*30)
    print("INICIANDO TESTES DA API CICLIK")
    print("🚀 "*30)
    
    resultados = {
        "Health Check": False,
        "Produto Encontrado": False,
        "Produto Não Encontrado": False,
        "GTIN Inválido": False,
        "Token Inválido": False,
        "Sem Token": False
    }
    
    try:
        resultados["Health Check"] = testar_health()
        resultados["Produto Encontrado"] = testar_produto_encontrado()
        resultados["Produto Não Encontrado"] = testar_produto_nao_encontrado()
        resultados["GTIN Inválido"] = testar_gtin_invalido()
        resultados["Token Inválido"] = testar_token_invalido()
        resultados["Sem Token"] = testar_sem_token()
    except requests.exceptions.ConnectionError:
        print("\n❌ ERRO: Não foi possível conectar à API")
        print("Certifique-se de que a API está rodando:")
        print("  python app.py")
        return
    except Exception as e:
        print(f"\n❌ ERRO: {str(e)}")
        return
    
    # Resumo
    print("\n" + "="*60)
    print("📊 RESUMO DOS TESTES")
    print("="*60)
    
    for teste, passou in resultados.items():
        status = "✅ PASSOU" if passou else "❌ FALHOU"
        print(f"{teste}: {status}")
    
    total = len(resultados)
    passou = sum(resultados.values())
    
    print("\n" + "="*60)
    print(f"Total: {passou}/{total} testes passaram")
    print("="*60)
    
    if passou == total:
        print("\n🎉 TODOS OS TESTES PASSARAM! API está funcionando perfeitamente!")
    else:
        print(f"\n⚠️  {total - passou} teste(s) falharam. Verifique os logs acima.")

if __name__ == "__main__":
    main()
