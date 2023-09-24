import * as vscode from 'vscode';
import * as fs from 'fs';
import * as jsonc from 'comment-json';
import { PROPERTIES} from './define';
import { SdkSelector } from './sdkSelect';
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

        // 创建配置项
        let strQtInclude = await ConfigAssist.instance().getPropertiesPath(PROPERTIES.QT_INCLUDE);
        
        let lstInclude = config.configurations[0].includePath;
        if(lstInclude == undefined){
            lstInclude = [strQtInclude];
        }else{
            // 查询是否已经设置
            for(var item of lstInclude){
                if( path.normalize(item) == strQtInclude) return;
            } 

            // 添加配置
            lstInclude.push(strQtInclude);
        }

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

        for(var item of env){
            if(item.name.toLowerCase() != 'path') continue;
            
            // 查看环境变量是否已经设置了
            let strValue = path.normalize(item.value);
            let index = strValue.indexOf(strSdkBin);
            if(index < 0 ) continue;
           
            // 检测 strSdkBin 是否只是配置中路径中部分
            if(strValue.length > strSdkBin.length){
                let lstCh = ": ;";

                // 左侧的符号
                let chLeft = (index - 1) < 0? " " : strValue[index - 1] ;
                
                // 右侧的符号
                let chRight = " ";
                index = index + strSdkBin.length;
                while (index < strValue.length) {
                    let ch = strValue[index];

                    // 过滤分隔符 
                    if('\\/'.indexOf(ch) < 0){
                        chRight = ch;
                        break;
                    }

                    // 挪动指针
                    ++index;
                }

                if(lstCh.indexOf(chLeft) < 0 || lstCh.indexOf(chRight) < 0) continue;
            }
            return false;
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
    private m_strSdkCache :string = ""; // 配置文件更新有延迟，用于缓解延迟
    m_strExtensionDir : string = "";
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
        let strInstall = await this.getPropertiesPath(PROPERTIES.INSTALL_PATH) ; 

        // 弹窗获取
        let strSdk = await new SdkSelector(strInstall).selectSdk();

        // 更新本地设置
        if(strSdk != "") vscode.workspace.getConfiguration().update(PROPERTIES.SDK, strSdk, vscode.ConfigurationTarget.Global).then((value)=>{
            // 清空缓存
            this.m_strSdkCache = "";
        });

        // 更新本地设置有延迟
        this.m_strSdkCache = strSdk;

        return strSdk;
    }

    /* 获取工具路径 */
    async getPropertiesPath(enType:PROPERTIES){
        // 获取配置
        let setting = vscode.workspace.getConfiguration().get(enType, "");

        switch (enType) {
            case PROPERTIES.SDK: return await this.getSdkPath(setting);
            case PROPERTIES.QT_CREATOR: return await this.getQtCreator(setting);
            case PROPERTIES.QT_INCLUDE: return await this.getIncludePath(setting);
            case PROPERTIES.QT_NATVIS: return this.getNatvis(setting);
            case PROPERTIES.INSTALL_PATH : 
                if(setting == "") throw Error ('The path of Qt install does not exist. please configure qt.installPath in settings.');
                return setting;
            default: return "";
        }
    }

    private async getNatvis(str:string): Promise<string> {
        if(str != "") return str;

        // 调用本地的
        return path.join(this.m_strExtensionDir,"assets", "natvis", "qt5.natvis.xml");
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