param(
  [Parameter(Mandatory = $true)]
  [string]$TestFile
)

$ErrorActionPreference = "Stop"
$repoRoot = Resolve-Path (Join-Path $PSScriptRoot "..")

try {
  Push-Location $repoRoot
  npm run testrun -- --file $TestFile --headed
}
finally {
  Pop-Location
  Write-Host ""
  Read-Host "Press Enter to close"
}
