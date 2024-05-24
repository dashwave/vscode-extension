import * as vscode from 'vscode';

export async function createProjectDialog() {
    const accessCode = await vscode.window.showInputBox({
        placeHolder: 'Access Code:',
        prompt: ''
    });

    if (!accessCode) {
        vscode.window.showInformationMessage(`Access Code is a mandatory field. Please enter a valid code.`);
    }
}