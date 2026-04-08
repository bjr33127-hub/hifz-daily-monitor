[CmdletBinding(SupportsShouldProcess = $true)]
param(
  [string]$Alias = "dabt-upload",
  [string]$StoreFile = ".keystore/dabt-upload.jks",
  [string]$StorePassword,
  [string]$KeyPassword,
  [string]$Dname = "CN=Dabt, OU=Mobile, O=Dabt, L=Paris, ST=Ile-de-France, C=FR",
  [switch]$Force
)

$ErrorActionPreference = "Stop"

function New-RandomSecret {
  param([int]$Length = 24)

  $alphabet = "abcdefghijkmnopqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789!@$%*_-"
  -join (1..$Length | ForEach-Object { $alphabet[(Get-Random -Minimum 0 -Maximum $alphabet.Length)] })
}

$projectRoot = Split-Path -Parent $PSScriptRoot
$jdkHome = Join-Path $projectRoot ".tools\jdk-21"
$keytoolPath = Join-Path $jdkHome "bin\keytool.exe"
$targetStoreFile = Join-Path $projectRoot $StoreFile
$keystorePropertiesPath = Join-Path $projectRoot "android\keystore.properties"

if (-not (Test-Path $keytoolPath)) {
  throw "keytool introuvable dans $keytoolPath"
}

if ((Test-Path $targetStoreFile) -and -not $Force) {
  throw "Le keystore existe deja dans $targetStoreFile. Utilise -Force pour l'ecraser."
}

if ([string]::IsNullOrWhiteSpace($StorePassword)) {
  $StorePassword = New-RandomSecret
}

if ([string]::IsNullOrWhiteSpace($KeyPassword)) {
  $KeyPassword = $StorePassword
}

New-Item -ItemType Directory -Force -Path (Split-Path -Parent $targetStoreFile) | Out-Null

if (Test-Path $targetStoreFile) {
  Remove-Item -Force $targetStoreFile
}

if ($PSCmdlet.ShouldProcess($targetStoreFile, "Generer le keystore Android release")) {
  & $keytoolPath `
    -genkeypair `
    -v `
    -storetype PKCS12 `
    -keystore $targetStoreFile `
    -alias $Alias `
    -keyalg RSA `
    -keysize 4096 `
    -validity 9125 `
    -storepass $StorePassword `
    -keypass $KeyPassword `
    -dname $Dname | Out-Host
}

if ($LASTEXITCODE -ne 0) {
  throw "La generation du keystore a echoue."
}

$androidRoot = Join-Path $projectRoot "android"
$relativeStoreFile = [System.IO.Path]::GetRelativePath($androidRoot, $targetStoreFile).Replace("\", "/")
$propertiesContent = @(
  "storeFile=$relativeStoreFile"
  "storePassword=$StorePassword"
  "keyAlias=$Alias"
  "keyPassword=$KeyPassword"
) -join "`n"

Set-Content -Path $keystorePropertiesPath -Value ($propertiesContent + "`n")

Write-Output "Keystore genere : $targetStoreFile"
Write-Output "Configuration ecrite : $keystorePropertiesPath"
