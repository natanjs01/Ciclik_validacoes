# Script para ver detalhes dos impactos pendentes

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

Write-Host "`n🔍 DETALHES DOS IMPACTOS PENDENTES" -ForegroundColor Cyan
Write-Host "=" * 60 -ForegroundColor Gray

$url = "$SUPABASE_URL/rest/v1/impacto_bruto?processado=eq.false&select=tipo,valor_bruto,processado,created_at&order=tipo,created_at"

try {
    $response = Invoke-RestMethod -Uri $url -Method Get -Headers $headers
    
    if ($response.Count -eq 0) {
        Write-Host "`n✅ Nenhum impacto pendente encontrado!" -ForegroundColor Green
    } else {
        Write-Host "`nTotal de impactos pendentes: $($response.Count)" -ForegroundColor Yellow
        Write-Host ""
        
        $response | ForEach-Object {
            $valor = [math]::Round($_.valor_bruto, 4)
            $data = ([DateTime]$_.created_at).ToString('dd/MM HH:mm')
            
            if ($valor -lt 1) {
                $status = "⚠️  Valor < 1 (acumula em saldo_parcial)"
                $cor = "Yellow"
            } else {
                $status = "✅ Valor >= 1 (deveria gerar UIB)"
                $cor = "Green"
            }
            
            Write-Host "  📊 Tipo: $($_.tipo.PadRight(10)) | Valor: $valor | Data: $data" -ForegroundColor White
            Write-Host "     $status" -ForegroundColor $cor
            Write-Host ""
        }
        
        # Calcular totais por tipo
        Write-Host "`n📈 TOTAIS POR TIPO:" -ForegroundColor Cyan
        $grupos = $response | Group-Object -Property tipo
        foreach ($grupo in $grupos) {
            $somaValores = ($grupo.Group | Measure-Object -Property valor_bruto -Sum).Sum
            $somaArredondada = [math]::Round($somaValores, 4)
            $uibsEsperadas = [math]::Floor($somaValores)
            
            Write-Host "  $($grupo.Name): " -NoNewline
            Write-Host "$($grupo.Count) impactos" -ForegroundColor White -NoNewline
            Write-Host " | Soma: $somaArredondada" -ForegroundColor Cyan -NoNewline
            Write-Host " → Deveria gerar $uibsEsperadas UIBs" -ForegroundColor $(if ($uibsEsperadas -gt 0) { "Green" } else { "Yellow" })
        }
        
        Write-Host "`n💡 INTERPRETAÇÃO:" -ForegroundColor Yellow
        Write-Host "  - Se valor_bruto < 1: Acumula em saldo_parcial até completar 1 UIB" -ForegroundColor Gray
        Write-Host "  - Se valor_bruto >= 1: Deveria gerar UIB imediatamente" -ForegroundColor Gray
        Write-Host "  - Se soma < 1: Motor retorna 0 (correto!)" -ForegroundColor Gray
        Write-Host "  - Se soma >= 1: Motor deveria gerar UIBs!" -ForegroundColor Gray
    }
    
} catch {
    Write-Host "`n❌ Erro ao consultar impactos!" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
}

Write-Host "`n" + ("=" * 60) -ForegroundColor Gray
