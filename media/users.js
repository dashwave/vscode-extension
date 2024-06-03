const vscode = acquireVsCodeApi();

document.getElementById("add-new-user").addEventListener("click", () => {
    vscode.postMessage({
        command: "addNewUser"
    });
});

document.getElementById("user-selector").addEventListener("change", (event) => {
    vscode.postMessage({
        command: "updateUser",
        text: event.target.value
    });
});

function updateSelectOptions(users) {
    const select = document.getElementById("user-selector");
    select.disabled = true;
    if (users.length > 0) {
        select.disabled = false;
        select.innerHTML = `<option value="" disabled selected>Select a user</option>` + users.map(user =>
            `<option value="${user}">${user}</option>`
        ).join("");
    } else {
        select.innerHTML = "<option value='' selected>No user available</option>";
        select.disabled = true;
    }
}
window.addEventListener("message", event => {
    const message = event.data;
    switch (message.command) {
        case "setUsers":
            updateSelectOptions(message.users);
            if(message.disabled){
                document.getElementById("user-selector").disabled = true;
            }
            break;
        case "setSelectedUser":
            document.getElementById("user-selector").value = message.user;
            break;
        default:
            vscode.window.showErrorMessage("Invalid message received from configuration view");
    }
});
