$desktop = [System.Environment]::GetFolderPath('Desktop')
$shortcutPath = Join-Path $desktop "QuietFlow.lnk"
$targetPath = "C:\Users\vdako\quietflow\quietflow.bat"
$iconPath = "C:\Users\vdako\quietflow\node_modules\electron\dist\electron.exe"

$shell = New-Object -ComObject WScript.Shell
$shortcut = $shell.CreateShortcut($shortcutPath)
$shortcut.TargetPath = "cmd.exe"
$shortcut.Arguments = "/c `"$targetPath`""
$shortcut.WorkingDirectory = "C:\Users\vdako\quietflow"
$shortcut.Description = "QuietFlow — Live Traffic Intelligence Desktop App"
$shortcut.IconLocation = "$iconPath, 0"
$shortcut.Save()

Write-Output "Created shortcut at: $shortcutPath"
Write-Output "Target: $targetPath"
