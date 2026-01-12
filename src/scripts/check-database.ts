import { supabase } from './integrations/supabase/client';async function checkDatabaseStructure() {
  try {
    // Lista de tabelas esperadas
    const expectedTables = [
      { name: 'profiles', description: 'Perfis de usuários' },
      { name: 'user_roles', description: 'Papéis/roles dos usuários' },
      { name: 'cooperativas', description: 'Cooperativas cadastradas' },
      { name: 'companies', description: 'Empresas parceiras' },
      { name: 'products', description: 'Produtos cadastrados' },
      { name: 'materials', description: 'Materiais recicláveis' },
      { name: 'deliveries', description: 'Entregas de recicláveis' },
      { name: 'delivery_promises', description: 'Promessas de entrega' },
      { name: 'delivery_items', description: 'Itens das entregas' },
      { name: 'points_transactions', description: 'Transações de pontos' },
      { name: 'gamification_missions', description: 'Missões gamificadas' },
      { name: 'mission_completions', description: 'Conclusões de missões' },
      { name: 'coupons', description: 'Cupons disponíveis' },
      { name: 'user_coupons', description: 'Cupons dos usuários' },
      { name: 'categories', description: 'Categorias de produtos' },
      { name: 'cdv_credits', description: 'Créditos CDV' },
      { name: 'cdv_transactions', description: 'Transações CDV' }
    ];const results = [];

    for (const table of expectedTables) {
      try {
        const { error, count } = await supabase
          .from(table.name)
          .select('*', { count: 'exact', head: true });

        if (!error) {
          results.push({
            status: '✅',
            table: table.name,
            description: table.description,
            exists: true,
            accessible: true,
            count: count || 0
          });
        } else if (error.code === 'PGRST116') {
          results.push({
            status: '❌',
            table: table.name,
            description: table.description,
            exists: false,
            accessible: false,
            error: 'Tabela não existe'
          });
        } else if (error.code === '42501') {
          results.push({
            status: '🔒',
            table: table.name,
            description: table.description,
            exists: true,
            accessible: false,
            error: 'Sem permissão RLS'
          });
        } else {
          results.push({
            status: '⚠️',
            table: table.name,
            description: table.description,
            exists: true,
            accessible: false,
            error: error.message
          });
        }
      } catch (err: any) {
        results.push({
          status: '❌',
          table: table.name,
          description: table.description,
          exists: false,
          accessible: false,
          error: err.message
        });
      }
    }

    // Exibir resultados);+ 'STATUS'.padEnd(15) + 'DESCRIÇÃO'););

    results.forEach(result => {
      const tableInfo = `${result.status} ${result.table}`.padEnd(30);
      const status = result.accessible 
        ? `${result.count || 0} registros`.padEnd(15)
        : (result.error || 'Erro').padEnd(15);}););

    // Resumo
    const totalTables = results.length;
    const existingTables = results.filter(r => r.exists).length;
    const accessibleTables = results.filter(r => r.accessible).length;
    const missingTables = results.filter(r => !r.exists);
    const restrictedTables = results.filter(r => r.exists && !r.accessible);if (missingTables.length > 0) {missingTables.forEach(table => {});}

    if (restrictedTables.length > 0) {restrictedTables.forEach(table => {});');
    }

    if (accessibleTables === totalTables) {}} catch (error: any) {
    console.error('❌ Erro durante a verificação:', error.message);
  }
}

checkDatabaseStructure();
