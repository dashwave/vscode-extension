import { visit } from "jsonc-parser";
import { OutputConsole } from "./components/outputConsole";
import { DwBuild, DwBuildConfig } from "./utils/dwBuild";
import * as vscode from 'vscode';
import { DwCmds } from "./utils/dwCmds";
import { disableBuild, enableBuild } from "./extension";
export async function runBuild(pwd:string, dwOutput:OutputConsole, clean:boolean, debug:boolean, runEmulator:boolean, module:string, variant:string, attachDebugger:boolean) {
    dwOutput.clear();
    vscode.window.withProgress({
        location: vscode.ProgressLocation.Notification,
        title: "Building Dashwave Project",
        cancellable: true,
    }, async (progress, token) => {
        disableBuild();
        progress.report({message:"Starting build..."});
        const dwConfigs = new DwBuildConfig(clean, debug, runEmulator, module, variant, attachDebugger, pwd);
        const dwBuild = new DwBuild(dwConfigs, dwOutput);
        token.onCancellationRequested(() => {
            dwOutput.displayOutput("Cancelling the build...");
            // cancel/stop build
            dwBuild.cancel();
        });
        await dwBuild.execute(progress, token);
        enableBuild();
    });
}