import { OutputConsole } from "./components/outputConsole";
import { DwCmds } from "./utils/dwCmds";
import { Process } from "./utils/process";
import fs from 'fs';
import * as vscode from 'vscode';
import { Messages } from "./messages/messages"; // Import the Messages module
import { parse } from 'jsonc-parser';
import { exit } from "process";
import { enableBuild, setModules, setProjectConnected, setSelectedUser, setUsers, setVariants } from "./extension";

var PluginMode:string = "";
var PluginEnv:string = "";

export function setPluginMode(mode: string) {
    console.log("Setting plugin mode to: " + mode);
    PluginMode = mode;
}
export function setPluginEnv(env: string) {
    console.log("Setting plugin env to: " + env);
    PluginEnv = env;
}

export function getPluginMode():string {
    return PluginMode;
}

export function getPluginEnv():string {
    return PluginEnv;
}

export type StringArrayMap = {
    [key: string]: string[];
};

export async function checkDW(projectRoot: string, dwOutput: OutputConsole) {
    const dwCmd = new DwCmds("check-update", projectRoot, true, dwOutput);
    const exitCode = await dwCmd.executeWithExitCode();
    if (exitCode === 0) {
        dwOutput.displayOutput(Messages.DW_INSTALLED_ALREADY);
        verifyLogin(projectRoot, dwOutput);
    } else if (exitCode === 11) {
        // Handle specific case for exit code 11 if needed
    } else {
        dwOutput.displayError(Messages.DW_NOT_INSTALLED);
        if(PluginMode !== "workspace"){
            showInstallDW(projectRoot, dwOutput);
        }
        installDW(projectRoot, dwOutput);
    }
}

function showInstallDW(projectRoot: string, dwOutput:OutputConsole) {
    vscode.window.showInformationMessage("Dashwave Plugin Not Configured, installing and configuring deps and modules for plugin");
    // const notificationGroup = NotificationGroup.balloonGroup("YourPluginNotificationGroup");
    // const notification = notificationGroup.createNotification(
    //     "Dashwave Plugin Not Configured",
    //     "Installing and configuring deps and modules for plugin",
    //     NotificationType.INFORMATION,
    //     null
    // );
    // notification.notify(project);
}


export function installDW(projectRoot:string, dwOutput: OutputConsole) {
    dwOutput.displayOutput("🔨 Setting up plugin...\n\n");

    // Execute the script
    const process = new Process("curl -sSL https://cli.dashwave.io | bash", projectRoot, true, dwOutput);

    new Promise<void>(async (resolve) => {
        const exitCode = await process.wait();
        if (exitCode === 0) {
            dwOutput.displayInfo(Messages.DW_DEPS_INSTALL_SUCCESS);
            dwOutput.displayInfo(Messages.DW_DEPS_CONFIGURING);

            const configCmd = new DwCmds("config", projectRoot, true, dwOutput);
            const exitcode = await configCmd.executeWithExitCode();
            if (exitcode === 0) {
                if (PluginMode === "workspace") {
                    dwOutput.displayInfo("🔨 Setting up workspace plugin...\n");
                    let workspaceCmd = "setup-workspace";
                    if (PluginEnv !== "") {
                        workspaceCmd += ` -e ${PluginEnv}`;
                    }
                    const setupWorkspaceCmd = new DwCmds(workspaceCmd, projectRoot, true, dwOutput);
                    const exitCode = await setupWorkspaceCmd.executeWithExitCode();
                    if (exitCode === 0) {
                        verifyLogin(projectRoot, dwOutput);
                    } else {
                        dwOutput.displayError("❌ Could not setup plugin. Please contact us at hello@dashwave.io");
                    }
                    resolve();
                    return;
                }

                dwOutput.displayInfo(Messages.DW_DEPS_CONFIGURE_SUCCESS);
                verifyLogin(projectRoot, dwOutput);
            } else {
                dwOutput.displayError(Messages.DW_DEPS_CONFIGURE_FAILED);
            }
        } else {
            dwOutput.displayError(Messages.DW_DEPS_INSTALL_FAILED);
        }
        resolve();
    });
}

async function verifyLogin(pwd: string, dwOutput: OutputConsole) {
    listUsers(pwd, dwOutput);
    // dwOutput.addModulesAndVariants(new Map<string, string[]>(), "", "");
    const currentUserLoginCmd = new DwCmds("user", pwd, true, dwOutput);
    const exitCode = await currentUserLoginCmd.executeWithExitCode();
    if (exitCode === 0) {
        // dwWindow.enableRunButton();
        vscode.commands.executeCommand('setContext', 'dashwave:userLoggedIn', true);
        checkProjectConnected(pwd, dwOutput);
    } else {
        if (PluginMode === "workspace") {
            dwOutput.displayError("❌ User is not setup correctly. Please contact us at hello@dashwave.io");
            return;
        }
        loginUser(pwd, dwOutput);
    }
}

