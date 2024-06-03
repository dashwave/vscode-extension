const vscode = acquireVsCodeApi();

document.getElementById('clean-build').addEventListener('change', (event)=>{
    vscode.postMessage({
        command: 'updateCleanBuild',
        checked: event.target.checked 
    });
});

document.getElementById('verbose').addEventListener('change', (event) => {
    vscode.postMessage({
        command: 'updateVerbose',
        checked: event.target.checked
    });
});
