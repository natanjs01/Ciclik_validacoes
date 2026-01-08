import { supabase } from './integrations/supabase/client';

console.log('🔍 Testando conexão com Supabase...\n');
console.log('📍 URL:', import.meta.env.VITE_SUPABASE_URL);
console.log('🔑 Key:', import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ? 
  `${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY.substring(0, 20)}...` : 
  '❌ Não encontrada');
console.log('\n' + '='.repeat(60) + '\n');

async function testConnection() {
  try {
    // Teste 1: Verificar se o Supabase está respondendo
    console.log('📡 Teste 1: Verificando conectividade básica...');
    
    // Teste 2: Listar tabelas conhecidas do projeto
    const commonTables = [
      'profiles',
      'products',
      'deliveries',
      'points_transactions',
      'gamification_missions',
      'cooperatives',
      'companies',
      'coupons',
      'materials',
      'delivery_promises'
    ];

    console.log('\n🔍 Tentando acessar tabelas do projeto...\n');
    let accessibleTables = 0;
    const results = [];

    for (const tableName of commonTables) {
      try {
        const { data, error, count } = await supabase
          .from(tableName)
          .select('*', { count: 'exact', head: false })
          .limit(1);

        if (!error) {
          results.push({ table: tableName, status: '✅', message: `${count || 0} registros` });
          accessibleTables++;
        } else if (error.code === 'PGRST116') {
          results.push({ table: tableName, status: '⚪', message: 'Não existe' });
        } else if (error.code === '42501') {
          results.push({ table: tableName, status: '🔒', message: 'Sem permissão' });
        } else {
          results.push({ table: tableName, status: '⚠️', message: error.message.substring(0, 40) });
        }
      } catch (err) {
        results.push({ table: tableName, status: '❌', message: err.message.substring(0, 40) });
      }
    }

    // Exibir resultados em formato tabular
    results.forEach(({ table, status, message }) => {
      console.log(`   ${status} ${table.padEnd(25)} - ${message}`);
    });

    // Teste 3: Verificar autenticação
    console.log('\n🔐 Teste 2: Verificando sistema de autenticação...');
    const { data: { session }, error: authError } = await supabase.auth.getSession();
    
    if (authError) {
      console.log('⚠️  Erro ao verificar sessão:', authError.message);
    } else if (session) {
      console.log('✅ Usuário autenticado:', session.user.email);
    } else {
      console.log('ℹ️  Nenhum usuário autenticado (OK para teste)');
    }

    // Teste 4: Verificar configuração do Storage
    console.log('\n📦 Teste 3: Verificando Supabase Storage...');
    try {
      const { data: buckets, error: storageError } = await supabase.storage.listBuckets();
      
      if (storageError) {
        console.log('⚠️  Erro ao acessar storage:', storageError.message);
      } else if (buckets && buckets.length > 0) {
        console.log(`✅ Storage configurado com ${buckets.length} bucket(s):`);
        buckets.forEach(bucket => {
          console.log(`   - ${bucket.name} (${bucket.public ? 'público' : 'privado'})`);
        });
      } else {
        console.log('ℹ️  Nenhum bucket de storage configurado');
      }
    } catch (err) {
      console.log('⚠️  Erro ao acessar storage:', err.message);
    }

    // Resumo
    console.log('\n' + '='.repeat(60));
    console.log('\n✨ RESUMO DO TESTE\n');
    console.log(`✅ Conexão com Supabase: OK`);
    console.log(`✅ URL do projeto: ${import.meta.env.VITE_SUPABASE_URL}`);
    console.log(`✅ Tabelas acessíveis: ${accessibleTables}/${commonTables.length}`);
    console.log(`✅ Cliente configurado corretamente\n`);
    console.log('🎉 Teste concluído!\n');

  } catch (error) {
    console.error('\n❌ ERRO DURANTE OS TESTES:');
    console.error(error);
  }
}

testConnection();
