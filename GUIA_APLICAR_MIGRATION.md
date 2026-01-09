# 🚀 GUIA COMPLETO - Aplicar Migration de Coordenadas

## ✅ O QUE FAZER AGORA (Passo a Passo)

### **1. Acesse o SQL Editor** 
O navegador já deve estar aberto em: https://supabase.com/dashboard/project/yfoqehkemzxbwzrbfubq/editor

Se não abriu, abra manualmente.

### **2. Criar Nova Query**
1. No SQL Editor, clique em **"New Query"** (botão verde no canto superior direito)
2. Uma nova aba de query será aberta

### **3. Copiar e Colar o SQL**
1. Abra o arquivo: `APLICAR_NO_SUPABASE.sql` (está na raiz do projeto)
2. Copie **TODO** o conteúdo (Ctrl+A, Ctrl+C)
3. Cole no SQL Editor do Supabase (Ctrl+V)

### **4. Executar a Migration**
1. Clique no botão **"Run"** (ou pressione Ctrl+Enter)
2. Aguarde a execução (deve levar poucos segundos)

### **5. Verificar Resultado**
Você verá:
- ✅ Mensagens de NOTICE indicando as colunas adicionadas
- ✅ Uma tabela mostrando:
  - `cooperativas` - total de registros e quantos têm coordenadas
  - `profiles` - total de registros e quantos têm coordenadas

**Exemplo do resultado esperado:**
```
NOTICE: Coluna latitude adicionada em cooperativas
NOTICE: Coluna longitude adicionada em cooperativas
NOTICE: Coluna latitude adicionada em profiles
NOTICE: Coluna longitude adicionada em profiles

tabela        | total_registros | com_latitude | com_longitude
cooperativas  | 5               | 0            | 0
profiles      | 10              | 0            | 0
```

---

## 🎯 DEPOIS DE APLICAR

### **Testar a Página**
1. Volte para http://localhost:8080/Ciclik_validacoes/select-materials
2. **Recarregue a página** (F5 ou Ctrl+R)
3. Agora o erro 400 **não deve mais aparecer**!

### **Verificar Console**
Abra o Console do navegador (F12) e veja:
- ❌ **ANTES**: `GET .../cooperativas?... 400 (Bad Request)`
- ✅ **DEPOIS**: `GET .../cooperativas?... 200 (OK)` (sem erros!)

---

## 📝 O QUE FOI FEITO

A migration adiciona:

1. **Colunas nas tabelas:**
   - `cooperativas.latitude` (DECIMAL 10,8)
   - `cooperativas.longitude` (DECIMAL 11,8)
   - `profiles.latitude` (DECIMAL 10,8)
   - `profiles.longitude` (DECIMAL 11,8)

2. **Índices para performance:**
   - `idx_cooperativas_coords` - busca rápida por cooperativas próximas
   - `idx_profiles_coords` - busca rápida por usuários próximos

3. **Comentários nas colunas:**
   - Documentação sobre o formato das coordenadas

---

## 🗺️ PRÓXIMOS PASSOS (Opcional)

Para ativar o **mapa interativo** e **cálculo de distância**:

### **Adicionar Coordenadas às Cooperativas**

**Opção A - Manualmente via Dashboard:**
1. Vá para: https://supabase.com/dashboard/project/yfoqehkemzxbwzrbfubq/editor
2. Clique na tabela `cooperativas`
3. Edite cada cooperativa adicionando latitude e longitude

**Opção B - Via CEP (Geocoding):**
Você pode usar um serviço de geocoding para converter os endereços em coordenadas:
- ViaCEP + OpenStreetMap Nominatim
- Google Geocoding API
- Brasil API

**Opção C - SQL Update (exemplo):**
```sql
-- Exemplo: Cooperativa em São Paulo
UPDATE cooperativas 
SET latitude = -23.5505, longitude = -46.6333
WHERE nome_fantasia = 'Nome da Cooperativa';
```

---

## 🐛 RESOLUÇÃO DE PROBLEMAS

### Se aparecer "column already exists"
✅ **IGNORAR** - significa que a coluna já foi criada antes. A migration é segura!

### Se aparecer erro de permissão
❌ Você precisa estar logado como **administrador** no Supabase
✅ Use a conta que criou o projeto

### Se a página ainda der erro 400
1. Verifique se a migration foi executada com sucesso
2. Recarregue a página com cache limpo: Ctrl+Shift+R
3. Verifique o Console para ver a mensagem de erro exata

---

## 💡 DICAS

- A migration é **idempotente** - pode executar várias vezes sem problemas
- As colunas são **nullable** - cooperativas sem coordenadas continuam funcionando
- O código já está preparado para funcionar **com ou sem** coordenadas
- Quando adicionar coordenadas, o mapa ativará automaticamente!

---

## 📞 VERIFICAÇÃO FINAL

Execute este SQL para confirmar que tudo funcionou:

```sql
SELECT 
    column_name, 
    data_type, 
    is_nullable
FROM information_schema.columns
WHERE table_name = 'cooperativas' 
AND column_name IN ('latitude', 'longitude')
ORDER BY column_name;
```

**Resultado esperado:**
```
column_name | data_type | is_nullable
latitude    | numeric   | YES
longitude   | numeric   | YES
```

✅ Se você vê esses 2 registros, **SUCESSO TOTAL!** 🎉
