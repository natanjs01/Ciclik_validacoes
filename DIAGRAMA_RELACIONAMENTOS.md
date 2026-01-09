# 🗺️ Diagrama de Relacionamento - Tabelas Ciclik

## 📊 Visão Geral do Banco de Dados

Este documento apresenta os relacionamentos entre todas as tabelas do sistema Ciclik, incluindo as 4 tabelas faltantes do módulo de Rotas de Coleta.

---

## 🎯 Módulos do Sistema

### 1. 👤 Módulo de Usuários e Autenticação
```
auth.users (Supabase Auth)
    ↓
profiles (Perfis de usuários)
    ├─→ user_roles (Papéis/Permissões)
    ├─→ indicacoes (Sistema de indicações)
    └─→ notificacoes (Notificações do usuário)
```

### 2. ♻️ Módulo de Reciclagem (Core)
```
profiles
    ↓
notas_fiscais (NF de compra)
    ↓
materiais_reciclaveis_usuario (Materiais do usuário)
    ↓
entregas_reciclaveis
    ├─→ materiais_coletados_detalhado
    ├─→ variacoes_peso_entrega
    └─→ cooperativas (Quem recebe)
```

### 3. 🏢 Módulo de Cooperativas
```
profiles
    ↓
cooperativas (Operadores logísticos)
    ├─→ entregas_reciclaveis (Recebem entregas)
    ├─→ notas_fiscais_cooperativa (NF emitidas)
    ├─→ emails_cooperativas (Log de emails)
    ├─→ chatbot_conversas (WhatsApp Bot)
    └─→ rotas_coleta ⚠️ (Sistema de rotas - FALTA CRIAR)
```

### 4. 🎓 Módulo de Gamificação
```
profiles
    ↓
missoes (Missões educativas)
    ├─→ questoes_missao (Perguntas de quiz)
    ├─→ missoes_usuarios (Progresso do usuário)
    └─→ respostas_quiz (Respostas dadas)
        ↓
pontos_mensais_usuarios (Score mensal)
```

### 5. 🎁 Módulo de Recompensas
```
profiles
    ↓
cupons (Cupons disponíveis)
    ├─→ cupons_resgates (Resgates realizados)
    └─→ alertas_estoque (Alertas de baixo estoque)
```

### 6. 🏭 Módulo de Empresas
```
profiles
    ↓
empresas (Empresas parceiras)
    └─→ metricas_empresas (KPIs da empresa)
```

### 7. 📦 Módulo de Produtos
```
produtos_ciclik (Catálogo de produtos)
    └─→ produto_embalagens (Tipos de embalagem)
        ↓
    (usado em notas_fiscais e materiais_reciclaveis_usuario)
```

### 8. 🌱 Módulo CDV (Certificado Digital Verde)
```
profiles
    ↓
cdv_investidores (Investidores)
    ↓
cdv_projetos (Projetos de impacto)
    ↓
cdv_quotas (Quotas compradas)
    ├─→ cdv_certificados (Certificados emitidos)
    └─→ cdv_conciliacoes (Conciliações de impacto)
        ↓
    estoque_residuos    ─┐
    estoque_educacao     ├─→ (Estoques de impacto)
    estoque_embalagens  ─┘
```

### 9. 🚚 Módulo de Rotas de Coleta ⚠️ (FALTA IMPLEMENTAR)
```
cooperativas
    ↓
rotas_coleta ⚠️ (Rotas criadas)
    ├─→ rotas_dias_coleta ⚠️ (Dias/horários)
    ├─→ rotas_areas_cobertura ⚠️ (Áreas atendidas)
    └─→ usuarios_rotas ⚠️ (Adesões de usuários)
            ↓
        profiles (Usuários aderidos)
            ↓
        entregas_reciclaveis (Entregas via rota)
```

### 10. 📊 Módulo de Analytics
```
configuracoes_sistema (Configs gerais)
kpis (Métricas globais)
pontos_mensais_usuarios (Score mensal)
ajustes_pontos_manuais (Ajustes de admin)
materiais_pontuacao (Pontuação por material)
cache_notas_fiscais (Cache de consultas)
```

---

## 🔗 Relacionamentos Detalhados

### Tabela: entregas_reciclaveis (Central)
**Relaciona:**
- `id_usuario` → profiles
- `id_cooperativa` → cooperativas
- `id_rota` ⚠️ → rotas_coleta (FALTA ADICIONAR COLUNA)
- `id_adesao_rota` ⚠️ → usuarios_rotas (FALTA ADICIONAR COLUNA)

