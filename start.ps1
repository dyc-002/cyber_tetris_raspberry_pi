$npm = Get-Command npm -ErrorAction SilentlyContinue
if (-not $npm) {
  Write-Error "Node.js and npm are required to run the Cyber Tetris desktop app."
  exit 1
}

Set-Location $PSScriptRoot
npm start
