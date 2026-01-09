# 📊 Dashboards por Tipo de Usuário - Sistema Ciclik

## 🎯 Visão Geral

O sistema Ciclik possui **6 tipos de usuários**, cada um com seu dashboard específico e funcionalidades personalizadas.

---

## 👥 1. USUÁRIO (Cidadão/Consumidor)

### 🔑 Role: `usuario` e `vendedor`

### 📍 Dashboard Principal
- **Rota:** `/user`
- **Componente:** `UserDashboard.tsx`
- **Acesso:** Após login, redireciona automaticamente para `/user`

### 🎯 Funcionalidades Principais

#### Dashboard (`/user`)
- ✅ Saldo de pontos total
- ✅ Nível de gamificação atual
- ✅ Progresso para próximo nível
- ✅ Missões disponíveis e em andamento
- ✅ Histórico de entregas
- ✅ Cupons disponíveis
- ✅ Metas pessoais
- ✅ Estatísticas de impacto ambiental

#### Missões (`/missions`)
- ✅ Lista de missões educacionais
- ✅ Conteúdos de aprendizagem
- ✅ Quizzes para ganhar pontos
- ✅ Certificados de conclusão

#### Entregas (`/schedule-delivery`)
- ✅ Agendar coleta de recicláveis
- ✅ Selecionar materiais para entrega
- ✅ Escolher cooperativa/rota de coleta
- ✅ Acompanhar status da entrega

#### Cupons (`/redeem-coupons`)
- ✅ Resgatar cupons com pontos
- ✅ Visualizar cupons resgatados
- ✅ QR Code para uso em estabelecimentos

#### Perfil (`/profile`)
- ✅ Dados pessoais
- ✅ Endereço de coleta
- ✅ Preferências
- ✅ Histórico de atividades

#### Extrato de Pontos (`/points-statement`)
- ✅ Histórico completo de pontos
- ✅ Ganhos por entrega
- ✅ Gastos com resgates
- ✅ Saldo atual

#### Metas (`/goals`)
- ✅ Definir metas pessoais
- ✅ Acompanhar progresso
- ✅ Conquistas desbloqueadas

---

## 🏢 2. COOPERATIVA (Operador Logístico)

### 🔑 Role: `cooperativa`

### 📍 Dashboard Principal
- **Rota:** `/cooperative`
- **Componente:** `CooperativeDashboard.tsx`
- **Acesso:** Após login, redireciona automaticamente para `/cooperative`

### 🎯 Funcionalidades Principais

#### Dashboard (`/cooperative`)
- ✅ Entregas previstas (agendadas por usuários)
- ✅ Entregas em coleta (escaneadas mas não confirmadas)
- ✅ Total de entregas realizadas
- ✅ Peso total coletado
- ✅ Estatísticas do mês

#### Escanear QR Code (`/cooperative/scan-qrcode`)
- ✅ Escanear QR Code da entrega do usuário
- ✅ Iniciar processo de coleta
- ✅ Validação automática

#### Registrar Materiais (`/cooperative/register-materials/:entregaId`)
- ✅ Inserir peso de cada tipo de material
- ✅ Calcular pontos automaticamente
- ✅ Confirmar coleta

#### Validar Entrega (`/cooperative/validate`)
- ✅ Finalizar processo de coleta
- ✅ Atribuir pontos ao usuário
- ✅ Confirmar recebimento

---

## 🏭 3. EMPRESA (Empresa Parceira)

### 🔑 Role: `empresa`

### 📍 Dashboard Principal
- **Rota:** `/company`
- **Componente:** `CompanyDashboard.tsx`
- **Acesso:** Após login, redireciona automaticamente para `/company`

### 🎯 Funcionalidades Principais

#### Dashboard (`/company`)
- ✅ Cupons criados pela empresa
- ✅ Total de resgates
- ✅ Estatísticas de uso
- ✅ Engajamento com usuários
- ✅ Impacto social gerado

#### Métricas Detalhadas (`/admin/companies/:id/metrics`)
- ✅ Gráficos de resgates ao longo do tempo
- ✅ Análise de ROI
- ✅ Usuários únicos atingidos
- ✅ Taxa de conversão

---

## 💼 4. INVESTIDOR CDV (Comprador de Créditos)

### 🔑 Role: `investidor`

### 📍 Dashboard Principal
- **Rota:** `/cdv/investor`
- **Componente:** `CDVInvestorDashboard.tsx`
- **Acesso:** Após login, redireciona automaticamente para `/cdv/investor`

### 🎯 Funcionalidades Principais

#### Dashboard (`/cdv/investor`)
- ✅ **Quotas Adquiridas:**
  - Visualização de todas as quotas compradas
  - Número da quota e projeto vinculado
  - Status (ativa, maturada, concluída)
  - Data de compra e maturação
  - Valor investido (R$ 2.000/quota)

