import * as vscode from 'vscode';

export async function createProjectDialog() {
    const projectName = await vscode.window.showInputBox({
        placeHolder: 'Project name*:',
        prompt: ''
    });

    if (!projectName) {
        vscode.window.showInformationMessage(`Project Name is a mandatory field. Please enter a valid name.`);
    }

    const rootModulePath = await vscode.window.showInputBox({
        placeHolder: 'Root Module Path:',
        prompt: ''
    });

    const options = [
        { label: 'Kotlin/Java', description: '' },
        { label: 'React Native', description: '' },
        { label: 'Flutter', description: '' }
    ];
    
    const devStackOptions = await vscode.window.showQuickPick(options, {
        placeHolder: 'Select an dev stack'
    });

    if (!devStackOptions) {
        vscode.window.showInformationMessage(`Please select a valid dev stack.`);
    }

    // const panel = vscode.window.createWebviewPanel(
    //     'customInput', 
    //     'Multiple Inputs', 
    //     vscode.ViewColumn.One, 
    //     { enableScripts: true }
    // );

    // panel.webview.html = getWebviewContent();

    // panel.webview.onDidReceiveMessage(message => {
    //     if (message.command === 'submit') {
    //         vscode.window.showInformationMessage(`You entered: ${message.inputs.join(', ')}`);
    //     }
    // });
}

function getWebviewContent() {
    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Multiple Inputs</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            padding: 10px;
        }
        .input-field {
            margin: 10px 0;
        }
        .button {
            display: inline-block;
            padding: 10px 20px;
            margin: 10px 0;
            color: #fff;
            background-color: #007ACC;
            border: none;
            border-radius: 4px;
            cursor: pointer;
            text-align: center;
            text-decoration: none;
            font-size: 14px;
        }
        .button:hover {
            background-color: #005A9E;
        }
    </style>
</head>
<body>
    <h2>Enter Values</h2>
    <div class="input-field">
        <label for="input1">First value:</label>
        <input type="text" id="input1">
    </div>
    <div class="input-field">
        <label for="input2">Second value:</label>
        <input type="text" id="input2">
    </div>
    <div class="input-field">
        <label for="input3">Third value:</label>
        <input type="text" id="input3">
    </div>
    <button class="button" onclick="submitForm()">Submit</button>

    <script>
        const vscode = acquireVsCodeApi();
        function submitForm() {
            const inputs = [
                document.getElementById('input1').value,
                document.getElementById('input2').value,
                document.getElementById('input3').value
            ];
            vscode.postMessage({ command: 'submit', inputs: inputs });
        }
    </script>
</body>
</html>`;
}
