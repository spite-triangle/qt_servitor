import * as vscode from 'vscode';


class OxO{
    private static m_sortedWorkspaceFolders: string[] | undefined;

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

    static sortedWorkspaceFolders(): string[] {
        if (this.m_sortedWorkspaceFolders === void 0) {
            this.m_sortedWorkspaceFolders = vscode.workspace.workspaceFolders ? vscode.workspace.workspaceFolders.map(folder => {
                let result = folder.uri.toString();
                if (result.charAt(result.length - 1) !== '/') {
                    result = result + '/';
                }
                return result;
            }).sort(
                (a, b) => {
                    return a.length - b.length;
                }
            ) : [];
        }
        return this.m_sortedWorkspaceFolders;
    }

    static clearSortedWorkspaceFolders(){
        this.m_sortedWorkspaceFolders = undefined;
    }

    /* 当存在多个 workspace 嵌套时， 返回最外层的 workspace*/
    static getOuterMostWorkspaceFolder(folder: vscode.WorkspaceFolder): vscode.WorkspaceFolder {
        const sorted = this.sortedWorkspaceFolders();
        for (const element of sorted) {
            let uri = folder.uri.toString();
            if (uri.charAt(uri.length - 1) !== '/') {
                uri = uri + '/';
            }
            if (uri.startsWith(element)) {
                return vscode.workspace.getWorkspaceFolder(vscode.Uri.parse(element))!;
            }
        }
        return folder;
    }

    static serializeArray(values: string[]){
        let command : string = "";
        for(let val of values){
            command += val + ","; 
        }
        if(command.length > 0){
            return command.substring(0, command.length - 1);
        }
        return command;
    }
}

export{
    OxO
}