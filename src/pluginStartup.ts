import { OutputConsole } from "./components/outputConsole";
import { DwCmds } from "./utils/dwCmds";
import { Process } from "./utils/process";
import fs from 'fs';
import * as vscode from 'vscode';

let PluginMode = "workspace";
let PluginEnv = "";

export function installDW(pwd: string | null) {
    // dwWindow.displayOutput("🔨 Setting up plugin...\n\n", ConsoleViewContentType.NORMAL_OUTPUT);

    console.log("🔨 Setting up plugin...\n\n")
    // Execute the script
    const process = new Process("curl -sSL https://cli.dashwave.io | bash", pwd, true);
    // process.start(false);

    new Promise<void>(async (resolve) => {
        const exitCode = await process.wait();
        if (exitCode === 0) {
            // dwWindow.displayInfo(Messages.DW_DEPS_INSTALL_SUCCESS);
            // dwWindow.displayInfo(Messages.DW_DEPS_CONFIGURING);

            const configCmd = new DwCmds("config", pwd, true);
            const exitcode = await configCmd.executeWithExitCode();
            if (exitcode === 0) {
                if (PluginMode === "workspace") {
                    // dwWindow.displayInfo("🔨 Setting up workspace plugin...\n");
                    let workspaceCmd = "setup-workspace";
                    if (PluginEnv !== "") {
                        workspaceCmd += ` -e ${PluginEnv}`;
                    }
                    const setupWorkspaceCmd = new DwCmds(workspaceCmd, pwd, true);
                    const exitCode = await setupWorkspaceCmd.executeWithExitCode();
                    if (exitCode === 0) {
                        verifyLogin(pwd);
                    } else {
                        // dwWindow.displayError("❌ Could not setup plugin. Please contact us at hello@dashwave.io");
                    }
                    resolve();
                    return;
                }

                // dwWindow.displayInfo(Messages.DW_DEPS_CONFIGURE_SUCCESS);
                verifyLogin(pwd);
            } else {
                // dwWindow.displayError(Messages.DW_DEPS_CONFIGURE_FAILED);
            }
        } else {
            // dwWindow.displayError(Messages.DW_DEPS_INSTALL_FAILED);
        }
        resolve();
    });
}

async function verifyLogin(pwd: string | null) {
    listUsers(pwd);
    // dwWindow.addModulesAndVariants(new Map<string, string[]>(), "", "");
    const currentUserLoginCmd = new DwCmds("user", pwd, true);
    const exitCode = await currentUserLoginCmd.executeWithExitCode();
    if (exitCode === 0) {
        // dwWindow.enableRunButton();
        // checkProjectConnected(pwd, dwWindow);
    } else {
        if (PluginMode === "workspace") {
            // dwWindow.displayError("❌ User is not setup correctly. Please contact us at hello@dashwave.io");
            return;
        }
        loginUser(pwd);
    }
}

async function loginUser(pwd: string | null) {
    // const loginDialog = new LoginDialog();
    let accessCode: string = "";

    // loginDialog.show();

    // if (loginDialog.exitCode === DialogWrapper.OK_EXIT_CODE) {
    //     accessCode = loginDialog.getAccessCode();
    // } else if (loginDialog.exitCode === DialogWrapper.CANCEL_EXIT_CODE) {
    //     // handle cancellation logic if any
    //     return;
    // }

    let loginUserCmd = `login ${accessCode}`;
    if (PluginEnv !== "") {
        loginUserCmd += ` -e ${PluginEnv}`;
    }
    const exitCode = await new DwCmds(loginUserCmd, pwd, true).executeWithExitCode();
    if (exitCode === 0) {
        // dwWindow.enableRunButton();
        // checkProjectConnected(pwd, dwWindow);
    } else {
        // const hyperlink = new HyperlinkInfo((p: Project) => {
        //     loginUser(pwd);
        // });
        // dwWindow.console.printHyperlink(Messages.DW_LOGIN_FAILED, hyperlink);
    }
}

function doesFileExist(filePath: string): boolean {
    return fs.existsSync(filePath);
}

async function listUsers(pwd: string | null) {
    const usersCmd = new DwCmds("user ls", pwd, false);
    const cmdOutput: [number, string] = await usersCmd.executeWithOutput();
    if (cmdOutput[0] !== 0) {
        // dwWindow.displayError(`❌ Could not find logged in users\n${cmdOutput[1]}`);
        return;
    }
    const jsonText = cmdOutput[1].trim();
    const cleanedJsonString = jsonText.replace(/^\s+/, '');
    console.log(cleanedJsonString);
    const jsonObject = JSON.parse(cleanedJsonString);

    const users = jsonObject.users?.map((user: any) => user.toString()) || [];
    const activeUser = jsonObject.active_user?.toString() || "";

    // dwWindow.addUsers(users, activeUser, pwd);
}

// function verifyLogin(pwd: string | null) {
//     listUsers(pwd, dwWindow);
//     dwWindow.addModulesAndVariants(new Map<string, string[]>(), "", "");
//     const currentUserLoginCmd = new DwCmds("user", pwd, true, dwWindow);
//     const exitCode = currentUserLoginCmd.executeWithExitCode();
//     if (exitCode === 0) {
//         dwWindow.enableRunButton();
//         checkProjectConnected(pwd, dwWindow);
//     } else {
//         if (PluginMode === "workspace") {
//             dwWindow.displayError("❌ User is not setup correctly. Please contact us at hello@dashwave.io");
//             return;
//         }
//         loginUser(pwd, dwWindow);
//     }
// }




