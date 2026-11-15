param([string]$out, [string]$stopFile)
$cpu = New-Object System.Diagnostics.PerformanceCounter('Processor', '% Processor Time', '_Total')
[void]$cpu.NextValue()
"t,cpu_total_pct,node_procs,node_ws_mb,node_private_mb" | Out-File -Encoding ascii $out
$t0 = Get-Date
while (-not (Test-Path $stopFile)) {
  Start-Sleep -Milliseconds 1000
  $c = [math]::Round($cpu.NextValue(), 1)
  $p = @(Get-Process node -ErrorAction SilentlyContinue)
  $ws = [math]::Round((($p | Measure-Object WorkingSet64 -Sum).Sum) / 1MB, 0)
  $pm = [math]::Round((($p | Measure-Object PrivateMemorySize64 -Sum).Sum) / 1MB, 0)
  $t = [math]::Round(((Get-Date) - $t0).TotalSeconds, 1)
  "$t,$c,$($p.Count),$ws,$pm" | Out-File -Append -Encoding ascii $out
}
