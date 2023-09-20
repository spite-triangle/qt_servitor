
import * as vscode from 'vscode';
import * as fs from 'fs';
import { spawn} from 'child_process';
import * as path from 'path'

import { TOOLS,CONFIG} from './define';
import {Logger} from './log'


const gMapNames: Map<TOOLS, string> = new Map([
    [TOOLS.NON,""],
    [TOOLS.ASSISTANT,"assistant.exe"],
    [TOOLS.DESIGNER,"designer.exe"],
    [TOOLS.QML,"qml.exe"],
    [TOOLS.QT_CREATOR,"QtCreator.exe"]
]);

const gMapExtentsion : Map<TOOLS, Set<string>> = new Map;
gMapExtentsion.set(TOOLS.DESIGNER, new Set(['.ui']));
gMapExtentsion.set(TOOLS.QT_CREATOR, new Set(['.qml']));



/* 启动工具 */
class ToolLauncher{
    private m_enType: TOOLS;
    private m_strExe: string;

    constructor(enType:TOOLS) {
        this.m_enType = enType;
        this.m_strExe = "";

        // 获取配置
        let config = vscode.workspace.getConfiguration();
        
        // 工具名
        let strName = gMapNames.get(enType);
        if(strName == undefined) throw new Error('not found' + strName);
        
        let strPath = "";
        if(enType == TOOLS.QT_CREATOR){
            strPath = config.get(CONFIG.QtCreator) as string;
        }else if(enType != TOOLS.NON){
           strPath = config.get(CONFIG.sdk) as string; 
           // 拼接路径
           strPath = path.join(strPath, "bin", strName);
        }else{
            throw new Error('the tool is non');
        }

        if( fs.existsSync(strPath) == false) throw new Error('Please check path settings of sdk and QtCreator. The path does not exit : ' + strPath);

        this.m_strExe = strPath;
    }

    public async launchWithFile(lstFiles:string[]){
        if(lstFiles.length <= 0) {
            Logger.instance().debug('not found target files about ' +  (gMapNames.get(this.m_enType) as string));
            return;
        }

        // 校验
        let lstGoodFiles = this.filteFile(lstFiles);
        if(lstGoodFiles.length <= 0) {
            let strTargets = gMapExtentsion.get(this.m_enType);
            Logger.instance().debug('not found target files '+ strTargets +' about ' +  (gMapNames.get(this.m_enType) as string));
            return;
        }

        await this.exe(lstGoodFiles);
    }

    public async launch(){
        await this.exe(undefined); 
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

    private async exe(lstFiles:string[] | undefined){
        const designer = spawn(this.m_strExe, lstFiles);
        designer.on('close', (code) => {
            Logger.instance().debug(`qt designer child process exited with code ${code}`);
        });
    }
}

export{
    ToolLauncher
}