function checkProjectConnected(projectRoot:string, dwOutput: OutputConsole) {
    listUsers(projectRoot, dwOutput);
    const gitConfigFilepath = `${projectRoot}/.git`;
    if (!doesFileExist(gitConfigFilepath)) {
        if (PluginMode === "workspace") {
            dwOutput.displayError("❌ There is some issue in setting up your project (.git doesn't exist), please contact us at hello@dashwave.io");
            return;
        }
        vscode.window.showErrorMessage("Could not find .git folder");
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

    if (doesFileExist(`${projectRoot}/dashwave.yml`)) {
        // dwWindow.enableRunButton();
        listModulesAndVariants(projectRoot, dwOutput);
        dwOutput.displayOutput("✅ Project is successfully connected to dashwave. Run a cloud build using dashwave icon on toolbar\n\n");
        vscode.window.showInformationMessage("Project is successfully connected to dashwave. Run a cloud build using dashwave extension");
        setProjectConnected();
        enableBuild();
    } else {
        if (PluginMode === "workspace") {
            dwOutput.displayError("❌ There is some issue in setting up your project (dashwave.yml doesn't exist), please contact us at hello@dashwave.io");
            return;
        }
        dwOutput.displayOutput("⚠️ This project is not connected to dashwave, create a new project on dashwave\n\n");
        // openCreateProjectDialog(pwd, true, dwWindow, () => {});
    }
}

export async function loginUser(pwd: string, dwOutput: OutputConsole) {
    // const loginDialog = new LoginDialog();

    // loginDialog.show();
    vscode.window.showInformationMessage(
        "Find your access code [here](https://console.dashwave.io/home?profile=true)",
    );
    const accessCode = await vscode.window.showInputBox({
        title: "Dashwave Login",
        prompt: `Enter Dashwave Access Code. You can find your access code [here](https://console.dashwave.io/home?profile=true)`,
        placeHolder: 'Access Code',

    });
    if (accessCode === undefined || accessCode === "") {
        vscode.window.showErrorMessage("Access code is required to login");
        dwOutput.displayError("❌ Access code is required to login");
        return;
    }

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
        vscode.window.showInformationMessage("Successfully logged in to Dashwave");
        vscode.commands.executeCommand('setContext', 'dashwave:userLoggedIn', true);
        // dwWindow.enableRunButton();
        checkProjectConnected(pwd, dwOutput);
    } else {
        vscode.window.showErrorMessage("Could not login to Dashwave");
        // const hyperlink = new HyperlinkInfo((p: Project) => {
        //     loginUser(pwd);
        // });
        // dwWindow.console.printHyperlink(Messages.DW_LOGIN_FAILED, hyperlink);
    }
}

function doesFileExist(filePath: string): boolean {
    return fs.existsSync(filePath);
}

async function listUsers(pwd: string, dwOutput: OutputConsole) {
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
    console.log(users);
    setUsers(users);
    const activeUser = jsonObject.active_user?.toString() || "";
    console.log(activeUser);
    setSelectedUser(activeUser);

    // dwWindow.addUsers(users, activeUser, pwd);
}

async function listModulesAndVariants(pwd: string, dwOutput: OutputConsole) {
    const configsCmd = new DwCmds("build configs", pwd, false, dwOutput);
    const cmdOutput = await configsCmd.executeWithOutput();
    if (cmdOutput[0] !== 0) {
        dwOutput.displayError("❌ Could not find modules and in variants\n" + cmdOutput[1]);
        return;
    }
    const jsonText = cmdOutput[1].trim();
    const object = parse(jsonText);
    const modules: string[] = [];
    let variants: StringArrayMap = {};
    for (const module in object){
        modules.push(module);
        const variant = object[module];
        variants[module] = variant;
    }
    setVariants(variants);
    setModules(modules);
}

export async function createProject(pwd:string,projectName:string,devStack:string, rootDir:string, dwOutput:OutputConsole){
    const createProjectCmd = `create-project --no-prompt --name=${projectName} --dev-stack=${devStack} --root-dir=${rootDir}`;
    const cmd = new DwCmds(createProjectCmd, pwd, true, dwOutput);
    const exitCode = await cmd.executeWithExitCode();
    if (exitCode === 0) {
        dwOutput.displayInfo(Messages.DW_PROJECT_CREATE_SUCCESS);
        vscode.window.showInformationMessage("Project created successfully. You can run builds now.");
        checkProjectConnected(pwd, dwOutput);
    } else if (exitCode === 13){
        vscode.commands.executeCommand('setContext', 'dashwave:userLoggedIn', true);
        vscode.window.showErrorMessage("Please login again");
    }else{
        dwOutput.displayError(Messages.DW_PROJECT_CREATE_FAILED);
        vscode.window.showErrorMessage("Project creation failed. Please try again")
    }
}

export async function switchUser(pwd:string,dwOutput:OutputConsole,username:string){
    const switchUserCmd = `user switch ${username}`;
    const cmd = new DwCmds(switchUserCmd, "", true, new OutputConsole());
    const exitCode = await cmd.executeWithExitCode();
    if (exitCode === 0) {
        vscode.window.showInformationMessage("User switched successfully");
    } else {
        vscode.window.showErrorMessage("User switch failed");
    }
    listUsers(pwd, dwOutput);
}



