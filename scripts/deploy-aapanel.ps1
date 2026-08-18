[CmdletBinding()]
param(
  [ValidateSet("test", "production")]
  [string]$Target = "test",
  [string]$ServerHost,
  [string]$SshUser = "root",
  [int]$SshPort = 22,
  [Alias("RemotePath")]
  [string]$RemoteRoot,
  [string]$Pm2AppName,
  [Nullable[int]]$AppPort,
  [switch]$SkipBuild,
  [switch]$PackageOnly,
  [switch]$Rollback,
  [switch]$ResetProcess,
  [string]$ReleaseName,
  [string]$OutputArchive
)

$ErrorActionPreference = "Stop"
Set-StrictMode -Version Latest

$targetDefaults = @{
  test = @{
    ServerHost = "192.168.250.64"
    RemoteRoot = "/www/wwwroot/EJB_web_test/3009"
    Pm2AppName = "web_test"
    AppPort = 3009
  }
  production = @{
    ServerHost = "192.168.250.73"
    RemoteRoot = "/www/wwwroot/web/5076"
    Pm2AppName = "web_5076"
    AppPort = 5076
  }
}
$targetConfig = $targetDefaults[$Target]

if (-not $ServerHost) {
  $ServerHost = [string]$targetConfig.ServerHost
}
if ($null -eq $AppPort) {
  $AppPort = [int]$targetConfig.AppPort
}
if (-not $RemoteRoot) {
  $RemoteRoot = [string]$targetConfig.RemoteRoot
}
if (-not $Pm2AppName) {
  $Pm2AppName = [string]$targetConfig.Pm2AppName
}

$repoRoot = Split-Path -Parent $PSScriptRoot
$deployDistDirName = ".next-deploy"
$deployDistDir = Join-Path $repoRoot $deployDistDirName
$deployTsConfig = "tsconfig.deploy.json"
$timestamp = Get-Date -Format "yyyyMMdd-HHmmss"
$releaseId = if ($ReleaseName) { $ReleaseName } else { $timestamp }
$tempBase = [System.IO.Path]::GetFullPath([System.IO.Path]::GetTempPath())
$tempRoot = Join-Path $tempBase "enjoybook-deploy-$timestamp"
$defaultArtifactDirectory = Join-Path $repoRoot ".deploy"
$archivePath = if ($OutputArchive) {
  [System.IO.Path]::GetFullPath($OutputArchive)
} else {
  Join-Path $defaultArtifactDirectory "enjoybook-$Target-standalone-$timestamp.tar.gz"
}

function Assert-SafeValue {
  param(
    [string]$Value,
    [string]$Name,
    [string]$Pattern
  )

  if ($Value -notmatch $Pattern) {
    throw "$Name contains unsupported characters: $Value"
  }
}

function Invoke-External {
  param(
    [string]$Command,
    [string[]]$Arguments
  )

  & $Command @Arguments
  if ($LASTEXITCODE -ne 0) {
    throw "$Command failed with exit code $LASTEXITCODE."
  }
}

function Require-Command {
  param([string]$Name)

  if (-not (Get-Command $Name -ErrorAction SilentlyContinue)) {
    throw "Required command not found: $Name"
  }
}

function ConvertTo-RemoteShellScript {
  param([string]$Script)

  # Bash on the Linux host must not receive Windows CRLF control characters.
  return $Script.Replace("`r`n", "`n").Replace("`r", "`n")
}

function Remove-StagingDirectory {
  $resolvedTempRoot = [System.IO.Path]::GetFullPath($tempRoot)
  $isChildOfTemp = $resolvedTempRoot.StartsWith($tempBase, [System.StringComparison]::OrdinalIgnoreCase)
  $hasExpectedName = (Split-Path -Leaf $resolvedTempRoot) -like "enjoybook-deploy-*"

  if (-not $isChildOfTemp -or -not $hasExpectedName) {
    throw "Refusing to remove unexpected staging path: $resolvedTempRoot"
  }

  if (Test-Path -LiteralPath $resolvedTempRoot) {
    Remove-Item -LiteralPath $resolvedTempRoot -Recurse -Force
  }
}

Assert-SafeValue -Value $ServerHost -Name "ServerHost" -Pattern '^[A-Za-z0-9._:-]+$'
Assert-SafeValue -Value $SshUser -Name "SshUser" -Pattern '^[A-Za-z0-9._-]+$'
Assert-SafeValue -Value $RemoteRoot -Name "RemoteRoot" -Pattern '^/[A-Za-z0-9._/-]+$'
Assert-SafeValue -Value $Pm2AppName -Name "Pm2AppName" -Pattern '^[A-Za-z0-9._-]+$'
Assert-SafeValue -Value $releaseId -Name "ReleaseName" -Pattern '^[A-Za-z0-9._-]+$'

