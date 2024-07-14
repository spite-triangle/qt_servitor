import QtQuick 2.6
import QtQuick.Controls 2.2

Rectangle {
    id: root
    visible: true
    width: 640
    height: 480
    Button {
        text: "Ok"
        onClicked: {
            root.color = Qt.rgba(Math.random(), Math.random(), Math.random(), 1);
        }
    }
}


