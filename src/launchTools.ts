
import * as vscode from 'vscode';
import * as fs from 'fs';
import { spawn} from 'child_process';
import * as path from 'path'

import { TOOLS, PROPERTIES} from './define';
import { ConfigAssist } from './config';
import {Logger} from './log'
import { promises } from 'dns';



const gMapNames: Map<TOOLS, string[]> = new Map([
    [TOOLS.NON,[]],
    [TOOLS.ASSISTANT,["assistant.exe"]],
    [TOOLS.DESIGNER,["designer.exe"]],
    [TOOLS.QML,["qml.exe"]],
    [TOOLS.QT_CREATOR,["QtCreator.exe"]]
]);

const gMapExtentsion : Map<TOOLS, Set<string>> = new Map;
gMapExtentsion.set(TOOLS.DESIGNER, new Set(['.ui']));
gMapExtentsion.set(TOOLS.QT_CREATOR, new Set(['.qml']));


/* 启动工具 */
 class ToolLauncher{
    private m_enType: TOOLS = TOOLS.NON;
    private m_strExe: string = "";

    async init(enType:TOOLS){
        this.m_enType = enType;        

        // 工具名
        let lstNames = gMapNames.get(enType);
        if(lstNames == undefined) throw new Error('not found tool');
        
        // REVIEW - 需要重新修改
        let strPath = "";
        if(enType == TOOLS.QT_CREATOR){
            strPath = await ConfigAssist.instance().getPropertiesPath(PROPERTIES.QT_CREATOR) ;
        }else if(enType != TOOLS.NON){
            strPath = await ConfigAssist.instance().getPropertiesPath(PROPERTIES.SDK);
            strPath = path.join(strPath,"bin");
            
            // 检测 sdk 路径
            if(fs.existsSync(strPath) == false){
                ConfigAssist.instance().updateSdkPath(""); 
                throw new Error('Please check the path : ' + strPath);
            }
            
        }else{
            throw new Error('the tool is non');
        }
        
        // 查找软件
        for(var strName of lstNames){
            strPath = path.join(strPath, strName);
            if( fs.existsSync(strPath) == true) {
                this.m_strExe = strPath;
                return ;
            }
        }

        throw new Error('Please check the path : ' + strPath);
    }

    public async launchWithFile(lstFiles:string[]){
        if(lstFiles.length <= 0) {
            Logger.instance().debug('not found target files about ' +  (gMapNames.get(this.m_enType) as string[]));
            return;
        }

        // 校验
        let lstGoodFiles = this.filteFile(lstFiles);
        if(lstGoodFiles.length <= 0) {
            let strTargets = gMapExtentsion.get(this.m_enType);
            Logger.instance().debug('not found target files '+ strTargets +' about ' +  (gMapNames.get(this.m_enType) as string[]));
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