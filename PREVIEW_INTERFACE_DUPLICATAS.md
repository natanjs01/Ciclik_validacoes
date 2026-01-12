# 🎨 PREVIEW: Interface de Duplicatas

## 📌 Exemplo Visual da Nova Interface

### **CENÁRIO: 2 Usuários com Mesmo CPF**

```
Banco de Dados:
- ID: 1, CPF: 111.222.333-44, Email: joao@email.com,       Created: 2026-01-01
- ID: 2, CPF: 111.222.333-44, Email: joao.silva@gmail.com, Created: 2026-01-10
```

---

## 🖥️ TELA DE GESTÃO DE USUÁRIOS

```
╔════════════════════════════════════════════════════════════════════════════╗
║  ← Gestão de Usuários                                 🔍 [Buscar...]      ║
║     Ver e editar informações dos usuários                                  ║
╠════════════════════════════════════════════════════════════════════════════╣
║                                                                            ║
║  ⚠️ Duplicatas Detectadas!                                                ║
║  Foram encontrados 2 usuários com CPF/CNPJ duplicados cadastrados com     ║
║  emails diferentes. Verifique os usuários marcados com o badge vermelho   ║
║  "DUPLICATA" para investigar e resolver cada caso.                        ║
║  📚 Consulte o arquivo GUIA_RESOLVER_DUPLICATAS_CPF.md para instruções.   ║
║                                                                            ║
╠════════════════════════════════════════════════════════════════════════════╣
║  Total de Usuários    │  Pessoas Físicas  │  Pessoas Jurídicas  │  ...   ║
║         125           │        98          │         27          │  ...   ║
╠════════════════════════════════════════════════════════════════════════════╣
║                                                                            ║
║  ┌──────────────────────────────────────────────────────────────────────┐ ║
║  │ 👤  João Silva                                                       │ ║
║  │     [Iniciante] [PF] [❌ Email não confirmado] 🚨 [DUPLICATA (2x)]   │ ║
║  │                                                                       │ ║
║  │     Email: joao@email.com                                            │ ║
║  │     Telefone: (11) 99999-9999                                        │ ║
║  │     CPF: 111.222.333-44                                              │ ║
║  │                                                                       │ ║
║  │     ┌─────────────────────────────────────────────────────────────┐  │ ║
║  │     │ ⚠️ Atenção: Este CPF está cadastrado 2 vezes com emails    │  │ ║
║  │     │ diferentes:                                                  │  │ ║
║  │     │ joao@email.com, joao.silva@gmail.com                        │  │ ║
║  │     └─────────────────────────────────────────────────────────────┘  │ ║
║  │                                                                       │ ║
║  │     Endereço: Rua das Flores, 123 - Centro, São Paulo/SP            │ ║
║  │     Cadastrado em: 01/01/2026                                        │ ║
║  │                                                                       │ ║
║  │     [📧 Reenviar Email]  [✏️ Ver Detalhes]                           │ ║
║  └──────────────────────────────────────────────────────────────────────┘ ║
║                                                                            ║
║  ┌──────────────────────────────────────────────────────────────────────┐ ║
║  │ 👤  João Silva                                                       │ ║
║  │     [Iniciante] [PF] [❌ Email não confirmado] 🚨 [DUPLICATA (2x)]   │ ║
║  │                                                                       │ ║
║  │     Email: joao.silva@gmail.com                                      │ ║
║  │     Telefone: (11) 98888-8888                                        │ ║
║  │     CPF: 111.222.333-44                                              │ ║
║  │                                                                       │ ║
║  │     ┌─────────────────────────────────────────────────────────────┐  │ ║
║  │     │ ⚠️ Atenção: Este CPF está cadastrado 2 vezes com emails    │  │ ║
║  │     │ diferentes:                                                  │  │ ║
║  │     │ joao@email.com, joao.silva@gmail.com                        │  │ ║
║  │     └─────────────────────────────────────────────────────────────┘  │ ║
║  │                                                                       │ ║
║  │     Endereço: Rua das Flores, 123 - Centro, São Paulo/SP            │ ║
║  │     Cadastrado em: 10/01/2026                                        │ ║
║  │                                                                       │ ║
║  │     [📧 Reenviar Email]  [✏️ Ver Detalhes]                           │ ║
║  └──────────────────────────────────────────────────────────────────────┘ ║
║                                                                            ║
╚════════════════════════════════════════════════════════════════════════════╝
```

---

## 🎨 ELEMENTOS VISUAIS

