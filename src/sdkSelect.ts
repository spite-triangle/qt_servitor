import * as vscode from 'vscode';
import * as fs from 'fs';
import { PROPERTIES} from './define';
import path = require('path');



class SdkSelector{

    private m_strInstall: string;

    constructor(strInstall :string){
        this.m_strInstall = strInstall;
    }

    // 获取 skd
    async selectSdk(){
        if(fs.existsSync(this.m_strInstall) == false) throw Error ('Pleas check install path : ' + this.m_strInstall);

        // FIXME - 修改为查询
        let lstFolderNames = this.getSubFolderName(this.m_strInstall);
        let strTarget = "";
        let reg = /^[0-9]\.[0-9]{1,3}\.[0-9]{1,3}$/i; // 例如 5.9.10
        for(var name of lstFolderNames){
            if(reg.test(name) == false)  continue;
            strTarget = name;
            break;
        }
        if(strTarget == "")throw Error ("Not found sdk folder. e.g.: 5.0.10");

        let strSdkRoot = path.join(this.m_strInstall, strTarget);

        const quickPick = vscode.window.createQuickPick();
        quickPick.placeholder = "Select Qt sdk version";
		quickPick.items = this.getOptions(strSdkRoot).map( item => {
            return {label:item};
        } );

        quickPick.onDidHide(() => {
                quickPick.dispose()
            });
        quickPick.show();
        
		return await new Promise<string>(resolve => {
            quickPick.onDidAccept( () => {
                if(quickPick.selectedItems.length >= 0){
                    resolve( path.join(strSdkRoot, quickPick.selectedItems[0].label));
                }else{
                    resolve("");
                }
                quickPick.hide();
            });
        }) 
    }

    private getOptions(strSdkRoot:string){
        let lstNames = this.getSubFolderName(strSdkRoot);

        // 遍历读取到的文件列表
        let lstOptions : string[] = [];
        for (let filename of lstNames) {
                if(filename.toLowerCase() == 'src') continue;
                lstOptions.push(filename); 
            }
        return lstOptions;
    }

    private getSubFolderName(strDir:string){
        let lstSubFolder : string [] = [];

        const lstfiles = fs.readdirSync(strDir);
        for(let file of lstfiles){
            const filePath = path.join(strDir, file);
            const stats = fs.statSync(filePath);
            if(stats.isDirectory() == true){
                lstSubFolder.push(file)
            }
        }
        return lstSubFolder;
    }
}

export{
    SdkSelector
}