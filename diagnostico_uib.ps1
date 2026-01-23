# Script para verificar impactos pendentes e estado das UIBs

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

$headers = @{
    "apikey" = $SUPABASE_ANON_KEY
    "Authorization" = "Bearer $SUPABASE_ANON_KEY"
    "Content-Type" = "application/json"
}

Write-Host "`n🔍 DIAGNÓSTICO COMPLETO - Sistema UIB" -ForegroundColor Cyan
Write-Host "=" * 60 -ForegroundColor Gray

# 1. Verificar impactos pendentes
Write-Host "`n📊 1. IMPACTOS BRUTOS PENDENTES:" -ForegroundColor Yellow

foreach ($tipo in @('residuo', 'educacao', 'produto')) {
    $url = "$SUPABASE_URL/rest/v1/impacto_bruto?tipo=eq.$tipo&processado=eq.false&select=count"
    $headers["Prefer"] = "count=exact"
    
    try {
        $response = Invoke-RestMethod -Uri $url -Method Get -Headers $headers
        $count = $response.Count
        
        if ($count -gt 0) {
            Write-Host "  ⚠️  $tipo`: $count impactos NÃO processados" -ForegroundColor Red
        } else {
            Write-Host "  ✅ $tipo`: 0 impactos pendentes" -ForegroundColor Green
        }
    } catch {
        Write-Host "  ❌ Erro ao consultar $tipo" -ForegroundColor Red
    }
}

# 2. Verificar UIBs disponíveis
Write-Host "`n📦 2. UIBs DISPONÍVEIS NO ESTOQUE:" -ForegroundColor Yellow

foreach ($tipo in @('residuo', 'educacao', 'produto')) {
    $url = "$SUPABASE_URL/rest/v1/uib?tipo=eq.$tipo&status=eq.disponivel&select=count"
    $headers["Prefer"] = "count=exact"
    
    try {
        $response = Invoke-RestMethod -Uri $url -Method Get -Headers $headers
        $count = $response.Count
        Write-Host "  📊 $tipo`: $count UIBs disponíveis" -ForegroundColor Cyan
    } catch {
        Write-Host "  ❌ Erro ao consultar $tipo" -ForegroundColor Red
    }
}

# 3. Verificar saldo parcial
Write-Host "`n💰 3. SALDO PARCIAL (Frações não convertidas):" -ForegroundColor Yellow

foreach ($tipo in @('residuo', 'educacao', 'produto')) {
    $url = "$SUPABASE_URL/rest/v1/saldo_parcial?tipo=eq.$tipo&select=saldo_decimal"
    
    try {
        $response = Invoke-RestMethod -Uri $url -Method Get -Headers $headers
        if ($response.Count -gt 0) {
            $saldo = [math]::Round($response[0].saldo_decimal, 3)
            Write-Host "  💵 $tipo`: $saldo (falta $([math]::Round(1 - $saldo, 3)) para próxima UIB)" -ForegroundColor White
        } else {
            Write-Host "  ⚪ $tipo`: Sem saldo registrado" -ForegroundColor Gray
        }
    } catch {
        Write-Host "  ❌ Erro ao consultar $tipo" -ForegroundColor Red
    }
}

# 4. Total de UIBs geradas (histórico)
Write-Host "`n📈 4. TOTAL DE UIBs GERADAS (Histórico):" -ForegroundColor Yellow

foreach ($tipo in @('residuo', 'educacao', 'produto')) {
    $url = "$SUPABASE_URL/rest/v1/uib?tipo=eq.$tipo&select=count"
    $headers["Prefer"] = "count=exact"
    
    try {
        $response = Invoke-RestMethod -Uri $url -Method Get -Headers $headers
        $count = $response.Count
        Write-Host "  📊 $tipo`: $count UIBs no total" -ForegroundColor Cyan
    } catch {
        Write-Host "  ❌ Erro ao consultar $tipo" -ForegroundColor Red
    }
}

Write-Host "`n" + ("=" * 60) -ForegroundColor Gray
Write-Host "✅ Diagnóstico concluído!" -ForegroundColor Green
Write-Host "`n💡 Próximo passo:" -ForegroundColor Yellow
Write-Host "   - Se houver impactos pendentes (⚠️), execute o Motor UIB novamente" -ForegroundColor White
Write-Host "   - Se todos estiverem em 0, o sistema está atualizado!" -ForegroundColor White
