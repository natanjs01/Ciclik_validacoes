-- 🔧 Corrigir enum tipo_pj_enum
-- Adicionar valores que podem estar faltando

-- Verificar valores atuais
DO $$ 
BEGIN
    -- Adicionar 'Condominio' se não existir
    IF NOT EXISTS (
        SELECT 1 FROM pg_enum e
        JOIN pg_type t ON e.enumtypid = t.oid
        WHERE t.typname = 'tipo_pj_enum' AND e.enumlabel = 'Condominio'
    ) THEN
        ALTER TYPE tipo_pj_enum ADD VALUE 'Condominio';
        RAISE NOTICE 'Adicionado valor: Condominio';
    END IF;

    -- Adicionar 'Restaurante' se não existir
    IF NOT EXISTS (
        SELECT 1 FROM pg_enum e
        JOIN pg_type t ON e.enumtypid = t.oid
        WHERE t.typname = 'tipo_pj_enum' AND e.enumlabel = 'Restaurante'
    ) THEN
        ALTER TYPE tipo_pj_enum ADD VALUE 'Restaurante';
        RAISE NOTICE 'Adicionado valor: Restaurante';
    END IF;

    -- Adicionar 'Comercio' se não existir
    IF NOT EXISTS (
        SELECT 1 FROM pg_enum e
        JOIN pg_type t ON e.enumtypid = t.oid
        WHERE t.typname = 'tipo_pj_enum' AND e.enumlabel = 'Comercio'
    ) THEN
        ALTER TYPE tipo_pj_enum ADD VALUE 'Comercio';
        RAISE NOTICE 'Adicionado valor: Comercio';
    END IF;

    -- Adicionar 'Servico' se não existir
    IF NOT EXISTS (
        SELECT 1 FROM pg_enum e
        JOIN pg_type t ON e.enumtypid = t.oid
        WHERE t.typname = 'tipo_pj_enum' AND e.enumlabel = 'Servico'
    ) THEN
        ALTER TYPE tipo_pj_enum ADD VALUE 'Servico';
        RAISE NOTICE 'Adicionado valor: Servico';
    END IF;

    -- Adicionar 'Industria' se não existir
    IF NOT EXISTS (
        SELECT 1 FROM pg_enum e
        JOIN pg_type t ON e.enumtypid = t.oid
        WHERE t.typname = 'tipo_pj_enum' AND e.enumlabel = 'Industria'
    ) THEN
        ALTER TYPE tipo_pj_enum ADD VALUE 'Industria';
        RAISE NOTICE 'Adicionado valor: Industria';
    END IF;

    -- Adicionar 'Outro' se não existir
    IF NOT EXISTS (
        SELECT 1 FROM pg_enum e
        JOIN pg_type t ON e.enumtypid = t.oid
        WHERE t.typname = 'tipo_pj_enum' AND e.enumlabel = 'Outro'
    ) THEN
        ALTER TYPE tipo_pj_enum ADD VALUE 'Outro';
        RAISE NOTICE 'Adicionado valor: Outro';
    END IF;
END $$;

-- Listar valores finais do enum para conferência
SELECT 
    t.typname as enum_name,
    e.enumlabel as valid_value,
    e.enumsortorder as sort_order
FROM pg_type t 
JOIN pg_enum e ON t.oid = e.enumtypid  
WHERE t.typname = 'tipo_pj_enum'
ORDER BY e.enumsortorder;
