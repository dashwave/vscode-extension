import * as vscode from 'vscode';

export async function readyForBuildNotif() {
    const gitConfigured = vscode.window.showInformationMessage(
        'Project created successfully and ready to build! Start the build here or on the Build button on the Sidebar',
        'Start Build',
    );
}