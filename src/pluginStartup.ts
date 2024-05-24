import { OutputConsole } from "./components/outputConsole";
import { DwCmds } from "./utils/dwCmds";
import { Process } from "./utils/process";
import fs from 'fs';
import * as vscode from 'vscode';
import { Messages } from "./messages/messages"; // Import the Messages module
import { parse } from 'jsonc-parser';

let PluginMode = "workspace";
let PluginEnv = "";

async function checkDW(project: any, dwOutput: OutputConsole) {
    const dwCmd = new DwCmds("check-update", project.basePath, true, dwOutput);
    const exitCode = await dwCmd.executeWithExitCode();
    if (exitCode === 0) {
        dwOutput.displayInfo(Messages.DW_INSTALLED_ALREADY);
        verifyLogin(project?.basePath, dwOutput);
    } else if (exitCode === 11) {
        // Handle specific case for exit code 11 if needed
    } else {
        dwOutput.displayError(Messages.DW_NOT_INSTALLED);
        showInstallDW(project);
        installDW(project?.basePath, dwOutput);
    }
}

function showInstallDW(project: any) {
    // const notificationGroup = NotificationGroup.balloonGroup("YourPluginNotificationGroup");
    // const notification = notificationGroup.createNotification(
    //     "Dashwave Plugin Not Configured",
    //     "Installing and configuring deps and modules for plugin",
    //     NotificationType.INFORMATION,
    //     null
    // );
    // notification.notify(project);
}


export function installDW(pwd: string | null, dwOutput: OutputConsole) {
    dwOutput.displayOutput("🔨 Setting up plugin...\n\n");

    console.log("🔨 Setting up plugin...\n\n")
    // Execute the script
    const process = new Process("curl -sSL https://cli.dashwave.io | bash", pwd, true);

    new Promise<void>(async (resolve) => {
        const exitCode = await process.wait();
        if (exitCode === 0) {
            dwOutput.displayInfo(Messages.DW_DEPS_INSTALL_SUCCESS);
            dwOutput.displayInfo(Messages.DW_DEPS_CONFIGURING);

            const configCmd = new DwCmds("config", pwd, true, dwOutput);
            const exitcode = await configCmd.executeWithExitCode();
            if (exitcode === 0) {
                if (PluginMode === "workspace") {
                    dwOutput.displayInfo("🔨 Setting up workspace plugin...\n");
                    let workspaceCmd = "setup-workspace";
                    if (PluginEnv !== "") {
                        workspaceCmd += ` -e ${PluginEnv}`;
                    }
                    const setupWorkspaceCmd = new DwCmds(workspaceCmd, pwd, true, dwOutput);
                    const exitCode = await setupWorkspaceCmd.executeWithExitCode();
                    if (exitCode === 0) {
                        verifyLogin(pwd, dwOutput);
                    } else {
                        dwOutput.displayError("❌ Could not setup plugin. Please contact us at hello@dashwave.io");
                    }
                    resolve();
                    return;
                }

                dwOutput.displayInfo(Messages.DW_DEPS_CONFIGURE_SUCCESS);
                verifyLogin(pwd, dwOutput);
            } else {
                dwOutput.displayError(Messages.DW_DEPS_CONFIGURE_FAILED);
            }
        } else {
            dwOutput.displayError(Messages.DW_DEPS_INSTALL_FAILED);
        }
        resolve();
    });
}

async function verifyLogin(pwd: string | null, dwOutput: OutputConsole) {
    listUsers(pwd, dwOutput);
    // dwOutput.addModulesAndVariants(new Map<string, string[]>(), "", "");
    const currentUserLoginCmd = new DwCmds("user", pwd, true, dwOutput);
    const exitCode = await currentUserLoginCmd.executeWithExitCode();
    if (exitCode === 0) {
        // dwWindow.enableRunButton();
        // checkProjectConnected(pwd, dwWindow);
    } else {
        if (PluginMode === "workspace") {
            dwOutput.displayError("❌ User is not setup correctly. Please contact us at hello@dashwave.io");
            return;
        }
        loginUser(pwd, dwOutput);
    }
}

