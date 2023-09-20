// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';

import { ToolLauncher } from './launchTools';
import { TOOLS, CONFIG } from './define';
import {Logger} from './log'


function getFileList(uri: vscode.Uri, selectedFiles: any){
	let files: string[] = [];
	if (selectedFiles && Array.isArray(selectedFiles)) {
		for (var selectedFile of selectedFiles) {
			const path = selectedFile.fsPath;
			if (path) files.push(path);
		}
	}else {
		if (uri){
			 files.push(uri.fsPath);
		}else {
			const editor = vscode.window.activeTextEditor;
			if (editor && editor.document) {
				files.push(editor.document.fileName);
			}
		}
	}
	return files;
}

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {

	let disposable = vscode.commands.registerCommand('qt.launchDesigner', async (uri: vscode.Uri, selectedFiles: any) => {
		let files = getFileList(uri, selectedFiles);

		if (files.length > 0) {
			try {
				await new ToolLauncher(TOOLS.DESIGNER).launchWithFile(files);
			} catch (error) {
				if(error instanceof Error) vscode.window.showErrorMessage(`error launching Qt Designer: ${error.message}`);
			}
		}
	});
	context.subscriptions.push(disposable);

	disposable = vscode.commands.registerCommand('qt.launchQML', async (uri: vscode.Uri, selectedFiles: any) => {
		let files = getFileList(uri, selectedFiles);

		if (files.length > 0) {
			try {
				await new ToolLauncher(TOOLS.QT_CREATOR).launchWithFile(files);
			} catch (error) {
				if(error instanceof Error) vscode.window.showErrorMessage(`error launching Qt QML: ${error.message}`);
			}
		}
	});
	context.subscriptions.push(disposable);
}

// This method is called when your extension is deactivated
export function deactivate() { }
