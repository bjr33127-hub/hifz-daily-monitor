param(
  [switch]$ProbeOnly
)

$ErrorActionPreference = "Stop"

$projectRoot = Split-Path -Parent $PSScriptRoot
$studioCandidates = @(
  "C:\Program Files\Android\Android Studio\bin\studio64.exe",
  "C:\Program Files\Android Studio\bin\studio64.exe",
  "C:\Users\bjr33\AppData\Local\Programs\Android Studio\bin\studio64.exe"
)

$studioPath = $studioCandidates | Where-Object { Test-Path $_ } | Select-Object -First 1

if (-not $studioPath) {
  throw "Android Studio introuvable. Installe-le puis relance cette commande."
}

if ($ProbeOnly) {
  Write-Output $studioPath
  exit 0
}

Start-Process -FilePath $studioPath -ArgumentList @((Join-Path $projectRoot "android"))
