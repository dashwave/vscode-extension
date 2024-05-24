// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import { installDW } from './pluginStartup';
const { exec } = require('child_process');


// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
	let disposable = vscode.commands.registerCommand('extension.runCliCommand', function (actionName: string) {
        // Replace 'your-cli-command' with the actual CLI command you want to run
        // Prepare your CLI command
		const cliCommand = 'whoami';
    });

	context.subscriptions.push(disposable);
}

// This method is called when your extension is deactivated
export function deactivate() {}
