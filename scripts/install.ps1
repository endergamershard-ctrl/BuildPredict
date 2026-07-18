# Install the latest BuildPredict release on Windows (x64).
# Usage:
#   irm https://raw.githubusercontent.com/endergamershard-ctrl/BuildPredict/main/scripts/install.ps1 | iex
$ErrorActionPreference = "Stop"

$repo = if ($env:BUILDPREDICT_REPO) { $env:BUILDPREDICT_REPO } else { "endergamershard-ctrl/BuildPredict" }
$api = "https://api.github.com/repos/$repo/releases/latest"

Write-Host "Fetching latest release from $repo..."
$release = Invoke-RestMethod -Uri $api -Headers @{ "User-Agent" = "buildpredict-installer" }
$tag = $release.tag_name

$asset = $release.assets | Where-Object { $_.name -like "*setup.exe" } | Select-Object -First 1
if (-not $asset) {
    Write-Error "Could not find a Windows setup.exe asset. Check https://github.com/$repo/releases"
    exit 1
}

$tmp = Join-Path $env:TEMP $asset.name
Write-Host "Downloading $tag ($($asset.name))..."
Invoke-WebRequest -Uri $asset.browser_download_url -OutFile $tmp -UseBasicParsing

Write-Host "Running installer..."
Start-Process -FilePath $tmp -Wait

Remove-Item $tmp -ErrorAction SilentlyContinue

Write-Host ""
Write-Host "Installed BuildPredict $tag. Launch it from the Start Menu."
Write-Host "Note: builds are unsigned - SmartScreen may warn on first run (More info -> Run anyway)."
