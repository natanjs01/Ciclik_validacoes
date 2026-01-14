/**
 * Script para limpar políticas duplicadas do bucket termos-uso
 * Mantém apenas as políticas mais recentes e corretas
 */

-- ========================================
-- REMOVER POLÍTICAS ANTIGAS/DUPLICADAS
-- ========================================

-- Remover políticas antigas (se existirem)
DROP POLICY IF EXISTS "Admin pode atualizar arquivos de termos" ON storage.objects;
DROP POLICY IF EXISTS "Admin pode deletar arquivos de termos" ON storage.objects;
DROP POLICY IF EXISTS "Admin pode fazer upload de termos" ON storage.objects;
DROP POLICY IF EXISTS "Usuários autenticados podem ler termos" ON storage.objects;

-- ========================================
-- VERIFICAR POLÍTICAS RESTANTES
-- ========================================

SELECT 
  policyname,
  cmd as operation,
  roles
FROM pg_policies 
WHERE schemaname = 'storage' 
AND tablename = 'objects'
AND policyname LIKE '%termos%'
ORDER BY policyname;

-- ========================================
-- RESULTADO ESPERADO (4 políticas)
-- ========================================
-- 1. Permitir leitura pública de termos (SELECT - public)
-- 2. Apenas admins podem fazer upload de termos (INSERT - public)
-- 3. Apenas admins podem atualizar termos (UPDATE - public)
-- 4. Apenas admins podem deletar termos (DELETE - public)
