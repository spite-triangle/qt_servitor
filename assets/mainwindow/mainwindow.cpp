#include "PLACEHOLDER.h"
#include "ui_PLACEHOLDER.h"

PLACEHOLDER::PLACEHOLDER(QWidget *parent) :
    QPLACEHOLDER(parent),
    ui(new Ui::PLACEHOLDER)
{
    ui->setupUi(this);
}

PLACEHOLDER::~PLACEHOLDER()
{
    delete ui;
}
