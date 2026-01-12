# 🧪 Teste de Geocodificação - Passo a Passo

## ✅ Status Atual

- [x] Edge Function deployada com sucesso
- [x] SQL copiado para área de transferência
- [ ] Migration SQL executada
- [ ] Teste realizado

---

## 📋 Passo 2: Executar Migration SQL

### **Opção A: Via Dashboard (Recomendado)**

1. Abra o Supabase Dashboard: https://supabase.com/dashboard/project/yfoqehkemzxbwzrbfubq/sql/new

2. **O SQL já está na área de transferência!** Cole com `Ctrl+V`

3. Clique em **Run** para executar

4. Verifique se apareceu mensagem de sucesso

### **Opção B: Via Terminal (Avançado)**

```bash
npx supabase db execute --file MIGRATION_GEOCODIFICACAO_AUTOMATICA.sql --project-ref yfoqehkemzxbwzrbfubq
```

---

## 🧪 Passo 3: Testar a Geocodificação

### **Teste 1: Via Console do Navegador**

Abra o projeto e execute no console:

```javascript
// Importar a função
import { geocodificarCooperativa } from './src/lib/geocoding';

// Buscar uma cooperativa sem coordenadas
const { data: cooperativas } = await supabase
  .from('cooperativas')
  .select('id, nome_fantasia, latitude, longitude, cidade, uf')
  .is('latitude', null)
  .limit(1);

if (cooperativas && cooperativas.length > 0) {
  const coop = cooperativas[0];
  console.log('Geocodificando:', coop.nome_fantasia);
  
  // Geocodificar
  await geocodificarCooperativa(coop.id);
  
  // Verificar resultado
  const { data: updated } = await supabase
    .from('cooperativas')
    .select('latitude, longitude')
    .eq('id', coop.id)
    .single();
    
  console.log('Resultado:', updated);
}
```

### **Teste 2: Via Arquivo de Teste**

Crie um arquivo `test-geocoding.ts`:

```typescript
import { supabase } from '@/lib/supabase';
import { geocodificarCooperativa } from '@/lib/geocoding';

async function testarGeocodificacao() {
  console.log('🧪 Testando geocodificação...\n');

  // 1. Buscar cooperativas sem coordenadas
  const { data: cooperativas, error } = await supabase
    .from('cooperativas')
    .select('id, nome_fantasia, cidade, uf, latitude, longitude')
    .is('latitude', null)
    .eq('status', 'aprovada')
    .limit(1);

  if (error) {
    console.error('❌ Erro ao buscar cooperativas:', error);
    return;
  }

  if (!cooperativas || cooperativas.length === 0) {
    console.log('✅ Todas as cooperativas já têm coordenadas!');
    return;
  }

  const cooperativa = cooperativas[0];
  console.log('📍 Cooperativa encontrada:');
  console.log(`   Nome: ${cooperativa.nome_fantasia}`);
  console.log(`   Local: ${cooperativa.cidade}/${cooperativa.uf}`);
  console.log(`   Coordenadas atuais: ${cooperativa.latitude}, ${cooperativa.longitude}`);
  console.log('');

  // 2. Geocodificar
  console.log('🌍 Geocodificando...');
  try {
    await geocodificarCooperativa(cooperativa.id);
    console.log('✅ Geocodificação concluída!');
  } catch (error) {
    console.error('❌ Erro ao geocodificar:', error);
    return;
  }

  // 3. Verificar resultado
  const { data: updated } = await supabase
    .from('cooperativas')
    .select('latitude, longitude')
    .eq('id', cooperativa.id)
    .single();

  console.log('');
  console.log('📊 Resultado:');
  console.log(`   Latitude: ${updated?.latitude}`);
  console.log(`   Longitude: ${updated?.longitude}`);
  console.log('');
  console.log('🎉 Teste concluído!');
}

// Executar
testarGeocodificacao();
```

Execute:
```bash
npx tsx test-geocoding.ts
```

---

## 🔍 Verificar Cooperativas Sem Coordenadas

### **Via SQL:**

