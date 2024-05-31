// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import { StringArrayMap, checkDW, createProject, installDW, loginUser } from './pluginStartup';
import { OutputConsole } from './components/outputConsole';
import { visit } from 'jsonc-parser';
import { create } from 'domain';
import { runBuild } from './build';
const { exec } = require('child_process');


var selectedModule:string = "", selectedVariant : string = "";
var availableModules:string[], availableVariants : StringArrayMap;
var projectConnected :boolean = false;
var buildEnabled:boolean = false;
var configView:DashwaveView, buildView:DashwaveView;
var outputChannel:OutputConsole;
var projectRootDir:string = "";
export async function activate(context: vscode.ExtensionContext) {

  outputChannel =  new OutputConsole();  
  // find the project root dir
  if (vscode.workspace.workspaceFolders && vscode.workspace.workspaceFolders.length > 0) {
    projectRootDir = vscode.workspace.workspaceFolders[0].uri.fsPath;
  } else {
    vscode.window.showErrorMessage('No workspace is opened');
    return;
  }

  // check if dw-cli is installed
  await checkDW(projectRootDir, outputChannel);

  // check if user is logged in
  // check if dashwave.yml exists?
  let disposable = vscode.commands.registerCommand('dashwave.createProject', () => {
    const createProjectPanel = vscode.window.createWebviewPanel(
        'createNewProject',
        "Dashwave",
        vscode.ViewColumn.One,
        {
            enableScripts: true,
            localResourceRoots:[
                context.extensionUri,
            ]
        }
      );
      createProjectPanel.webview.html = getCreateProjectWebViewHTML(context.extensionUri, createProjectPanel.webview);
      createProjectPanel.webview.onDidReceiveMessage(async message => {
        switch(message.command){
            case "createProject":
                const projectData = message.projectData;                
                createProjectPanel.dispose();
                createProject(projectRootDir,projectData.projectName, projectData.devStack, projectData.rootDir, outputChannel);
                break;
            default:
                vscode.window.showErrorMessage('Invalid message received from create project view');
        }
      });
  });


  buildView = new DashwaveView("build",context.extensionUri);
  const createProjectView = new DashwaveView("createProject", context.extensionUri);
  const helpView = new DashwaveView("help", context.extensionUri);
  configView = new DashwaveView("config", context.extensionUri);
  const loginView = new DashwaveView("login", context.extensionUri);

  vscode.window.registerWebviewViewProvider("dashwaveBuildOptsView", buildView);
  vscode.window.registerWebviewViewProvider("dashwaveConfigurationView", configView);
  vscode.window.registerWebviewViewProvider("dashwaveHelpView", helpView);
  vscode.window.registerWebviewViewProvider("dashwaveCreateProjectView", createProjectView);
  vscode.window.registerWebviewViewProvider("dashwaveLoginView", loginView);

  vscode.commands.executeCommand('setContext', 'dashwave:userLoggedIn', false);
  context.subscriptions.push(disposable);
}

export function setProjectConnected(){
    projectConnected = true;
    vscode.commands.executeCommand('setContext', 'dashwave:projectConnected', true);
}

function setProjectDisconnected(){
    projectConnected = false;
    vscode.commands.executeCommand('setContext', 'dashwave:projectConnected', false);
}

export function setVariants(variants:StringArrayMap){
    availableVariants = variants;
}

export function setModules(modules:string[]){
    availableModules = modules;
    configView.setAvailableModules(modules);
}

export function enableBuild(){
    buildEnabled = true;
    vscode.commands.executeCommand('setContext', 'dashwave:buildEnabled', true);
    buildView.enableBuild();
}

export function disableBuild(){
    buildEnabled = false;
    vscode.commands.executeCommand('setContext', 'dashwave:buildEnabled', false);
    buildView.disableBuild();
}
class DashwaveView implements vscode.WebviewViewProvider {

    private webv?: vscode.WebviewView;

    public setAvailableModules(modules:string[]){
        if(this._viewType !== "config"){
            vscode.window.showErrorMessage('Invalid view type for setting available modules');
        }
        this.postAvailableModulesAndVariantsToWebview("Modules",modules);
    }

    public setAvailableVariants(variants:string[]){
        if(this._viewType !== "config"){
            vscode.window.showErrorMessage('Invalid view type for setting available variants');
        }
        this.postAvailableModulesAndVariantsToWebview("Variants",variants);
    }

