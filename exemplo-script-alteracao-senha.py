# 🔐 SCRIPT DE ALTERAÇÃO DE SENHA DO ADMIN (Python)
# Este provavelmente foi o método usado

from supabase import create_client, Client
import os

# Configuração do Supabase
SUPABASE_URL = "https://[seu-projeto].supabase.co"
SUPABASE_KEY = "[sua-anon-key]"

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

def alterar_senha_admin():
    print("🔐 Iniciando alteração de senha do admin...")
    
    # 1. Fazer login com a senha antiga
    print("1️⃣ Fazendo login...")
    try:
        auth_response = supabase.auth.sign_in_with_password({
            "email": "admin@ciclik.com.br",
            "password": "Admin@123456"  # Senha antiga (fraca)
        })
        print("✅ Login bem-sucedido!")
    except Exception as e:
        print(f"❌ Erro no login: {e}")
        return
    
    # 2. Alterar para nova senha forte
    print("2️⃣ Alterando senha...")
    try:
        update_response = supabase.auth.update_user({
            "password": "Nova_Senha_Forte_Aqui_123!@#"
        })
        print("✅ Senha alterada com sucesso!")
        print("📧 Nova senha: Nova_Senha_Forte_Aqui_123!@#")
        print("⚠️ Guarde esta senha em local seguro!")
    except Exception as e:
        print(f"❌ Erro ao alterar senha: {e}")
        return
    
    # 3. Fazer logout
    supabase.auth.sign_out()
    print("🚪 Logout realizado")

if __name__ == "__main__":
    alterar_senha_admin()
    print("✅ Processo concluído!")

"""
CARACTERÍSTICAS DESTE MÉTODO:
- Login registrado em last_sign_in_at ✅
- Alteração imediata (milissegundos) ✅
- Sem necessidade de interface gráfica ✅
- Pode ser rodado de qualquer lugar ✅
- Explica os timestamps idênticos ✅

COMO RODAR:
1. Salvar como: alterar_senha_admin.py
2. pip install supabase
3. python alterar_senha_admin.py

ESTE SCRIPT EXPLICA:
- Por que houve login (last_sign_in_at atualizado)
- Por que foi em 3ms (código sequencial)
- Por que não há logs detalhados (via client, não admin)
- Por que não precisa de UI (script direto)
"""
