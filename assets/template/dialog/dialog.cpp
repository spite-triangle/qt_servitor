#include "PLACEFILENAME.h"
#include "ui_PLACEFILENAME.h"

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
