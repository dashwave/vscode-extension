const vscode = acquireVsCodeApi();

document.getElementById('create-project').addEventListener('click', (event) => {
    vscode.postMessage({
        command: 'createProjectModalOpen'
    });
});
