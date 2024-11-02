// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import * as process from 'process'

import { ToolLauncher } from './module/launchTools';
import { PROPERTIES, TOOLS} from './common/define';
import { Logger, LOG_LEVEL} from './common/log'
import { CreateTemplate } from './module/templateCreate';
import { ConfigAssist } from './common/config';
import { Terminal } from './module/terminal';
import { OxO } from './common/tool';
import { LspClient } from './language/lspClient';
import { SdkStatusBar } from './module/sdkSelect';
import path = require('path');



// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export async function activate(context: vscode.ExtensionContext) {

	if(process.platform !=  "linux" && process.platform != "win32"){
		vscode.window.showErrorMessage("This extension is incompatible with platform " + process.platform);
		return;
	}

	// 初始化 Logger
	Logger.instance().init(LOG_LEVEL.NON, vscode.window.createOutputChannel("Qt Servitor"));
	Logger.INFO("launch");
	ConfigAssist.instance().m_strExtensionDir = context.extensionPath;

	let disposable = vscode.commands.registerCommand('qt.launchDesigner', async (uri: vscode.Uri, selectedFiles: any) => {
		let files = OxO.getForcusPath(uri, selectedFiles);
		if(files.length <= 0) return;

		try {
			let launcher =  new ToolLauncher();
			await launcher.init(TOOLS.DESIGNER);
			launcher.launchWithFile(files);
		} catch (error) {
			if(error instanceof Error) vscode.window.showErrorMessage(`error Open .ui: ${error.message}`);
		}
	});
	context.subscriptions.push(disposable);

	disposable = vscode.commands.registerCommand('qt.launchQtCreator', async (uri: vscode.Uri, selectedFiles: any) => {
		let files = OxO.getForcusPath(uri, selectedFiles);
		if(files.length <= 0) return;

		try {
			let launcher =  new ToolLauncher();
			await launcher.init(TOOLS.QT_CREATOR);
			launcher.launchWithFile(files);
		} catch (error) {
			if(error instanceof Error) vscode.window.showErrorMessage(`Error Launch Qt Creator: ${error.message}`);
		}
	});
	context.subscriptions.push(disposable);

	disposable = vscode.commands.registerCommand('qt.launchAssistant', async (uri: vscode.Uri, selectedFiles: any) => {
		try {
			let launcher =  new ToolLauncher();
			await launcher.init(TOOLS.ASSISTANT);
			launcher.launch();
		} catch (error) {
			if(error instanceof Error) vscode.window.showErrorMessage(`Error Launch Assistant: ${error.message}`);
		}
	});
	context.subscriptions.push(disposable);

	disposable = vscode.commands.registerCommand('qt.launchLinguist', async (uri: vscode.Uri, selectedFiles: any) => {
		let files = OxO.getForcusPath(uri, selectedFiles);
		if(files.length <= 0) return;

		try {
			let launcher =  new ToolLauncher();
			await launcher.init(TOOLS.LINGUIST);
			launcher.launchWithFile(files);
		} catch (error) {
			if(error instanceof Error) vscode.window.showErrorMessage(`Error Open .ts: ${error.message}`);
		}
	});
	context.subscriptions.push(disposable);

	disposable = vscode.commands.registerCommand('qt.windeployqt', async (uri: vscode.Uri, selectedFiles: any) => {
		try {
			let launcher =  new ToolLauncher();
			await launcher.init(TOOLS.WIN_DEPLOY);
			launcher.launchTerminal([uri.fsPath]);
		} catch (error) {
			if(error instanceof Error) vscode.window.showErrorMessage(`Error deploy exe: ${error.message}`);
		}
	});
	context.subscriptions.push(disposable);

	disposable = vscode.commands.registerCommand('qt.qmleasing', async (uri: vscode.Uri, selectedFiles: any) => {
		try {
			let launcher =  new ToolLauncher();
			await launcher.init(TOOLS.QML_EASING);
			launcher.launch();
		} catch (error) {
			if(error instanceof Error) vscode.window.showErrorMessage(`Error Launch qmleasing.exe: ${error.message}`);
		}
	});
	context.subscriptions.push(disposable);

	disposable = vscode.commands.registerCommand('qt.qmlPeekFile', async (uri: vscode.Uri, selectedFiles: any) => {
		let files = OxO.getForcusPath(uri, selectedFiles);
		if(files.length <= 0) return;
		try {
			let launcher =  new ToolLauncher();
			await launcher.init(TOOLS.QML_TOOL);
			launcher.launchTerminal([files[0]]);
		} catch (error) {
			if(error instanceof Error) vscode.window.showErrorMessage(`Error Peek Current Qml: ${error.message}`);
		}
	});
	context.subscriptions.push(disposable);

	disposable = vscode.commands.registerCommand('qt.qmlPreviewFile', async (uri: vscode.Uri, selectedFiles: any) => {
		try {
			let filePath = uri.fsPath.toString();
			let launcher =  new ToolLauncher();
			await launcher.initPreview(path.basename(filePath));
			await launcher.launchPreview(filePath);
		} catch (error) {
			if(error instanceof Error) vscode.window.showErrorMessage(`Error Preview Current Qml: ${error.message}`);
		}
	});
	context.subscriptions.push(disposable);

	disposable = vscode.commands.registerCommand('qt.createTemplate', async (uri: vscode.Uri, selectedFiles: any) => {
		let files = OxO.getForcusPath(uri, selectedFiles);
		if (files.length > 0) {
			try {
				CreateTemplate(files[0], context.extensionPath);	
			} catch (error) {
				if(error instanceof Error) vscode.window.showErrorMessage(`Error Create Template: ${error.message}`);
			}
		}
	});
	context.subscriptions.push(disposable);
	

	SdkStatusBar.createBar('qt.updateSdk');
	SdkStatusBar.updateText(await ConfigAssist.instance().getPropertiesPath(PROPERTIES.SDK));
	disposable = vscode.commands.registerCommand('qt.updateSdk', async (uri: vscode.Uri, selectedFiles: any) => {
		
		try {
			let strSdk = await ConfigAssist.instance().updateSdkPath();
			SdkStatusBar.updateText(strSdk);
			if(strSdk.length <= 0) return;

			// 更新配置
			await ConfigAssist.instance().updateLaunch();
			await ConfigAssist.instance().updateCppProperties();	

			// 通知 lsp 当前 sdk 修改
			let folders = vscode.workspace.workspaceFolders;
			if(folders == undefined) return;
			let target = OxO.getOuterMostWorkspaceFolder(folders[0]);
			LspClient.didChangeConfigurationParams(target.uri.toString());
			
		} catch (error) {
			if(error instanceof Error) vscode.window.showErrorMessage(`Error Update Sdk Path: ${error.message}`);
		}
		
	});
	context.subscriptions.push(disposable);

	disposable = vscode.commands.registerCommand('qt.updateConfigure', async (uri: vscode.Uri, selectedFiles: any) => {
		
		try {
			await ConfigAssist.instance().updateLaunch();
			await ConfigAssist.instance().updateCppProperties();
		} catch (error) {
			if(error instanceof Error) vscode.window.showErrorMessage(`Error Update Kits Configure: ${error.message}`);
		}
		
	});
	context.subscriptions.push(disposable);

	disposable = vscode.commands.registerCommand('qt.launchTerminal', async (uri: vscode.Uri, selectedFiles: any) => {
		try {
			Terminal.launchTerminal();
		} catch (error) {
			if(error instanceof Error) vscode.window.showErrorMessage(`Error Launch Terminal: ${error.message}`);
		}
		
	});
	context.subscriptions.push(disposable);

	// TODO - 目前只支持 windows 平台
	if(process.platform != "win32") return;

	// lsp 服务
	disposable = vscode.workspace.onDidOpenTextDocument(document =>{
		let uri = document.uri;

		if (document.languageId !== 'qml' || uri.scheme !== "file") return;
		if(LspClient.contains(uri.toString()) == true) return;

		let folder = vscode.workspace.getWorkspaceFolder(uri);
		if(folder == undefined) return;
		
		LspClient.createClient(folder);
	});
	context.subscriptions.push(disposable);

	disposable = vscode.workspace.onDidChangeWorkspaceFolders((event)=> {
		// 关闭退出的 workspace
		for (const folder of event.removed) {
			LspClient.remove(folder.uri.toString());
		}
	});
	context.subscriptions.push(disposable);

	// 查看是否有 qml 文件
	for(let doc of vscode.workspace.textDocuments){

		// 校验
		if (doc.languageId !== 'qml' || doc.uri.scheme !== "file") return;
	
		let folder = vscode.workspace.getWorkspaceFolder(doc.uri);
		if(folder == undefined) return;
		
		LspClient.createClient(folder);
		return;
	}
}

// This method is called when your extension is deactivated
export function deactivate() { }
