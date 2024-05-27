// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import { installDW } from './pluginStartup';
import { OutputConsole } from './components/outputConsole';
const { exec } = require('child_process');


// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
	let disposable = vscode.commands.registerCommand('extension.runCliCommand', function (actionName: string) {
        // Replace 'your-cli-command' with the actual CLI command you want to run
        // Prepare your CLI command
		const cliCommand = 'whoami';

    const dwOutput = new OutputConsole();

    installDW(null, dwOutput); // Include the dwOutput argument
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
