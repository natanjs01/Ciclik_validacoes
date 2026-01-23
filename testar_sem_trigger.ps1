# ============================================
# TESTE AUTOMATIZADO: Motor UIB sem trigger
# ============================================

Write-Host "🔧 TESTE: Motor UIB com trigger DESABILITADO" -ForegroundColor Cyan
Write-Host "=" -NoNewline -ForegroundColor DarkGray
1..50 | ForEach-Object { Write-Host "=" -NoNewline -ForegroundColor DarkGray }
Write-Host ""

$SUPABASE_URL = "https://yfoqehkemzxbwzrbfubq.supabase.co"
$SERVICE_ROLE_KEY = $env:SUPABASE_SERVICE_ROLE_KEY

if (-not $SERVICE_ROLE_KEY) {
    Write-Host "❌ ERRO: Variável SUPABASE_SERVICE_ROLE_KEY não encontrada!" -ForegroundColor Red
    exit 1
}

# Passo 1: Desabilitar trigger
Write-Host "`n📋 Passo 1: Desabilitando trigger..." -ForegroundColor Yellow

$disableTrigger = @{
    Uri = "$SUPABASE_URL/rest/v1/rpc/exec_sql"
    Method = "POST"
    Headers = @{
        "apikey" = $SERVICE_ROLE_KEY
        "Authorization" = "Bearer $SERVICE_ROLE_KEY"
        "Content-Type" = "application/json"
    }
    Body = @{
        query = "ALTER TABLE uib DISABLE TRIGGER prevent_duplicate_uib_trigger"
    } | ConvertTo-Json
}

try {
    Invoke-RestMethod @disableTrigger | Out-Null
    Write-Host "✅ Trigger desabilitado!" -ForegroundColor Green
} catch {
    Write-Host "⚠️ Erro ao desabilitar trigger (pode já estar desabilitado)" -ForegroundColor Yellow
}

# Passo 2: Executar Motor UIB
Write-Host "`n📋 Passo 2: Executando Motor UIB..." -ForegroundColor Yellow

$invokeFunction = @{
    Uri = "$SUPABASE_URL/functions/v1/motor-uib"
    Method = "POST"
    Headers = @{
        "Authorization" = "Bearer $SERVICE_ROLE_KEY"
        "Content-Type" = "application/json"
    }
    Body = "{}" | ConvertTo-Json
}

try {
    $response = Invoke-RestMethod @invokeFunction
    
    Write-Host "`n📊 RESULTADO:" -ForegroundColor Cyan
    Write-Host ($response | ConvertTo-Json -Depth 10)
    
    $totalProcessados = $response.totais.impactos_processados
    $totalGeradas = $response.totais.uibs_geradas
    
    Write-Host "`n🎯 RESUMO:" -ForegroundColor Cyan
    Write-Host "   Impactos processados: $totalProcessados" -ForegroundColor White
    Write-Host "   UIBs geradas: $totalGeradas" -ForegroundColor $(if ($totalGeradas -gt 0) { "Green" } else { "Red" })
    
    if ($totalGeradas -gt 0) {
        Write-Host "`n✅ SUCESSO! Motor UIB está FUNCIONANDO!" -ForegroundColor Green
        Write-Host "   Problema era o TRIGGER bloqueando inserções!" -ForegroundColor Yellow
    } else {
        Write-Host "`n❌ FALHOU! Problema NÃO é apenas o trigger!" -ForegroundColor Red
        Write-Host "   Investigar RLS ou constraints!" -ForegroundColor Yellow
    }
    
} catch {
    Write-Host "`n❌ ERRO ao executar Motor UIB:" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
}

# Passo 3: Reabilitar trigger
Write-Host "`n📋 Passo 3: Reabilitando trigger..." -ForegroundColor Yellow

$enableTrigger = @{
    Uri = "$SUPABASE_URL/rest/v1/rpc/exec_sql"
    Method = "POST"
    Headers = @{
        "apikey" = $SERVICE_ROLE_KEY
        "Authorization" = "Bearer $SERVICE_ROLE_KEY"
        "Content-Type" = "application/json"
    }
    Body = @{
        query = "ALTER TABLE uib ENABLE TRIGGER prevent_duplicate_uib_trigger"
    } | ConvertTo-Json
}

try {
    Invoke-RestMethod @enableTrigger | Out-Null
    Write-Host "✅ Trigger reabilitado!" -ForegroundColor Green
} catch {
    Write-Host "⚠️ Erro ao reabilitar trigger" -ForegroundColor Yellow
}

Write-Host "`n" -NoNewline
Write-Host "=" -NoNewline -ForegroundColor DarkGray
1..50 | ForEach-Object { Write-Host "=" -NoNewline -ForegroundColor DarkGray }
Write-Host ""
Write-Host "✅ Teste concluído!" -ForegroundColor Cyan
