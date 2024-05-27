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
