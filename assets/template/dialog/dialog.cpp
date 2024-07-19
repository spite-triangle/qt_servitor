#include "PLACEHOLDER.h"
#include "PLACEUIHOLDER.h"

PLACEHOLDER::PLACEHOLDER(QWidget *parent) :
    QDialog(parent),
    ui(new Ui::PLACEHOLDER)
{
    ui->setupUi(this);
}

PLACEHOLDER::~PLACEHOLDER()
{
    delete ui;
}
