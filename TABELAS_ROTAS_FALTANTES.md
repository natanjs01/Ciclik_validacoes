# 🗄️ Tabelas Faltantes - Sistema de Rotas de Coleta

## ⚠️ IMPORTANTE: Tabelas Necessárias para AdminRotasColeta.tsx

Após análise detalhada do projeto de referência, identifiquei que existem **4 tabelas específicas** para o sistema de rotas de coleta que **NÃO EXISTEM** no projeto atual.

---

## 📋 Tabelas a Serem Criadas

### 1️⃣ rotas_coleta
**Descrição:** Tabela principal de rotas de coleta

**Campos:**
- `id` (UUID, PK)
- `nome` (VARCHAR 100) - Nome da rota
- `descricao` (TEXT) - Descrição detalhada
- `id_operador` (UUID, FK → cooperativas) - Operador responsável
- `status` (VARCHAR 20) - Status: 'ativa', 'bloqueada', 'inativa'
- `created_at` (TIMESTAMP)
- `updated_at` (TIMESTAMP)

**Relacionamentos:**
- → `cooperativas` (operador responsável pela rota)

---

### 2️⃣ rotas_dias_coleta
**Descrição:** Define os dias e horários de coleta para cada rota

**Campos:**
- `id` (UUID, PK)
- `id_rota` (UUID, FK → rotas_coleta)
- `dia_semana` (INTEGER 0-6) - 0=Domingo, 6=Sábado
- `horario_inicio` (TIME) - Hora de início da coleta
- `horario_fim` (TIME) - Hora de fim da coleta
- `created_at` (TIMESTAMP)

**Relacionamentos:**
- → `rotas_coleta` (rota pai)

**Constraints:**
- UNIQUE(id_rota, dia_semana) - Não pode ter dia duplicado por rota

---

### 3️⃣ rotas_areas_cobertura
**Descrição:** Define as áreas (ruas, bairros, CEPs) atendidas por cada rota

**Campos:**
- `id` (UUID, PK)
- `id_rota` (UUID, FK → rotas_coleta)
- `id_dia_coleta` (UUID, FK → rotas_dias_coleta) - Opcional
- `logradouro` (VARCHAR 200)
- `bairro` (VARCHAR 100)
- `cep` (VARCHAR 9)
- `cidade` (VARCHAR 100)
- `uf` (VARCHAR 2)
- `complemento_endereco` (TEXT)
- `created_at` (TIMESTAMP)

**Relacionamentos:**
- → `rotas_coleta` (rota pai)
- → `rotas_dias_coleta` (dia específico de coleta nessa área)

---

### 4️⃣ usuarios_rotas
**Descrição:** Registro de usuários aderidos a rotas com QR Code fixo

**Campos:**
- `id` (UUID, PK)
- `id_usuario` (UUID, FK → profiles)
- `id_rota` (UUID, FK → rotas_coleta)
- `id_area` (UUID, FK → rotas_areas_cobertura)
- `qrcode_adesao` (VARCHAR 50, UNIQUE) - QR Code fixo do usuário
- `hash_qrcode` (VARCHAR 64) - Hash de validação
- `endereco_coleta` (TEXT) - Endereço completo de coleta
- `observacoes` (TEXT)
- `status` (VARCHAR 20) - Status: 'ativa', 'pausada', 'cancelada'
- `data_adesao` (TIMESTAMP)
- `updated_at` (TIMESTAMP)

**Relacionamentos:**
- → `profiles` (usuário)
- → `rotas_coleta` (rota aderida)
- → `rotas_areas_cobertura` (área específica)

**Constraints:**
- UNIQUE(id_usuario, id_rota) - Usuário não pode aderir 2x à mesma rota

---

## 🔗 Alterações em Tabelas Existentes

### entregas_reciclaveis
**Adicionar colunas:**
- `id_rota` (UUID, FK → rotas_coleta) - Vincula entrega a uma rota
- `id_adesao_rota` (UUID, FK → usuarios_rotas) - Vincula à adesão específica
- `tipo_entrega` (VARCHAR 20) - Valores: 'avulsa' ou 'rota'

---

## 🎯 Fluxo de Funcionamento

