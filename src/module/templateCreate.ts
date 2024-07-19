import * as vscode from 'vscode';
import * as fs from 'fs';
import path = require('path');

import * as iconv from 'iconv-lite'

import {Logger} from '../common/log'
import {TEMPLATE} from '../common/define'


const gMapTemplateType : Map<string, TEMPLATE> = new Map([
    ["Qt Mainwindow", TEMPLATE.MAIN_WINDOW],
    ["Qt Widget", TEMPLATE.WIDGET],
    ["Qt Dialog", TEMPLATE.DIALOG],
    ["Qt Object", TEMPLATE.QOBJECT],
    ["Qt Designer Form", TEMPLATE.UI],
    ["Qt Resource File", TEMPLATE.RESOURCE],
    ["Quick View", TEMPLATE.QUICK_VIEW],
    ["Quick Widget", TEMPLATE.QUICK_WIDGET],
    ["Quick Application", TEMPLATE.QUICK_APP]
]);

const gMapTemplateFolder : Map<TEMPLATE, string> = new Map([
    [TEMPLATE.MAIN_WINDOW,"assets/template/mainwindow"],
    [TEMPLATE.DIALOG,"assets/template/dialog"],
    [TEMPLATE.QOBJECT,"assets/template/object"],
    [TEMPLATE.RESOURCE,"assets/template/resource"],
    [TEMPLATE.UI,"assets/template/ui"],
    [TEMPLATE.WIDGET,"assets/template/widget"],
    [TEMPLATE.QUICK_APP,"assets/template/quickapp"],
    [TEMPLATE.QUICK_VIEW,"assets/template/quickview"],
    [TEMPLATE.QUICK_WIDGET,"assets/template/quickwidget"],
]);

const gMapTemplateExt : Map<TEMPLATE, string[]> = new Map([
    [TEMPLATE.MAIN_WINDOW,[".ui",".h",".cpp"]],
    [TEMPLATE.DIALOG,[".ui",".h",".cpp"]],
    [TEMPLATE.QOBJECT,[".h",".cpp"]],
    [TEMPLATE.RESOURCE,[".qrc"]],
    [TEMPLATE.UI,[".ui"]],
    [TEMPLATE.WIDGET,[".ui",".h","cpp"]],
    [TEMPLATE.QUICK_APP,[".qrc",".cpp",".qml"]]
]);


const gLstParentObject : Array<string> = [
    "QObject",
    "QWidget",
    "QDialog",
    "QMainWindow",
    "Custom Object"
];


class TemplateCreator {
    private m_strDir : string; // 创建文件的文件夹
    private m_strExtensionDir : string;

    constructor(strTargetPath:string,  strExtensionDir: string){
        if(fs.existsSync(strTargetPath) == false) Logger.ERROR('The target dir doese not exist：' + strTargetPath);

        // 获取文件夹
        const stat = fs.statSync(strTargetPath);
        if(stat.isDirectory() == true) {
            this.m_strDir = strTargetPath;
        }else{
            this.m_strDir = path.dirname(strTargetPath);
        }

        this.m_strExtensionDir = strExtensionDir;
    }

    async create(enType: TEMPLATE){
        if(gMapTemplateFolder.has(enType) == false){
            Logger.WARN("Not found target template.");
            return;
        }

        // 获取父对象类型
        let strObj = "";
        let strParent = "";
        if(enType == TEMPLATE.QOBJECT){
            strObj = await this.getParentObject();

            if(strObj == "Custom Object" ){
                strObj = await this.getObjectName();
                strParent = "QObject";
            }else if(strObj ==  "QObject"){
                strParent = "QObject";
            }else{
                strParent = "QWidget";
            }
        }

        // 用户输入名称
        const inputBox = vscode.window.createInputBox();
        inputBox.placeholder = "Please input the name of module";
        inputBox.onDidHide(()=>{
            inputBox.dispose();
        });

        inputBox.onDidAccept(()=>{

            // 检测是否已经有同名文件存在
            if(this.checkTargeFileExist(enType, inputBox.value) == true){
                Logger.WARN("Please change this file name." + inputBox.value +" already exists in current dir", true);
                return;
            }

            // 创建目标文件
            this.createTargetFiles(enType, inputBox.value, strObj, strParent);

            inputBox.hide();
        });

        inputBox.show();
    }

