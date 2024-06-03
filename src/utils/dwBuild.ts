import { OutputConsole } from '../components/outputConsole';
import * as vscode from 'vscode';
import { DwCmds } from './dwCmds'; // Import the DwCmds function from the appropriate module
import { getPluginMode } from '../pluginStartup';
export class DwBuildConfig {
    clean: boolean;
    debug: boolean;
    openEmulator: boolean;
    pwd: string;
    module: string;
    variant: string;
    attachDebugger: boolean;

    constructor(clean: boolean, debug: boolean, openEmulator: boolean, module: string, variant: string, attachDebugger: boolean, pwd: string) {
        this.clean = clean;
        this.debug = debug;
        this.openEmulator = openEmulator;
        this.pwd = pwd;
        this.module = module;
        this.variant = variant;
        this.attachDebugger = attachDebugger;
    }
}

export class DwBuild {
    private cmd: string = "plugin-build";
    private openEmulator: boolean;
    private attachDebugger: boolean = false;
    private pwd: string;
    private dwOutput: OutputConsole;
    private dwcmd: DwCmds|null = null;

    constructor(config: DwBuildConfig, dwOutput: OutputConsole) {
        if (config.clean) {
            this.cmd += " --clean";
        }
        if (config.debug) {
            this.cmd += " --debug";
        }

        if (config.module !== "") {
            this.cmd += ` --module ${config.module}`;
        }

        if (config.variant !== "") {
            this.cmd += ` --variant ${config.variant}`;
        }
        if (config.attachDebugger) {
            this.cmd += " --attach-debugger";
        }
        if (getPluginMode() === "workspace"){
            this.cmd += " --workspace";
        }

        this.pwd = config.pwd;
        this.openEmulator = config.openEmulator;
        this.dwOutput = dwOutput;
        this.attachDebugger = config.attachDebugger;
    }

    public async execute(progress: vscode.Progress<{ message?: string, increment?: number }>, token: vscode.CancellationToken) {
        // DashwaveWindow.displayInfo();
        const buildCmd = new DwCmds(this.cmd, this.pwd, true, this.dwOutput); // Ensure that `this.pwd` is of type `string | null`
        this.dwcmd = buildCmd;
        await buildCmd.executeBuild(this.pwd ?? null, this.openEmulator, this.attachDebugger, progress); // Ensure that `this.pwd` is of type `string | null`
    }

    public async cancel() {
        this.dwcmd?.exit();
        const cancelCmd = new DwCmds("stop-build", this.pwd, true, this.dwOutput);
        cancelCmd.executeWithExitCode().then((ex) => {
            if (ex === 0) {
                this.dwOutput.displayOutput("Build cancelled successfully");
                vscode.window.showInformationMessage("Build cancelled successfully");
            } else {
                this.dwOutput.displayError("Failed to cancel the build");
                vscode.window.showErrorMessage("Failed to cancel the build");
            }
        });
    }

    // run(p: Project) {
    //     this.activateDashwaveWindow();
    //     DashwaveWindow.clearConsole();
    //     DashwaveWindow.disableRunButton();
    //     DashwaveWindow.enableCancelButton();
    //     if (DashwaveWindow.lastEmulatorProcess !== null) {
    //         DashwaveWindow.lastEmulatorProcess.exit();
    //     }
    //     if (!doesFileExist(`${this.pwd}/dashwave.yml`)) {
    //         if (!openCreateProjectDialog(this.pwd, false)) {
    //             DashwaveWindow.enableRunButton();
    //             DashwaveWindow.disableCancelButton();
    //             return;
    //         }
    //     }
    //     this.execute();
    // }
}


