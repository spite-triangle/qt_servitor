import * as vscode from 'vscode';
import * as fs from 'fs';
import path = require('path');
import { ConfigAssist } from '../common/config';
import { VERSION } from '../common/define';



class SdkSelector{

    private m_strInstall: string;

    constructor(strInstall :string){
        this.m_strInstall = strInstall;
    }

    // 获取 qt 版本 
    getSdkVersion(){
        let strTarget = this.getSdkFolderName();
        if(strTarget == "") return VERSION.NONE;

        let versions = strTarget.split('.');
        if(versions.length <= 0) return VERSION.NONE;

        if(versions[0] == "4"){
            return VERSION.QT_4;
        }else if(versions[0] == "5"){
            return VERSION.QT_5;
        }else if(versions[0] == "6"){
            return VERSION.QT_6;
        }
        return VERSION.NONE;
    }

    // 存放 sdk 的文件夹名
    getSdkFolderName(){
        if(fs.existsSync(this.m_strInstall) == false) throw Error ('Pleas check install path : ' + this.m_strInstall);

        let lstFolderNames = this.getSubFolderName(this.m_strInstall);
        let strTarget = "";
        let reg = /^[0-9]\.[0-9]{1,3}\.[0-9]{1,3}$/i; // 例如 5.9.10
        for(var name of lstFolderNames){
            if(reg.test(name) == false)  continue;
            strTarget = name;
            break;
        }

        return strTarget;
    }

    // 获取 skd
    async selectSdk(){
        let strTarget = this.getSdkFolderName();
        if(strTarget == "")throw Error ("Not found sdk folder. e.g.: 5.15.10");

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
            // quickPick.onDidAccept( () => {
            // });
            let bSelected = false; 
            quickPick.onDidChangeSelection((items: readonly vscode.QuickPickItem[])=>{
                if(items.length >= 0){
                    resolve( path.join(strSdkRoot, quickPick.selectedItems[0].label));
                }
    
                resolve("");
                bSelected = true;
                quickPick.hide();
            });

            quickPick.onDidHide(()=>{
                if(bSelected == false){
                    resolve("");
                }
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

class SdkStatusBar{
    static bar:vscode.StatusBarItem;

    static createBar(command:string){
        this.bar = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right,700);
        this.bar.command = command;
        this.bar.text = "Qt: NONE";
        this.bar.tooltip = "Qt SDK Version";
        this.bar.show();
    }

    static updateText(strSdk: string){
        let sdk = path.basename(strSdk);
        if(sdk.length <= 0 || sdk == '.' || sdk == '..'){
            this.bar.text = "Qt: NONE";
        }else{
            this.bar.text = `Qt: ${sdk}`;
        }
    }
}

export{
    SdkSelector,
    SdkStatusBar
}