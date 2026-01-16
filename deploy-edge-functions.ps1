# 🚀 Script de Deploy Automático das Edge Functions
# Execute este script no PowerShell para fazer deploy das funções corrigidas

Write-Host "🚀 Iniciando deploy das Edge Functions corrigidas..." -ForegroundColor Cyan
Write-Host ""

# Verifica se o Supabase CLI está instalado
Write-Host "🔍 Verificando Supabase CLI..." -ForegroundColor Yellow
try {
    $version = supabase --version
    Write-Host "✅ Supabase CLI encontrado: $version" -ForegroundColor Green
} catch {
    Write-Host "❌ Supabase CLI não encontrado!" -ForegroundColor Red
    Write-Host "📦 Instale com: npm install -g supabase" -ForegroundColor Yellow
    exit 1
}

Write-Host ""
Write-Host "📋 Funções que serão deployadas:" -ForegroundColor Cyan
Write-Host "   1. processar-historico-residuos" -ForegroundColor White
Write-Host "   2. processar-historico-educacao" -ForegroundColor White
Write-Host "   3. processar-historico-embalagens" -ForegroundColor White
Write-Host ""

# Pergunta confirmação
$confirmacao = Read-Host "Deseja continuar com o deploy? (S/N)"
if ($confirmacao -ne "S" -and $confirmacao -ne "s") {
    Write-Host "❌ Deploy cancelado pelo usuário." -ForegroundColor Red
    exit 0
}

Write-Host ""
Write-Host "🔗 Fazendo link com o projeto..." -ForegroundColor Yellow
try {
    supabase link --project-ref yfoqehkemzxbwzrbfubq
    Write-Host "✅ Link estabelecido com sucesso!" -ForegroundColor Green
} catch {
    Write-Host "⚠️  Projeto já está linkado ou erro ao linkar." -ForegroundColor Yellow
}

Write-Host ""
Write-Host "📤 Iniciando deploy das funções..." -ForegroundColor Cyan
Write-Host ""

# Array de funções
$funcoes = @(
    "processar-historico-residuos",
    "processar-historico-educacao",
    "processar-historico-embalagens"
)

$sucessos = 0
$erros = 0

foreach ($funcao in $funcoes) {
    Write-Host "📦 Deployando: $funcao..." -ForegroundColor Yellow
    try {
        supabase functions deploy $funcao
        Write-Host "   ✅ $funcao deployada com sucesso!" -ForegroundColor Green
        $sucessos++
    } catch {
        Write-Host "   ❌ Erro ao deployar $funcao" -ForegroundColor Red
        $erros++
    }
    Write-Host ""
}

Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host "📊 RESUMO DO DEPLOY" -ForegroundColor Cyan
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host "✅ Sucessos: $sucessos" -ForegroundColor Green
Write-Host "❌ Erros: $erros" -ForegroundColor Red
Write-Host ""

if ($erros -eq 0) {
    Write-Host "🎉 Deploy concluído com sucesso!" -ForegroundColor Green
    Write-Host ""
    Write-Host "🧪 PRÓXIMOS PASSOS:" -ForegroundColor Cyan
    Write-Host "   1. Acesse: http://localhost:8080/admin/cdv" -ForegroundColor White
    Write-Host "   2. Clique no botão '🔄 Processar Histórico'" -ForegroundColor White
    Write-Host "   3. Verifique se não há mais erro CORS no console" -ForegroundColor White
    Write-Host ""
    Write-Host "📝 Listar funções deployadas:" -ForegroundColor Yellow
    Write-Host "   supabase functions list" -ForegroundColor Gray
    Write-Host ""
    Write-Host "📋 Ver logs em tempo real:" -ForegroundColor Yellow
    Write-Host "   supabase functions logs processar-historico-residuos --follow" -ForegroundColor Gray
} else {
    Write-Host "⚠️  Deploy concluído com erros!" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "🔍 Verifique:" -ForegroundColor Cyan
    Write-Host "   1. Suas credenciais do Supabase estão corretas?" -ForegroundColor White
    Write-Host "   2. Você está na pasta raiz do projeto?" -ForegroundColor White
    Write-Host "   3. As funções existem na pasta supabase/functions/?" -ForegroundColor White
    Write-Host ""
    Write-Host "📖 Consulte: DEPLOY_EDGE_FUNCTIONS_URGENTE.md" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
