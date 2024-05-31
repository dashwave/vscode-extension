import { spawn, ChildProcess } from 'child_process';
import { EventEmitter } from 'events';
import { OutputConsole } from '../components/outputConsole';

export class Process {
    private ph: ChildProcess;
    private outputBuilder: string[] = [];
    private latch: EventEmitter = new EventEmitter();
    private dwOutput: OutputConsole;

    constructor(cmd: string, pwd: string | null, log: boolean, dwOutput: OutputConsole) {
        // const command = `/bin/bash -c "${cmd}"`;
        // Use shell = true instead

        const command = cmd;
        const options: any = {};

        if (pwd) {
            options.cwd = pwd;
        }

        this.dwOutput = dwOutput;

        const homeValue = process.env.HOME;
        const pathValue = process.env.PATH;
        options.env = {
            ...process.env,
            PATH: `${pathValue}:${homeValue}/.dw-cli/tools/:${homeValue}/.dw-cli/bin/`
        };
        options.shell = true;

        // split command into an array
        let commandArray: string[] = command.split(' ');
        const rootCommand = commandArray[0];
        commandArray.shift();

        // Spawn the process
        console.log(`Spawning process: ${command}`);
        this.ph = spawn(rootCommand, commandArray, options);

        if (this.ph.stdout) {
            this.ph.stdout.on('data', (data) => {
                const text = data.toString();
                this.outputBuilder.push(text);
                if (log) {
                    decodeAndPrintString(text, this.dwOutput);
                }
            });
        }

        if (this.ph.stderr) {
            this.ph.stderr.on('data', (data) => {
                const text = data.toString();
                this.outputBuilder.push(text);
                if (log) {
                    decodeAndPrintString(text, this.dwOutput);
                }
            });
        }

        this.ph.on('close', (code) => {
            this.latch.emit('done', code);
        });
    }

    start(p0: boolean) {
        // In Node.js, the process starts immediately upon spawn
        // but I want to start it here explicitly

        // spawn(this.command, this.options)
    }

    async wait(): Promise<number> {
        return new Promise((resolve) => {
            this.latch.once('done', (code) => {
                resolve(code);
            });
        });
    }

    exit() {
        this.ph.kill();
    }

    getOutput(): string {
        return this.outputBuilder.join('');
    }
}

function decodeAndPrintString(s: string, dwOutput: OutputConsole) {
    // Assuming a simple console log for demonstration purposes
    dwOutput.appendLine(s);
    console.log(s);
}


