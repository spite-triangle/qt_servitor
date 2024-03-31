/* 工具 */
enum TOOLS{
    NON = 0,
    ASSISTANT,
    DESIGNER,
    QT_CREATOR,
    LINGUIST,
    WIN_DEPLOY,
    QML_PREVIEW,
    QML_EASING,
    QML_TOOL
}

/* settings.json 配置 */
enum PROPERTIES{
    QT_CREATOR = 'qt.qtCreatorPath',
    SDK = 'qt.sdkPath',
    QT_NATVIS = 'qt.qtnatvis',
    QT_INCLUDE =  'qt.includePath',
    INSTALL_PATH = 'qt.installPath',
    QT_ASSISTANT = "qt.assistantPath",
    QT_LINGUIST = 'qt.linguistPath'
}

/* 模板生成资源类型 */
enum TEMPLATE{
    MAIN_WINDOW = 0,
    WIDGET,
    RESOURCE,
    UI,
    QOBJECT,
    DIALOG,
    QUICK_APP,
    QUICK_VIEW,
    QUICK_WIDGET
}

/* 终端名 */
export const TERM_NAME = "Qt Servitor"

export {
    TOOLS,
    PROPERTIES,
    TEMPLATE
}