enum TOOLS{
    NON = 0,
    ASSISTANT = 1,
    DESIGNER = 2,
    QML = 3,
    QT_CREATOR = 4
}

enum CONFIG{
    QtCreator = 'qt.QtCreatorPath',
    sdk = 'qt.sdkPath',
    qtnatvis = 'qt.qtnatvis'
}

export {
    TOOLS,
    CONFIG
}