    private async createTargetFiles(enType: TEMPLATE, strName: string, strObj: string = "", strParent: string = ""){
        let lstTemplates = this.getTemplateFiles(enType);


        for(var file of lstTemplates){
            // 读取文件
            let strFile = fs.readFileSync(file,'utf8');
            let strExt = path.extname(file);

            // 替换
            strFile = strFile.replaceAll("PLACEHOLDER", strName);

            // 替换保护宏
            strFile = strFile.replaceAll("PLACE#HOLDER", strName.toUpperCase());

            // 替换继承类型
            if(strObj != ""){
                strFile = strFile.replaceAll("OBJECTHOLDER", strObj);
            }

            // 替换父对象类型
            if(strParent != ""){
                strFile = strFile.replaceAll("PARENTHOLDER", strParent);
            }
            
            // 保存路径
            let upper = vscode.workspace.getConfiguration().get("qt.fileNameUpperCase", true);
            let fileName = "";
            if(upper){
                fileName = strName[0].toUpperCase() + strName.substring(1, strName.length);
            }else{
                fileName = strName[0].toLowerCase() + strName.substring(1, strName.length);
            }
            let strPath = path.join(this.m_strDir, fileName + strExt)
            strFile = strFile.replaceAll("PLACEUIHOLDER", "ui_" + fileName);
            

            // 写出文件
            fs.writeFile(strPath, strFile, (err)=>{
                if(err) Logger.ERROR(err.message);
            });
        }
    }

    private async getParentObject(){

        const quickPick = vscode.window.createQuickPick();

        quickPick.placeholder = "Select Parent Object";
		quickPick.items = Array.from(gLstParentObject).map( item => {
            return {label:item};
        } );

        quickPick.onDidHide(() => {
                quickPick.dispose()
            });
        quickPick.show();
        
		return await new Promise<string>(resolve => {
            quickPick.onDidAccept( () => {
                if(quickPick.selectedItems.length >= 0){
                    resolve(quickPick.selectedItems[0].label);
                }else{
                    resolve("");
                }
                quickPick.hide();
            });
        }) 
    }

    private async getObjectName(){
        const inputbox = vscode.window.createInputBox();

        inputbox.placeholder = "Please input the name of Qt class";

        inputbox.onDidHide(() => {
                inputbox.dispose()
            });
        inputbox.show();
        
		return await new Promise<string>(resolve => {
            inputbox.onDidAccept( () => {
                resolve(inputbox.value);
            });
        }) 
    }

    private checkTargeFileExist(enType: TEMPLATE, strName: string){
        let lstExt = gMapTemplateExt.get(enType);
        if(lstExt == undefined ) return;

        for(var strExt of lstExt){
            if(fs.existsSync(path.join(this.m_strDir, strName + strExt)) == false) continue;
            Logger.WARN("The name already exist. " + strName);
            return true;
        }
        return false;
    }

    private getTemplateFiles(enType: TEMPLATE){
        let strDir = path.join(this.m_strExtensionDir , gMapTemplateFolder.get(enType) as string);
        
        let lstFiles: string[] = [];
        // 根据文件路径读取文件，返回一个文件列表
        const files = fs.readdirSync(strDir);
        // 遍历读取到的文件列表
        for (let filename of files) {
            // path.join得到当前文件的绝对路径
            const filepath = path.join(strDir, filename);
            // 根据文件路径获取文件信息
            const stats = fs.statSync(filepath);
            if(stats.isFile()){
                lstFiles.push(filepath);
            }
        }
        return lstFiles;
    }
}


export function CreateTemplate(strTargetPath: string, strExtensionDir: string){
    // 检测路径是否在工作空间
    let lstFolders = vscode.workspace.workspaceFolders;
    let bOk = false;
    if( lstFolders == undefined ){
        Logger.WARN('Not found workspace folder.',true);
        return;
    }
    for(var folder of lstFolders){
        let strPath = folder.uri.fsPath;
        if(strTargetPath.substring(0, strPath.length) == strPath){
            bOk = true;
            break;
        }
    }
    if(bOk == false){
        Logger.WARN('The target path is not found in any workspace folder. ' + strTargetPath,true);
        return;
    }

    // 选择类型
    const quickPick = vscode.window.createQuickPick();
    quickPick.items = Array.from(gMapTemplateType.keys()).map(label => ({label}));
    quickPick.placeholder = "Select Qt moudle that needs to be generated";

    quickPick.onDidAccept( () => {
            let key = quickPick.selectedItems[0].label;
            new TemplateCreator(strTargetPath, strExtensionDir).create(gMapTemplateType.get(key) as TEMPLATE);
            quickPick.hide();
        });

    quickPick.onDidHide(() => {
            quickPick.dispose()
        });
        
    quickPick.show();
}