- ✅ **Progresso de Impacto:**
  - Meta de resíduos (kg) vs. conciliado
  - Meta de educação (horas) vs. conciliado
  - Meta de produtos (unidades) vs. conciliado
  - Barra de progresso visual para cada métrica

- ✅ **Certificados CDV:**
  - Download de certificados em PDF
  - QR Code para validação
  - Informações do projeto
  - Período de validade

- ✅ **Validação:**
  - Validar certificados via QR Code
  - Verificar autenticidade
  - Dados do investidor e projeto

#### Certificado Individual (`/cdv/certificate/:id`)
- ✅ Visualização detalhada do certificado
- ✅ Download em formato oficial
- ✅ Compartilhamento

#### Validação Pública (`/cdv/validate/:id`)
- ✅ Qualquer pessoa pode validar
- ✅ Verificação via QR Code
- ✅ Autenticidade garantida

---

## 👨‍💼 5. ADMIN (Administrador do Sistema)

### 🔑 Role: `admin`

### 📍 Dashboard Principal
- **Rota:** `/admin`
- **Componente:** `AdminDashboard.tsx`
- **Acesso:** Após login, redireciona automaticamente para `/admin`

### 🎯 Funcionalidades Principais (Menu Principal)

#### 1. Dashboard Geral (`/admin`)
- ✅ Cards com acesso rápido a todas as funcionalidades
- ✅ Estatísticas gerais do sistema
- ✅ Menu de navegação

#### 2. Usuários (`/admin/users`)
- ✅ Lista completa de usuários
- ✅ Editar roles
- ✅ Bloquear/desbloquear
- ✅ Visualizar perfil completo

#### 3. Cooperativas (`/admin/operadores-logisticos`)
- ✅ **CRUD de Cooperativas:**
  - Cadastrar nova cooperativa
  - Editar dados (CNPJ, endereço, capacidade)
  - Ativar/desativar
  - Vincular rotas de coleta
- ✅ **Tipos de Operador:**
  - Cooperativa
  - Rota Ciclik (rota própria)
  - Operador Parceiro
- ✅ **Capacidade Mensal:**
  - Formato brasileiro (1.250,23)
  - Em toneladas

#### 4. Empresas (`/admin/companies`)
- ✅ Lista de empresas parceiras
- ✅ Cadastrar novas empresas
- ✅ Editar informações
- ✅ Ver métricas detalhadas

#### 5. Produtos (`/admin/products`)
- ✅ Catálogo de produtos
- ✅ Valores em pontos
- ✅ Estoque
- ✅ Categorias

#### 6. Missões (`/admin/missions`)
- ✅ Criar missões educacionais
- ✅ Definir conteúdos
- ✅ Configurar quizzes
- ✅ Pontos por missão

#### 7. Cupons (`/admin/coupons`)
- ✅ Importar cupons
- ✅ Gerenciar validade
- ✅ Controlar estoque
- ✅ Relatórios de uso

#### 8. Rotas de Coleta (`/admin/rotas`)
- ✅ **Criar Rotas:**
  - Nome e descrição
  - Bairros atendidos
  - Dias de coleta
  - Cooperativa responsável
- ✅ **Adesões de Usuários:**
  - Ver quem aderiu
  - Endereços de coleta
  - Status das adesões

#### 9. Interesses (`/admin/interesses`)
- ✅ Demanda por funcionalidades
- ✅ Mapa de calor por região
- ✅ Análise de interesse

#### 10. Gamificação (`/admin/gamification`)
- ✅ Configurar níveis
- ✅ Pontos por nível
- ✅ Recompensas
- ✅ Badges

#### 11. KPIs (`/admin/kpis`)
- ✅ Indicadores chave de performance
- ✅ Entregas realizadas
- ✅ Usuários ativos
- ✅ Taxa de conversão

#### 12. Auditoria de Pontos (`/admin/points-audit`)
- ✅ Log completo de transações
- ✅ Ganhos e gastos
- ✅ Validações
- ✅ Ajustes manuais

#### 13. Entregas Prometidas (`/admin/delivery-promises`)
- ✅ Entregas agendadas
- ✅ Status de cada entrega
- ✅ Cooperativas responsáveis

#### 14. Configurações (`/admin/settings`)
- ✅ Parâmetros do sistema
- ✅ Taxas de conversão
- ✅ Limites e regras

#### 15. Documentação (`/admin/documentation`)
- ✅ Guias do sistema
- ✅ FAQs
- ✅ Tutoriais

#### 16. **Gestão CDV** (`/admin/cdv`)
- ✅ **Aba Leads:**
  - Leads interessados em investir
  - Converter em investidores
  - Histórico de contatos
  
