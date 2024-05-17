import * as vscode from 'vscode';

// Make it as a class and create an object for it
export class OutputConsole {
    private outputChannel: vscode.OutputChannel;
    constructor() {
        this.outputChannel = vscode.window.createOutputChannel('Dashwave');
        this.outputChannel.appendLine('Dashwave Extension is now Active');
        this.outputChannel.show();
    }

    // Add a method to append a line to the output channel
    appendLine(line: string) {
        this.outputChannel.appendLine(line);
        this.outputChannel.show();
    }

    // Add a method to show the output channel
    show() {
        this.outputChannel.show();
    }

    // Add a method to hide the output channel
    hide() {
        this.outputChannel.hide();
    }

    // Add a method to dispose the output channel
    dispose() {
        this.outputChannel.dispose();
    }

    // Add a method to clear the output channel
    clear() {
        this.outputChannel.clear();
    }
}