const vscode = acquireVsCodeApi();

document.getElementById('build-opts-selector').addEventListener('change', (event)=>{
    vscode.postMessage({
        command: 'updateBuildOpts',
        text: event.target.value
    });
});