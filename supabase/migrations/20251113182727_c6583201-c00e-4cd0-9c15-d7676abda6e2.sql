-- Add numero_nota and itens fields to notas_fiscais table
ALTER TABLE notas_fiscais 
ADD COLUMN numero_nota text,
ADD COLUMN itens jsonb;