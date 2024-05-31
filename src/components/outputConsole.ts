import * as vscode from 'vscode';

const formatRegex = /\[[\d;]+m([\s\S]*?)\[0m/;

function removeEscapeCodes(input: string): string {
    // Regular expression to match ANSI escape codes
    const ansiRegex = /[\u001b\u009b][[\]()#;?]*((([a-zA-Z\d](;[-a-zA-Z\d\/#&.:=?%@~_]+)*)?(\u0007))|((\d{1,4}(;\d{0,4})*)?[\dA-PR-TZcf-nq-uy=><~]))/g;
    return input.replace(ansiRegex, '');
}

// Make it as a class and create an object for it
export class OutputConsole {
    private outputChannel: vscode.OutputChannel;
    constructor() {
        this.outputChannel = vscode.window.createOutputChannel('Dashwave');
        this.outputChannel.appendLine('Starting Dashwave Plugin...');
        this.outputChannel.show();
    }

    // Add a method to append a line to the output channel
    appendLine(line: string) {
        line = removeEscapeCodes(line);
        const match = line.match(formatRegex);
        if (match) {
            this.outputChannel.appendLine(match[1]);
        }else{
            this.outputChannel.appendLine(line);
        }
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

    displayOutput(message: string) {
        this.outputChannel.appendLine(message);
    }

    displayInfo(message: string) {
        this.outputChannel.appendLine(`[INFO]: ${message}`);
    }

    displayError(message: string) {
        this.outputChannel.appendLine(`[ERROR]: ${message}`);
    }

}