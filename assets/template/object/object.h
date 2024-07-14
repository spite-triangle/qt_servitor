#ifndef PLACE#HOLDER_H
#define PLACE#HOLDER_H

#include <OBJECTHOLDER>

class PLACEHOLDER : public OBJECTHOLDER
{
    Q_OBJECT
public:
    explicit PLACEHOLDER(PARENTHOLDER *parent = nullptr);

signals:

};

#endif // PLACE#HOLDER_H