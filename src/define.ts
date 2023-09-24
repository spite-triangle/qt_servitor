enum TOOLS{
    NON = 0,
    ASSISTANT = 1,
    DESIGNER = 2,
    QML = 3,
    QT_CREATOR = 4,
    LINGUIST = 5,
}

enum PROPERTIES{
    QT_CREATOR = 'qt.qtCreatorPath',
    SDK = 'qt.sdkPath',
    QT_NATVIS = 'qt.qtnatvis',
    QT_INCLUDE =  'qt.includePath',
    INSTALL_PATH = 'qt.installPath',
    QT_ASSISTANT = "qt.assistantPath",
    QT_LINGUIST = 'qt.linguistPath'
}


enum TEMPLATE{
    MAIN_WINDOW = 0,
    WIDGET = 1,
    QML = 2,
    QML2 = 3,
    RESOURCE = 4,
    UI = 5,
    QOBJECT = 6,
    DIALOG = 7
}

export {
    TOOLS,
    PROPERTIES,
    TEMPLATE
}