/**
 * Script para aplicar migration de coordenadas geográficas
 * Usa PostgreSQL REST API do Supabase diretamente
 */

const SUPABASE_URL = 'https://yfoqehkemzxbwzrbfubq.supabase.co';
const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inlmb3FlaGtlbXp4Ynd6cmJmdWJxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTczMTQzNjU0OSwiZXhwIjoyMDQ3MDEyNTQ5fQ.1yV1t7H7Ep8c9fQKvnHxgQ6jNdYdCfBWAE6XpXUq8gI';

async function executeSql(query: string): Promise<any> {
  const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/exec_sql`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': SERVICE_ROLE_KEY,
      'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
    },
    body: JSON.stringify({ query })
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`SQL Error: ${error}`);
  }

  return response.json();
}

async function applyMigration() {
  console.log('🔧 Aplicando migration de coordenadas geográficas...\n');

  const migrations = [
    {
      name: 'Adicionar latitude em cooperativas',
      sql: 'ALTER TABLE cooperativas ADD COLUMN IF NOT EXISTS latitude DECIMAL(10, 8);'
    },
    {
      name: 'Adicionar longitude em cooperativas',
      sql: 'ALTER TABLE cooperativas ADD COLUMN IF NOT EXISTS longitude DECIMAL(11, 8);'
    },
    {
      name: 'Adicionar latitude em profiles',
      sql: 'ALTER TABLE profiles ADD COLUMN IF NOT EXISTS latitude DECIMAL(10, 8);'
    },
    {
      name: 'Adicionar longitude em profiles',
      sql: 'ALTER TABLE profiles ADD COLUMN IF NOT EXISTS longitude DECIMAL(11, 8);'
    },
    {
      name: 'Criar índice em cooperativas',
      sql: 'CREATE INDEX IF NOT EXISTS idx_cooperativas_coords ON cooperativas(latitude, longitude) WHERE latitude IS NOT NULL AND longitude IS NOT NULL;'
    },
    {
      name: 'Criar índice em profiles',
      sql: 'CREATE INDEX IF NOT EXISTS idx_profiles_coords ON profiles(latitude, longitude) WHERE latitude IS NOT NULL AND longitude IS NOT NULL;'
    }
  ];

  for (const migration of migrations) {
    try {
      console.log(`⏳ ${migration.name}...`);
      await executeSql(migration.sql);
      console.log(`✅ ${migration.name} - OK\n`);
    } catch (error: any) {
      console.error(`❌ ${migration.name} - ERRO:`);
      console.error(error.message);
      console.log('');
    }
  }

  console.log('🎉 Migration concluída!\n');
  console.log('📋 Próximos passos:');
  console.log('   1. Recarregar a página /select-materials');
  console.log('   2. Adicionar coordenadas às cooperativas via dashboard');
}

applyMigration();