**É referenciada por:**
- materiais_coletados_detalhado
- variacoes_peso_entrega
- estoque_residuos
- chatbot_conversas

---

### Tabela: profiles (Central)
**Relaciona:**
- `id` → auth.users (FK implícita)

**É referenciada por:**
- user_roles
- cooperativas
- empresas
- missoes_usuarios
- respostas_quiz
- notas_fiscais
- materiais_reciclaveis_usuario
- entregas_reciclaveis
- cupons_resgates
- indicacoes (id_indicador e id_indicado)
- notificacoes
- pontos_mensais_usuarios
- ajustes_pontos_manuais
- cdv_investidores
- estoque_residuos
- estoque_educacao
- usuarios_rotas ⚠️ (FALTA CRIAR)

---

### Tabela: cooperativas
**Relaciona:**
- `id_user` → profiles

**É referenciada por:**
- entregas_reciclaveis
- materiais_coletados_detalhado
- notas_fiscais_cooperativa
- emails_cooperativas
- rotas_coleta ⚠️ (FALTA CRIAR - id_operador)

---

### Tabelas do Módulo de Rotas ⚠️ (FALTAM CRIAR)

#### rotas_coleta
**Relaciona:**
- `id_operador` → cooperativas

**É referenciada por:**
- rotas_dias_coleta
- rotas_areas_cobertura
- usuarios_rotas
- entregas_reciclaveis (nova coluna id_rota)

#### rotas_dias_coleta
**Relaciona:**
- `id_rota` → rotas_coleta

**É referenciada por:**
- rotas_areas_cobertura (id_dia_coleta - opcional)

#### rotas_areas_cobertura
**Relaciona:**
- `id_rota` → rotas_coleta
- `id_dia_coleta` → rotas_dias_coleta (opcional)

**É referenciada por:**
- usuarios_rotas (id_area - opcional)

#### usuarios_rotas
**Relaciona:**
- `id_usuario` → profiles
- `id_rota` → rotas_coleta
- `id_area` → rotas_areas_cobertura (opcional)

**É referenciada por:**
- entregas_reciclaveis (nova coluna id_adesao_rota)

---

## 📊 Diagrama Visual ASCII

```
                    ┌──────────────┐
                    │  auth.users  │
                    └──────┬───────┘
                           │
                    ┌──────▼───────┐
                    │   profiles   │◄─────────────┐
                    └──────┬───────┘              │
                           │                      │
         ┌─────────────────┼─────────────────┐   │
         │                 │                 │   │
    ┌────▼────┐      ┌─────▼─────┐    ┌────▼───▼──┐
    │user_roles│      │cooperativas│    │ empresas  │
    └─────────┘      └─────┬──────┘    └───────────┘
                           │
                ┌──────────┼──────────┐
                │          │          │
         ┌──────▼─────┐    │    ┌─────▼────────┐
         │rotas_coleta│◄───┘    │emails_coops  │
         │  ⚠️ FALTA │          └──────────────┘
         └──────┬─────┘
                │
        ┌───────┼────────┐
        │       │        │
  ┌─────▼──┐ ┌─▼───┐ ┌──▼────┐
  │dias    │ │areas│ │usuarios│
  │coleta  │ │cob. │ │rotas   │
  │⚠️ FALTA│ │⚠️   │ │⚠️ FALTA│
  └────────┘ └─────┘ └───┬────┘
                          │
    ┌─────────────────────┼──────────────────┐
    │                     │                  │
┌───▼────────┐    ┌───────▼────────┐   ┌────▼─────┐
│materiais   │    │entregas        │   │missoes   │
│reciclaveis │    │reciclaveis     │   │usuarios  │
└────────────┘    └───────┬────────┘   └──────────┘
                          │
                  ┌───────┼────────┐
                  │       │        │
            ┌─────▼──┐ ┌──▼────┐ ┌─▼──────┐
            │materiais│ │variac.│ │estoque │
            │coletados│ │peso   │ │residuos│
            └─────────┘ └───────┘ └────────┘

    ┌──────────────────────────────────────┐
    │         MÓDULO CDV                   │
    │  cdv_investidores → cdv_projetos     │
    │         ↓                             │
    │    cdv_quotas → cdv_certificados     │
    │         ↓                             │
    │  cdv_conciliacoes                    │
    │         ↓                             │
    │  estoques (residuos, educacao, emb)  │
    └──────────────────────────────────────┘
```

