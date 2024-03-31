#include <QGuiApplication>
#include <QQmlApplicationEngine>

int main(int argc, char *argv[])
{
#if QT_VERSION >= 0x50601
    QCoreApplication::setAttribute(Qt::AA_EnableHighDpiScaling);
#endif

    QGuiApplication app(argc, argv);

    QQmlApplicationEngine engine;
    
    QUrl url = QUrl("qrc:/PLACEHOLDER.qml"); // qrc 配置
    // url = QUrl::fromLocalFile("E:/testspace/qml/src/PLACEHOLDER.qml"); // 本地绝对路径配置
    engine.load(url);

    QObject::connect(&engine, &QQmlApplicationEngine::objectCreated, [&](QObject *object, const QUrl &url){
        // TODO - PLACEHOLDER.qml 加载完成
        
    });

    return app.exec();
}
