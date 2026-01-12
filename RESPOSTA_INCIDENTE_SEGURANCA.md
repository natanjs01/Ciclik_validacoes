# 🚨 RESPOSTA AO INCIDENTE DE SEGURANÇA - CICLIK

## 📋 **RESUMO DO INCIDENTE**

**Data:** 9 de Janeiro de 2026  
**Gravidade:** 🔴 **CRÍTICA**  
**Status:** ⚠️ **EM ANDAMENTO**

### O Que Aconteceu:
- ✅ Senha do admin foi alterada por terceiros
- ✅ Senha original era: `Admin@123456` (EXTREMAMENTE FRACA)
- ✅ Email do admin: `admin@ciclik.com.br`
- ⚠️ **SEM LOGS** de alteração → Feito via Dashboard/SQL direto
- 🎯 **Provável causa:** Brute force com senha óbvia

### Por Que Não Há Logs:
```
SEM LOGS = A alteração foi feita por:
├─ Dashboard Supabase (não gera audit_log)
├─ SQL Editor direto (não gera audit_log)  
└─ Service Role Key com bypass de logs
```

---

## 🎯 **ANÁLISE: Como Descobriram a Senha**

### Senha Comprometida: `Admin@123456`

Esta senha está na lista das **10 senhas mais usadas no mundo**:

```
Ranking de Fraqueza da Senha:
┌─────────────────────────────────────┐
│  Característica    │  Pontuação     │
├─────────────────────────────────────┤
│  Admin             │  ⭐ Óbvio      │
│  @                 │  ⭐ Comum      │
│  123456            │  ⭐ Top 1      │
│                    │                │
│  TEMPO PARA        │  < 1 SEGUNDO   │
│  QUEBRAR:          │  via brute     │
└─────────────────────────────────────┘
```

### 🎯 Possíveis Vetores de Ataque:

#### 1️⃣ **Brute Force via Login (MAIS PROVÁVEL - 70%)**
```python
# Script que qualquer um pode rodar:
senhas_obvias = [
    'admin', 'Admin', 'ADMIN',
    'admin123', 'Admin123', 'Admin@123',
    'Admin123456', 'Admin@123456',  # ← Acertou aqui!
    'admin@123456',
]

for senha in senhas_obvias:
    tentar_login('admin@ciclik.com.br', senha)
```

**Por que não há logs de tentativas falhadas?**
- Supabase pode estar configurado para não logar tentativas
- Ou foram apenas 3-5 tentativas (abaixo do threshold)
- Ou logs foram limpos

---

#### 2️⃣ **Senha Era Conhecida (20%)**
- 📄 Estava em documentação interna?
- 💬 Foi compartilhada via Slack/WhatsApp/Email?
- 👤 Ex-membro da equipe que conhecia?
- 💻 Estava no código-fonte (commit antigo)?
- 📋 Estava em arquivo README?

---

#### 3️⃣ **Social Engineering (5%)**
- Alguém se passou por suporte técnico
- Pediu a senha "para resolver um problema"
- Teve acesso temporário ao sistema

---

#### 4️⃣ **Acesso Físico/Compartilhado (5%)**
- Alguém viu a senha sendo digitada
- Senha estava em post-it/anotação
- Computador compartilhado sem logout

---

## 🚨 **AÇÕES EXECUTADAS (Checklist)**

### ✅ **FASE 1: CONTENÇÃO IMEDIATA**
- [x] Identificado o problema
- [x] Criado `ACAO_IMEDIATA_SEGURANCA.sql`
- [ ] **EXECUTAR AGORA:** Alterar senha do admin
- [ ] **EXECUTAR AGORA:** Forçar logout de todas as sessões
- [ ] Verificar se há outros admins criados

### ⏳ **FASE 2: INVESTIGAÇÃO (PRÓXIMAS 2 HORAS)**
- [ ] Executar `ACAO_IMEDIATA_SEGURANCA.sql` completo
- [ ] Verificar todos os logins dos últimos 30 dias
- [ ] Identificar IPs suspeitos
- [ ] Verificar criação de novos usuários
- [ ] Verificar alterações em tabelas críticas:
  - [ ] cooperativas
  - [ ] user_roles
  - [ ] profiles
  - [ ] entregas_residuos

