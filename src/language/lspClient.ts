import * as vscode from 'vscode'
import * as lsp from 'vscode-languageclient/node'
import * as net from 'net'
import { spawn } from 'child_process'
import { Logger } from '../common/log'
import { OxO } from '../common/tool'
import {ConfigAssist} from '../common/config'
import { PROPERTIES } from '../common/define'
import { resourceUsage } from 'process'
import { ClientRequest } from 'http'


/* qmllsp 配置 */
interface QmlSettings{
    targetFolder?: string[];
    importPath?: string[];
    qml2ImportPath?: string[];
    qrc?:string[];
    sourceFolder?:string[];
    sdk?:string;
}

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

    static createClient(folder: vscode.WorkspaceFolder): boolean{
        let target = OxO.getOuterMostWorkspaceFolder(folder);
        if(this.contains(target.uri.toString()) == true) return true;

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

		let client = new lsp.LanguageClient('qmllsp', 'QML LSP', this.launchServer, clientOptions);
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
            }
        });

        return true;
    }



    private static async launchServer(): Promise<lsp.StreamInfo>{
        let getPort = require('get-port');
        let qtConfig = ConfigAssist.qtConfigueration();
        let configAssist = ConfigAssist.instance();
        let tool = await configAssist.getPropertiesPath(PROPERTIES.QML_LSP_TOOL);
        let qmlTypeDesc = await configAssist.getPropertiesPath(PROPERTIES.QML_TYPE_DESC);
        let sdk = await configAssist.getPropertiesPath(PROPERTIES.SDK);
        let port = await getPort();

        
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

        let	server = spawn(tool, args, {
        	env: process.env,
        });



        return new Promise((resolve,reject)=>{

            server.on("spawn",  ()=>{
                // 先等待 qmllsp 的服务器启动
                new Promise(resolve => setTimeout(resolve, 5000)).then(()=>{
                    let socket = net.connect(port);
                    let result: lsp.StreamInfo = {
                        writer: socket,
                        reader: socket
                    };
                    resolve(result);
                })
            });

            server.on("error", (error)=>{
                Logger.ERROR(`Failed to launch server. ${error}`, true);
                reject(error);
            });

            server.on("exit", (code) =>{
                if(code == 0) return;
                Logger.ERROR(`Failed to launch server. ${code}`, true);
            });
        })
    }




    private static launchServerDebug(): Promise<lsp.StreamInfo>{
        let socket = net.connect(12345);
        let result: lsp.StreamInfo = {
            writer: socket,
            reader: socket
        };
        return Promise.resolve(result);
    }
}
