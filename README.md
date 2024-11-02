# 简介

`Qt Servitor` 插件的开发目的是在 vscode 中辅助 Qt 项目的构建，插件功能包括
- 自动配置 `launch.json` 文件，便于 Qt 程序的运行与调试；
- 自动配置 `c_cpp_properties.json`，使得 [c/c++ extension](https://marketplace.visualstudio.com/items?itemName=ms-vscode.cpptools) 插件能正确识别 Qt 相关头文件
- Qt sdk 版本切换；
- Qt 模块自动生成；
- `assistant.exe`、`designer.exe`、`linguist.exe` 、`windeployqt.exe`、`qml.exe` 、`qtcreator.exe` 等工具的快捷启动。
- QML 实时预览

    ![preview](docs/git/previewlive.gif)

- QML 语言特性
  - 语法静态检测
  - 拾色器
  - 智能补全
  - 定义跳转
  - 变量重命名
  - 引用查找
  - 格式化

  ![color](docs/git/color.gif)

# 声明

> 该插件只支持 `windows` 与 `linux` 操作，且未对 `linux` 进行过测试 （目前没有测试环境，有时间再测了）。

参考项目：
- [C/C++ Extension](https://marketplace.visualstudio.com/items?itemName=ms-vscode.cpptools)
- [Qt visual Studio Tools](https://github.com/qt-labs/vstools)
- [Qt Tools](https://marketplace.visualstudio.com/items?itemName=tonka3000.qtvsctools)
- [Qt Creator](https://github.com/qt-creator/qt-creator)
- [qmlhelper](https://marketplace.visualstudio.com/items?itemName=flywine.qmlhelper)


# 使用

- [工具使用文档](https://spite-triangle.github.io/qt_servitor/)

# 配置

```
triangle@LEARN:~$ pwd
D:/ProgramData/Qt/  // Qt 的安装目录
triangle@LEARN:~$ tree
.
│── 5.15.2  // sdk 目录
│    ├── msvc2015_64
│    ├── msvc2017_64
│    ├── msvc2019_64
│    └── wasm_32
├── Docs
    ...
├── Tools  // qtcreator.exe 所在目录
    ...
└── vcredist
```

| 选项                          | 必选   | 描述                                                                                                                                                                                              |
| ----------------------------- | ------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `qt.installPath`              | **是** | 指定 Qt 的安装位置，例如 `D:/ProgramData/Qt/`                                                                                                                                                     |
| `qt.qtCreatorPath`            | 否     | 指定 `qtcreator.exe` 的所在路径，例如 `D:/ProgramData/Qt/Tools/QtCreator/`                                                                                                                        |
| `qt.sdkPath`                  | 否     | 指定项目所使用的 SDK 版本，例如 `D:/ProgramData/Qt/5.15.2/msvc2017_64`                                                                                                                            |
| `qt.qtnatvis`                 | 否     | 指定 `qt.natvis.xml` 的路径。该文件来自 [Qt visual Studio Tools](https://github.com/qt-labs/vstools)，可以在原工程项目中[下载](https://github.com/qt-labs/vstools/blob/dev/QtMSBuild/QtMsBuild)。 |
| `qt.includePath`              | 否     | 指定 Qt 的头文件，例如 `D:/ProgramData/Qt/5.15.2/msvc2017_64/include`                                                                                                                             |
| `qt.previewInterval`          | 否     | 配置 `qmlpreview` 工具最小刷新时间                                                                                                                                                                |
| `qt.previewToolPath`          | 否     | 配置 `qmlpreview` 工具路径，可自行编译[工具](https://github.com/spite-triangle/qmltools)                                                                                                                                                                       |
| `qt.qmllspToolPath`           | 否     | 配置 `qmllsp` 语言服务路径（非官方版），可自行编译[工具](https://github.com/spite-triangle/qmltools)                                                                                                                                                                        |
| `qt.qmlTypeDescriptionFolder` | 否     | `qml-type-descriptions` 资源文件夹路径，[Qt Creator](https://github.com/qt-creator/qt-creator/tree/master/share/qtcreator/qml-type-descriptions)                                                  |
| `qt.fileNameUpperCase`        | 否     | 通过 `create qt module` 创建的文件的文件名是否大写                                                                                                                                                |

