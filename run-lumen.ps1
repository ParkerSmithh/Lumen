param([ValidateSet('dev', 'build', 'preview', 'test', 'test:browser', 'setup:assets')][string]$Task = 'dev')
$ErrorActionPreference = 'Stop'
Set-Location -LiteralPath $PSScriptRoot
$runtime = Get-ChildItem -LiteralPath (Join-Path $PSScriptRoot '.tools') -Directory -Filter 'node-*-win-x64' -ErrorAction SilentlyContinue | Sort-Object Name -Descending | Select-Object -First 1
if ($runtime) { $env:PATH = $runtime.FullName + ';' + $env:PATH }
if (-not (Get-Command npm.cmd -ErrorAction SilentlyContinue)) { throw 'Install Node.js 22.12+ or restore the portable runtime in .tools.' }
& npm.cmd run $Task
exit $LASTEXITCODE