    public resolveWebviewView(webviewView: vscode.WebviewView, context: vscode.WebviewViewResolveContext<unknown>, token: vscode.CancellationToken) {
        this.webv = webviewView;
        webviewView.webview.options = {
			// Allow scripts in the webview
			enableScripts: true,

			localResourceRoots: [
				this._extensionUri
			]
		};

        webviewView.webview.html = this._getHtmlForWebview(this._viewType,webviewView.webview);
        switch(this._viewType){
            case "build":
                webviewView.webview.onDidReceiveMessage(async message => {
                    switch(message.command){
                        case "runBuild":
                            const message = vscode.window.showInformationMessage('Running build command');
                            setTimeout(()=>{
                                message.then(() => {}, () => {});
                            }, 2000);
                            // Run the build command
                            await runBuild(projectRootDir, outputChannel, false, false, false, selectedModule, selectedVariant, false);
                            break;
                        case "runBuildAndEmulation":
                            vscode.window.showInformationMessage('Running build and emulate command');
                            // Run the build and emulate command
                            await runBuild(projectRootDir, outputChannel, false, false, true, selectedModule, selectedVariant, false);
                            break;
                        case "runDebugger":
                            vscode.window.showInformationMessage('Running debugger command');
                            // Run the debugger command
                            await runBuild(projectRootDir, outputChannel, false, false, false, selectedModule, selectedVariant, true);
                            break;
                        default:
                            vscode.window.showErrorMessage('Invalid message received from build view');
                    }
                });
                break;
            case "config":
                webviewView.webview.onDidReceiveMessage(async message => {
                    switch (message.command) {
                        case 'updateVariant':
                            selectedVariant = message.text;
                            vscode.window.showInformationMessage(`Variant updated to ${message.text}`);
                            break;
                        case 'updateModule':
                            selectedModule = message.text;
                            vscode.window.showInformationMessage(`Module updated to ${message.text}`);
                            this.setAvailableVariants(availableVariants[selectedModule]);
                            break;
                        default:
                            vscode.window.showErrorMessage('Invalid message received from configuration view');
                    }
                });
                break;
            case "createProject":
                webviewView.webview.onDidReceiveMessage(async message => {
                    switch(message.command){
                        case "createProjectModalOpen":
                            vscode.commands.executeCommand('dashwave.createProject');                            
                            break;
                        default:
                            vscode.window.showErrorMessage('Invalid message received from create project view');
                    }
                });
            case "login":
                webviewView.webview.onDidReceiveMessage(async message => {
                    switch(message.command){
                        case "loginUser":
                            vscode.window.showInformationMessage('Logging in user');
                            await loginUser(projectRootDir, outputChannel);
                            break;
                        default:
                            vscode.window.showErrorMessage(`Invalid message received from login view: ${message.command}`);
                    }
                });
                break;
        }
    }

    constructor(
        private readonly _viewType: String,
		private readonly _extensionUri: vscode.Uri
	) { }

    private postAvailableModulesAndVariantsToWebview(type:string, list:string[]){
        if(this.webv){
            this.webv.webview.postMessage({command:`setAvailable${type}`, list:list});
        }
    }

    public enableBuild(){
        if(this._viewType !== "build"){
            vscode.window.showErrorMessage('Invalid view type for enabling build');
            return;
        }
        if(this.webv){
            this.webv.webview.postMessage({command:"enableBuild"});
        }
    }

    public disableBuild(){
        if(this._viewType !== "build"){
            vscode.window.showErrorMessage('Invalid view type for disabling build');
            return;
        }
        if(this.webv){
            this.webv.webview.postMessage({command:"disableBuild"});
        }
    }

