# 🧪 Script de Teste Local - Processamento Automático
# ====================================================
# Execute este script para testar o sistema ANTES de fazer push

Write-Host "=" -NoNewline -ForegroundColor Cyan
Write-Host ("=" * 59) -ForegroundColor Cyan
Write-Host "🧪 TESTE LOCAL - PROCESSAMENTO AUTOMÁTICO" -ForegroundColor Cyan
Write-Host "=" -NoNewline -ForegroundColor Cyan
Write-Host ("=" * 59) -ForegroundColor Cyan
Write-Host ""

# Verificar se Python está instalado
Write-Host "1️⃣ Verificando Python..." -ForegroundColor Yellow
$pythonVersion = python --version 2>&1
if ($LASTEXITCODE -eq 0) {
    Write-Host "   ✅ Python instalado: $pythonVersion" -ForegroundColor Green
} else {
    Write-Host "   ❌ Python não encontrado!" -ForegroundColor Red
    Write-Host "   Instale em: https://www.python.org/downloads/" -ForegroundColor Yellow
    exit 1
}

# Verificar dependências
Write-Host ""
Write-Host "2️⃣ Verificando dependências..." -ForegroundColor Yellow
$packages = @('requests')
foreach ($package in $packages) {
    $installed = pip show $package 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Host "   ✅ $package instalado" -ForegroundColor Green
    } else {
        Write-Host "   ⚠️  $package não encontrado - instalando..." -ForegroundColor Yellow
        pip install $package --quiet
        if ($LASTEXITCODE -eq 0) {
            Write-Host "   ✅ $package instalado com sucesso" -ForegroundColor Green
        } else {
            Write-Host "   ❌ Erro ao instalar $package" -ForegroundColor Red
            exit 1
        }
    }
}

# Verificar variáveis de ambiente
Write-Host ""
Write-Host "3️⃣ Verificando variáveis de ambiente..." -ForegroundColor Yellow

# Carregar .env se existir
$envFile = "scripts/processamento-automatico/.env"
if (Test-Path $envFile) {
    Write-Host "   📄 Carregando variáveis de $envFile..." -ForegroundColor Cyan
    Get-Content $envFile | ForEach-Object {
        if ($_ -match '^([^#][^=]+)=(.*)$') {
            $name = $matches[1].Trim()
            $value = $matches[2].Trim()
            [Environment]::SetEnvironmentVariable($name, $value, "Process")
            Write-Host "   ✅ $name carregado" -ForegroundColor Green
        }
    }
} else {
    Write-Host "   ⚠️  Arquivo .env não encontrado" -ForegroundColor Yellow
    Write-Host "   Copie .env.example para .env e configure as variáveis" -ForegroundColor Yellow
    
    # Perguntar se quer criar arquivo .env
    $criar = Read-Host "   Deseja criar arquivo .env agora? (s/n)"
    if ($criar -eq "s") {
        Copy-Item "scripts/processamento-automatico/.env.example" $envFile
        Write-Host "   ✅ Arquivo .env criado!" -ForegroundColor Green
        Write-Host "   📝 Edite $envFile com suas credenciais" -ForegroundColor Yellow
        notepad $envFile
        exit 0
    }
}

# Validar variáveis obrigatórias
$variaveis = @{
    'SUPABASE_URL' = $env:SUPABASE_URL
    'SUPABASE_SERVICE_KEY' = $env:SUPABASE_SERVICE_KEY
    'API_RENDER_URL' = $env:API_RENDER_URL
    'API_RENDER_TOKEN' = $env:API_RENDER_TOKEN
}

$todasConfiguradas = $true
foreach ($var in $variaveis.GetEnumerator()) {
    if ([string]::IsNullOrWhiteSpace($var.Value)) {
        Write-Host "   ❌ $($var.Key) não configurado" -ForegroundColor Red
        $todasConfiguradas = $false
    } else {
        $preview = $var.Value.Substring(0, [Math]::Min(30, $var.Value.Length))
        Write-Host "   ✅ $($var.Key): $preview..." -ForegroundColor Green
    }
}

