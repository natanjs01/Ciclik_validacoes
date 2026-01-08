-- Add new fields to cooperativas table
ALTER TABLE cooperativas 
ADD COLUMN IF NOT EXISTS whatsapp TEXT,
ADD COLUMN IF NOT EXISTS documento_constituicao_url TEXT,
ADD COLUMN IF NOT EXISTS documento_representante_url TEXT,
ADD COLUMN IF NOT EXISTS data_cadastro TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Create storage bucket for cooperative documents
INSERT INTO storage.buckets (id, name, public) 
VALUES ('cooperative-documents', 'cooperative-documents', false)
ON CONFLICT (id) DO NOTHING;

-- RLS policies for cooperative documents bucket
CREATE POLICY "Admins can upload cooperative documents"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'cooperative-documents' 
  AND (SELECT has_role(auth.uid(), 'admin'::app_role))
);

CREATE POLICY "Admins can view cooperative documents"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'cooperative-documents' 
  AND (SELECT has_role(auth.uid(), 'admin'::app_role))
);

CREATE POLICY "Admins can delete cooperative documents"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'cooperative-documents' 
  AND (SELECT has_role(auth.uid(), 'admin'::app_role))
);

CREATE POLICY "Cooperatives can view their own documents"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'cooperative-documents' 
  AND (
    (SELECT has_role(auth.uid(), 'admin'::app_role))
    OR
    EXISTS (
      SELECT 1 FROM cooperativas 
      WHERE cooperativas.id_user = auth.uid()
      AND (storage.foldername(storage.objects.name))[1] = cooperativas.id::text
    )
  )
);