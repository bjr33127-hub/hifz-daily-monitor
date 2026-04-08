param(
  [Parameter(ValueFromRemainingArguments = $true)]
  [string[]]$GradleArgs = @("assembleDebug")
)

$ErrorActionPreference = "Stop"

$projectRoot = Split-Path -Parent $PSScriptRoot
$jdkHome = Join-Path $projectRoot ".tools\jdk-21"
$sdkRoot = Join-Path $projectRoot ".android-sdk"
$gradleWrapper = Join-Path $projectRoot "android\gradlew.bat"
$localPropertiesPath = Join-Path $projectRoot "android\local.properties"

if (-not (Test-Path $jdkHome)) {
  throw "JDK 21 introuvable dans $jdkHome"
}

if (-not (Test-Path $sdkRoot)) {
  throw "SDK Android introuvable dans $sdkRoot"
}

if (-not (Test-Path $gradleWrapper)) {
  throw "Gradle wrapper introuvable dans android\\gradlew.bat"
}

$env:JAVA_HOME = $jdkHome
$env:ANDROID_HOME = $sdkRoot
$env:ANDROID_SDK_ROOT = $sdkRoot
$env:Path = "$jdkHome\bin;$sdkRoot\platform-tools;$env:Path"

$escapedSdkRoot = $sdkRoot -replace "\\", "\\"
Set-Content -Path $localPropertiesPath -Value "sdk.dir=$escapedSdkRoot`n" -NoNewline

Push-Location (Join-Path $projectRoot "android")
try {
  & $gradleWrapper @GradleArgs
  exit $LASTEXITCODE
} finally {
  Pop-Location
}
