import * as vscode from 'vscode';

export async function gitNotConfiguredNotif() {
    const gitConfigured = vscode.window.showErrorMessage(
        'Git is not configured on your system. Please configure Git and try again.',
        'Yes', 'No'
    );
}