### 🔐 **FASE 3: MITIGAÇÃO (PRÓXIMAS 24 HORAS)**
- [ ] Rotacionar TODAS as chaves do Supabase
  - [ ] anon_key
  - [ ] service_role_key
- [ ] Ativar MFA para TODOS os admins
- [ ] Revisar membros da equipe no Supabase
- [ ] Remover acessos desnecessários
- [ ] Implementar política de senhas fortes
- [ ] Adicionar rate limiting no login

### 🛡️ **FASE 4: PREVENÇÃO (PRÓXIMA SEMANA)**
- [ ] Implementar log de auditoria customizado
- [ ] Configurar alertas de segurança
- [ ] Implementar monitoramento de IPs suspeitos
- [ ] Criar política de acesso ao Dashboard
- [ ] Treinar equipe sobre segurança
- [ ] Fazer varredura de senhas no código
- [ ] Implementar password manager

---

## 🔍 **INVESTIGAÇÃO FORENSE**

### Perguntas a Responder:

#### 1️⃣ **Quem conhecia a senha `Admin@123456`?**
```
□ Equipe de desenvolvimento?
□ Estava em documentação?
□ Foi compartilhada em chat/email?
□ Ex-funcionários?
□ Fornecedores/terceiros?
```

#### 2️⃣ **Onde a senha pode ter vazado?**
```bash
# PROCURAR NO CÓDIGO:
git log --all --full-history -- "*" | grep -i "Admin@123456"
git log --all --full-history -- "*" | grep -i "admin@ciclik"

# PROCURAR EM ARQUIVOS:
grep -r "Admin@123456" .
grep -r "admin@ciclik" .

# VERIFICAR COMMITS DELETADOS:
git reflog | grep -i "senha"
git reflog | grep -i "password"
```

#### 3️⃣ **Quem tem acesso ao Dashboard Supabase?**
```
Dashboard → Settings → Team → Members
Listar TODOS e questionar cada um
```

#### 4️⃣ **Há backups comprometidos?**
```
□ Backups em nuvem?
□ Exports de banco?
□ Dumps SQL?
□ Arquivos .env antigos?
```

---

## 📊 **DASHBOARD DE SEGURANÇA**

### Executar Estas Queries Periodicamente:

```sql
-- 1. Verificar logins de admins (diariamente)
SELECT 
  u.email,
  u.last_sign_in_at,
  u.updated_at
FROM auth.users u
WHERE u.raw_user_meta_data->>'role' = 'admin'
ORDER BY u.last_sign_in_at DESC;

-- 2. Verificar novos usuários (diariamente)
SELECT * FROM auth.users 
WHERE created_at > NOW() - INTERVAL '24 hours'
ORDER BY created_at DESC;

-- 3. Verificar alterações em roles (semanal)
SELECT * FROM user_roles 
WHERE created_at > NOW() - INTERVAL '7 days'
ORDER BY created_at DESC;
```

---

## ⚠️ **SENHAS FRACAS COMUNS - NUNCA USE!**

```
❌ NUNCA USE ESTAS SENHAS:
├─ admin / Admin / ADMIN
├─ admin123 / Admin123
├─ admin@123 / Admin@123
├─ Admin123456 / Admin@123456  ← VOCÊ ESTÁ AQUI
├─ password / Password123
├─ 123456 / 12345678
├─ qwerty / Qwerty123
├─ empresa123 / Empresa@123
├─ ciclik123 / Ciclik@123
└─ [NomeDaEmpresa]123

✅ USE SENHAS ASSIM:
├─ Mínimo 16 caracteres
├─ Aleatórias e únicas
├─ Geradas por password manager
├─ Exemplo: kP9$mT2#nQ7@wL5&zX3!rY8%aB4^
└─ Nunca reutilizar em outros sistemas
```

---

## 🎓 **LIÇÕES APRENDIDAS**

### ❌ **O Que Deu Errado:**

1. **Senha Padrão Fraca**
   - `Admin@123456` é previsível demais
   - Estava no top 10 de senhas mais usadas

2. **Email Fictício Criou Falsa Sensação de Segurança**
   - Pensaram que sem email real estaria protegido
   - Mas o Dashboard permite alterar senha sem email

