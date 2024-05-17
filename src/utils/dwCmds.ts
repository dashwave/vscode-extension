import { exec, ExecOptions } from 'child_process';
import { Process } from './process';
import { installDW } from '../pluginStartup';

export class DwCmds {
    private cmd: string;
    private p: Process;
    private pwd: string | null;

    constructor(execCmd: string, wd: string | null, log: boolean = false) {
        this.cmd = `dw ${execCmd} --plugin`;
        this.pwd = wd ?? null;
        this.p = new Process(this.cmd, this.pwd, log);
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
            // DashwaveWindow.displayError('Dashwave has a major update, you need to update dependencies\n');
            const hyperlink = {
                // onClick: (p: Project) => {
                //     this.installDW(this.pwd);
                // }
            };
            // DashwaveWindow.console.printHyperlink('Click here to update\n\n', hyperlink);
        }
        return exitCode;
    }

    async executeWithOutput(): Promise<[number, string]> {
        this.p.start(true);
        const exitCode = await this.p.wait();
        if (exitCode === 11) {
            // this.dwWindow.displayError("Dashwave has a major update, you need to update dependencies\n");
            const hyperlink = {
                execute: (p: any) => { // Replace with the actual type
                    // installDW(this.pwd, p);
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
