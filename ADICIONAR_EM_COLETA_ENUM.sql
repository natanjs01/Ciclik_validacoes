-- ========================================
-- 🔧 CORREÇÃO RÁPIDA: Enum status_promessa_entrega
-- ========================================
-- Erro: invalid input value for enum status_promessa_entrega: "em_coleta"
-- Causa: O enum no banco não tem o valor "em_coleta"
-- ========================================

-- ✅ PASSO 1: Verificar valores atuais do enum
SELECT 
  unnest(enum_range(NULL::status_promessa_entrega))::text as valores_atuais;

-- Se retornar apenas: ativa, finalizada, expirada, cancelada
-- Significa que está FALTANDO "em_coleta"!

-- ========================================
-- ✅ PASSO 2: Adicionar valor "em_coleta" (se não existir)
-- ========================================

-- Adicionar o valor faltante
ALTER TYPE status_promessa_entrega ADD VALUE IF NOT EXISTS 'em_coleta';

-- ========================================
-- ✅ PASSO 3: Verificar novamente (deve mostrar "em_coleta" agora)
-- ========================================

SELECT 
  unnest(enum_range(NULL::status_promessa_entrega))::text as valores_atuais;

-- Resultado esperado:
-- ativa
-- em_coleta ✅ (novo!)
-- finalizada
-- expirada
-- cancelada

-- ========================================
-- ✅ PASSO 4: Testar a página
-- ========================================
-- Após executar este script:
-- 1. Recarregue a página /cooperative
-- 2. O erro deve desaparecer
-- 3. As entregas "em coleta" devem aparecer corretamente
-- ========================================
