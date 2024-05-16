import { spawn, ChildProcess } from 'child_process';
import { EventEmitter } from 'events';

export class Process {
    private ph: ChildProcess;
    private outputBuilder: string[] = [];
    private latch: EventEmitter = new EventEmitter();

    constructor(cmd: string, pwd: string | null, log: boolean) {
        const command = `/bin/bash -c "${cmd}"`;
        const options: any = {};

        if (pwd) {
            options.cwd = pwd;
        }

        const homeValue = process.env.HOME;
        const pathValue = process.env.PATH;
        options.env = {
            ...process.env,
            PATH: `${pathValue}:${homeValue}/.dw-cli/tools/:${homeValue}/.dw-cli/bin/`
        };

        this.ph = spawn(command, options);

        if (this.ph.stdout) {
            this.ph.stdout.on('data', (data) => {
                const text = data.toString();
                this.outputBuilder.push(text);
                if (log) {
                    decodeAndPrintString(text);
                }
            });
        }

        if (this.ph.stderr) {
            this.ph.stderr.on('data', (data) => {
                const text = data.toString();
                this.outputBuilder.push(text);
                if (log) {
                    decodeAndPrintString(text);
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

function decodeAndPrintString(s: string) {
    // Assuming a simple console log for demonstration purposes
    console.log(s);
}


