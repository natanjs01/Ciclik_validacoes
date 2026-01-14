# ✅ Configuração Final do Bucket Termos-Uso

## Status Atual
✅ Bucket criado com sucesso!
- ID: `termos-uso`
- Tamanho máximo: 10 MB
- Tipo: STANDARD

## ⚠️ Ajustes Necessários

O bucket foi criado mas precisa de 2 configurações:

### 1. Tornar o bucket público
### 2. Definir tipos MIME permitidos (apenas PDF)

## 🔧 Opção 1: Via Interface do Supabase (Mais Fácil)

### Passo 1: Configurações do Bucket
1. Acesse: **Supabase Dashboard** → **Storage** → **termos-uso**
2. Clique nos **3 pontinhos** → **Edit bucket**
3. Marque: ☑️ **Public bucket**
4. Em **Allowed MIME types**, adicione: `application/pdf`
5. Clique em **Save**

### Passo 2: Configurar Políticas RLS
1. No bucket `termos-uso`, clique em **Policies**
2. Clique em **New Policy** (4 vezes, uma para cada política)

**Política 1: Leitura Pública**
```
Name: Permitir leitura pública de termos
Operation: SELECT
Policy Definition: 
  bucket_id = 'termos-uso'
```

**Política 2: Upload (Admin)**
```
Name: Apenas admins podem fazer upload de termos
Operation: INSERT
Policy Definition: 
  bucket_id = 'termos-uso' AND
  EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_roles.user_id = auth.uid()
    AND user_roles.role = 'admin'
  )
```

**Política 3: Atualizar (Admin)**
```
Name: Apenas admins podem atualizar termos
Operation: UPDATE
Policy Definition: 
  bucket_id = 'termos-uso' AND
  EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_roles.user_id = auth.uid()
    AND user_roles.role = 'admin'
  )
```

**Política 4: Deletar (Admin)**
```
Name: Apenas admins podem deletar termos
Operation: DELETE
Policy Definition: 
  bucket_id = 'termos-uso' AND
  EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_roles.user_id = auth.uid()
    AND user_roles.role = 'admin'
  )
```

## 🔧 Opção 2: Via SQL (Mais Rápido)

Execute o arquivo **`ATUALIZAR_BUCKET_TERMOS.sql`** no SQL Editor do Supabase.

Este script irá:
- ✅ Tornar o bucket público
- ✅ Definir tipos MIME (apenas PDF)
- ✅ Criar todas as 4 políticas RLS automaticamente

## 🧪 Teste de Validação

Após configurar, execute este SQL para verificar:

```sql
-- Verificar configurações do bucket
SELECT 
  id,
  name,
  public,
  allowed_mime_types,
  file_size_limit
FROM storage.buckets 
WHERE id = 'termos-uso';

-- Verificar políticas criadas
SELECT 
  policyname,
  cmd as operation
FROM pg_policies 
WHERE schemaname = 'storage' 
AND tablename = 'objects'
AND policyname LIKE '%termos%';
```

**Resultado esperado:**
- `public`: true ✅
- `allowed_mime_types`: {application/pdf} ✅
- 4 políticas listadas ✅

## 🎯 Teste Funcional

1. Acesse: `/admin/termos`
2. Clique em **Novo Termo**
3. Preencha todos os campos
4. Faça upload de um PDF de teste
5. Clique em **Salvar**

**Resultado esperado:**
- ✅ Upload bem-sucedido
- ✅ Termo criado na tabela
- ✅ PDF acessível via URL pública

## 📊 Estrutura Final

```
Bucket: termos-uso (PÚBLICO)
├── Configurações:
│   ├── Público: Sim ✅
│   ├── Tamanho máx: 10 MB
│   └── MIME types: application/pdf
│
└── Políticas RLS:
    ├── SELECT: Público (todos) ✅
    ├── INSERT: Apenas admins ✅
    ├── UPDATE: Apenas admins ✅
    └── DELETE: Apenas admins ✅
```

## ⚡ Próximo Passo

Escolha uma opção acima e configure o bucket. Após isso, teste criando um termo!