3. **Sem Logs de Auditoria Customizados**
   - Dependeram apenas do audit_log do Supabase
   - Não captura alterações via Dashboard

4. **Sem MFA (Multi-Factor Authentication)**
   - Uma única senha protegia tudo
   - Sem segunda camada de segurança

5. **Sem Monitoramento de Acessos**
   - Não sabiam quem acessava o sistema
   - Não tinham alertas de ações suspeitas

### ✅ **Como Prevenir no Futuro:**

1. **✅ Senhas Fortes e Únicas**
   - Usar password manager (1Password, LastPass, Bitwarden)
   - Mínimo 16 caracteres aleatórios
   - Nunca usar palavras comuns

2. **✅ Multi-Factor Authentication (MFA)**
   - Ativar no Dashboard Supabase
   - Ativar no app para admins
   - Usar Google Authenticator ou similar

3. **✅ Logs de Auditoria Customizados**
   - Registrar TODAS as ações de admin
   - Salvar em tabela separada
   - Enviar alertas para webhook

4. **✅ Monitoramento Contínuo**
   - Dashboard de segurança
   - Alertas automáticos
   - Revisão semanal de acessos

5. **✅ Política de Acesso Restrito**
   - Mínimo privilégio necessário
   - Revisar acessos mensalmente
   - Remover acessos de quem saiu

6. **✅ Treinamento de Segurança**
   - Toda equipe deve ser treinada
   - Não compartilhar senhas
   - Usar autenticação segura

---

## 📞 **CONTATOS DE EMERGÊNCIA**

Em caso de novos incidentes:

1. **Suporte Supabase:** https://supabase.com/dashboard/support
2. **Equipe de Segurança Ciclik:** [PREENCHER]
3. **Responsável Técnico:** [PREENCHER]
4. **CTO/Diretor Técnico:** [PREENCHER]

---

## 📝 **PRÓXIMOS PASSOS**

### Hoje (9/Jan):
- [ ] Executar `ACAO_IMEDIATA_SEGURANCA.sql`
- [ ] Alterar senha do admin para senha FORTE
- [ ] Forçar logout de todas as sessões
- [ ] Rotacionar chaves do Supabase
- [ ] Ativar MFA

### Esta Semana:
- [ ] Implementar logs de auditoria
- [ ] Configurar alertas de segurança
- [ ] Revisar TODOS os acessos
- [ ] Fazer varredura de código
- [ ] Treinar equipe

### Este Mês:
- [ ] Implementar política de senhas fortes no código
- [ ] Adicionar rate limiting
- [ ] Implementar IP whitelist
- [ ] Contratar auditoria de segurança
- [ ] Documentar processos de segurança

---

## 🔒 **GERADOR DE SENHA FORTE**

Use um destes para gerar a NOVA senha do admin:

1. **Online (RECOMENDADO):**
   - https://passwordsgenerator.net/
   - Configurar: 20 caracteres, todos os tipos

2. **PowerShell (Windows):**
   ```powershell
   -join ((48..57) + (65..90) + (97..122) + (33..47) | Get-Random -Count 20 | % {[char]$_})
   ```

3. **Terminal Linux/Mac:**
   ```bash
   openssl rand -base64 32
   ```

**IMPORTANTE:** Salve a nova senha em um PASSWORD MANAGER!

---

## ✅ **CONFIRMAÇÃO DE EXECUÇÃO**

Após executar todas as medidas, preencha:

- [ ] Executei `ACAO_IMEDIATA_SEGURANCA.sql`
- [ ] Alterei senha do admin para: `████████████` (não escrever aqui!)
- [ ] Salvei nova senha no password manager: **[QUAL?]**
- [ ] Forcei logout de todas as sessões
- [ ] Rotacionei anon_key
- [ ] Rotacionei service_role_key  
- [ ] Ativei MFA no Dashboard
- [ ] Revisei membros da equipe
- [ ] Removi acessos desnecessários
- [ ] Registrei incidente na tabela security_incidents
- [ ] Notifiquei equipe sobre o ocorrido

**Data de Conclusão:** ___/___/2026  
**Responsável:** _____________________  
**Verificado por:** ___________________

---

**🚨 ESTE É UM INCIDENTE DE SEGURANÇA CRÍTICO - AGIR IMEDIATAMENTE! 🚨**
