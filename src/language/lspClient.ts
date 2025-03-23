import * as vscode from 'vscode'
import * as lsp from 'vscode-languageclient/node'
import * as net from 'net'
import * as fs from 'fs'
import { ChildProcess, ChildProcessWithoutNullStreams, spawn,exec} from 'child_process'
import { Logger } from '../common/log'
import { OxO } from '../common/tool'
import {ConfigAssist} from '../common/config'
import { PROPERTIES } from '../common/define'
import path = require('path')


/* qmllsp 配置 */
interface QmlSettings{
    targetFolder?: string[];
    importPath?: string[];
    qml2ImportPath?: string[];
    qrc?:string[];
    sourceFolder?:string[];
    sdk?:string;
}

enum SERVER_STATE{
    INIT,
    RUNNING,
    STOP,
    ERROR
}


class LspServer{
    state:SERVER_STATE = SERVER_STATE.INIT;
    process:ChildProcessWithoutNullStreams | null= null;
    errorMsg: string = "";

    async launch(port : number){
        let qtConfig = await ConfigAssist.qtConfigueration();
        let configAssist = ConfigAssist.instance();
        let tool = await configAssist.getPropertiesPath(PROPERTIES.QML_LSP_TOOL);
        let qmlTypeDesc = await configAssist.getPropertiesPath(PROPERTIES.QML_TYPE_DESC);
        let sdk = await configAssist.getPropertiesPath(PROPERTIES.SDK);

        if(fs.existsSync(tool) == false){
            Logger.ERROR("qmllsp tool is invalid. please check `qt.qmllspToolPath`.", true);
            return false;
        }

        let args : string[] =[
            `-p ${port}`,
            "-v",
            `--sdk=${sdk}`,
            `--typeDescription=${qmlTypeDesc}`
        ];

        if(qtConfig != undefined){
            if(qtConfig.importPath != undefined){
                let command = OxO.serializeArray(qtConfig.importPath);
                args.push(`--import=${command}`);
            }

            if(qtConfig.qrc != undefined){
                let command = OxO.serializeArray(qtConfig.qrc);
                args.push(`--qrc=${command}`);
            }

            if(qtConfig.sourceFolder != undefined){
                let command = OxO.serializeArray(qtConfig.sourceFolder);
                args.push(`--src=${command}`);
            }

            if(qtConfig.targetFolder != undefined){
                let command = OxO.serializeArray(qtConfig.targetFolder);
                args.push(`--targetFolder=${command}`);
            }

            if(qtConfig.qml2ImportPath != undefined){
                let command = OxO.serializeArray(qtConfig.qml2ImportPath);
                args.push(`--qml2imports=${command}`);
            }
        }

        Logger.INFO("create qmllsp process.");
        this.process = spawn(tool, args, {
            env: process.env,
        });
        
        process.on("spawn",  ()=>{
            this.state = SERVER_STATE.RUNNING;
            Logger.INFO("launch qmllsp successfully.");
        });

        process.on("error", (error)=>{
            this.errorMsg = error.message;
            this.state = SERVER_STATE.ERROR;
            Logger.ERROR(`occur exception in qmllsp. ${this.errorMsg}`, true);
        });

        process.on("exit", (code) =>{
            this.state = SERVER_STATE.STOP;
            Logger.ERROR(`stop qmllsp ${code}`, true);
        });


        return true;
    }


    static  launchDebug(): Promise<lsp.StreamInfo>{
        let socket = net.connect(12345);
        let result: lsp.StreamInfo = {
            writer: socket,
            reader: socket
        };
        return Promise.resolve(result);
    }

};

export class LspObject{
    client : lsp.LanguageClient | null = null;
    server : LspServer | null = null;
};


export class LspClient{
    private static m_configChangeCount : Map<string, number> = new Map();
    private static m_clients: Map<string, LspObject> = new Map();
    private static m_channel: vscode.OutputChannel = vscode.window.createOutputChannel("qmllsp");
    
    static append(folder: string, obj: LspObject){
        if(this.contains(folder) == false){
            this.m_clients.set(folder, obj);
        }
    }

    static getObject(folder: string): LspObject | undefined{
        return this.m_clients.get(folder);
    }

    static updateServer(folder: string, server:LspServer){
        if(this.contains(folder) == true){
            let obj = this.m_clients.get(folder);
            if(obj == undefined) return;
            if(obj.server != null){
                obj.server.process?.kill();
            } 

            obj.server = server;
        }
    }