- ✅ **Aba Projetos:**
  - Criar projetos CDV
  - Definir metas (kg, horas, produtos)
  - Calcular quotas (R$ 2.000 cada)
  - Prazo de maturação
  
- ✅ **Aba Investidores:**
  - CRUD de investidores
  - Dados corporativos (CNPJ, razão social)
  - Histórico de emails
  - Enviar/reenviar convites
  
- ✅ **Aba Quotas:**
  - Atribuir quotas a investidores
  - Atribuição em lote
  - Distribuir datas de maturação
  - Acompanhar progresso
  
- ✅ **Aba Estoque:**
  - Resíduos disponíveis
  - Educação disponível
  - Produtos disponíveis
  - Conciliar com quotas
  
- ✅ **Aba Reconciliação:**
  - Conciliação manual
  - Vincular impactos a quotas
  - Gerar certificados

---

## 📊 Resumo: Redirecionamento Automático por Role

Quando um usuário faz login, o sistema verifica sua role e redireciona automaticamente:

| Role | Dashboard | Rota |
|------|-----------|------|
| `usuario` | UserDashboard | `/user` |
| `vendedor` | UserDashboard | `/user` |
| `cooperativa` | CooperativeDashboard | `/cooperative` |
| `empresa` | CompanyDashboard | `/company` |
| `investidor` | CDVInvestorDashboard | `/cdv/investor` |
| `admin` | AdminDashboard | `/admin` |

---

## 🔒 Segurança

Cada dashboard está protegido por:
1. **ProtectedRoute** - Verifica role antes de renderizar
2. **RoleBasedRedirect** - Redireciona automaticamente após login
3. **RLS (Row Level Security)** - Filtra dados no banco de dados
4. **Session Validation** - Valida sessão ativa via Supabase Auth

---

## 🎨 Características Comuns

Todos os dashboards possuem:
- ✅ **Header** com nome do usuário e botão de logout
- ✅ **Navigation** personalizada por role
- ✅ **Cards informativos** com métricas relevantes
- ✅ **Interface responsiva** (mobile-friendly)
- ✅ **Tema consistente** (Ciclik brand colors)
- ✅ **Loading states** durante carregamento
- ✅ **Error handling** com mensagens amigáveis
- ✅ **Toast notifications** para feedback

---

## 📱 Suporte Mobile (PWA)

O sistema funciona como Progressive Web App:
- ✅ Instalável no celular
- ✅ Funciona offline (parcialmente)
- ✅ Notificações push
- ✅ Ícone na home screen

---

## 🚀 Fluxo de Primeiro Acesso

### Para Usuários (Cidadãos)
1. Acessa `/auth`
2. Cria conta com email/senha
3. Confirma email
4. Faz login
5. Redirecionado para `/user`
6. Tutorial de boas-vindas

### Para Cooperativas
1. Admin cadastra em `/admin/operadores-logisticos`
2. Sistema cria usuário automaticamente
3. Email de recuperação de senha é enviado
4. Cooperativa define senha
5. Faz login
6. Redirecionado para `/cooperative`

### Para Empresas
1. Admin cadastra em `/admin/companies`
2. Sistema cria usuário
3. Email de acesso enviado
4. Empresa define senha
5. Faz login
6. Redirecionado para `/company`

### Para Investidores
1. Admin cadastra em `/admin/cdv` → Investidores
2. Admin atribui quotas em `/admin/cdv` → Quotas
3. Sistema cria usuário e envia email de recuperação
4. Investidor define senha
5. Faz login
6. Redirecionado para `/cdv/investor`
7. Marca primeiro acesso automaticamente

### Para Admins
1. Criado diretamente no Supabase Auth
2. Role `admin` atribuída manualmente
3. Faz login
4. Redirecionado para `/admin`

---

## 📚 Documentação Adicional

- `CONFIRMACAO_PORTAL_INVESTIDOR.md` - Portal do investidor
- `CONFIRMACAO_SEGURANCA_QUOTAS_INVESTIDOR.md` - Segurança de quotas
- `PWA_GUIA.md` - Guia de PWA
- `README.md` - Visão geral do projeto

---

## ✨ Conclusão

O sistema Ciclik possui dashboards especializados para cada tipo de usuário, garantindo:
- 🎯 **Experiência personalizada** para cada role
- 🔒 **Segurança robusta** com múltiplas camadas
- 📊 **Métricas relevantes** para cada contexto
- 🚀 **Performance otimizada** com queries eficientes
- 🎨 **Interface intuitiva** e responsiva

Cada usuário vê apenas o que precisa, com acesso restrito aos dados e funcionalidades pertinentes ao seu papel no sistema.
