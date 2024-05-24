import { exec, ExecOptions } from 'child_process';
import { Process } from './process';
import { installDW } from '../pluginStartup';
import { OutputConsole } from '../components/outputConsole';

export class DwCmds {
    private cmd: string;
    private p: Process;
    private pwd: string | null;
    private dwOutput: OutputConsole;

    constructor(execCmd: string, wd: string | null, log: boolean = false, dwOutput: OutputConsole) {
        this.cmd = `dw ${execCmd} --plugin`;
        this.pwd = wd ?? null;
        this.p = new Process(this.cmd, this.pwd, log);
        this.dwOutput = dwOutput;
    }

    private runCommand(command: string, cwd?: string, log: boolean = false): Promise<void> {
        const options: ExecOptions = {
            cwd: cwd,
    };

    return new Promise((resolve, reject) => {
        exec(command, options, (error, stdout, stderr) => {
            if (error) {
            reject(error);
            } else {
            resolve();
            }
        });
        });
    }

    async executeWithExitCode(): Promise<number> {
        this.p.start(true);
        const exitCode = await this.p.wait();
        if (exitCode === 11) {
            this.dwOutput.displayError('Dashwave has a major update, you need to update dependencies\n');
            const hyperlink = {
                onClick: () => {
                    installDW(this.pwd, this.dwOutput); // Include the dwOutput argument
                }
            };
            // DashwaveWindow.console.printHyperlink('Click here to update\n\n', hyperlink);
            this.dwOutput.displayOutput(`Click here to update\n\n {hyperlink}`);
        }
        return exitCode;
    }

    async executeWithOutput(): Promise<[number, string]> {
        this.p.start(true);
        const exitCode = await this.p.wait();
        if (exitCode === 11) {
            this.dwOutput.displayError("Dashwave has a major update, you need to update dependencies\n");
            const hyperlink = {
                execute: (p: any) => { // Replace with the actual type
                    installDW(this.pwd, this.dwOutput);
                }
            };
            // this.dwWindow.console.printHyperlink("Click here to update\n\n", hyperlink);
        }

        // get the stdout as string
        return [exitCode, this.p.getOutput()];
    }

    executeBg(): void {
        new Promise<void>((resolve) => {
            this.p.start(true);
            resolve();
        });
    }

    exit(): void {
    // There is no direct way to exit a running process in TypeScript,
    // but you can use the 'kill' method of the child process to terminate it.
    // this.p.kill();
    }

    executeBuild(pwd: string | null, openEmulator: boolean, attachDebugger: boolean): Promise<number> {
        this.p.start(true);
        // this.dwWindow.disableRunButton();
        // this.dwWindow.enableCancelButton();
        // this.dwWindow.currentBuild = this;
        // this.dwWindow.changeIcon(this.dwWindow.loadIcon);

        return this.p.wait().then((ex) => {
            switch (ex) {
                case 0:
                    if (!attachDebugger && openEmulator) {
                        // const emulatorCmd = new DwCmds("emulator", pwd, false, this.dwWindow);
                        // this.dwWindow.lastEmulatorProcess = emulatorCmd;
                        // const ex = emulatorCmd.executeWithExitCode();
                    }
                    break;
                case 11:
                    // const hyperlink = new HyperlinkInfo((p: Project) => {
                    //     installDW(pwd, this.dwWindow);
                    // });
                    break;
                case 14:
                    console.log("attaching debugger");
                    if (attachDebugger) {
                        // const debuggerCmd = new DwCmds("get-debugger", pwd, true, this.dwWindow);
                        // debuggerCmd.executeBg();
                    }
                    if (openEmulator) {
                        // const emulatorCmd = new DwCmds("emulator", pwd, false, this.dwWindow);
                        // this.dwWindow.lastEmulatorProcess = emulatorCmd;
                        // const ex = emulatorCmd.executeWithExitCode();
                    }
                    break;
                default:
                    // add try again
                    break;
            }
            return ex;
        });
    }
}
