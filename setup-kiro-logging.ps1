# setup-kiro-logging.ps1
# Run this script in any project root to add Kiro chat logging hooks.

$hookDir = ".kiro\hooks"
New-Item -ItemType Directory -Path $hookDir -Force | Out-Null

# Log chat messages hook
$logHook = @'
{
  "enabled": true,
  "name": "Log Chat Messages",
  "description": "Logs each user message to chat-log/chat-session.log with a timestamp.",
  "version": "1",
  "when": {
    "type": "promptSubmit"
  },
  "then": {
    "type": "askAgent",
    "prompt": "Append the user's message to chat-log\\chat-session.log with a timestamp. Format: [YYYY-MM-DD HH:MM:SS] USER: <their message>. Create the chat-log folder if it doesn't exist. Do this silently without commenting on it to the user."
  }
}
'@

# Rename chat log hook (user triggered)
$renameHook = @'
{
  "enabled": true,
  "name": "Rename Chat Log on Close",
  "description": "When manually triggered, renames chat-session.log with a brief summary name including the date.",
  "version": "1",
  "when": {
    "type": "userTriggered"
  },
  "then": {
    "type": "askAgent",
    "prompt": "Rename the file chat-log\\chat-session.log to a brief, space-free filename that captures the essence of what happened in this chat session. Use format: chat-log\\YYYY-MM-DD_short-summary.log. If chat-session.log does not exist or is empty, do nothing."
  }
}
'@

# Write files as UTF-8 without BOM (compatible with PowerShell 5.1)
$utf8NoBom = New-Object System.Text.UTF8Encoding($false)
[System.IO.File]::WriteAllText((Join-Path $PWD "$hookDir\log-chat-messages.kiro.hook"), $logHook, $utf8NoBom)
[System.IO.File]::WriteAllText((Join-Path $PWD "$hookDir\rename-chat-log.kiro.hook"), $renameHook, $utf8NoBom)

# Create chat-log directory
New-Item -ItemType Directory -Path "chat-log" -Force | Out-Null

# Add chat logs to .gitignore if not already there
$gitignore = ".gitignore"
$entry = "chat-log/*.log"
if (Test-Path $gitignore) {
    $content = Get-Content $gitignore -Raw
    if ($content -notmatch [regex]::Escape($entry)) {
        Add-Content $gitignore "`n$entry"
    }
} else {
    [System.IO.File]::WriteAllText((Join-Path $PWD $gitignore), "$entry`n", $utf8NoBom)
}

Write-Host "Kiro chat logging hooks installed successfully." -ForegroundColor Green
Write-Host "  - Messages will be logged to chat-log/chat-session.log"
Write-Host "  - Use the 'Rename Chat Log on Close' hook button to archive the log"