    static contains(folder : string) : boolean{
        return this.m_clients.has(folder);
    }

    static remove(folder:string){
        let obj = this.m_clients.get(folder);
        if(obj?.client != null){
            this.m_clients.delete(folder);
            obj.client.stop()
        }
        
    }

    static async didChangeConfigurationParams(folder:string){
        if(LspClient.contains(folder) == false) return false;

        let obj = this.m_clients.get(folder);
        if(obj == undefined) return false;

        let qtConfig = await ConfigAssist.qtConfigueration();
        if(qtConfig == undefined) return false;
        
        let configAssist = ConfigAssist.instance();
        let strSdk = await configAssist.getPropertiesPath(PROPERTIES.SDK);

        let settings : QmlSettings = {
            sdk: strSdk,
            qrc: qtConfig?.qrc,
            targetFolder: qtConfig?.targetFolder,
            importPath: qtConfig?.importPath,
            qml2ImportPath: qtConfig?.qml2ImportPath,
            sourceFolder : qtConfig?.sourceFolder
        };

        if(obj.client !=null){
            obj.client.sendNotification("workspace/didChangeConfiguration", settings);
        }else{
            return false;
        }
        return true;
    }

    static async createClient(folder: vscode.WorkspaceFolder){        
        let target = OxO.getOuterMostWorkspaceFolder(folder);
        if(this.contains(target.uri.toString()) == true) return true;
        


        // 客户端连接服务
        const clientOptions: lsp.LanguageClientOptions = {
            documentSelector: [
                {scheme: 'file',language: 'qml' },
                {scheme: "file", language: 'qmldir'},
                {scheme: "file", language: 'xml', pattern: "**/*.qrc"},
                {scheme: "file", language: 'javascript'}
            ],
            diagnosticCollectionName: 'qmllsp',
            outputChannel: this.m_channel
        };

		let client = new lsp.LanguageClient('qmllsp', 'QML LSP',  ()=>{
            return new Promise(async (resolve, reject)=>{
                // 获取服务端口，并创建服务
                let getPort = require('get-port');
                let port = await getPort();
                
                let obj = this.getObject(target.uri.toString());
                if(obj == undefined) return;

                if(obj.server == null || obj.server.process?.killed == true || obj.server.process?.exitCode != null){
                    let server = new LspServer();
                    if(await server.launch(port) == false){
                        reject("launch qmllsp failed.");
                        return;
                    }
                    this.updateServer(target.uri.toString(), server);
                }

                setTimeout(function(){ 
                    let socket = net.connect(port);
                    let result: lsp.StreamInfo = {
                        writer: socket,
                        reader: socket,
                    };
    
                    resolve(result);
                }, 5000);
            });
        }, clientOptions);

        // 测试环境
        // let client = new lsp.LanguageClient('qmllsp', 'QML LSP', LspServer.launchDebug, clientOptions);

		client.start();

        let obj = new LspObject();
        obj.client = client;
        this.append(target.uri.toString(), obj);

        this.m_configChangeCount.set(target.uri.toString(), 0);

        // 监控配置文件
        let watcher = vscode.workspace.createFileSystemWatcher( new vscode.RelativePattern(folder.uri.fsPath, ".vscode/c_cpp_properties.json"))
        let dWatcher =  watcher.onDidChange(async (uri)=>{
            // 会连续触发两次
            let count = this.m_configChangeCount.get(target.uri.toString());
            if(count == undefined) return;
            count = count + 1;
            if(count < 2){
                this.m_configChangeCount.set(target.uri.toString(), count);
                return;
            }else{
                this.m_configChangeCount.set(target.uri.toString(), 0);
            }
    
            LspClient.didChangeConfigurationParams(target.uri.toString());
        });

        // 文档切换
		let dActive = vscode.window.onDidChangeActiveTextEditor(event =>{
			if(event == undefined) return;
            let document = event.document;
            let uri = event.document.uri;
            if((uri.scheme == "file" && (document.languageId == 'qml' || document.languageId == 'javascript')) == false) return;

			client.sendNotification("textDocument/didChange", {
				textDocument:{
					uri: document.uri,
					version: document.version
				},
				contentChanges:{
					text: document.getText()
				}
			});
		});

        client.onDidChangeState((e)=>{
            if(e.newState == lsp.State.Stopped){
                dWatcher.dispose();
                dActive.dispose();
                
            }
        });

        return true;
    }


}
