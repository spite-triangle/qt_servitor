#include <QQuickWidget>
#include <QApplication>

int main(int argc, char *argv[])
{
#if QT_VERSION >= 0x50601
    QCoreApplication::setAttribute(Qt::AA_EnableHighDpiScaling);
#endif

    QApplication app(argc, argv);
    QQuickWidget widget;

    // REVIEW - 查找 qml 的根目录
    // auto engine = widget.engine();
    // engine->setBaseUrl(QUrl::fromLocalFile("E:/testspace/qml/src/"));

    // 主 qml 配置
    QUrl url = QUrl("qrc:/PLACEHOLDER.qml"); // qrc 配置
    // url = QUrl::fromLocalFile("E:/testspace/qml/src/PLACEHOLDER.qml"); // 本地绝对路径配置
    widget.setSource(url);

    QObject::connect(&widget, &QQuickWidget::statusChanged, [&](QQuickWidget::Status enStatus){
        // TODO - main.qml 加载完成

    });

    widget.show();

    return app.exec();
}
