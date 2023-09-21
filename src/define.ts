enum TOOLS{
    NON = 0,
    ASSISTANT = 1,
    DESIGNER = 2,
    QML = 3,
    QT_CREATOR = 4
}

enum PROPERTIES{
    QT_CREATOR = 'qt.QtCreatorPath',
    SDK = 'qt.sdkPath',
    QT_NATVIS = 'qt.qtnatvis',
    INSTALL_PATH = 'qt.installPath'
}

export {
    TOOLS,
    PROPERTIES 
}