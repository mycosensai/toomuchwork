Set shell = CreateObject("WScript.Shell")
desktopPath = shell.SpecialFolders("Desktop")
quietflowDir = "C:\Users\vdako\quietflow"

' Create shortcut pointing to VBS stealth launcher
Set shortcut = shell.CreateShortcut(desktopPath & "\QuietFlow.lnk")
shortcut.TargetPath = "wscript.exe"
shortcut.Arguments = """" & quietflowDir & "\QuietFlow.vbs"""
shortcut.WorkingDirectory = quietflowDir
shortcut.Description = "QuietFlow — Live Traffic Intelligence. Double-click to launch."
shortcut.WindowStyle = 7
shortcut.Save()

WScript.Echo "Desktop shortcut created pointing to VBS launcher: " & desktopPath & "\QuietFlow.lnk"
