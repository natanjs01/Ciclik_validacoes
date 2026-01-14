/**
 * Script SQL para atualizar o bucket 'termos-uso'
 * Torna o bucket público e define tipos MIME permitidos
 */

-- Atualizar o bucket para ser público e aceitar apenas PDFs
UPDATE storage.buckets
SET 
  public = true,
  allowed_mime_types = ARRAY['application/pdf']
WHERE id = 'termos-uso';

-- Verificar se foi atualizado corretamente
SELECT * FROM storage.buckets WHERE id = 'termos-uso';

-- ========================================
-- POLÍTICAS RLS (se ainda não existirem)
-- ========================================

-- 1. Permitir leitura pública (todos podem visualizar os PDFs)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' 
    AND tablename = 'objects' 
    AND policyname = 'Permitir leitura pública de termos'
  ) THEN
    CREATE POLICY "Permitir leitura pública de termos"
    ON storage.objects FOR SELECT
    USING (bucket_id = 'termos-uso');
  END IF;
END $$;

-- 2. Apenas admins podem fazer upload
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' 
    AND tablename = 'objects' 
    AND policyname = 'Apenas admins podem fazer upload de termos'
  ) THEN
    CREATE POLICY "Apenas admins podem fazer upload de termos"
    ON storage.objects FOR INSERT
    WITH CHECK (
      bucket_id = 'termos-uso' AND
      EXISTS (
        SELECT 1 FROM user_roles
        WHERE user_roles.user_id = auth.uid()
        AND user_roles.role = 'admin'
      )
    );
  END IF;
END $$;

-- 3. Apenas admins podem atualizar
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' 
    AND tablename = 'objects' 
    AND policyname = 'Apenas admins podem atualizar termos'
  ) THEN
    CREATE POLICY "Apenas admins podem atualizar termos"
    ON storage.objects FOR UPDATE
    USING (
      bucket_id = 'termos-uso' AND
      EXISTS (
        SELECT 1 FROM user_roles
        WHERE user_roles.user_id = auth.uid()
        AND user_roles.role = 'admin'
      )
    );
  END IF;
END $$;

-- 4. Apenas admins podem deletar
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' 
    AND tablename = 'objects' 
    AND policyname = 'Apenas admins podem deletar termos'
  ) THEN
    CREATE POLICY "Apenas admins podem deletar termos"
    ON storage.objects FOR DELETE
    USING (
      bucket_id = 'termos-uso' AND
      EXISTS (
        SELECT 1 FROM user_roles
        WHERE user_roles.user_id = auth.uid()
        AND user_roles.role = 'admin'
      )
    );
  END IF;
END $$;

-- Verificar políticas criadas
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd
FROM pg_policies 
WHERE schemaname = 'storage' 
AND tablename = 'objects'
AND policyname LIKE '%termos%'
ORDER BY policyname;
