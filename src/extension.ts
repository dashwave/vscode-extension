// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import { installDW } from './pluginStartup';
import { OutputConsole } from './components/outputConsole';
import { visit } from 'jsonc-parser';
const { exec } = require('child_process');


var selectedModule:string = "", selectedVariant : string = "";
var availableModules:string[] = [], availableVariants : string[] = [];
var projectConnected :boolean = false;

export function activate(context: vscode.ExtensionContext) {
  const buildView = new DashwaveView("build",context.extensionUri);
  const configView = new DashwaveView("config", context.extensionUri);
  const helpView = new DashwaveView("help", context.extensionUri);

  vscode.window.registerWebviewViewProvider("dashwaveBuildOptsView", buildView);
  vscode.window.registerWebviewViewProvider("dashwaveConfigurationView", configView);
  vscode.window.registerWebviewViewProvider("dashwaveHelpView", helpView);

  // updates the available modules and variants in the configuration view
  setTimeout(()=>{
    configView.setAvailableVariants(availableVariants);
    configView.setAvailableModules(availableModules);
  }, 2000);

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
                            vscode.window.showInformationMessage('Running build command');
                            // Run the build command
                            break;
                        case "runBuildAndEmulation":
                            vscode.window.showInformationMessage('Running build and emulate command');
                            // Run the build and emulate command
                            break;
                        case "runDebugger":
                            vscode.window.showInformationMessage('Running debugger command');
                            // Run the debugger command
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
                            break;
                        default:
                            vscode.window.showErrorMessage('Invalid message received from configuration view');
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

    private _getHtmlForWebview(viewName:String,webview:vscode.Webview) {
		// Get the local path to main script run in the webview, then convert it to a uri we can use in the webview.
		const scriptUri = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, 'media', `${this._viewType}.js`));

		// Do the same for the stylesheet.
		const styleVSCodeUri = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, 'media', 'vscode.css'));
		const styleMainUri = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, 'media', 'main.css'));

		// Use a nonce to only allow a specific script to be run.

        switch(viewName){
            case "build":
                return `<!DOCTYPE html>
                    <html lang="en">
                    <head>
                        <meta charset="UTF-8">
                        <meta name="viewport" content="width=device-width, initial-scale=1.0">
                        <link href="${styleVSCodeUri}" rel="stylesheet">
                        <link href="${styleMainUri}" rel="stylesheet">
                        <title>Dashwave Build Opts</title>
                    </head>
                    <body>
                        <div class="action-div">
                            <div class="action-text">Builds your app on dashwave cloud</div>
                            <button class="action-btn" id="run-build">Run dashwave build</button>
                        </div>
                        <div class="action-div">
                            <div class="action-text">Builds your app on dashwave cloud and opens an emulation right here</div>
                            <button class="action-btn" id="run-build-and-emulation">Build and Emulate</button>
                        </div>
                        <div class="action-div">
                            <div class="action-text">Debug your code with dashwave debugger</div>
                            <button class="action-btn" id="run-debugger">Run Dashwave Debugger</button>
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
                        <link href="${styleVSCodeUri}" rel="stylesheet">
                        <link href="${styleMainUri}" rel="stylesheet">
                        <title>Configuration Opts</title>
                    </head>
                    <body>
                        <div class="config-div">
                            <div class="config-text">Module</div>
                                <select class="config-select" name="module" id="module-selector">
                                </select>
                            </div>
                            <div class="config-div">
                                <div class="config-text">Variant</div>
                                <select class="config-select" name="variant" id="variant-selector">
                                </select>
                            </div>
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
                        <link href="${styleVSCodeUri}" rel="stylesheet">
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
