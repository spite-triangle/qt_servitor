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

        let folderName = path.basename(this.m_strInstall).substring(2);
        let strSdkRoot = path.join(this.m_strInstall, folderName);

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

        let lstOptions: string[] = [];
        // 根据文件路径读取文件，返回一个文件列表
        const files = fs.readdirSync(strSdkRoot);
        // 遍历读取到的文件列表
        for (let filename of files) {
            // path.join得到当前文件的绝对路径
            const filepath = path.join(strSdkRoot, filename);
            // 根据文件路径获取文件信息
            const stats = fs.statSync(filepath);
            if(stats.isDirectory()){
                // 过滤文件夹
                if(filename.toLowerCase() == 'src') continue;
                lstOptions.push(filename);
            }
        }
        return lstOptions;
    }
}

export{
    SdkSelector
}