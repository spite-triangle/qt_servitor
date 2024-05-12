import * as vscode from 'vscode';
import * as fs from 'fs';
import * as jsonc from 'comment-json';
import * as process from 'process'

import { PROPERTIES, VERSION} from './define';
import { SdkSelector } from '../module/sdkSelect';
import path = require('path');
import { Logger } from './log';

interface EnvironmentItem {
    name:string;
    value: string;
}

/* c_cpp_properties.json 的定义，直接从 c/c++ 插件抄过来 */
interface ConfigurationJson {
    configurations: Configuration[];
    env?: { [key: string]: string | string[] };
    version: number;
    enableConfigurationSquiggles?: boolean;
}

interface Configuration {
    name: string;
    compilerPathInCppPropertiesJson?: string;
    compilerPath?: string;
    compilerPathIsExplicit?: boolean;
    compilerArgs?: string[];
    compilerArgsLegacy?: string[];
    cStandard?: string;
    cStandardIsExplicit?: boolean;
    cppStandard?: string;
    cppStandardIsExplicit?: boolean;
    includePath?: string[];
    macFrameworkPath?: string[];
    windowsSdkVersion?: string;
    dotConfig?: string;
    defines?: string[];
    intelliSenseMode?: string;
    intelliSenseModeIsExplicit?: boolean;
    compileCommandsInCppPropertiesJson?: string;
    compileCommands?: string;
    forcedInclude?: string[];
    configurationProviderInCppPropertiesJson?: string;
    configurationProvider?: string;
    mergeConfigurations?: boolean;
    browse?: Browse;
    customConfigurationVariables?: { [key: string]: string };
}

interface Browse {
    path?: string[];
    limitSymbolsToIncludedHeaders?: boolean | string;
    databaseFilename?: string;
}

// TODO - 删除旧配置
// c_cpp_properties.json
class CppPropertiesTool{

    async update(strPath: string){

        // 是否存在配置文件夹
        if(fs.existsSync(strPath) == false) return;

        // 解析
        let config :ConfigurationJson = this.parseJson(strPath) as any;
        if(config == null){
            Logger.WARN("Failed to parse c_cpp_properties.json.");
            return;
        }
        
        if(config.configurations.length <= 0) return;

        // 创建配置项  D:/ProgramData/Qt/5.15.2/msvc2017_64/include
        let strQtInclude = await ConfigAssist.instance().getPropertiesPath(PROPERTIES.QT_INCLUDE);
        let strInstallPath = await ConfigAssist.instance().getPropertiesPath(PROPERTIES.INSTALL_PATH);
        
        let lstInclude = config.configurations[0].includePath;
        if(lstInclude != undefined){
            // 查询是否已经设置
            lstInclude = lstInclude.filter(value=>{
                return (path.normalize(value).indexOf(strInstallPath) == 0)? false : true;
            });
        }else{
            lstInclude = [];
        }

        
        // 添加配置
        lstInclude.push(strQtInclude);
        config.configurations[0].includePath = lstInclude;

        // 保存配置
        this.saveJson(strPath,config);
    }

    // 将 c_cpp_properties.json 转为 ConfigurationJson
    private parseJson(strPath:string){
        const strConfig: string = fs.readFileSync(strPath, 'utf8');
        if (strConfig == "") return null;

        // TODO?: Handle when jsonc.parse() throws an exception due to invalid JSON contents.
        return jsonc.parse(strConfig, undefined, true) ;
    }

    private saveJson(strPath:string, json: ConfigurationJson){
        let strContext = jsonc.stringify(json, null, 4);
        fs.writeFile(strPath, strContext, (err)=>{
            if(err) Logger.ERROR(err.message);
        });
    }
}


// Launch.json
class LaunchConfigTool{

    bChange: Boolean = false; // 配置文件是否修改
    bHasSdkBin: Boolean = true; // Qt 运行路径是否存在

    async update(configuration : any){
        // 检测 type
        if( this.checkIsCppdbgType(configuration) == false) return; 

        // 更新 qt.natvis
        if( await this.updateVisualizerFile(configuration) == true) this.bChange = true;

        // 检测是否为 Launch 模式
        if(this.bHasSdkBin == true && 
           this.checkIsLaunchRequest(configuration) == true){
            if( await this.updateEnvironment(configuration)  == true) this.bChange = true;
        }
    }

    private checkIsCppdbgType(configuration : any){
         // 判断 type 的类型
         if( ('type' in configuration) == false) return false;

        // 检测类型 
         let strType = configuration.type as string;
         if (strType != "cppdbg" && strType != "cppvsdbg") return false;
         return true;
    }

    private checkIsLaunchRequest(configuration : any){
         // 判断 request 的类型
         if( ('request' in configuration) == false) return false;

        // 检测类型 
         let strType = configuration.request as string;
         if (strType != "launch" ) return false;
         return true;
    }

    private async updateEnvironment(configuration : any){
        // 判断 request 的类型
        let env : Array<EnvironmentItem> = [];
        if( ('environment' in configuration) == true){
            env = configuration.environment as Array<EnvironmentItem>;
        }
        
        // 新增 path 环境变量
        let strSdkBin = path.join( await ConfigAssist.instance().getPropertiesPath(PROPERTIES.SDK), "bin");
        if(fs.existsSync(strSdkBin) == false){
            Logger.WARN("Not found Qt run environment path. " + strSdkBin);
            this.bHasSdkBin =false;
            return false;
        } 

        let strInstallPath = await ConfigAssist.instance().getPropertiesPath(PROPERTIES.INSTALL_PATH);

        // 环境变量分割符
        let strSplit = "";
        if (process.platform == "win32") {
            strSplit = ";"; 
        }else if(process.platform == "linux"){
            strSplit = ":";
        }

        // 查询设置
        for(var item of env){
            if(item.name.toLowerCase() != 'path') continue;
            
            let lstPaths = item.value.split(strSplit);
            for(var strItem of lstPaths){
                let strNorm = path.normalize(strItem);

                // 已经设置了
                if(strNorm == strSdkBin) return false;

                // 存在路径是 strInstallPath 的子目录，认为就是旧的设置
                // 正常人应该不会在这个路径下安装其他软件
                if(strNorm.indexOf(strInstallPath) == 0){
                    // 修改
                    item.value = item.value.replace(strItem, strSdkBin);
                    return true;
                }
            }
        } 

        env.push( {name: "path",value: strSdkBin} );
        configuration.environment = env;
        return true;
    }

