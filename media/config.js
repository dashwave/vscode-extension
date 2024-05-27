const vscode = acquireVsCodeApi();

document.getElementById('variant-selector').addEventListener('change', (event) => {
    vscode.postMessage({
        command: 'updateVariant',
        text: event.target.value
    });
});

document.getElementById('module-selector').addEventListener('change', (event) => {
    vscode.postMessage({
        command: 'updateModule',
        text: event.target.value
    });
});

 // Function to update the select options dynamically
 function updateSelectOptions(elementID,states) {
    const select = document.getElementById(elementID);
    if(states.length > 0){
        select.disabled = false;
        select.innerHTML = states.map(state => 
            `<option value="${state.toLowerCase()}">${state}</option>`
        ).join('');
    }else{
        select.innerHTML = '<option value="" selected>Not available yet</option>';
        select.disabled = true;
    }
}

// Listen for messages from the extension to update the select options
window.addEventListener('message', event => {
    const message = event.data;
    console.log('Received message from extension:', message);
    switch (message.command) {
        case 'setAvailableModules':
            updateSelectOptions("module-selector",message.list);
            break;
        case 'setAvailableVariants':
            updateSelectOptions("variant-selector",message.list);
            break;
        default:
            vscode.window.showErrorMessage('Invalid message received from configuration view');
    }
});