import * as vscode from 'vscode';

enum LOG_LEVEL {
    NON = 0,
    INFO = 1,
    WARNING = 2,
    ERROR = 3,
}

class Logger  {
    private m_outputchannel?: vscode.OutputChannel;
    private m_level = LOG_LEVEL.NON;
    private static m_instance : Logger;

    private constructor() {}

    public static instance(){
        if(this.m_instance == null){
            this.m_instance = new Logger;

        }
        return this.m_instance;
    }

    public static ERROR(text: string, show:Boolean = false){
        Logger.instance().error(text);

        if( show == true) vscode.window.showErrorMessage(text);
    } 

    public static INFO(text: string, show :  Boolean = false){
        Logger.instance().info(text);
        
        if( show == true) vscode.window.showInformationMessage(text);
    } 

    public static WARN(text: string, show: Boolean = false){
        Logger.instance().warning(text);

        if( show == true) vscode.window.showWarningMessage(text);
    } 

    public init(level:LOG_LEVEL, channel: vscode.OutputChannel){
        this.m_level = level;
        this.m_outputchannel = channel;
    }

    public setOutputChannel(outputchannel?: vscode.OutputChannel){
        this.m_outputchannel = outputchannel;
    }

    public setLevel(enType:LOG_LEVEL){
        this.m_level = enType;
    }

    public warning(text: string) {
        if (this.m_level >= LOG_LEVEL.WARNING)  this.print(text, "warning");
    }

    public error(text: string) {
        if (this.m_level >= LOG_LEVEL.ERROR) this.print(text, "error");
    }

    public info(text: string) {
        if (this.m_level >= LOG_LEVEL.INFO) this.print(text, "debug");
        
    }

    private print(text: string, prefix: string = "") {
        if (this.m_outputchannel) {
            const date = new Date().toISOString();
            this.m_outputchannel.appendLine(`${date} [${prefix}] ${text}`);
        }
    }
}

export{
    Logger,
    LOG_LEVEL
}