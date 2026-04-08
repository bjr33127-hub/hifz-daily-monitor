param(
  [Parameter(ValueFromRemainingArguments = $true)]
  [string[]]$AdbArgs = @("devices")
)

$ErrorActionPreference = "Stop"

$projectRoot = Split-Path -Parent $PSScriptRoot
$sdkRoot = Join-Path $projectRoot ".android-sdk"
$adbPath = Join-Path $sdkRoot "platform-tools\adb.exe"

if (-not (Test-Path $adbPath)) {
  throw "adb introuvable dans $adbPath"
}

$env:ANDROID_HOME = $sdkRoot
$env:ANDROID_SDK_ROOT = $sdkRoot
$env:Path = "$sdkRoot\platform-tools;$env:Path"

& $adbPath @AdbArgs
exit $LASTEXITCODE
