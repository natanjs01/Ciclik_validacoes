# Teste de Rotação de Tokens - Sistema Ciclik
# PowerShell Script

$API_URL = "https://ciclik-api-produtos.onrender.com"
$API_TOKEN = "ciclik_secret_token_2026"

# Produtos para testar (GTINs da sua lista)
$GTINS_TESTE = @(
    "7899710006531",  # LAMP KIAN LED BIV A60 6500K 9W
    "7896026306416",  # JARDIANCE BOEHRINGER 10MG C/30 CPR
    "7896369617552",  # ADOCANTE LIO MARIZA N.QUALV STEVIA
    "7891962054124",  # BISC BAUDUCCO COOKIES MAXI
    "7897705202753",  # GLP RVBELSUS 14MG C/30
    "7896806700021"   # LEITE DE ROSAS 100ML
)

function Print-Header {
    param($texto)
    Write-Host "`n$('='*70)" -ForegroundColor Cyan
    Write-Host "  $texto" -ForegroundColor Yellow
    Write-Host "$('='*70)" -ForegroundColor Cyan
}

function Get-TokenStatus {
    try {
        $response = Invoke-RestMethod -Uri "$API_URL/api/status/tokens" -Method Get -TimeoutSec 10
        return $response
    }
    catch {
        Write-Host "❌ Erro ao consultar status: $_" -ForegroundColor Red
        return $null
    }
}

function Get-Produto {
    param($gtin)
    
    $headers = @{
        'Authorization' = "Bearer $API_TOKEN"
    }
    
    try {
        $stopwatch = [System.Diagnostics.Stopwatch]::StartNew()
        $response = Invoke-RestMethod -Uri "$API_URL/api/produtos/$gtin" -Headers $headers -Method Get -TimeoutSec 10
        $stopwatch.Stop()
        
        return @{
            status_code = 200
            data = $response
            tempo_resposta = [math]::Round($stopwatch.Elapsed.TotalSeconds, 2)
        }
    }
    catch {
        $stopwatch.Stop()
        return @{
            status_code = $_.Exception.Response.StatusCode.value__
            data = $null
            erro = $_.Exception.Message
            tempo_resposta = [math]::Round($stopwatch.Elapsed.TotalSeconds, 2)
        }
    }
}

function Print-TokenStatus {
    param($status)
    
    if (-not $status) {
        Write-Host "❌ Status não disponível" -ForegroundColor Red
        return
    }
    
    Write-Host "`n📊 STATUS DOS TOKENS:" -ForegroundColor Cyan
    Write-Host ("-"*70) -ForegroundColor DarkGray
    
    foreach ($token in $status.tokens) {
        $usado = $token.usado_hoje
        $disponivel = $token.disponivel
        $limite = $token.limite
        $preview = $token.token_preview
        
        # Barra de progresso
        $progresso = [math]::Floor(($usado / $limite) * 20)
        $barra = ("█" * $progresso) + ("░" * (20 - $progresso))
        
        $emoji = if ($token.status -eq "disponível") { "✅" } else { "🔴" }
        
        Write-Host "$emoji $($token.token_id) $preview" -ForegroundColor White
        Write-Host "   [$barra] $usado/$limite usado - $disponivel disponível" -ForegroundColor Gray
    }
    
    Write-Host ("-"*70) -ForegroundColor DarkGray
    Write-Host "📈 RESUMO:" -ForegroundColor Cyan
    Write-Host "   Total de tokens: $($status.resumo.total_tokens)" -ForegroundColor White
    Write-Host "   Total usado: $($status.resumo.total_usado)" -ForegroundColor Yellow
    Write-Host "   Total disponível: $($status.resumo.total_disponivel)" -ForegroundColor Green
    Write-Host "   Limite total: $($status.resumo.limite_total)" -ForegroundColor White
    Write-Host "   Último reset: $($status.ultimo_reset)" -ForegroundColor Gray
    Write-Host "   Próximo reset: $($status.proximo_reset)" -ForegroundColor Gray
}

# ============================================================================
# INÍCIO DO TESTE
# ============================================================================

Print-Header "🧪 TESTE DE ROTAÇÃO DE TOKENS - SISTEMA CICLIK"
Write-Host "📅 Data/Hora: $(Get-Date -Format 'dd/MM/yyyy HH:mm:ss')" -ForegroundColor White
Write-Host "🌐 API: $API_URL" -ForegroundColor White
Write-Host "📦 Produtos a testar: $($GTINS_TESTE.Count)" -ForegroundColor White

# 1. Status inicial
Print-Header "1️⃣ STATUS INICIAL DOS TOKENS"
$status_inicial = Get-TokenStatus
Print-TokenStatus $status_inicial

if (-not $status_inicial) {
    Write-Host "`n❌ Não foi possível obter status inicial. Abortando teste." -ForegroundColor Red
    exit
}

# 2. Teste de consultas
Print-Header "2️⃣ REALIZANDO CONSULTAS DE PRODUTOS"

$resultados = @()
$contador = 1

