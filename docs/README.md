![alt|c,30](image/qt.ico)

# 简介

`Qt Servitor` 插件的开发目的是在 vscode 中辅助 Qt 项目的构建，插件功能包括
- 自动配置 `launch.json` 文件，便于 Qt 程序的运行与调试；
- 自动配置 `c_cpp_properties.json`，使得 [c/c++ extension](https://marketplace.visualstudio.com/items?itemName=ms-vscode.cpptools) 插件能正确识别 Qt 相关头文件
- Qt sdk 版本切换；
- Qt 模块自动生成；
- `assistant.exe`、`designer.exe`、`linguist.exe` 、`windeployqt.exe`、`qml.exe` 、`qtcreator.exe` 等工具的快捷启动。
- QML 实时预览
- QML 语言特性
  - 语法静态检测
  - 拾色器
  - 智能补全
  - 定义跳转
  - 变量重命名
  - 引用查找
  - 格式化


# 声明

> 该插件只支持 `windows` 与 `linux` 操作，且未对 `linux` 进行过测试 （目前没有测试环境，有时间再测了）。

参考项目：
- [C/C++ Extension](https://marketplace.visualstudio.com/items?itemName=ms-vscode.cpptools)
- [Qt visual Studio Tools](https://github.com/qt-labs/vstools)
- [Qt Tools](https://marketplace.visualstudio.com/items?itemName=tonka3000.qtvsctools)
- [Qt Creator](https://github.com/qt-creator/qt-creator)
- [qmlhelper](https://marketplace.visualstudio.com/items?itemName=flywine.qmlhelper)


# 支持功能

- [配置](./chapter/configure.md)
- [工具集](./chapter/tools.md)
- [QML 支持](./chapter/qmltool.md)

> QML 语言特性与实时预览目前只支持 windows 平台

