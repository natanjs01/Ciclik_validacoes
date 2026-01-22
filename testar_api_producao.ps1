# Script de teste da API Cosmos em produção no Render
# Execute: .\testar_api_producao.ps1

$API_URL = "https://ciclik-api-produtos.onrender.com"
$API_TOKEN = "ciclik_secret_token_2026"

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "TESTANDO API COSMOS NO RENDER" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

# Teste 1: Health Check
Write-Host "1️⃣  Testando Health Check..." -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri "$API_URL/health" -Method Get
    Write-Host "   ✅ Health Check OK!" -ForegroundColor Green
    Write-Host "   Status: $($response.status)" -ForegroundColor Gray
    Write-Host "   Timestamp: $($response.timestamp)`n" -ForegroundColor Gray
} catch {
    Write-Host "   ❌ Erro no Health Check: $_`n" -ForegroundColor Red
}

# Teste 2: Produto encontrado (exemplo)
Write-Host "2️⃣  Consultando produto de exemplo (GTIN: 7891910000197)..." -ForegroundColor Yellow
try {
    $headers = @{
        "Authorization" = "Bearer $API_TOKEN"
        "Content-Type" = "application/json"
    }
    
    $response = Invoke-RestMethod -Uri "$API_URL/api/produtos/7891910000197" -Method Get -Headers $headers
    
    Write-Host "   ✅ Produto encontrado!" -ForegroundColor Green
    Write-Host "   Descrição: $($response.descricao)" -ForegroundColor Gray
    Write-Host "   NCM: $($response.ncm)" -ForegroundColor Gray
    Write-Host "   Peso: $($response.peso_liquido_em_gramas)g" -ForegroundColor Gray
    Write-Host "   Categoria: $($response.categoria_api)`n" -ForegroundColor Gray
} catch {
    Write-Host "   ❌ Erro na consulta: $_`n" -ForegroundColor Red
}

# Teste 3: Produto não encontrado
Write-Host "3️⃣  Testando produto inexistente (GTIN: 9999999999999)..." -ForegroundColor Yellow
try {
    $headers = @{
        "Authorization" = "Bearer $API_TOKEN"
        "Content-Type" = "application/json"
    }
    
    $response = Invoke-RestMethod -Uri "$API_URL/api/produtos/9999999999999" -Method Get -Headers $headers
    
    if (-not $response.encontrado) {
        Write-Host "   ✅ Resposta correta para produto não encontrado!" -ForegroundColor Green
        Write-Host "   Mensagem: $($response.mensagem)`n" -ForegroundColor Gray
    }
} catch {
    Write-Host "   ❌ Erro inesperado: $_`n" -ForegroundColor Red
}

# Teste 4: GTIN inválido
Write-Host "4️⃣  Testando GTIN inválido (ABC123)..." -ForegroundColor Yellow
try {
    $headers = @{
        "Authorization" = "Bearer $API_TOKEN"
        "Content-Type" = "application/json"
    }
    
    $response = Invoke-RestMethod -Uri "$API_URL/api/produtos/ABC123" -Method Get -Headers $headers -ErrorAction Stop
    Write-Host "   ❌ Deveria ter retornado erro 400!`n" -ForegroundColor Red
} catch {
    if ($_.Exception.Response.StatusCode -eq 400) {
        Write-Host "   ✅ Validação funcionando corretamente (erro 400)!`n" -ForegroundColor Green
    } else {
        Write-Host "   ❌ Erro inesperado: $_`n" -ForegroundColor Red
    }
}

# Teste 5: Token inválido
Write-Host "5️⃣  Testando autenticação (token inválido)..." -ForegroundColor Yellow
try {
    $headers = @{
        "Authorization" = "Bearer token_errado"
        "Content-Type" = "application/json"
    }
    
    $response = Invoke-RestMethod -Uri "$API_URL/api/produtos/7891910000197" -Method Get -Headers $headers -ErrorAction Stop
    Write-Host "   ❌ Deveria ter retornado erro 401!`n" -ForegroundColor Red
} catch {
    if ($_.Exception.Response.StatusCode -eq 401) {
        Write-Host "   ✅ Autenticação funcionando corretamente (erro 401)!`n" -ForegroundColor Green
    } else {
        Write-Host "   ❌ Erro inesperado: $_`n" -ForegroundColor Red
    }
}

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "TESTES CONCLUÍDOS!" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

Write-Host "📌 URL da API: $API_URL" -ForegroundColor Magenta
Write-Host "📌 Token de autenticação: $API_TOKEN`n" -ForegroundColor Magenta
