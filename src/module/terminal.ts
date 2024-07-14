import * as vscode from 'vscode';
import * as path from 'path'

import { ConfigAssist } from '../common/config';
import { PROPERTIES } from '../common/define';

class Terminal{
    private m_name: string ; // 终端名

    constructor(name :string ){
        this.m_name = name;
    }

    /* 启动一个终端 */
    public static  async launchTerminal(){
        let strSdk = await ConfigAssist.instance().getPropertiesPath(PROPERTIES.SDK);
        let name =  path.basename(strSdk);

        let msg =`Launch the Qt SDK terminal successfully.\r\n - SDK: ${strSdk}\r\nyou can use all tools of sdk directly, e.g.: qmake、qml、qmlpreview etc.\r\n`;
        let term = await Terminal.createTerminal(name, msg);
        term.show();
    }

    /* 执行一条命令命令 */
    public async execLine(line:string, newTerm: boolean = false){
        let term = await this.getTerminal(newTerm);

        term.sendText(line);
        term.show(false);
    }

    public execCommand(command:string, args:string[], newTerm: boolean = false){
        let line = command;
        for(let arg of args){
            line = line + " " + arg;
        }

        this.execLine(line, newTerm);
    }

    /* 获取 terminal */
    private async getTerminal(newTerm: boolean){
        let term = Terminal.searchTerminals(this.m_name);

        // 没有创建
        if(term == null){
            term = await Terminal.createTerminal(this.m_name);
        }else if(newTerm == true){
            // ctrl + c 信号
            term.sendText('\x03\r\x03\r');
            term.dispose();
            term = await Terminal.createTerminal(this.m_name);
        }
        return term;
    }

    /* 创建一个 terminal */
    private static async createTerminal(name:string, msg:string = ""){
        // 获取 sdk/bin 目录
        let strSdk = await ConfigAssist.instance().getPropertiesPath(PROPERTIES.SDK);
        strSdk = path.join(strSdk,"bin");

        // 将 sdk/bin 添加到环境变量
        let env =  process.env;
        let split = process.platform == "linux" ? ":" : ";";
        env["path"] = strSdk + split + env["path"];

        // 终端配置
        let options: vscode.TerminalOptions = {
            name: name,
            env: env,
            message: msg,
            location: vscode.TerminalLocation.Panel
        };
        return vscode.window.createTerminal(options);
    }

    /* 搜索 vscode.terminals */
    private static searchTerminals(name:string){
        for(let term of vscode.window.terminals){
            if(term.name == name) return term;
        }
        return null;
    }
}

export{
    Terminal
}
