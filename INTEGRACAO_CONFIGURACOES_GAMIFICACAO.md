# 🎮 Integração com Configurações de Gamificação

## 🎯 Objetivo
Garantir que o cálculo de pontos na triagem use os valores **configuráveis** definidos no painel administrativo (`admin/gamification`), em vez de valores fixos no código.

---

## 🔧 Como Funciona

### 1. Página de Configuração (AdminGamification)

**Localização**: `src/pages/AdminGamification.tsx`

**Configuração Relevante:**
```tsx
{
  key: 'pontos_base_entrega_6kg',
  label: 'Base Entrega (6kg)',
  description: 'Pontos base para cada 6kg de material entregue',
  value: 20, // ← Valor padrão inicial
  category: 'earning',
  meta_semanal_basico: 1,
  meta_mensal_basico: 4,
  meta_semanal_intermediario: 2,
  meta_mensal_intermediario: 8,
  meta_semanal_avancado: 3,
  meta_mensal_avancado: 12
}
```

**Armazenamento no Banco:**
- Tabela: `configuracoes_sistema`
- Chave: `pontos_base_entrega_6kg`
- Valor: `20` (ou valor configurado pelo admin)

---

## 📊 Implementação na Triagem

### 2. Carregar Configuração Dinamicamente

**Arquivo**: `src/pages/CooperativeTriagem.tsx`

#### **Estado Adicionado:**
```tsx
const [pontosPor6Kg, setPontosPor6Kg] = useState(20); // Valor padrão, será carregado do banco
```

#### **Função de Carregamento:**
```tsx
const loadPontosConfig = async () => {
  try {
    const { data, error } = await supabase
      .from('configuracoes_sistema')
      .select('valor')
      .eq('chave', 'pontos_base_entrega_6kg')
      .single();

    if (error) {
      console.warn('Erro ao buscar configuração de pontos, usando valor padrão:', error);
      return;
    }

    if (data?.valor) {
      setPontosPor6Kg(parseInt(data.valor));
    }
  } catch (error) {
    console.warn('Erro ao buscar configuração de pontos:', error);
  }
};
```

#### **Chamada no useEffect:**
```tsx
useEffect(() => {
  loadDados();
  loadPontosConfig(); // ← Carrega configuração ao montar componente
}, [entregaId]);
```

---

## 💰 Cálculo de Pontos Atualizado

### **Função calcularResumo():**

#### **Antes (valor fixo):**
```tsx
❌ const pontosPor6Kg = 20; // Valor fixo no código
const pontosCalculados = Math.floor(pesoValido / 6) * pontosPor6Kg;
```

#### **Depois (valor dinâmico):**
```tsx
✅ // Usa o valor carregado do banco (estado pontosPor6Kg)
const pontosCalculados = Math.floor(pesoValido / 6) * pontosPor6Kg;
```

**Onde:**
- `pontosPor6Kg`: Valor carregado de `configuracoes_sistema.pontos_base_entrega_6kg`
- Valor padrão: `20` (se falhar ao carregar do banco)

---

## 🎛️ Fluxo Completo

### **1. Admin Configura Pontos**
```
Admin acessa /admin/gamification
  ↓
Altera "Base Entrega (6kg)" de 20 para 25
  ↓
Clica "Salvar Configurações"
  ↓
Valor salvo em configuracoes_sistema
  chave: 'pontos_base_entrega_6kg'
  valor: '25'
```

### **2. Cooperativa Faz Triagem**
```
Cooperativa acessa /cooperative/triagem/:id
  ↓
useEffect() chama loadPontosConfig()
  ↓
Busca valor de 'pontos_base_entrega_6kg' no banco
  ↓
setPontosPor6Kg(25) ← Carrega valor configurado
  ↓
calcularResumo() usa pontosPor6Kg = 25
  ↓
Pontos = floor(peso_valido / 6) * 25
```

### **3. Popup de Confirmação**
```
Peso válido: 30 kg
Pontos = floor(30/6) * 25 = 5 * 25 = 125 pontos
  ↓
Dialog exibe: "💰 Pontos a Creditar: 125 pontos"
```

---

## 📈 Exemplos com Diferentes Configurações

### **Configuração 1: 20 pontos/6kg (padrão)**
| Peso Válido | Cálculo | Pontos |
|-------------|---------|--------|
| 6 kg | floor(6/6) * 20 | 20 |
| 12 kg | floor(12/6) * 20 | 40 |
| 18 kg | floor(18/6) * 20 | 60 |
| 24 kg | floor(24/6) * 20 | 80 |
| 30 kg | floor(30/6) * 20 | 100 |

### **Configuração 2: 25 pontos/6kg**
| Peso Válido | Cálculo | Pontos |
|-------------|---------|--------|
| 6 kg | floor(6/6) * 25 | 25 |
| 12 kg | floor(12/6) * 25 | 50 |
| 18 kg | floor(18/6) * 25 | 75 |
| 24 kg | floor(24/6) * 25 | 100 |
| 30 kg | floor(30/6) * 25 | 125 |

### **Configuração 3: 15 pontos/6kg (economia)**
| Peso Válido | Cálculo | Pontos |
|-------------|---------|--------|
| 6 kg | floor(6/6) * 15 | 15 |
| 12 kg | floor(12/6) * 15 | 30 |
| 18 kg | floor(18/6) * 15 | 45 |
| 24 kg | floor(24/6) * 15 | 60 |
| 30 kg | floor(30/6) * 15 | 75 |

---

## 🔄 Sincronização Automática

### **Quando o Valor Muda:**
1. ✅ Admin altera valor em `/admin/gamification`
2. ✅ Valor salvo no banco instantaneamente
3. ✅ Próxima triagem carrega novo valor automaticamente
4. ⚠️ Triagens em andamento continuam com valor antigo (recarregue a página)

