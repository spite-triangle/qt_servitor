import * as vscode from 'vscode';

class  OxO{

    // 获取当前正关注的文件夹或者文件的路径
    static getForcusPath(uri: vscode.Uri, selectedFiles: any, active: boolean = true){
        let files: string[] = [];
        if (selectedFiles && Array.isArray(selectedFiles) && selectedFiles.length > 0) {
            for (var selectedFile of selectedFiles) {
                const path = selectedFile.fsPath;
                if (path) files.push(path);
            }
        }else  if (uri && uri.fsPath != undefined){
            files.push(uri.fsPath);
        }else if(active == true){
            const editor = vscode.window.activeTextEditor;
            if (editor && editor.document) {
                files.push(editor.document.fileName);
            }
        }
        
        return files;
    }
}

export{
    OxO
}