Write-Host "Target: $Target ($ServerHost`:$AppPort)"
Write-Host "Remote root: $RemoteRoot"
Write-Host "PM2 app: $Pm2AppName"

$remoteTarget = "$SshUser@$ServerHost"
$sshArguments = @("-p", [string]$SshPort)
$remoteReleases = "$RemoteRoot/releases"
$remoteRelease = "$remoteReleases/$releaseId"
$remoteCurrent = "$RemoteRoot/current"
$remotePrevious = "$RemoteRoot/previous"

if ($Rollback) {
  Require-Command -Name "ssh"

  $rollbackCommand = @'
set -e
if ! command -v pm2 >/dev/null 2>&1; then
  pm2_bin=''
  for candidate in "$HOME"/.bun/bin/pm2 /www/server/nodejs/*/bin/pm2 "$HOME"/.nvm/versions/node/*/bin/pm2; do
    if [ -x "$candidate" ]; then
      pm2_bin="$candidate"
    fi
  done
  if [ -z "$pm2_bin" ]; then
    echo 'pm2 command not found in PATH or known runtime locations.' >&2
    exit 127
  fi
  export PATH="$(dirname "$pm2_bin"):$PATH"
fi
test -L '__PREVIOUS__'
test -L '__CURRENT__'
previous_target=$(readlink -f '__PREVIOUS__')
current_target=$(readlink -f '__CURRENT__')
test -f "$previous_target/server.js"
ln -sfn "$current_target" '__ROOT__/current.next'
mv -Tf '__ROOT__/current.next' '__PREVIOUS__'
ln -sfn "$previous_target" '__ROOT__/current.next'
mv -Tf '__ROOT__/current.next' '__CURRENT__'
cd '__CURRENT__'
APP_CURRENT_PATH='__CURRENT__' PORT='__PORT__' PM2_APP_NAME='__APP__' pm2 startOrReload ecosystem.config.js --update-env
pm2 save
'@
  $rollbackCommand = $rollbackCommand.
    Replace("__PREVIOUS__", $remotePrevious).
    Replace("__CURRENT__", $remoteCurrent).
    Replace("__ROOT__", $RemoteRoot).
    Replace("__PORT__", [string]$AppPort).
    Replace("__APP__", $Pm2AppName)
  $rollbackCommand = ConvertTo-RemoteShellScript -Script $rollbackCommand

  Write-Host "Rolling back $Pm2AppName to the previous release..."
  Invoke-External -Command "ssh" -Arguments ($sshArguments + @($remoteTarget, $rollbackCommand))
  Write-Host "Rollback complete: http://${ServerHost}:$AppPort"
  return
}

Require-Command -Name "tar"
if (-not $PackageOnly) {
  Require-Command -Name "ssh"
  Require-Command -Name "scp"
}