if (-not $todasConfiguradas) {
    Write-Host ""
    Write-Host "⚠️  Configure as variáveis em scripts/processamento-automatico/.env" -ForegroundColor Yellow
    exit 1
}

# Testar conexão com API
Write-Host ""
Write-Host "4️⃣ Testando conexão com API Render..." -ForegroundColor Yellow
try {
    $headers = @{
        'Authorization' = "Bearer $env:API_RENDER_TOKEN"
        'Content-Type' = 'application/json'
    }
    $response = Invoke-RestMethod -Uri "$env:API_RENDER_URL/api/status/tokens" -Headers $headers -TimeoutSec 10
    Write-Host "   ✅ API respondendo!" -ForegroundColor Green
    Write-Host "   📊 Tokens usados: $($response.resumo.total_usado)/100" -ForegroundColor Cyan
} catch {
    Write-Host "   ⚠️  Erro ao conectar na API: $($_.Exception.Message)" -ForegroundColor Yellow
    Write-Host "   Pode ser cold start (normal) - o script lidará com isso" -ForegroundColor Cyan
}

# Testar conexão com Supabase
Write-Host ""
Write-Host "5️⃣ Testando conexão com Supabase..." -ForegroundColor Yellow
try {
    $headers = @{
        'apikey' = $env:SUPABASE_SERVICE_KEY
        'Authorization' = "Bearer $env:SUPABASE_SERVICE_KEY"
    }
    $response = Invoke-RestMethod -Uri "$env:SUPABASE_URL/rest/v1/produtos_em_analise?limit=1" -Headers $headers -TimeoutSec 10
    Write-Host "   ✅ Supabase conectado!" -ForegroundColor Green
} catch {
    Write-Host "   ❌ Erro ao conectar no Supabase: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "   Verifique SUPABASE_URL e SUPABASE_SERVICE_KEY" -ForegroundColor Yellow
    exit 1
}

# Executar script em modo teste
Write-Host ""
Write-Host "6️⃣ Executando script em MODO TESTE..." -ForegroundColor Yellow
Write-Host "   (Não irá alterar o banco de dados)" -ForegroundColor Cyan
Write-Host ""

$env:MODO_TESTE = "true"
$env:LIMITE_PRODUTOS = "5"  # Apenas 5 produtos para teste

python scripts/processamento-automatico/processar.py

Write-Host ""
if ($LASTEXITCODE -eq 0) {
    Write-Host "=" -NoNewline -ForegroundColor Green
    Write-Host ("=" * 59) -ForegroundColor Green
    Write-Host "✅ TESTE CONCLUÍDO COM SUCESSO!" -ForegroundColor Green
    Write-Host "=" -NoNewline -ForegroundColor Green
    Write-Host ("=" * 59) -ForegroundColor Green
    Write-Host ""
    Write-Host "📋 Próximos passos:" -ForegroundColor Cyan
    Write-Host "   1. Configure secrets no GitHub (Settings > Secrets)" -ForegroundColor White
    Write-Host "   2. Faça push: git add . && git commit -m '🤖 Add auto processing' && git push" -ForegroundColor White
    Write-Host "   3. Teste no GitHub: Actions > Run workflow" -ForegroundColor White
    Write-Host ""
} else {
    Write-Host "=" -NoNewline -ForegroundColor Red
    Write-Host ("=" * 59) -ForegroundColor Red
    Write-Host "❌ TESTE FALHOU!" -ForegroundColor Red
    Write-Host "=" -NoNewline -ForegroundColor Red
    Write-Host ("=" * 59) -ForegroundColor Red
    Write-Host ""
    Write-Host "Verifique os erros acima e corrija antes de fazer push" -ForegroundColor Yellow
    exit 1
}