### **1. Badge de Duplicata**
```
🚨 DUPLICATA (2x)
```
- **Cor:** Vermelho brilhante (#DC2626)
- **Background:** Vermelho claro (#FEE2E2)
- **Ícone:** ⚠️ (AlertTriangle)
- **Tamanho:** Pequeno (h-3 w-3)
- **Posição:** Inline com outros badges

### **2. Caixa de Aviso**
```
┌─────────────────────────────────────────────────────────────┐
│ ⚠️ Atenção: Este CPF está cadastrado 2 vezes com emails    │
│ diferentes:                                                  │
│ joao@email.com, joao.silva@gmail.com                        │
└─────────────────────────────────────────────────────────────┘
```
- **Background:** #FEE2E2 (vermelho muito claro)
- **Border:** 1px solid #FCA5A5 (vermelho médio)
- **Border Radius:** 4px
- **Padding:** 8px
- **Font Size:** 12px
- **Texto Bold:** Vermelho escuro (#B91C1C)

### **3. Alerta no Topo**
```
╔═══════════════════════════════════════════════════════════════╗
║ ⚠️ Duplicatas Detectadas!                                     ║
║ ───────────────────────────────────────────────────────────── ║
║ Foram encontrados 2 usuários com CPF/CNPJ duplicados         ║
║ cadastrados com emails diferentes. Verifique os usuários     ║
║ marcados com o badge vermelho "DUPLICATA" para investigar    ║
║ e resolver cada caso.                                         ║
║                                                               ║
║ 📚 Consulte o arquivo GUIA_RESOLVER_DUPLICATAS_CPF.md        ║
╚═══════════════════════════════════════════════════════════════╝
```
- **Variant:** destructive (padrão Shadcn/ui)
- **Background:** #FEE2E2
- **Border:** Vermelho
- **Ícone:** AlertTriangle vermelho
- **Título:** Bold
- **Posicionamento:** Acima dos cards de estatísticas

---

## 📊 LOGS DO CONSOLE

Ao carregar a página, você verá:

```javascript
✅ [AdminUsers] Total de profiles no banco: 127
✅ [AdminUsers] Usuários válidos (com documento): 125
⚠️ [AdminUsers] Documentos únicos (CPF/CNPJ): 123
🔴 [AdminUsers] Contas duplicadas detectadas: 4
📊 [AdminUsers] Taxa de duplicação: 3.2%
```

---

## 🔍 DETALHAMENTO POR USUÁRIO

### **Campos Adicionados (invisíveis ao usuário, mas úteis para código)**

```typescript
user = {
  // ... campos normais (nome, email, cpf, etc.)
  
  // ✅ NOVOS CAMPOS
  isDuplicate: true,                // Se é duplicata
  duplicateCount: 2,                // Quantas vezes foi cadastrado
  duplicateEmails: "joao@email.com, joao.silva@gmail.com"  // Lista de emails
}
```

---

## 🎯 COMPORTAMENTO INTERATIVO

### **Cenário 1: Usuário Clica em "Ver Detalhes"**
- Abre modal com informações completas
- Mostra histórico de login
- Permite reenviar email de confirmação
- *(comportamento existente, não modificado)*

### **Cenário 2: Usuário Clica em "Reenviar Email"**
- Reenvia email de confirmação
- Toast de sucesso aparece
- Badge de status atualiza
- *(comportamento existente, não modificado)*

### **Cenário 3: Admin Busca por CPF Duplicado**
```
🔍 Buscar: "111.222.333-44"

Resultados:
✅ 2 usuários encontrados (ambos aparecem)
- joao@email.com       🚨 DUPLICATA (2x)
- joao.silva@gmail.com 🚨 DUPLICATA (2x)
```

---

## 🚀 COMO TESTAR

### **1. Abrir Página de Gestão**
```bash
npm run dev
# Acesse: http://localhost:5173/admin/users
```

### **2. Verificar Alertas Visuais**
- [ ] Alerta vermelho aparece no topo?
- [ ] Contagem de duplicatas está correta?
- [ ] Badge "DUPLICATA" aparece nos usuários corretos?

### **3. Verificar Caixa de Aviso**
- [ ] Caixa vermelha aparece abaixo do CPF/CNPJ?
- [ ] Lista de emails está completa?
- [ ] Formatação está clara?

### **4. Verificar Console do Navegador**
- [ ] Logs aparecem ao carregar a página?
- [ ] Contadores estão corretos?
- [ ] Sem erros no console?

### **5. Testar Busca**
- [ ] Buscar por CPF duplicado mostra ambos?
- [ ] Filtros funcionam normalmente?
- [ ] Cards permanecem com badges de alerta?

---

## 📸 SCREENSHOTS ESPERADOS

### **Tela Normal (Sem Duplicatas)**
```
┌────────────────────────────────────────┐
│ 👤 Maria Santos                        │
│    [Bronze] [PF] [✅ Email confirmado] │
│                                        │
│    Email: maria@email.com              │
│    CPF: 222.333.444-55                 │
└────────────────────────────────────────┘
```

### **Tela com Duplicata (Novo)**
```
┌────────────────────────────────────────┐
│ 👤 João Silva                          │
│    [Iniciante] [PF] 🚨 [DUPLICATA (2x)]│
│                                        │
│    Email: joao@email.com               │
│    CPF: 111.222.333-44                 │
│    ┌──────────────────────────────────┐│
│    │ ⚠️ Este CPF está cadastrado 2x  ││
│    │ joao@email.com, joao.silva@...  ││
│    └──────────────────────────────────┘│
└────────────────────────────────────────┘
```

---

## ✅ CHECKLIST DE VALIDAÇÃO VISUAL

### **Cores e Estilo**
- [ ] Badge vermelho (#DC2626) com ícone de alerta
- [ ] Caixa de aviso com fundo #FEE2E2 e borda vermelha
- [ ] Alerta no topo com variant="destructive"
- [ ] Texto legível e contrastante

### **Conteúdo**
- [ ] Contagem de duplicatas precisa no badge
- [ ] Todos os emails listados na caixa de aviso
- [ ] Mensagem clara no alerta do topo
- [ ] Link para documentação visível

### **Interatividade**
- [ ] Badges não quebram layout
- [ ] Caixa de aviso não sobrepõe outros elementos
- [ ] Alerta não interfere com funcionalidade
- [ ] Todos os botões funcionam normalmente

### **Responsividade**
- [ ] Layout funciona em desktop (>1024px)
- [ ] Layout funciona em tablet (768-1024px)
- [ ] Layout funciona em mobile (<768px)
- [ ] Badges se ajustam com flex-wrap

---

## 🎉 RESULTADO FINAL

**Você agora terá:**
- ✅ Visibilidade total de duplicatas
- ✅ Alertas claros e chamativos
- ✅ Informações detalhadas para cada caso
- ✅ Ferramentas para tomar decisões informadas
- ✅ Logs completos para auditoria

**Próximo passo:** Resolver as duplicatas usando o `GUIA_RESOLVER_DUPLICATAS_CPF.md`! 🚀
