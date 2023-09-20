import * as vscode from 'vscode';

enum LOG {
    NON = 0,
    DEBUG = 1,
    WARNING = 2,
    ERROR = 3,
}

class Logger  {
    private m_outputchannel?: vscode.OutputChannel;
    private m_level = LOG.NON;
    private static m_instance : Logger;

    private constructor() {}

    public static instance(){
        if(this.m_instance == null){
            this.m_instance = new Logger;
            this.m_instance.setOutputChannel(vscode.window.createOutputChannel('Qt'));
            this.m_instance.setLevel(LOG.DEBUG);
        }
        return this.m_instance;
    }

    public setOutputChannel(outputchannel?: vscode.OutputChannel){
        this.m_outputchannel = outputchannel;
    }

    public setLevel(enType:LOG){
        this.m_level = enType;
    }

    public warning(text: string) {
        if (this.m_level >= LOG.WARNING)  this.print(text, "warning");
    }

    public error(text: string) {
        if (this.m_level >= LOG.ERROR) this.print(text, "error");
    }

    public debug(text: string) {
        if (this.m_level >= LOG.DEBUG) this.print(text, "debug");
        
    }

    private print(text: string, prefix: string = "") {
        if (this.m_outputchannel) {
            const date = new Date().toISOString();
            this.m_outputchannel.appendLine(`${date} [${prefix}] ${text}`);
        }
    }
}

export{
    Logger
}