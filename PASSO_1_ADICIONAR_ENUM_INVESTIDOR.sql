-- ========================================
-- PASSO 1: Adicionar 'investidor' ao enum app_role
-- ========================================
-- ⚠️ IMPORTANTE: Execute APENAS este SQL primeiro
-- ⚠️ Depois execute o PASSO 2 em uma query SEPARADA

-- Adicionar o valor 'investidor' ao enum app_role
ALTER TYPE app_role ADD VALUE IF NOT EXISTS 'investidor';

-- ========================================
-- ✅ SUCESSO! Agora execute o PASSO 2
-- ========================================
-- Não execute mais nada neste SQL.
-- Vá para o arquivo: PASSO_2_CORRIGIR_MARIO.sql
