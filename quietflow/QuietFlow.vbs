' QuietFlow Launcher — Double-click the Desktop shortcut to run.
' No console window appears. The app opens in a clean Edge window.

Dim shell, qDir, logPath, nextDist, port
qDir = "C:\Users\vdako\quietflow"
logPath = qDir & "\quietflow-log.txt"
nextDist = qDir & "\node_modules\next\dist\bin\next"
port = "3456"

Set shell = CreateObject("WScript.Shell")
shell.CurrentDirectory = qDir

Dim fso, logFile
Set fso = CreateObject("Scripting.FileSystemObject")
Set logFile = fso.OpenTextFile(logPath, 8, True)
logFile.WriteLine Now & " [VBS] QuietFlow starting..."

' Kill any previous server on our port
On Error Resume Next
shell.Run "cmd.exe /c netstat -ano | findstr :" & port & " > """ & qDir & "\portcheck.txt""", 0, True
If fso.FileExists(qDir & "\portcheck.txt") Then
    Dim portFile
    Set portFile = fso.OpenTextFile(qDir & "\portcheck.txt")
    Dim line
    Do While Not portFile.AtEndOfStream
        line = portFile.ReadLine()
        If InStr(line, "LISTENING") > 0 Then
            Dim parts, pid
            parts = Split(Trim(line), " ")
            pid = parts(UBound(parts))
            If IsNumeric(pid) Then
                shell.Run "taskkill /f /pid " & pid, 0, True
                logFile.WriteLine Now & " [VBS] Killed stale process on port " & port & " (PID: " & pid & ")"
            End If
        End If
    Loop
    portFile.Close
    fso.DeleteFile qDir & "\portcheck.txt"
End If
On Error GoTo 0

' Check if build exists
If fso.FileExists(qDir & "\.next\BUILD_ID") Then
    logFile.WriteLine Now & " [VBS] Production build found. Starting server..."
    shell.Run "cmd.exe /c node """ & nextDist & """ start -p " & port & " >> """ & logPath & """ 2>&1", 0, False
Else
    logFile.WriteLine Now & " [VBS] No production build. Starting dev server..."
    shell.Run "cmd.exe /c pnpm next dev -p " & port & " >> """ & logPath & """ 2>&1", 0, False
End If
logFile.Close

' Wait for server (up to 60s)
Dim ready, i
ready = False
For i = 1 To 40
    WScript.Sleep 1500
    On Error Resume Next
    Dim http
    Set http = CreateObject("MSXML2.ServerXMLHTTP.6.0")
    http.open "GET", "http://localhost:" & port, False
    http.setTimeouts 1000, 1000, 1000, 1000
    http.send()
    If http.status = 200 Then
        ready = True
        Exit For
    End If
    Set http = Nothing
    On Error GoTo 0
Next

Set logFile = fso.OpenTextFile(logPath, 8, True)

If ready Then
    logFile.WriteLine Now & " [VBS] Server ready on port " & port
    
    ' Open Edge in app mode
    Dim edgePath
    edgePath = "C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe"
    
    On Error Resume Next
    shell.Run """" & edgePath & """ --app=http://localhost:" & port & " --window-size=1280,860", 1, False
    If Err.Number <> 0 Then
        shell.Run "http://localhost:" & port, 1, False
    End If
    On Error GoTo 0
    
    logFile.WriteLine Now & " [VBS] Browser window opened"
Else
    logFile.WriteLine Now & " [VBS] ERROR: Server not ready after 60s"
    MsgBox "QuietFlow server did not start." & vbCrLf & _
           "Check the log: " & logPath, vbExclamation, "QuietFlow"
End If

logFile.Close
