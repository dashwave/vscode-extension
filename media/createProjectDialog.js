const vscode = acquireVsCodeApi();

document.getElementById('create-project-form').addEventListener('submit', (e) => {
    e.preventDefault();
    // Gather form data
    const projectName = document.getElementById('project-name').value;
    const rootModulePath = document.getElementById('root-module-path').value;
    const projectType = document.querySelector('input[name="project-type"]:checked').value;

    // Create a project data object
    const projectData = {
        projectName: projectName,
        rootModulePath: rootModulePath,
        projectType: projectType
    };

    // Send the project data to the VSCode extension
    vscode.postMessage({
        command: 'createProject',
        projectData
    });
});