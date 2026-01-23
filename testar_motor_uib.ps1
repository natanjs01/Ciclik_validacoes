# Script para testar a função motor-uib deployada

# Carregar variáveis de ambiente
$envContent = Get-Content .env -Raw
$lines = $envContent -split "`n"
$SUPABASE_URL = ""
$SUPABASE_ANON_KEY = ""

foreach ($line in $lines) {
    if ($line -match 'VITE_SUPABASE_URL="(.+)"') {
        $SUPABASE_URL = $matches[1].Trim()
    }
    if ($line -match 'VITE_SUPABASE_PUBLISHABLE_KEY="(.+)"') {
        $SUPABASE_ANON_KEY = $matches[1].Trim()
    }
}

Write-Host "🔍 Testando função motor-uib..." -ForegroundColor Cyan
Write-Host "URL: $SUPABASE_URL" -ForegroundColor Gray

# Chamar a função
$headers = @{
    "apikey" = $SUPABASE_ANON_KEY
    "Authorization" = "Bearer $SUPABASE_ANON_KEY"
    "Content-Type" = "application/json"
}

$url = "$SUPABASE_URL/functions/v1/motor-uib"

Write-Host "`n📡 Invocando função..." -ForegroundColor Yellow

try {
    $response = Invoke-RestMethod -Uri $url -Method Post -Headers $headers -Body "{}" -ErrorAction Stop
    
    Write-Host "`n✅ SUCESSO!" -ForegroundColor Green
    Write-Host "`n📊 Resultado:" -ForegroundColor Cyan
    $response | ConvertTo-Json -Depth 10
    
    Write-Host "`n🎯 Resumo:" -ForegroundColor Cyan
    Write-Host "  Impactos processados: $($response.totais.impactos_processados)" -ForegroundColor White
    Write-Host "  UIBs geradas: $($response.totais.uibs_geradas)" -ForegroundColor Green
    
    Write-Host "`n📋 Por tipo:" -ForegroundColor Cyan
    Write-Host "  Resíduos: $($response.resultados.residuo.processados) impactos → $($response.resultados.residuo.uibsGeradas) UIBs" -ForegroundColor White
    Write-Host "  Educação: $($response.resultados.educacao.processados) impactos → $($response.resultados.educacao.uibsGeradas) UIBs" -ForegroundColor White
    Write-Host "  Produtos: $($response.resultados.produto.processados) impactos → $($response.resultados.produto.uibsGeradas) UIBs" -ForegroundColor White
    
} catch {
    Write-Host "`n❌ ERRO ao invocar função!" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
    Write-Host $_.Exception.Response -ForegroundColor Gray
}

Write-Host "`n✨ Deploy concluído em: $(Get-Date -Format 'dd/MM/yyyy HH:mm:ss')" -ForegroundColor Green