```
┌─────────────────────────────────────────────────────────────┐
│                   FLUXO DE ROTAS                            │
└─────────────────────────────────────────────────────────────┘

1. CRIAÇÃO DA ROTA (Admin)
   ├─ Criar registro em rotas_coleta
   ├─ Definir dias em rotas_dias_coleta
   └─ Mapear áreas em rotas_areas_cobertura

2. ADESÃO DO USUÁRIO
   ├─ Usuário busca rota por CEP/endereço
   ├─ Sistema valida área de cobertura
   ├─ Gera QR Code fixo único
   └─ Cria registro em usuarios_rotas

3. ENTREGA
   ├─ Usuário gera entrega usando QR Code da adesão
   ├─ Sistema vincula a id_rota e id_adesao_rota
   ├─ Define tipo_entrega = 'rota'
   └─ Cooperativa coleta no dia/horário programado

4. GESTÃO (Admin)
   ├─ Visualiza todas as rotas
   ├─ Edita rotas, dias e áreas
   ├─ Monitora adesões por rota
   └─ Gerencia status das rotas
```

---

## 📊 Índices para Performance

```sql
-- rotas_coleta
CREATE INDEX idx_rotas_coleta_status ON rotas_coleta(status);
CREATE INDEX idx_rotas_coleta_operador ON rotas_coleta(id_operador);

-- rotas_dias_coleta
CREATE INDEX idx_rotas_dias_rota ON rotas_dias_coleta(id_rota);

-- rotas_areas_cobertura
CREATE INDEX idx_rotas_areas_rota ON rotas_areas_cobertura(id_rota);
CREATE INDEX idx_rotas_areas_cidade_uf ON rotas_areas_cobertura(cidade, uf);
CREATE INDEX idx_rotas_areas_cep ON rotas_areas_cobertura(cep);

-- usuarios_rotas
CREATE INDEX idx_usuarios_rotas_usuario ON usuarios_rotas(id_usuario);
CREATE INDEX idx_usuarios_rotas_rota ON usuarios_rotas(id_rota);
CREATE INDEX idx_usuarios_rotas_qrcode ON usuarios_rotas(qrcode_adesao);

-- entregas_reciclaveis (novos índices)
CREATE INDEX idx_entregas_tipo ON entregas_reciclaveis(tipo_entrega);
CREATE INDEX idx_entregas_rota ON entregas_reciclaveis(id_rota);
```

---

## 🔒 Row Level Security (RLS)

### rotas_coleta
```sql
-- Usuários autenticados veem rotas ativas
-- Admins veem todas
POLICY: SELECT - rotas ativas ou admin

-- Apenas admins podem criar/editar/deletar
POLICY: ALL - apenas admin
```

### rotas_dias_coleta
```sql
-- Visível se a rota pai for visível
POLICY: SELECT - via join com rotas_coleta

-- Apenas admins podem gerenciar
POLICY: ALL - apenas admin
```

### rotas_areas_cobertura
```sql
-- Visível se a rota pai for visível
POLICY: SELECT - via join com rotas_coleta

-- Apenas admins podem gerenciar
POLICY: ALL - apenas admin
```

### usuarios_rotas
```sql
-- Usuários veem suas próprias adesões
-- Admins veem todas
POLICY: SELECT - próprio usuário ou admin

-- Usuários podem criar/editar suas adesões
-- Admins podem todas
POLICY: INSERT/UPDATE - próprio usuário ou admin

-- Apenas o próprio usuário pode cancelar
POLICY: DELETE - próprio usuário ou admin
```

---

## 🛠️ Funções Auxiliares

### gerar_qrcode_adesao_rota()
```sql
-- Gera código único no formato: ROTA-XXXXXXXXXXXX
-- Verifica unicidade antes de retornar
-- Usado ao criar registro em usuarios_rotas
```

### update_rotas_updated_at()
```sql
-- Trigger automático para atualizar campo updated_at
-- Aplicado em:
--   - rotas_coleta
--   - usuarios_rotas
```

---

## 📝 Migration SQL Completa

Arquivo de referência completo localizado em:
```
eco-champion-circle-main_referencia_não_alterar_nada/
  supabase/migrations/
    20260107220147_e4675efc-54ad-44bd-9f90-c31e28443893.sql
```

