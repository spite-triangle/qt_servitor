#include <QQuickView>
#include <QGuiApplication>

int main(int argc, char *argv[])
{
#if QT_VERSION >= 0x50601
    QCoreApplication::setAttribute(Qt::AA_EnableHighDpiScaling);
#endif

    QGuiApplication app(argc, argv);
    QQuickView view;

    // REVIEW - 查找 qml 的根目录
    // auto engine = view.engine();
    // engine->setBaseUrl(QUrl::fromLocalFile("E:/testspace/qml/src/"));

    // 主 qml 配置
    QUrl url = QUrl("qrc:/PLACEHOLDER.qml"); // qrc 配置
    // url = QUrl::fromLocalFile("E:/testspace/qml/src/PLACEHOLDER.qml"); // 本地绝对路径配置
    widget.setSource(url);

    QObject::connect(&view, &QQuickView::statusChanged, [&](QQuickView::Status enStatus){
        // TODO - PLACEHOLDER.qml 加载完成

    });

    view.show();

    return app.exec();
}
