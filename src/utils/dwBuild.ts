import { OutputConsole } from '../components/outputConsole';
import { DwCmds } from './dwCmds'; // Import the DwCmds function from the appropriate module
class DwBuildConfig {
    clean: boolean;
    debug: boolean;
    openEmulator: boolean;
    pwd: string | null;
    module: string;
    variant: string;
    attachDebugger: boolean;

    constructor(clean: boolean, debug: boolean, openEmulator: boolean, module: string, variant: string, pwd: string | null) {
        this.clean = clean;
        this.debug = debug;
        this.openEmulator = openEmulator;
        this.pwd = pwd;
        this.module = module;
        this.variant = variant;
        this.attachDebugger = false;
    }
}

class DwBuild {
    private cmd: string = "plugin-build";
    private openEmulator: boolean;
    private attachDebugger: boolean = false;
    private pwd: string | undefined;
    private dwOutput: OutputConsole;

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

        this.pwd = config.pwd ?? undefined;
        this.openEmulator = config.openEmulator;
        this.dwOutput = dwOutput;
    }

    private execute() {
        // DashwaveWindow.displayInfo();
        const buildCmd = new DwCmds(this.cmd, this.pwd ?? null, true, this.dwOutput); // Ensure that `this.pwd` is of type `string | null`
        buildCmd.executeBuild(this.pwd ?? null, this.openEmulator, this.attachDebugger); // Ensure that `this.pwd` is of type `string | null`
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


