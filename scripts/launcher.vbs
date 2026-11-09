Set shell = CreateObject("WScript.Shell")
Set fso = CreateObject("Scripting.FileSystemObject")

base = fso.GetParentFolderName(WScript.ScriptFullName)
urlFile = base & "\data\server-url.txt"
errorFile = base & "\data\server-error.txt"

' 数据目录固定在发布目录下，程序更新不会碰 data。
shell.Environment("PROCESS")("DATA_DIR") = base & "\data"

On Error Resume Next
shell.Run """" & base & "\runtime\node.exe"" """ & base & "\app\server\index.mjs""", 0, False

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

message = "启动超时。请检查 " & errorFile & " 或手动运行 runtime\node.exe app\server\index.mjs。"
MsgBox message, 16, "IndexSama的魔法录"
