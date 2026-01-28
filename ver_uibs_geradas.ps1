# Script para verificar UIBs geradas
$SUPABASE_URL = "https://yfoqehkemzxbwzrbfubq.supabase.co"
$SERVICE_ROLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inlmb3FlaGtlbXp4Ynd6emJmdWJxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTczNDkwNTk4MCwiZXhwIjoyMDUwNDgxOTgwfQ.eFTzC-bDxIhXwU9KyDy1l6Y12IjvLnT6yskOhU-kHmY"

Write-Host "🔍 Verificando UIBs geradas nos últimos 10 minutos..." -ForegroundColor Cyan
Write-Host ""

$headers = @{
    "apikey" = $SERVICE_ROLE_KEY
    "Authorization" = "Bearer $SERVICE_ROLE_KEY"
}

try {
    $response = Invoke-RestMethod -Uri "$SUPABASE_URL/rest/v1/uib?select=*&order=created_at.desc&limit=20" -Headers $headers
    
    if ($response.Count -eq 0) {
        Write-Host "❌ NENHUMA UIB encontrada!" -ForegroundColor Red
        Write-Host ""
        Write-Host "Isso significa que o trigger AINDA está bloqueando!" -ForegroundColor Yellow
    } else {
        Write-Host "✅ Encontradas $($response.Count) UIBs!" -ForegroundColor Green
        Write-Host ""
        
        $recent = $response | Where-Object { 
            $created = [DateTime]::Parse($_.created_at)
            $now = [DateTime]::Now
            ($now - $created).TotalMinutes -lt 10
        }
        
        Write-Host "📊 UIBs criadas nos últimos 10 minutos: $($recent.Count)" -ForegroundColor Cyan
        Write-Host ""
        
        if ($recent.Count -gt 0) {
            Write-Host "Detalhes:" -ForegroundColor White
            $recent | ForEach-Object {
                Write-Host "  - #$($_.numero_sequencial) | Tipo: $($_.tipo) | Status: $($_.status) | Criada: $($_.created_at)" -ForegroundColor Gray
            }
            Write-Host ""
            
            $porTipo = $recent | Group-Object tipo
            Write-Host "Por tipo:" -ForegroundColor White
            $porTipo | ForEach-Object {
                Write-Host "  - $($_.Name): $($_.Count) UIBs" -ForegroundColor Gray
            }
        }
    }
    
} catch {
    Write-Host "❌ Erro ao consultar UIBs:" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
}

Write-Host ""
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor DarkGray
