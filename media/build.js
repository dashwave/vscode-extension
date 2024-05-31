const vscode = acquireVsCodeApi();

document.getElementById('run-build').addEventListener('click', (event) => {
    vscode.postMessage({
        command: 'runBuild'
    });
});

document.getElementById('run-build-and-emulation').addEventListener('click', (event) => {
    vscode.postMessage({
        command: 'runBuildAndEmulation'
    });
});

document.getElementById('run-debugger').addEventListener('click', (event) => {
    vscode.postMessage({
        command: 'runDebugger'
    });
});

window.addEventListener('message', event => {
    const message = event.data;
    switch (message.command) {
        case 'enableBuild':
            document.getElementById('run-build').disabled = false;
            document.getElementById('run-build-and-emulation').disabled = false;
            document.getElementById('run-debugger').disabled = false;
            break;
        case 'disableBuild':
            document.getElementById('run-build').disabled = true;
            document.getElementById('run-build-and-emulation').disabled = true;
            document.getElementById('run-debugger').disabled = true;
            break;
        default:
            vscode.window.showErrorMessage('Invalid message received from build view');
    } 
});