function checkProjectConnected(pwd: string | null, dwOutput: OutputConsole) {
    listUsers(pwd, dwOutput);
    const gitConfigFilepath = `${pwd}/.git`;
    if (!doesFileExist(gitConfigFilepath)) {
        if (PluginMode === "workspace") {
            dwOutput.displayError("❌ There is some issue in setting up your project (.git doesn't exist), please contact us at hello@dashwave.io");
            return;
        }
        dwOutput.displayOutput(`❌ ${Messages.GIT_NOT_CONFIGURED}`);
        // const notif = new BalloonNotif(
        //     "Could not find .git folder",
        //     "",
        //     "This is not a git repository, initialise git and push codebase to proceed ",
        //     NotificationType.ERROR,
        //     () => {}
        // );
        // notif.show(dwWindow.p);

        // const dialog = new GitNotConfiguredDialog();
        // dialog.show();
        return;
    }

    if (doesFileExist(`${pwd}/dashwave.yml`)) {
        // dwWindow.enableRunButton();
        listModulesAndVariants(pwd, dwOutput);
        dwOutput.displayOutput("✅ Project is successfully connected to dashwave. Run a cloud build using dashwave icon on toolbar\n\n");
        // const dd = new ReadyForBuildDialog();
        // dd.show();
    } else {
        if (PluginMode === "workspace") {
            dwOutput.displayError("❌ There is some issue in setting up your project (dashwave.yml doesn't exist), please contact us at hello@dashwave.io");
            return;
        }
        dwOutput.displayOutput("⚠️ This project is not connected to dashwave, create a new project on dashwave\n\n");
        // openCreateProjectDialog(pwd, true, dwWindow, () => {});
    }
}

async function loginUser(pwd: string | null, dwOutput: OutputConsole) {
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
    const exitCode = await new DwCmds(loginUserCmd, pwd, true, dwOutput).executeWithExitCode();
    if (exitCode === 0) {
        // dwWindow.enableRunButton();
        // checkProjectConnected(pwd, dwOutput);
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

async function listUsers(pwd: string | null, dwOutput: OutputConsole) {
    const usersCmd = new DwCmds("user ls", pwd, false, dwOutput);
    const cmdOutput: [number, string] = await usersCmd.executeWithOutput();
    if (cmdOutput[0] !== 0) {
        dwOutput.displayError(`❌ Could not find logged in users\n${cmdOutput[1]}`);
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

async function listModulesAndVariants(pwd: string | null, dwOutput: OutputConsole) {
    const configsCmd = new DwCmds("build configs", pwd, false, dwOutput);
    const cmdOutput = await configsCmd.executeWithOutput();
    if (cmdOutput[0] !== 0) {
        dwOutput.displayError("❌ Could not find modules and in variants\n" + cmdOutput[1]);
        return;
    }
    const jsonText = cmdOutput[1].trim();
    const cleanedJsonString = jsonText.replace(/^\s+/, '');
    const jsonObject = parse(cleanedJsonString);
    const map: { [key: string]: string[] } = {};
    let defaultModule = "";
    let defaultVariant = "";
    let foundDefault = false;

    for (const [key, value] of Object.entries(jsonObject)) {
        const list = value instanceof Array ? value.map(String) : [];
        if (key === "default") {
            if (list.length >= 2) {
                defaultModule = list[0];
                defaultVariant = list[1];
                foundDefault = true;
            } else {
                console.log("Warning: 'default' project does not contain enough build types.");
            }
        }
        map[key] = list;
    }

    if (!foundDefault && Object.keys(map).length > 0) {
        const firstEntry = Object.entries(map)[0];
        defaultModule = firstEntry[0];
        defaultVariant = firstEntry[1][0] || "";
    }

    // dwOutput.addModulesAndVariants(map, defaultModule, defaultVariant);
}





