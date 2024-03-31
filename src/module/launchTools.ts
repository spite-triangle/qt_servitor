
import * as vscode from 'vscode';
import * as fs from 'fs';
import { spawn} from 'child_process';
import * as path from 'path'

import { TOOLS, PROPERTIES, TERM_NAME} from '../common/define';
import { ConfigAssist} from '../common/config';
import {Logger} from '../common/log'
import { Terminal } from './terminal';

const gMapNames: Map<TOOLS, string[]> = new Map([
    [TOOLS.NON,[]],
    [TOOLS.QT_CREATOR,["qtcreator.exe","qtcreator"]],
    [TOOLS.LINGUIST,["linguist.exe","linguist","linguist-qt5.exe","linguist-qt5","linguist-qt6.exe","linguist-qt6"]],
    [TOOLS.DESIGNER,["designer.exe","designer","designer-qt5.exe","designer-qt5","designer-qt6.exe", "designer-qt6"]],
    [TOOLS.ASSISTANT,["assistant.exe","assistant","assistant-qt5.exe","assistant-qt5","assistant-qt6.exe","assistant-qt6"]],
    [TOOLS.WIN_DEPLOY,["windeployqt.exe"]],
    [TOOLS.QML_EASING,["qmleasing.exe","qmleasing"]],
    [TOOLS.QML_PREVIEW,["qmlpreview.exe","qmlpreview"]],
    [TOOLS.QML_TOOL,["qml.exe","qml"]],
]);

const gMapExtentsion : Map<TOOLS, Set<string>> = new Map([
    [TOOLS.DESIGNER, new Set(['.ui'])],
    [TOOLS.LINGUIST, new Set(['.ts'])],
    [TOOLS.QT_CREATOR, new Set(['.qml','.pro','.ui','.ts','.qrc'])],
    [TOOLS.WIN_DEPLOY, new Set(['.exe'])],
    [TOOLS.QML_PREVIEW, new Set(['.exe'])],
    [TOOLS.QML_TOOL, new Set(['.qml'])],
]);


/* 启动工具 */
 class ToolLauncher{
    private m_enType: TOOLS = TOOLS.NON;
    private m_strExePath: string = "";
    private m_strExeName: string = "";

    async init(enType:TOOLS){
        this.m_enType = enType;        

        // 工具名
        let lstNames = gMapNames.get(enType);
        if(lstNames == undefined) throw new Error('not found tool');
        
        // 获取工具路径
        let strPath = "";
        if(enType == TOOLS.QT_CREATOR){
            strPath = await ConfigAssist.instance().getPropertiesPath(PROPERTIES.QT_CREATOR) ;
        }else if(enType != TOOLS.NON){
            strPath = await ConfigAssist.instance().getPropertiesPath(PROPERTIES.SDK);
            strPath = path.join(strPath,"bin");
        }else{
            throw new Error('the tool is non');
        }
        
        // 查找软件
        for(var strName of lstNames){
            let strToolPath = path.join(strPath, strName);
            if( fs.existsSync(strToolPath) == true) {
                this.m_strExePath = strToolPath;
                this.m_strExeName = strName;
                return ;
            }
        }

        throw new Error('Please check the path : ' + strPath);
    }

    /* 启动程序 */
    public  launchWithFile(lstFiles:string[]){
        if(lstFiles.length <= 0) {
            Logger.INFO('not found target files about ' +  (gMapNames.get(this.m_enType) as string[]));
            return;
        }

        // 校验
        let lstGoodFiles = this.filteFile(lstFiles);
        if(lstGoodFiles.length <= 0) {
            let strTargets = gMapExtentsion.get(this.m_enType);
            Logger.INFO('not found target files '+ strTargets +' about ' +  (gMapNames.get(this.m_enType) as string[]));
            return;
        }

        return this.exe(lstGoodFiles);
    }

    /* 在终端执行命令 */
    public launchTerminal(args:string[]){
        let term = new Terminal(TERM_NAME);
        term.execCommand(this.m_strExeName, args);
    }

    /* 直接启动工具 */
    public launch(){
        return this.exe(undefined); 
    }

    private filteFile(lstFiles : string[]){
        let strTargets = gMapExtentsion.get(this.m_enType);
        if(strTargets == undefined) return [];
        
        let lstGoods : string[] = [];
        for(var item of lstFiles){
            let strExt = path.extname(item).toLowerCase();
            if(strTargets.has(strExt) == true){
                lstGoods.push(item);
                continue;
            }
        }

        return lstGoods;
    }

    private exe(args:string[] | undefined){
        const designer = spawn(this.m_strExePath, args);
        designer.on('close', (code) => {
            Logger.instance().info(`${this.m_strExePath} exited with code ${code}`);
        });
    }
}

export{
    ToolLauncher
}