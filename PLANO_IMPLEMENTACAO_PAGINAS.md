# 🚀 Plano de Ação - Implementação de Páginas Faltantes

## 📋 Status Geral

✅ **Banco de Dados:** 100% completo - todas as tabelas necessárias já existem
⚠️ **Páginas:** 4 páginas precisam ser criadas

---

## 📄 Páginas a Serem Criadas

### 1️⃣ AdminInteresses.tsx
**Prioridade:** 🔴 ALTA

**Descrição:**
Página de gerenciamento de interesses/leads de investidores CDV. Permite visualizar, filtrar e gerenciar leads que demonstraram interesse em investir em certificados digitais verdes.

**Funcionalidades Principais:**
- Listagem de leads com filtros
- Visualização de detalhes do lead
- Alteração de status (novo, contatado, negociando, convertido, perdido)
- Exportação de dados
- Notas e histórico de contatos

**Tabelas Relacionadas:**
- `cdv_leads` (já existe no projeto atual!)
- `cdv_investidores`

**Dependências:**
- Componente de tabela com filtros
- Modal de detalhes
- Integração com API do Supabase

---

### 2️⃣ AdminRotasColeta.tsx
**Prioridade:** 🔴 ALTA

**Descrição:**
Gerenciamento de rotas de coleta de recicláveis. Permite criar, editar e visualizar rotas otimizadas para cooperativas e operadores logísticos.

**Funcionalidades Principais:**
- Listagem de rotas ativas/inativas
- Criação de nova rota
- Edição de pontos de coleta
- Visualização em mapa (integração com Google Maps)
- Associação de cooperativas/operadores
- Agendamento de coletas

**Tabelas Relacionadas:**
- `cooperativas` (já existe)
- `entregas_reciclaveis` (já existe)
- Possível nova tabela: `rotas_coleta` (verificar se necessária)

**Dependências:**
- Google Maps API ou similar
- Componentes de formulário
- Algoritmo de otimização de rotas (opcional)

---

### 3️⃣ InstitutionalPresentation.tsx
**Prioridade:** 🟡 MÉDIA

**Descrição:**
Página de apresentação institucional da Ciclik para novos visitantes, empresas parceiras e público em geral. Landing page com informações sobre missão, visão, valores e impacto.

**Funcionalidades Principais:**
- Hero section com chamada para ação
- Seção "Sobre Nós"
- Estatísticas de impacto em tempo real
- Depoimentos de usuários/parceiros
- Seção de parcerias
- Call-to-action para cadastro

**Tabelas Relacionadas:**
- `kpis` (estatísticas públicas)
- `profiles` (depoimentos)

**Dependências:**
- Componentes de UI/marketing
- Animações
- Imagens e assets institucionais

---

### 4️⃣ InvestorPresentation.tsx
**Prioridade:** 🟡 MÉDIA

**Descrição:**
Página de apresentação específica para investidores interessados em CDV (Certificado Digital Verde). Mostra oportunidades de investimento, retorno esperado e impacto ambiental.

**Funcionalidades Principais:**
- Apresentação do modelo de negócio CDV
- Projetos disponíveis para investimento
- Calculadora de retorno/impacto
- Cases de sucesso
- Formulário de interesse
- Download de materiais (pitch deck, whitepaper)

**Tabelas Relacionadas:**
- `cdv_projetos` (já existe)
- `cdv_quotas` (já existe)
- `cdv_leads` (captura de interesse)

**Dependências:**
- Componentes de apresentação
- Gráficos e visualizações
- Formulário de captura de leads
- PDFs para download

---

## 🎯 Ordem de Implementação Recomendada

### Sprint 1 (1-2 dias)
1. ✅ **AdminInteresses.tsx**
   - Essencial para gestão comercial
   - Tabela já existe
   - Implementação mais direta

### Sprint 2 (2-3 dias)
2. ✅ **AdminRotasColeta.tsx**
   - Importante para operações
   - Pode exigir nova tabela
   - Integração com mapas

### Sprint 3 (1-2 dias)
3. ✅ **InstitutionalPresentation.tsx**
   - Marketing e captação
   - Principalmente front-end

### Sprint 4 (1-2 dias)
4. ✅ **InvestorPresentation.tsx**
   - Captação de investidores
   - Principalmente front-end

---

## 📦 Estrutura de Arquivos

### Para cada página criar:

```
src/pages/
  ├── [NomePagina].tsx           # Componente principal
  └── ...

src/components/
  ├── [NomePagina]/              # Componentes específicos (se necessário)
  │   ├── [Subcomponente1].tsx
  │   └── [Subcomponente2].tsx
  └── ...

src/types/
  └── [nomePagina].ts            # Tipos TypeScript (se necessário)

src/hooks/
  └── use[NomePagina].ts         # Custom hooks (se necessário)
```

---

## 🔧 Checklist de Implementação

### Para Cada Página:

