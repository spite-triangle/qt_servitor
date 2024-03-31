// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import * as process from 'process'

import { ToolLauncher } from './module/launchTools';
import { TOOLS} from './common/define';
import { Logger, LOG_LEVEL} from './common/log'
import { CreateTemplate } from './module/templateCreate';
import { ConfigAssist } from './common/config';
import { Terminal } from './module/terminal';
import { OxO } from './common/tool';


// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {

	if(process.platform !=  "linux" && process.platform != "win32"){
		vscode.window.showErrorMessage("This extension is incompatible with platform " + process.platform);
		return;
	}

	// 初始化 Logger
	Logger.instance().init(LOG_LEVEL.ERROR, vscode.window.createOutputChannel("Qt Servitor"));
	Logger.INFO("launch");

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

	disposable = vscode.commands.registerCommand('qt.qmlPreviewFile', async (uri: vscode.Uri, selectedFiles: any) => {
		let files = OxO.getForcusPath(uri, selectedFiles);
		if(files.length <= 0) return;
		try {
			let launcher =  new ToolLauncher();
			await launcher.init(TOOLS.QML_TOOL);
			launcher.launchTerminal([files[0]]);
		} catch (error) {
			if(error instanceof Error) vscode.window.showErrorMessage(`Error Preview Current Qml: ${error.message}`);
		}
	});
	context.subscriptions.push(disposable);

	disposable = vscode.commands.registerCommand('qt.qmlPreviewExe', async (uri: vscode.Uri, selectedFiles: any) => {
		try {
			let launcher =  new ToolLauncher();
			await launcher.init(TOOLS.QML_PREVIEW);
			launcher.launchTerminal([uri.fsPath,"-qmljsdebugger=host:localhost,port:2444"]);
		} catch (error) {
			if(error instanceof Error) vscode.window.showErrorMessage(`Error Preview Qml Exe: ${error.message}`);
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

	disposable = vscode.commands.registerCommand('qt.updateSdk', async (uri: vscode.Uri, selectedFiles: any) => {
		
		try {
			await ConfigAssist.instance().updateSdkPath();
		} catch (error) {
			if(error instanceof Error) vscode.window.showErrorMessage(`Error Update Sdk Path: ${error.message}`);
		}
		
	});
	context.subscriptions.push(disposable);

	disposable = vscode.commands.registerCommand('qt.updateConfigure', async (uri: vscode.Uri, selectedFiles: any) => {
		
		try {
			ConfigAssist.instance().m_strExtensionDir = context.extensionPath;
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
}

// This method is called when your extension is deactivated
export function deactivate() { }
