$node = "C:\Program Files\Microsoft Visual Studio\18\Community\MSBuild\Microsoft\VisualStudio\NodeJs\node.exe"
if (-not (Test-Path $node)) {
  Write-Error "Node.js was not found at $node. Install Node.js or update this start script."
  exit 1
}

Set-Location $PSScriptRoot
& $node server.js