#### 1. Preparação
- [ ] Ler implementação da referência
- [ ] Identificar componentes reutilizáveis
- [ ] Verificar tabelas e tipos necessários
- [ ] Listar dependências externas

#### 2. Desenvolvimento
- [ ] Criar estrutura básica da página
- [ ] Implementar layout e UI
- [ ] Conectar com Supabase
- [ ] Implementar lógica de negócio
- [ ] Adicionar validações
- [ ] Implementar tratamento de erros

#### 3. Integração
- [ ] Adicionar rota no sistema
- [ ] Adicionar link no menu/navegação
- [ ] Configurar permissões (RLS)
- [ ] Testar fluxo completo

#### 4. Qualidade
- [ ] Testar responsividade
- [ ] Testar diferentes perfis de usuário
- [ ] Verificar performance
- [ ] Revisar código
- [ ] Documentar funcionalidades

---

## 🗺️ Roadmap Visual

```
┌─────────────────────────────────────────────────────────┐
│                    IMPLEMENTAÇÃO                        │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  Sprint 1 (Dias 1-2)                                   │
│  ├─ AdminInteresses.tsx ⭐                             │
│  │  ├─ Criar página básica                            │
│  │  ├─ Integrar com cdv_leads                         │
│  │  ├─ Implementar filtros                            │
│  │  └─ Adicionar ações                                │
│  │                                                      │
│  Sprint 2 (Dias 3-5)                                   │
│  ├─ AdminRotasColeta.tsx ⭐                            │
│  │  ├─ Verificar/criar tabela rotas                   │
│  │  ├─ Integrar Google Maps                           │
│  │  ├─ Implementar CRUD de rotas                      │
│  │  └─ Adicionar visualização                         │
│  │                                                      │
│  Sprint 3 (Dias 6-7)                                   │
│  ├─ InstitutionalPresentation.tsx                      │
│  │  ├─ Criar landing page                             │
│  │  ├─ Adicionar seções                               │
│  │  ├─ Integrar KPIs                                  │
│  │  └─ Otimizar SEO                                   │
│  │                                                      │
│  Sprint 4 (Dias 8-9)                                   │
│  └─ InvestorPresentation.tsx                           │
│     ├─ Criar página investidor                        │
│     ├─ Adicionar calculadora                          │
│     ├─ Integrar projetos CDV                          │
│     └─ Implementar formulário                         │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

---

## 📚 Recursos de Referência

### Arquivos para Consultar:
1. `eco-champion-circle-main_referencia_não_alterar_nada/src/pages/`
2. `MIGRACAO_SUPABASE_COMPLETA.sql`
3. `FLUXO_COOPERATIVAS.md`
4. `RELATORIO_FUNCIONAL_CICLIK.md`

### Padrões do Projeto:
- React + TypeScript
- Vite
- TailwindCSS
- Shadcn/ui components
- Supabase (backend)
- React Query (data fetching)

---

## ⚠️ Pontos de Atenção

### AdminInteresses.tsx
- Verificar se `cdv_leads` tem todos os campos necessários
- Implementar sistema de status/funil
- Considerar notificações para novos leads

### AdminRotasColeta.tsx
- **ATENÇÃO:** Pode precisar criar tabela `rotas_coleta`
- Avaliar custo de API do Google Maps
- Considerar uso de cache para rotas

### InstitutionalPresentation.tsx
- Otimizar imagens e performance
- Implementar animações leves
- Garantir acessibilidade

### InvestorPresentation.tsx
- Validar fórmulas de cálculo com time
- Proteger informações sensíveis
- Implementar captcha no formulário

---

## ✅ Critérios de Aceite

### Para considerar uma página completa:

1. **Funcional**
   - [ ] Todas as funcionalidades principais implementadas
   - [ ] Sem erros no console
   - [ ] Integração com backend funcionando

2. **UI/UX**
   - [ ] Responsiva (mobile, tablet, desktop)
   - [ ] Segue design system do projeto
   - [ ] Feedback visual para ações do usuário
   - [ ] Loading states implementados

3. **Segurança**
   - [ ] Validação de inputs
   - [ ] RLS configurado no Supabase
   - [ ] Permissões verificadas

4. **Performance**
   - [ ] Carregamento < 3s
   - [ ] Otimização de queries
   - [ ] Lazy loading implementado

5. **Documentação**
   - [ ] Código comentado (quando necessário)
   - [ ] README atualizado
   - [ ] Tipos TypeScript definidos

---

## 🎉 Conclusão

Com este plano, conseguiremos implementar todas as páginas faltantes de forma organizada e eficiente. O projeto já está 95% completo em termos de estrutura, faltando apenas estas 4 páginas específicas.

**Tempo estimado total:** 8-10 dias de desenvolvimento

**Próximo passo:** Começar com AdminInteresses.tsx

---

**Criado em:** 08/01/2026
**Última atualização:** 08/01/2026