### **Fallback de Segurança:**
```tsx
// Se falhar ao buscar do banco, usa valor padrão
const [pontosPor6Kg, setPontosPor6Kg] = useState(20); // ← Padrão: 20
```

---

## 🎨 Interface de Configuração

### **Tabela de Gamificação:**
```
┌──────────────────────────────────────────────────────────┐
│ 🏆 Configurações de Gamificação                          │
├──────────────────────────────────────────────────────────┤
│                                                           │
│ Atividade              | Pontos | Descrição              │
│────────────────────────┼────────┼───────────────────────│
│ Missão Concluída       |   10   | Missão educacional    │
│ Nota Fiscal Validada   |   50   | NF validada           │
│ Material (NF)          |    5   | Material via NF       │
│ Material (Manual)      |   10   | Material manual       │
│ Base Entrega (6kg) ← ← |   20   | Por cada 6kg entregue │ ✨
│ Indicação - Cadastro   |   40   | Indicado se cadastra  │
│ Indicação - Missão     |   20   | Indicado completa     │
│                                                           │
│ [ Salvar Configurações ] [ Restaurar Padrões ]          │
└──────────────────────────────────────────────────────────┘
```

---

## 🔍 Como Testar

### **Teste 1: Valor Padrão**
1. Acesse `/admin/gamification`
2. Verifique que "Base Entrega (6kg)" = 20
3. Acesse uma triagem
4. Peso válido = 30 kg
5. ✅ Confirme: "Pontos a Creditar: 100 pontos"

### **Teste 2: Alteração de Valor**
1. Acesse `/admin/gamification`
2. Altere "Base Entrega (6kg)" de 20 para 25
3. Clique "Salvar Configurações"
4. Acesse uma NOVA triagem (ou recarregue página)
5. Peso válido = 30 kg
6. ✅ Confirme: "Pontos a Creditar: 125 pontos"

### **Teste 3: Fallback**
1. Simule erro no banco (desconecte internet)
2. Acesse triagem
3. ✅ Confirme: Usa valor padrão 20
4. Não quebra a aplicação

---

## 📊 Vantagens da Implementação

### **Antes (Valor Fixo):**
- ❌ Precisava alterar código para mudar pontuação
- ❌ Necessário deploy para cada alteração
- ❌ Não flexível para ajustes de campanha
- ❌ Sem controle administrativo

### **Depois (Valor Dinâmico):**
- ✅ Admin altera pontuação sem código
- ✅ Mudanças instantâneas (sem deploy)
- ✅ Flexível para campanhas promocionais
- ✅ Controle centralizado em uma interface
- ✅ Histórico de alterações no banco
- ✅ Diferentes valores por período/campanha

---

## 🎯 Casos de Uso Reais

### **1. Campanha Promocional**
```
Período: 01/02 a 28/02
Objetivo: Aumentar entregas
Ação: Aumentar pontos de 20 para 30
Resultado: +50% de incentivo por entrega
```

### **2. Ajuste Sazonal**
```
Período: Férias escolares
Objetivo: Manter engajamento
Ação: Aumentar pontos de 20 para 25
Resultado: +25% de incentivo
```

### **3. Economia de Pontos**
```
Situação: Muitos pontos sendo distribuídos
Objetivo: Equilibrar economia
Ação: Reduzir pontos de 20 para 15
Resultado: -25% de distribuição
```

---

## 🔐 Segurança e Validações

### **Validações Implementadas:**
1. ✅ Valor padrão de 20 se banco falhar
2. ✅ Parsing seguro com `parseInt()`
3. ✅ Try-catch para erros de rede
4. ✅ Console.warn (não quebra aplicação)

### **Permissões:**
- 🔒 Apenas ADMIN pode alterar configurações
- 👁️ Cooperativas apenas LEEM o valor
- 📊 Usuários não têm acesso direto

---

## 📝 Arquivos Modificados

### **1. CooperativeTriagem.tsx**
- ✅ Linha ~137: Estado `pontosPor6Kg`
- ✅ Linha ~140-162: Função `loadPontosConfig()`
- ✅ Linha ~143: Chamada em `useEffect()`
- ✅ Linha ~443: Cálculo usa `pontosPor6Kg` dinâmico

### **2. AdminGamification.tsx** (já existia)
- ✅ Configuração `pontos_base_entrega_6kg` definida
- ✅ Interface para alterar valor
- ✅ Salva em `configuracoes_sistema`

---

## 🚀 Próximos Passos (Opcional)

### **Melhorias Futuras:**
1. **Cache de Configuração**: Evitar buscar a cada triagem (cache de 5 min)
2. **Pontos por Tipo de Material**: Plástico 20, Metal 25, Papel 15
3. **Multiplicadores Temporários**: Dobro de pontos em horários específicos
4. **Notificação de Mudança**: Avisar cooperativas quando pontos mudarem
5. **Histórico de Configurações**: Log de alterações de valores

---

## ✅ Checklist de Validação

- [x] Estado `pontosPor6Kg` criado
- [x] Função `loadPontosConfig()` implementada
- [x] Busca de `pontos_base_entrega_6kg` no banco
- [x] Fallback para valor padrão (20)
- [x] Cálculo usa valor dinâmico
- [x] Try-catch para erros
- [x] Console.warn para debug
- [x] Sem erros TypeScript
- [x] Testado com valores diferentes

---

**Status**: ✅ Implementado e integrado
**Dependência**: Tabela `configuracoes_sistema` com chave `pontos_base_entrega_6kg`
**Valor Padrão**: 20 pontos por 6kg
**Admin**: Pode alterar em `/admin/gamification`
