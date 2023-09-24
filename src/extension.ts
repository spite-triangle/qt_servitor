// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import * as process from 'process'

import { ToolLauncher } from './launchTools';
import { TOOLS} from './define';
import { Logger, LOG_LEVEL} from './log'
import { CreateTemplate } from './templateCreate';
import { ConfigAssist } from './config';


// 获取当前正关注的文件夹或者文件的路径
function getForcusPath(uri: vscode.Uri, selectedFiles: any, active: boolean = true) {
	let files: string[] = [];
	if (selectedFiles && Array.isArray(selectedFiles) && selectedFiles.length > 0) {
		for (var selectedFile of selectedFiles) {
			const path = selectedFile.fsPath;
			if (path) files.push(path);
		}
	}else  if (uri && uri.fsPath != undefined){
		files.push(uri.fsPath);
	}else if(active == true){
		const editor = vscode.window.activeTextEditor;
		if (editor && editor.document) {
			files.push(editor.document.fileName);
		}
	}
	
	return files;
}

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
		let files = getForcusPath(uri, selectedFiles);

		if (files.length > 0) {
			try {
				let launcher =  new ToolLauncher();
				await launcher.init(TOOLS.DESIGNER);
				await launcher.launchWithFile(files);
			} catch (error) {
				if(error instanceof Error) vscode.window.showErrorMessage(`error Open .ui: ${error.message}`);
			}
		}
	});
	context.subscriptions.push(disposable);

	disposable = vscode.commands.registerCommand('qt.launchQtCreator', async (uri: vscode.Uri, selectedFiles: any) => {
		let files = getForcusPath(uri, selectedFiles);

		if (files.length > 0) {
			try {
				let launcher =  new ToolLauncher();
				await launcher.init(TOOLS.QT_CREATOR);
				await launcher.launchWithFile(files);
			} catch (error) {
				if(error instanceof Error) vscode.window.showErrorMessage(`Error Launch Qt Creator: ${error.message}`);
			}
		}
	});
	context.subscriptions.push(disposable);

	disposable = vscode.commands.registerCommand('qt.launchAssistant', async (uri: vscode.Uri, selectedFiles: any) => {
		try {
			let launcher =  new ToolLauncher();
			await launcher.init(TOOLS.ASSISTANT);
			await launcher.launch();
		} catch (error) {
			if(error instanceof Error) vscode.window.showErrorMessage(`Error Launch Assistant: ${error.message}`);
		}
	});
	context.subscriptions.push(disposable);

	disposable = vscode.commands.registerCommand('qt.launchLinguist', async (uri: vscode.Uri, selectedFiles: any) => {
		let files = getForcusPath(uri, selectedFiles);

		if (files.length > 0) {
			try {
				let launcher =  new ToolLauncher();
				await launcher.init(TOOLS.LINGUIST);
				await launcher.launchWithFile(files);
			} catch (error) {
				if(error instanceof Error) vscode.window.showErrorMessage(`Error Open .ts: ${error.message}`);
			}
		}
	});
	context.subscriptions.push(disposable);

	disposable = vscode.commands.registerCommand('qt.createTemplate', async (uri: vscode.Uri, selectedFiles: any) => {
		let workspaces = vscode.workspace.workspaceFolders;

		// 排除当前项目存在多个 workspacefolder 时，用户未选择任何目录的情况
		let files : string[]  = [];
		if(workspaces != undefined && workspaces.length > 1){
			files = getForcusPath(uri, selectedFiles, false);
		}else{
			files = getForcusPath(uri, selectedFiles);
		}

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
}

// This method is called when your extension is deactivated
export function deactivate() { }
