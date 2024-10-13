import * as vscode from 'vscode'
import * as lsp from 'vscode-languageclient/node'
import * as net from 'net'
import { ChildProcess, ChildProcessWithoutNullStreams, spawn } from 'child_process'
import { Logger } from '../common/log'
import { OxO } from '../common/tool'
import {ConfigAssist} from '../common/config'
import { PROPERTIES } from '../common/define'
import { resourceUsage } from 'process'
import { ClientRequest } from 'http'
import { clearScreenDown } from 'readline'


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
        let qtConfig = ConfigAssist.qtConfigueration();
        let configAssist = ConfigAssist.instance();
        let tool = await configAssist.getPropertiesPath(PROPERTIES.QML_LSP_TOOL);
        let qmlTypeDesc = await configAssist.getPropertiesPath(PROPERTIES.QML_TYPE_DESC);
        let sdk = await configAssist.getPropertiesPath(PROPERTIES.SDK);

        
        let args : string[] =[
            `-p ${port}`,
            // "-v",
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

        
        this.process = spawn(tool, args, {
            env: process.env,
        });
        
        this.process.on("spawn",  ()=>{
            this.state = SERVER_STATE.RUNNING;
        });

        this.process.on("error", (error)=>{
            this.errorMsg = error.message;
            this.state = SERVER_STATE.ERROR;
        });

        this.process.on("exit", (code) =>{
            this.state = SERVER_STATE.STOP;
        });

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

export class LspClient{
    private static m_configChangeCount : Map<string, number> = new Map();
    private static m_clients: Map<string, lsp.LanguageClient> = new Map();
    private static m_channel: vscode.OutputChannel = vscode.window.createOutputChannel("qmllsp");
    
    static append(folder: string, client: lsp.LanguageClient){
        if(this.contains(folder) == false){
            this.m_clients.set(folder, client);
        }
    }

    static contains(folder : string) : boolean{
        return this.m_clients.has(folder);
    }

    static remove(folder:string){
        let client = this.m_clients.get(folder);
        if(client){
            this.m_clients.delete(folder);
            client.stop();
        }
        
    }

    static async didChangeConfigurationParams(folder:string){
        if(LspClient.contains(folder) == false) return false;

        let client = this.m_clients.get(folder);
        if(client == undefined) return false;

        let qtConfig = ConfigAssist.qtConfigueration();
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

        client.sendNotification("workspace/didChangeConfiguration", settings);
        return true;
    }

    static async createClient(folder: vscode.WorkspaceFolder){        
        let target = OxO.getOuterMostWorkspaceFolder(folder);
        if(this.contains(target.uri.toString()) == true) return true;
        
        // 获取服务端口，并创建服务
        let getPort = require('get-port');
        let port = await getPort();
        let server = new LspServer();
        await server.launch(port);
        // let server = await this.launchServer(port);

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
            return new Promise((resolve, reject)=>{
                setTimeout(() => {
                    if(server.process == null || server.state == SERVER_STATE.ERROR || server.state == SERVER_STATE.STOP){
                        reject(`Failed to launch LSP server. ${server.errorMsg}`);
                    }else if(server.state == SERVER_STATE.INIT){
                        if(server.process == null){
                            reject("Failed to launch LSP server.");
                        }else{
                            server.process.on("spawn",()=>{
                                let socket = net.connect(port);
                                let result: lsp.StreamInfo = {
                                    writer: socket,
                                    reader: socket
                                };
                
                                resolve(result);
                            });
                        }
                    }else if(server.state == SERVER_STATE.RUNNING){
                        let socket = net.connect(port);
                        let result: lsp.StreamInfo = {
                            writer: socket,
                            reader: socket
                        };
                        
                        resolve(result);
                    }
                }, 500);
            });
        }, clientOptions);

        // 测试环境
        // let client = new lsp.LanguageClient('qmllsp', 'QML LSP', LspServer.launchDebug, clientOptions);

		client.start();
        this.append(target.uri.toString(), client);
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

                if(server.process != null){
                    server.process.kill();
                }
            }
        });

        return true;
    }


}