```sql
SELECT 
  id,
  nome_fantasia,
  CONCAT(cidade, ', ', uf) as localizacao,
  latitude,
  longitude,
  CASE 
    WHEN latitude IS NULL OR longitude IS NULL THEN '❌ Sem coordenadas'
    ELSE '✅ Com coordenadas'
  END as status
FROM cooperativas
WHERE status = 'aprovada'
ORDER BY 
  CASE WHEN latitude IS NULL THEN 0 ELSE 1 END,
  nome_fantasia;
```

---

## 🎯 Próximos Passos Após Teste

### **1. Adicionar Botão no Admin**

Em `src/pages/Admin/Cooperativas.tsx` (ou similar):

```typescript
import { geocodificarCooperativa } from '@/lib/geocoding';

// No componente
const handleGeocodificar = async (cooperativaId: string) => {
  try {
    await geocodificarCooperativa(cooperativaId);
    // Recarregar lista
    loadCooperativas();
  } catch (error) {
    console.error(error);
  }
};

// No JSX da linha da cooperativa
{(!cooperativa.latitude || !cooperativa.longitude) && (
  <Button
    onClick={() => handleGeocodificar(cooperativa.id)}
    size="sm"
    variant="outline"
  >
    📍 Geocodificar
  </Button>
)}
```

### **2. Integrar no Fluxo de Cadastro**

Em `src/pages/Admin/CadastroCooperativa.tsx` (ou similar):

```typescript
import { geocodificarAposCadastro } from '@/lib/geocoding';

// Após criar a cooperativa
const handleSubmit = async (dados: CooperativaFormData) => {
  const { data: cooperativa, error } = await supabase
    .from('cooperativas')
    .insert(dados)
    .select()
    .single();

  if (!error && cooperativa) {
    // Geocodificar automaticamente
    await geocodificarAposCadastro(cooperativa.id);
    
    // Continuar fluxo normal...
  }
};
```

### **3. Geocodificar Todas as Existentes**

Crie um script ou botão:

```typescript
import { geocodificarCooperativasEmLote } from '@/lib/geocoding';

const geocodificarTodas = async () => {
  const { data: cooperativas } = await supabase
    .from('cooperativas')
    .select('id')
    .is('latitude', null)
    .eq('status', 'aprovada');

  if (cooperativas && cooperativas.length > 0) {
    const ids = cooperativas.map(c => c.id);
    console.log(`Geocodificando ${ids.length} cooperativas...`);
    await geocodificarCooperativasEmLote(ids);
  }
};
```

---

## 📊 Monitoramento

### **Ver Logs da Edge Function:**

1. Dashboard: https://supabase.com/dashboard/project/yfoqehkemzxbwzrbfubq/functions/geocodificar-cooperativa/logs
2. Veja execuções e erros em tempo real

### **Ver Status das Cooperativas:**

```sql
SELECT 
  COUNT(*) FILTER (WHERE latitude IS NOT NULL) as com_coordenadas,
  COUNT(*) FILTER (WHERE latitude IS NULL) as sem_coordenadas,
  COUNT(*) as total
FROM cooperativas
WHERE status = 'aprovada';
```

---

## ⚠️ Troubleshooting

### **"Function not found"**
- Confirme que o deploy foi bem-sucedido
- Verifique o nome: `geocodificar-cooperativa`

### **"No coordinates found"**
- Endereço pode estar incompleto
- API pode não reconhecer endereço muito específico
- Tente no Google Maps manualmente

### **"Rate limit exceeded"**
- Nominatim permite 1 req/segundo
- Use `geocodificarCooperativasEmLote` que tem delay automático

---

## ✅ Checklist Final

- [ ] Edge Function deployada
- [ ] Migration SQL executada
- [ ] Teste realizado com sucesso
- [ ] Botão adicionado no Admin
- [ ] Fluxo de cadastro integrado
- [ ] Cooperativas existentes geocodificadas
- [ ] Mapa funcionando corretamente

---

## 🎉 Resultado Esperado

Após todas as etapas:

1. ✅ Novas cooperativas geocodificadas automaticamente
2. ✅ Mapa mostra todas as cooperativas com coordenadas
3. ✅ Admin pode geocodificar manualmente com 1 clique
4. ✅ Toast mostra feedback ao usuário
5. ✅ Logs disponíveis no Dashboard