**Total de linhas:** 181
**Conteúdo:**
- ✅ Criação das 4 tabelas
- ✅ Alteração da tabela entregas_reciclaveis
- ✅ Criação de todos os índices
- ✅ Criação de triggers
- ✅ Criação de funções auxiliares
- ✅ Configuração completa de RLS
- ✅ Políticas de segurança

---

## ✅ Checklist de Implementação

### Fase 1: Criar Tabelas
- [ ] Copiar migration 20260107220147 para projeto atual
- [ ] Executar migration no Supabase
- [ ] Verificar criação de todas as 4 tabelas
- [ ] Verificar alterações em entregas_reciclaveis
- [ ] Verificar índices criados
- [ ] Verificar RLS habilitado

### Fase 2: Validar Estrutura
- [ ] Testar inserção em rotas_coleta
- [ ] Testar inserção em rotas_dias_coleta
- [ ] Testar inserção em rotas_areas_cobertura
- [ ] Testar geração de QR Code em usuarios_rotas
- [ ] Testar constraints e validações
- [ ] Testar políticas RLS

### Fase 3: Integrar com Página
- [ ] Criar AdminRotasColeta.tsx
- [ ] Implementar CRUD de rotas
- [ ] Implementar gestão de dias de coleta
- [ ] Implementar gestão de áreas de cobertura
- [ ] Implementar visualização de adesões
- [ ] Adicionar mapas (Google Maps)

---

## 🎨 Interface da Página AdminRotasColeta

### Seções Principais:

1. **Lista de Rotas**
   - Grid/tabela com todas as rotas
   - Filtros: status, operador, cidade
   - Ações: ver, editar, bloquear, excluir

2. **Criar/Editar Rota**
   - Modal ou página separada
   - Formulário com:
     - Nome
     - Descrição
     - Operador (select de cooperativas)
     - Status
   - Ao salvar, permite adicionar dias e áreas

3. **Gestão de Dias de Coleta**
   - Dentro da edição de rota
   - Lista de dias da semana
   - Para cada dia: checkbox + horários

4. **Gestão de Áreas de Cobertura**
   - Dentro da edição de rota
   - Formulário de endereço
   - Busca de CEP automática
   - Lista de áreas cadastradas
   - Possível integração com mapa

5. **Adesões por Rota**
   - Lista de usuários aderidos
   - Filtros: status, data
   - Visualização de QR Code
   - Histórico de entregas

---

## 📦 Dados de Exemplo

### Rota Exemplo:
```json
{
  "nome": "Rota Centro - Segunda/Quarta",
  "descricao": "Coleta residencial na região central",
  "id_operador": "uuid-da-cooperativa",
  "status": "ativa",
  "dias_coleta": [
    {
      "dia_semana": 1,
      "horario_inicio": "08:00",
      "horario_fim": "12:00"
    },
    {
      "dia_semana": 3,
      "horario_inicio": "08:00",
      "horario_fim": "12:00"
    }
  ],
  "areas_cobertura": [
    {
      "logradouro": "Rua das Flores",
      "bairro": "Centro",
      "cep": "01310-100",
      "cidade": "São Paulo",
      "uf": "SP"
    }
  ]
}
```

---

## 🚨 Pontos de Atenção

1. **QR Code Único:** Cada usuário tem um QR Code fixo por rota
2. **Validação de Área:** Verificar se endereço do usuário está na área de cobertura
3. **Dias de Coleta:** Validar que não há sobreposição de horários
4. **Status de Rota:** Rotas bloqueadas não aceitam novas adesões
5. **Cascata:** Ao deletar rota, todos os relacionamentos são afetados

---

## 📚 Próximos Passos

1. **AGORA:** Criar migration com as 4 tabelas
2. **DEPOIS:** Implementar página AdminRotasColeta.tsx
3. **POR FIM:** Implementar fluxo de adesão do usuário

---

**Criado em:** 08/01/2026  
**Referência:** Migration 20260107220147_e4675efc-54ad-44bd-9f90-c31e28443893.sql  
**Status:** 📝 Documentação completa - Pronto para implementação