    private _getHtmlForWebview(viewName:String,webview:vscode.Webview) {
		// Get the local path to main script run in the webview, then convert it to a uri we can use in the webview.
		const scriptUri = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, 'media', `${this._viewType}.js`));

		// Do the same for the stylesheet.
		const styleMainUri = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, 'media', 'main.css'));

		// Use a nonce to only allow a specific script to be run.

        switch(viewName){
            case "build":
                let buildButtonDisabled = "";
                if(!buildEnabled){
                    buildButtonDisabled = "disabled";
                }
                return `<!DOCTYPE html>
                    <html lang="en">
                    <head>
                        <meta charset="UTF-8">
                        <meta name="viewport" content="width=device-width, initial-scale=1.0">
                        <link href="${styleMainUri}" rel="stylesheet">
                        <title>Dashwave Build Opts</title>
                    </head>
                    <body>
                        <div class="action-div">
                            <div class="action-text">Builds your app on dashwave cloud</div>
                            <button class="action-btn" id="run-build" ${buildButtonDisabled}>Run dashwave build</button>
                        </div>
                        <div class="action-div">
                            <div class="action-text">Builds your app on dashwave cloud and opens an emulation right here</div>
                            <button class="action-btn" id="run-build-and-emulation" ${buildButtonDisabled}>Build and Emulate</button>
                        </div>
                        <div class="action-div">
                            <div class="action-text">Debug your code with dashwave debugger</div>
                            <button class="action-btn" id="run-debugger" ${buildButtonDisabled}>Run Dashwave Debugger</button>
                        </div>
                        <script src="${scriptUri}"></script>
                    </body>
                    </html>`;
            case "config":
                return `<!DOCTYPE html>
                    <html lang="en">
                    <head>
                        <meta charset="UTF-8">
                        <meta name="viewport" content="width=device-width, initial-scale=1.0">
                        <link href="${styleMainUri}" rel="stylesheet">
                        <title>Configuration Opts</title>
                    </head>
                    <body>
                        <div class="config-div">
                            <div class="config-text">Module</div>
                                <select class="config-select" name="module" id="module-selector" disabled>
                                '<option value="" selected>Not available yet</option>'
                                </select>
                            </div>
                            <div class="config-div">
                                <div class="config-text">Variant</div>
                                <select class="config-select" name="variant" id="variant-selector" disabled>
                                '<option value="" selected>Not available yet</option>'
                                </select>
                            </div>
                        </div>
                        <script src="${scriptUri}"></script>
                    </body>
                    </html>`;
            case "createProject":
                return `<!DOCTYPE html>
                    <html lang="en">
                    <head>
                        <meta charset="UTF-8">
                        <meta name="viewport" content="width=device-width, initial-scale=1.0">
                        <link href="${styleMainUri}" rel="stylesheet">
                        <title>Create Project</title>
                    </head>
                    <body>
                        <div class="action-div">
                            <div class="action-text">Create a new project on Dashwave</div>
                            <button class="action-btn" id="create-project">Create Project</button>
                        </div>
                        <script src="${scriptUri}"></script>
                    </body>
                    </html>`;
            case "login":
                return `<!DOCTYPE html>
                    <html lang="en">
                    <head>
                        <meta charset="UTF-8">
                        <meta name="viewport" content="width=device-width, initial-scale=1.0">
                        <link href="${styleMainUri}" rel="stylesheet">
                        <title>Login</title>
                    </head>
                    <body>
                        <div class="action-div">
                            <div class="action-text">Login User to Dashwave</div>
                            <button class="action-btn" id="login-user">Login</button>
                        </div>
                        <script src="${scriptUri}"></script>
                    </body>
                    </html>`;
            default:
                return `<!DOCTYPE html>
                    <html lang="en">
                    <head>
                        <meta charset="UTF-8">
                        <meta name="viewport" content="width=device-width, initial-scale=1.0">
                        <link href="${styleMainUri}" rel="stylesheet">
                        <title>Help and Feedback</title>
                    </head>
                    <body>
                        <div class="help-div">
                            <a href="https://discord.gg/EFK86Vzs5x">Join Discord</a>
                        </div>
                        <script src="${scriptUri}"></script>
                    </body>
                    </html>`;
        }
	}
}

function getCreateProjectWebViewHTML(extensionUri: vscode.Uri, webview: vscode.Webview){
    const scriptUri = webview.asWebviewUri(vscode.Uri.joinPath(extensionUri, 'media', `createProjectDialog.js`));
	const styleMainUri = webview.asWebviewUri(vscode.Uri.joinPath(extensionUri, 'media', 'main.css'));
    return `<!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <link href="${styleMainUri}" rel="stylesheet">
        <title>Create Project</title>
    </head>
        <body id="create-project-dialog">
            <div class="create-project-container">
                <h1 class="create-project-title">New Dashwave Project</h1>
                <p class="create-project-subtitle">Create a new project on dashwave to get started</p>
                <form class="create-project-form" id="create-project-form">
                    <div class="create-project-form-group">
                        <label for="project-name">Project name*</label>
                        <input type="text" id="project-name" class="create-project-form-control" placeholder="Type here" required>
                    </div>
                    <div class="create-project-form-group">
                        <label for="root-module-path">Root module path*</label>
                        <input type="text" id="root-module-path" class="create-project-form-control" value="./" required>
                    </div>
                    <div class="create-project-form-group">
                        <label>Project Type*</label>
                        <div class="create-project-radio-group">
                            <label>
                                <input type="radio" name="project-type" value="GRADLE" required> Native (Java/Kotlin)
                            </label>
                            <label>
                                <input type="radio" name="project-type" value="REACTNATIVE"> RNative
                            </label>
                            <label>
                                <input type="radio" name="project-type" value="FLUTTER"> Flutter
                            </label>
                        </div>
                    </div>
                    <button type="submit" class="create-project-btn-submit">Create</button>
                </form>
            </div>
            <script src="${scriptUri}"></script>
        </body>
        </html>`;
    }