---

## 🎯 Fluxos Principais

### Fluxo 1: Usuário Faz Entrega Avulsa
```
1. profiles (usuário)
2. materiais_reciclaveis_usuario (cadastra materiais)
3. entregas_reciclaveis (cria entrega)
   - tipo_entrega = 'avulsa'
   - gera QR Code único
4. cooperativas (recebe)
5. materiais_coletados_detalhado (valida)
6. variacoes_peso_entrega (registra diferença)
7. profiles.score_verde (atualiza pontuação)
```

### Fluxo 2: Usuário Adere a Rota ⚠️ (NOVO - FALTA IMPLEMENTAR)
```
1. profiles (usuário)
2. rotas_coleta (busca rota por CEP)
3. rotas_areas_cobertura (valida endereço)
4. usuarios_rotas (cria adesão)
   - gera QR Code FIXO
5. Nos dias de coleta:
   - rotas_dias_coleta (verifica dia/horário)
   - entregas_reciclaveis (cria entrega)
     * tipo_entrega = 'rota'
     * id_rota
     * id_adesao_rota
   - cooperativas coleta
```

### Fluxo 3: Admin Cria Rota ⚠️ (NOVO - FALTA IMPLEMENTAR)
```
1. AdminRotasColeta.tsx
2. rotas_coleta (cria rota)
3. rotas_dias_coleta (define dias/horários)
4. rotas_areas_cobertura (mapeia áreas)
5. cooperativas (associa operador)
```

### Fluxo 4: Missão Educativa
```
1. missoes (missão disponível)
2. questoes_missao (perguntas)
3. profiles (usuário acessa)
4. respostas_quiz (usuário responde)
5. missoes_usuarios (registra conclusão)
6. pontos_mensais_usuarios (atualiza score)
7. estoque_educacao (gera impacto CDV)
```

### Fluxo 5: Geração de Certificado CDV
```
1. cdv_investidores (compra quota)
2. cdv_quotas (quota ativa)
3. Sistema monitora:
   - estoque_residuos
   - estoque_educacao
   - estoque_embalagens
4. cdv_conciliacoes (atribui impactos)
5. cdv_quotas (atualiza progresso)
6. cdv_certificados (emite certificado)
```

---

## 📋 Checklist de Integridade

### ✅ Já Existe
- [x] Estrutura básica de usuários
- [x] Sistema de entregas
- [x] Sistema de cooperativas
- [x] Sistema de gamificação
- [x] Sistema de cupons
- [x] Sistema CDV completo
- [x] Sistema de empresas
- [x] Catálogo de produtos

### ⚠️ Falta Implementar
- [ ] 4 Tabelas do módulo de Rotas
- [ ] 2 Colunas em entregas_reciclaveis
- [ ] Página AdminRotasColeta.tsx
- [ ] Página AdminInteresses.tsx
- [ ] Fluxo de adesão a rotas (usuário)

---

## 🔧 Comandos SQL Úteis

### Ver Todas as Tabelas
```sql
SELECT tablename 
FROM pg_tables 
WHERE schemaname = 'public' 
ORDER BY tablename;
```

### Ver Relacionamentos de Uma Tabela
```sql
SELECT
    tc.table_name, 
    kcu.column_name, 
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name 
FROM information_schema.table_constraints AS tc 
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY' 
  AND tc.table_name = 'entregas_reciclaveis';
```

### Verificar Se Tabela Existe
```sql
SELECT EXISTS (
   SELECT FROM information_schema.tables 
   WHERE table_schema = 'public' 
   AND table_name = 'rotas_coleta'
);
```

---

## 📚 Documentos Relacionados

1. **ANALISE_COMPARATIVA_TABELAS.md** - Comparação completa
2. **TABELAS_ROTAS_FALTANTES.md** - Detalhes das 4 tabelas
3. **PLANO_IMPLEMENTACAO_PAGINAS.md** - Roadmap de páginas
4. **RESUMO_EXECUTIVO.md** - Visão geral do projeto

---

## 🎯 Próximos Passos

1. ✅ Criar 4 tabelas do módulo de rotas
2. ✅ Adicionar 2 colunas em entregas_reciclaveis
3. ✅ Implementar AdminRotasColeta.tsx
4. ✅ Implementar fluxo de adesão do usuário
5. ✅ Testar integração completa

---

**Criado em:** 08/01/2026  
**Versão:** 1.0  
**Status:** 📊 Diagrama Completo