    private async updateVisualizerFile(configuration : any){
        let strQtNatvisOld : string = "";
        if( ('visualizerFile' in configuration) == true){
            strQtNatvisOld = configuration.environment as string;
        }

        let strQtNatvis = await ConfigAssist.instance().getPropertiesPath(PROPERTIES.QT_NATVIS);

        // 判断新旧设置是否一样
        if(strQtNatvisOld == strQtNatvis) return false;

        if(fs.existsSync(strQtNatvis) == false){
            Logger.WARN("The path of qt.natvis.xml is invalid. " + strQtNatvis,true);
            return false;
        }
        configuration.visualizerFile = strQtNatvis;

        return true;
    }

}



class ConfigAssist {
    m_strExtensionDir : string = "";
    private m_strSdkCache :string = ""; // 配置文件更新有延迟，用于缓解延迟
    private static m_instance : ConfigAssist;
    private constructor() {}

    static instance(){
        if(this.m_instance == null){
            this.m_instance = new ConfigAssist;
        }
        return this.m_instance;
    }

    // 更新 c_cpp_properties.json
    async updateCppProperties(){
        let workspace = vscode.workspace.workspaceFolders;
        if(workspace == undefined || workspace.length <= 0) return;
        let strPath = path.join(workspace[0].uri.fsPath, ".vscode", "c_cpp_properties.json");
        await new CppPropertiesTool().update(strPath);
    }


    // 更新 Launch.json 中设置
    async updateLaunch(){

        // 获取 launch.json 配置
        const config = vscode.workspace.getConfiguration('launch');

        // configurations
        let launchTool = new LaunchConfigTool;
        let lstConfigurations = config.get<Array<any>>('configurations', []);
        for(var configuration of lstConfigurations){
            await launchTool.update(configuration);
        }
        
        // 更烈 Launch.json 配置
        if(launchTool.bChange == true){
            config.update('configurations', lstConfigurations);
        }
    }

    async updateSdkPath(){
        // 推断 sdk
        let strInstall = await this.getPropertiesPath(PROPERTIES.INSTALL_PATH);

        // 弹窗获取
        let strSdk = await new SdkSelector(strInstall).selectSdk();

        // 更新本地设置
        if(strSdk != "") {
            // 默认将配置更新到全局 settings.json 中
            let settingTarget = vscode.ConfigurationTarget.Global;

            // 检查 workfolder 是否存在 PROPERTIES.SDK 配置。存在则更新到 workfolder 的 settings.json 中
            let allSettings = vscode.workspace.getConfiguration().inspect(PROPERTIES.INSTALL_PATH);
            if(allSettings != undefined && allSettings.workspaceValue != ""){
                settingTarget = vscode.ConfigurationTarget.Workspace;
            }
 
            // 更新配置
            vscode.workspace.getConfiguration().update(PROPERTIES.SDK, strSdk, settingTarget).then((value)=>{
                // 清空缓存
                this.m_strSdkCache = "";
            });
        }

        // 更新本地设置有延迟
        this.m_strSdkCache = strSdk;

        return strSdk;
    }

    /* 获取工具路径 */
    async getPropertiesPath(enType:PROPERTIES){
        // 获取 setting.json 中的配置，优先使用 workfolder 中的配置
        let setting = vscode.workspace.getConfiguration().get(enType, "");

        // 将 setting中的配置转换为实际需要的路径 
        switch (enType) {
            case PROPERTIES.SDK: setting = await this.getSdkPath(setting); break;
            case PROPERTIES.QT_CREATOR: setting =  await this.getQtCreator(setting); break;
            case PROPERTIES.QT_INCLUDE: setting = await this.getIncludePath(setting); break;
            case PROPERTIES.QT_NATVIS: setting = await this.getNatvis(setting); break;
            case PROPERTIES.INSTALL_PATH : 
                if(setting == "") throw Error ('The path of Qt install does not exist. please configure qt.installPath in settings.');
                break;
            default: return "";
        }

        return path.normalize(setting);
    }

    private async getNatvis(str:string): Promise<string> {
        if(str != "") return str;

        let version = new SdkSelector( await this.getPropertiesPath(PROPERTIES.INSTALL_PATH)).getSdkVersion();
        if(version == VERSION.QT_6){
            return path.join(this.m_strExtensionDir,"assets", "natvis", "qt6.natvis.xml");
        }else {
            return path.join(this.m_strExtensionDir,"assets", "natvis", "qt5.natvis.xml");
        }
    }

    private async getIncludePath(str:string): Promise<string>{
        if(str != "") return str;

        let strSdk = await this.getPropertiesPath(PROPERTIES.SDK);
        return path.join(strSdk, "include", "**");
    }

    private async getSdkPath(str:string) : Promise<string> {
        // 指定了 sdk
        if( str != "") return str;

        if(this.m_strSdkCache != "") return this.m_strSdkCache;

        return await this.updateSdkPath();
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