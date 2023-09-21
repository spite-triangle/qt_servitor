import * as vscode from 'vscode';
import { PROPERTIES} from './define';
import { SdkSelector } from './sdkSelect';
import path = require('path');


class ConfigAssist {
    private static m_instance : ConfigAssist;
    private constructor() {}

    private m_Sdk:string = "";

    static instance(){
        if(this.m_instance == null){
            this.m_instance = new ConfigAssist;
        }
        return this.m_instance;
    }

    async updateSdkPath(){
        this.m_Sdk = "";
        // 推断 sdk
        let strInstall = await this.getPropertiesPath(PROPERTIES.INSTALL_PATH) ; 

        this.m_Sdk = await new SdkSelector(strInstall).selectSdk();
    }

    /* 获取工具路径 */
    async getPropertiesPath(enType:PROPERTIES){
        // 获取配置
        let setting = vscode.workspace.getConfiguration().get(enType, "");

        switch (enType) {
            case PROPERTIES.SDK: return await this.getSdkPath(setting);
            case PROPERTIES.QT_CREATOR: return await this.getQtCreator(setting);
            case PROPERTIES.QT_NATVIS: return setting;
            case PROPERTIES.INSTALL_PATH : 
                if(setting == "") throw Error ('The path of Qt install does not exist. please go to set.');
                return setting;
            default: return "";
        }
    }

    private async getSdkPath(str:string) : Promise<string> {
        // 指定了 sdk
        if( str != "") return str;

        // 本地有 sdk
        if (this.m_Sdk != "") return this.m_Sdk;

        await this.updateSdkPath();

        return this.m_Sdk;
    }

    private async getQtCreator(str:string) : Promise<string> {
        // 存在配置
        if( str != "" ) return path.join(str,"bin");

        // 获取安装路径
        let strInstall = await this.getPropertiesPath(PROPERTIES.INSTALL_PATH);

        return path.join(strInstall, "Tools", "QtCreator", "bin") ;
    }

}

export{
    ConfigAssist
}