foreach ($gtin in $GTINS_TESTE) {
    Write-Host "`n🔍 Consulta $contador/$($GTINS_TESTE.Count) - GTIN: $gtin" -ForegroundColor Cyan
    
    $resultado = Get-Produto $gtin
    $resultados += $resultado
    
    if ($resultado.status_code -eq 200) {
        $data = $resultado.data
        if ($data.encontrado) {
            $desc = $data.descricao.Substring(0, [Math]::Min(50, $data.descricao.Length))
            Write-Host "   ✅ Produto encontrado: $desc..." -ForegroundColor Green
            Write-Host "   🏷️  Marca: $($data.marca)" -ForegroundColor White
        }
        else {
            Write-Host "   ⚠️  Produto não encontrado na base Bluesoft" -ForegroundColor Yellow
        }
    }
    elseif ($resultado.status_code -eq 429) {
        Write-Host "   🔴 Rate limit atingido!" -ForegroundColor Red
    }
    else {
        Write-Host "   ❌ Erro: $($resultado.erro)" -ForegroundColor Red
    }
    
    Write-Host "   ⏱️  Tempo de resposta: $($resultado.tempo_resposta)s" -ForegroundColor Gray
    
    $contador++
    Start-Sleep -Milliseconds 500
}

# 3. Status após consultas
Print-Header "3️⃣ STATUS APÓS CONSULTAS"
$status_final = Get-TokenStatus
Print-TokenStatus $status_final

# 4. Análise comparativa
Print-Header "4️⃣ ANÁLISE COMPARATIVA"

if ($status_inicial -and $status_final) {
    $usado_antes = $status_inicial.resumo.total_usado
    $usado_depois = $status_final.resumo.total_usado
    $consultas_realizadas = $usado_depois - $usado_antes
    
    $bem_sucedidas = ($resultados | Where-Object { $_.status_code -eq 200 }).Count
    $encontrados = ($resultados | Where-Object { $_.data.encontrado -eq $true }).Count
    $rate_limits = ($resultados | Where-Object { $_.status_code -eq 429 }).Count
    $erros = ($resultados | Where-Object { $_.status_code -notin @(200, 429) }).Count
    
    Write-Host "`n📊 ESTATÍSTICAS:" -ForegroundColor Cyan
    Write-Host "   Consultas realizadas: $consultas_realizadas" -ForegroundColor White
    Write-Host "   Consultas bem-sucedidas: $bem_sucedidas" -ForegroundColor Green
    Write-Host "   Produtos encontrados: $encontrados" -ForegroundColor Green
    Write-Host "   Rate limits: $rate_limits" -ForegroundColor Yellow
    Write-Host "   Erros: $erros" -ForegroundColor Red
    
    # Verificar rotação
    Write-Host "`n🔄 ROTAÇÃO DE TOKENS:" -ForegroundColor Cyan
    $tokens_usados = $status_final.tokens | Where-Object { $_.usado_hoje -gt 0 } | Select-Object -ExpandProperty token_id
    
    if ($tokens_usados.Count -gt 1) {
        Write-Host "   ✅ ROTAÇÃO DETECTADA! Tokens usados: $($tokens_usados -join ', ')" -ForegroundColor Green
    }
    elseif ($tokens_usados.Count -eq 1) {
        Write-Host "   ℹ️  Apenas 1 token usado: $tokens_usados" -ForegroundColor Cyan
        Write-Host "   (Normal para poucas consultas - rotação ocorre após 25 consultas)" -ForegroundColor Gray
    }
    else {
        Write-Host "   ⚠️  Nenhum token marcado como usado" -ForegroundColor Yellow
    }
}

# 5. Recomendações
Print-Header "5️⃣ RECOMENDAÇÕES"

if ($status_final) {
    $disponivel = $status_final.resumo.total_disponivel
    $usado_total = $status_final.resumo.total_usado
    
    Write-Host "`n💡 CAPACIDADE ATUAL:" -ForegroundColor Cyan
    Write-Host "   $disponivel consultas ainda disponíveis hoje" -ForegroundColor Green
    Write-Host "   $usado_total consultas já utilizadas" -ForegroundColor Yellow
    
    if ($disponivel -gt 80) {
        Write-Host "`n   ✅ Capacidade excelente! Pode processar muitos produtos." -ForegroundColor Green
    }
    elseif ($disponivel -gt 50) {
        Write-Host "`n   👍 Boa capacidade. Continue processando normalmente." -ForegroundColor Cyan
    }
    elseif ($disponivel -gt 20) {
        Write-Host "`n   ⚠️  Capacidade moderada. Use com moderação." -ForegroundColor Yellow
    }
    else {
        Write-Host "`n   🔴 Capacidade baixa! Economize consultas ou aguarde reset às 00:00." -ForegroundColor Red
    }
}

Print-Header "✅ TESTE CONCLUÍDO"
Write-Host "`n📁 Para ver logs completos no Render, acesse:" -ForegroundColor Cyan
Write-Host "   https://dashboard.render.com/" -ForegroundColor White
Write-Host ""
