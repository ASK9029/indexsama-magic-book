Set shell = CreateObject("WScript.Shell")
Set fso = CreateObject("Scripting.FileSystemObject")

base = fso.GetParentFolderName(WScript.ScriptFullName)
urlFile = base & "\data\server-url.txt"
errorFile = base & "\data\server-error.txt"

' Keep user data inside the release data folder.
shell.Environment("PROCESS")("DATA_DIR") = base & "\data"

On Error Resume Next
' Remove a stale URL left by a forced shutdown so we only open the fresh one.
If fso.FileExists(urlFile) Then fso.DeleteFile urlFile, True

cmd = Chr(34) & base & "\runtime\node.exe" & Chr(34) & " " & Chr(34) & base & "\app\server\index.mjs" & Chr(34)
shell.Run cmd, 0, False

For i = 1 To 20
  WScript.Sleep 1000
  If fso.FileExists(urlFile) Then
    Set stream = fso.OpenTextFile(urlFile, 1)
    url = Trim(stream.ReadAll)
    stream.Close
    If Len(url) > 0 Then
      shell.Run url, 1, False
      WScript.Quit 0
    End If
  End If
Next

' Title is built with ChrW so the .vbs file stays ASCII-only for WSH.
title = "IndexSama" & ChrW(30340) & ChrW(39764) & ChrW(27861) & ChrW(24405)
message = "Startup timed out. Check " & errorFile & " or run runtime\node.exe app\server\index.mjs manually."
MsgBox message, 16, title