Push-Location $repoRoot
try {
  if (-not $SkipBuild) {
    $previousDistDir = $env:NEXT_DIST_DIR
    $previousTsConfig = $env:NEXT_TSCONFIG
    try {
      $env:NEXT_DIST_DIR = $deployDistDirName
      $env:NEXT_TSCONFIG = $deployTsConfig

      if (Get-Command "bun" -ErrorAction SilentlyContinue) {
        Write-Host "Building application with Bun in isolated directory $deployDistDirName..."
        Invoke-External -Command "bun" -Arguments @("run", "build")
      } else {
        Write-Host "Bun is not installed locally; running the equivalent npm/Next build steps..."
        Invoke-External -Command "npm.cmd" -Arguments @("run", "lint")
        Invoke-External -Command (Join-Path $repoRoot "node_modules\.bin\next.cmd") -Arguments @("build", "--turbopack")
      }
    } finally {
      $env:NEXT_DIST_DIR = $previousDistDir
      $env:NEXT_TSCONFIG = $previousTsConfig
    }
  }

  $standaloneSource = Join-Path $deployDistDir "standalone"
  $staticSource = Join-Path $deployDistDir "static"
  foreach ($path in @($standaloneSource, $staticSource)) {
    if (-not (Test-Path -LiteralPath $path)) {
      throw "Build artifact not found: $path. Run the build before deploying."
    }
  }

  New-Item -Path $tempRoot -ItemType Directory -Force | Out-Null
  Get-ChildItem -LiteralPath $standaloneSource -Force |
    Copy-Item -Destination $tempRoot -Recurse -Force

  $stagedNextPath = Join-Path $tempRoot $deployDistDirName
  New-Item -Path $stagedNextPath -ItemType Directory -Force | Out-Null
  Copy-Item -LiteralPath $staticSource -Destination (Join-Path $stagedNextPath "static") -Recurse -Force

  $publicSource = Join-Path $repoRoot "public"
  if (Test-Path -LiteralPath $publicSource) {
    Copy-Item -LiteralPath $publicSource -Destination (Join-Path $tempRoot "public") -Recurse -Force
  }

  Copy-Item -LiteralPath (Join-Path $repoRoot "ecosystem.config.js") -Destination $tempRoot -Force
  New-Item -Path (Join-Path $tempRoot "logs") -ItemType Directory -Force | Out-Null

  $archiveDirectory = Split-Path -Parent $archivePath
  New-Item -Path $archiveDirectory -ItemType Directory -Force | Out-Null
  if (Test-Path -LiteralPath $archivePath) {
    Remove-Item -LiteralPath $archivePath -Force
  }

  Write-Host "Packing standalone artifact..."
  Invoke-External -Command "tar" -Arguments @("-czf", $archivePath, "-C", $tempRoot, ".")

  if ($PackageOnly) {
    Write-Host "Package ready: $archivePath"
    Write-Host "Upload and extract it into a new release below: $remoteReleases"
    return
  }

  $remoteArchive = "/tmp/enjoybook-standalone-$timestamp.tar.gz"

  Write-Host "Preparing release $releaseId on $remoteTarget..."
  Invoke-External -Command "ssh" -Arguments ($sshArguments + @($remoteTarget, "mkdir -p '$remoteReleases'; test ! -e '$remoteRelease'"))

  Write-Host "Uploading artifact..."
  Invoke-External -Command "scp" -Arguments @("-P", [string]$SshPort, $archivePath, "${remoteTarget}:$remoteArchive")

  $remoteDeployCommand = @'
set -e
if ! command -v pm2 >/dev/null 2>&1; then
  pm2_bin=''
  for candidate in "$HOME"/.bun/bin/pm2 /www/server/nodejs/*/bin/pm2 "$HOME"/.nvm/versions/node/*/bin/pm2; do
    if [ -x "$candidate" ]; then
      pm2_bin="$candidate"
    fi
  done
  if [ -z "$pm2_bin" ]; then
    echo 'pm2 command not found in PATH or known runtime locations.' >&2
    exit 127
  fi
  export PATH="$(dirname "$pm2_bin"):$PATH"
fi
mkdir -p '__RELEASE__'
tar -xzf '__ARCHIVE__' -C '__RELEASE__'
rm -f '__ARCHIVE__'
test -f '__RELEASE__/server.js'
test -d '__RELEASE__/__DIST_DIR__/static'
if [ -L '__CURRENT__' ]; then
  ln -sfn "$(readlink -f '__CURRENT__')" '__PREVIOUS__'
elif [ -f '__ROOT__/server.js' ]; then
  ln -sfn '__ROOT__' '__PREVIOUS__'
fi
ln -sfn '__RELEASE__' '__ROOT__/current.next'
mv -Tf '__ROOT__/current.next' '__CURRENT__'
cd '__CURRENT__'
if [ '__RESET_PROCESS__' = '1' ]; then
  pm2 delete '__APP__' >/dev/null 2>&1 || true
fi
APP_CURRENT_PATH='__CURRENT__' PORT='__PORT__' PM2_APP_NAME='__APP__' pm2 startOrReload ecosystem.config.js --update-env
pm2 save
'@
  $remoteDeployCommand = $remoteDeployCommand.
    Replace("__RELEASE__", $remoteRelease).
    Replace("__ARCHIVE__", $remoteArchive).
    Replace("__CURRENT__", $remoteCurrent).
    Replace("__PREVIOUS__", $remotePrevious).
    Replace("__ROOT__", $RemoteRoot).
    Replace("__PORT__", [string]$AppPort).
    Replace("__APP__", $Pm2AppName).
    Replace("__DIST_DIR__", $deployDistDirName).
    Replace("__RESET_PROCESS__", $(if ($ResetProcess) { "1" } else { "0" }))
  $remoteDeployCommand = ConvertTo-RemoteShellScript -Script $remoteDeployCommand

  Write-Host "Activating release and reloading PM2 application..."
  Invoke-External -Command "ssh" -Arguments ($sshArguments + @($remoteTarget, $remoteDeployCommand))
  Write-Host "Deploy complete: http://${ServerHost}:$AppPort (release $releaseId)"
} finally {
  Pop-Location
  Remove-StagingDirectory
  if ((-not $PackageOnly) -and (Test-Path -LiteralPath $archivePath)) {
    Remove-Item -LiteralPath $archivePath -Force
  }
}
