$ErrorActionPreference = "Stop"

$launcher = Resolve-Path (Join-Path $PSScriptRoot "run-tests-from-file.ps1")
$menuKey = "HKCU:\Software\Classes\SystemFileAssociations\.txt\shell\ITOTRunTests"
$commandKey = Join-Path $menuKey "command"
$command = "powershell.exe -ExecutionPolicy Bypass -File `"$launcher`" `"%1`""

New-Item -Path $menuKey -Force | Out-Null
New-ItemProperty -Path $menuKey -Name "MUIVerb" -Value "Run Test" -PropertyType String -Force | Out-Null
New-ItemProperty -Path $menuKey -Name "Icon" -Value "powershell.exe" -PropertyType String -Force | Out-Null

New-Item -Path $commandKey -Force | Out-Null
Set-Item -Path $commandKey -Value $command

Write-Host "Installed right-click menu: Run Test"
Write-Host "Right-click Tests.txt, choose Run Test, and every non-empty line will be used as a test case."
