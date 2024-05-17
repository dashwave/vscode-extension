// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import { installDW } from './pluginStartup';
const { exec } = require('child_process');
import { OutputConsole } from './components/outputConsole';

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {

	// Use the console to output diagnostic information (console.log) and errors (console.error)
	// This line of code will only be executed once when your extension is activated
	console.log('Your extension "dashwave" is now active!');

    // Initalize the output console
    // const dwOutput = new OutputConsole();
	// The command has been defined in the package.json file
	// Now provide the implementation of the command with registerCommand
	// The commandId parameter must match the command field in package.json
	// let disposable = vscode.commands.registerCommand('dashwave.helloWorld', () => {
	// 	// The code you place here will be executed every time your command is executed
	// 	// Display a message box to the user
	// 	vscode.window.showInformationMessage('Hello World from Dashwave!');
	// });

	let disposable = vscode.commands.registerCommand('extension.runCliCommand', function (actionName: string) {
        // Replace 'your-cli-command' with the actual CLI command you want to run
        // Prepare your CLI command
		const cliCommand = 'whoami';

        installDW(null);

		// Get the active terminal or create a new one
		const terminal = vscode.window.activeTerminal || vscode.window.createTerminal({ name: 'CLI Command Output' });
		terminal.show();

		// Run the CLI command in the terminal
		terminal.sendText(cliCommand);
    });

	context.subscriptions.push(disposable);


	const dashwaveActionsProvider = new DashwaveActionsProvider();
    vscode.window.registerTreeDataProvider('dashwaveView', dashwaveActionsProvider);
}

class DashwaveActionsProvider {
    getTreeItem(element: any) {
        return element;
    }

    getChildren(element: any) {
        if (element === undefined) {
            return ['Build', 'Emulate', 'Debug'].map(action => {
                const treeItem = new vscode.TreeItem(action);
                    treeItem.command = { 
                        command: 'extension.runCliCommand', 
                        title: 'Run CLI Command', 
                        arguments: [action] // Pass the fruit name as an argument
                    };
                return treeItem;
            });
        }
        return [];
    }
}

// This method is called when your extension is deactivated
export function deactivate() {}
