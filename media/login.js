const vscode = acquireVsCodeApi();

document.getElementById('login-user').addEventListener('click', (event) => {
    vscode.postMessage({
        command: 'loginUser'
    });
});
