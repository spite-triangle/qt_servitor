#ifndef PLACE#HOLDER_H
#define PLACE#HOLDER_H

#include <QWidget>

namespace Ui {
class PLACEHOLDER;
}

class PLACEHOLDER : public QWidget
{
    Q_OBJECT

public:
    explicit PLACEHOLDER(QWidget *parent = nullptr);
    ~PLACEHOLDER();

private:
    Ui::PLACEHOLDER *ui;
};

#endif // PLACE#HOLDER_H
