# Change Log

All notable changes to the "triangle" extension will be documented in this file.

## [0.3.1] 2024-07-19 22:45:28
## 修复
- 修复创建 `QObject` 模块问题
- 修复创建 `ui_xxx.h` 引用问题
- 修复 `create qt module` 无法使用问题

## 增加
- 增加 `qt.fileNameUpperCase` 文件名首字母大小写控制
- 增加 `Custom Object` 自定义类创建

## [0.3.1] 2024-07-14 17:48:53
## 修复
- 修复 qmlpreview 的 `--search` 参数配置
- 增加 `No QML engines found.` 异常处理提示

## 修改
- 关闭日志文件输出

## [0.3.0] 2024-07-14 16:43:23

## 增加
- QML 实时预览功能
- QML 语言特性支持

## [0.1.2] 2024-05-12 14:49:46

### 修改
- 增加 `qt6.natvis.xml` 支持
- 放开 `qmlpreview.exe` 限制

## [0.1.0] 2024-03-31 11:32:17

### 修改
- `qt.xxxx` 配置支持 `workspace/.vscode/settings.json` 局部配置。且局部配置优先全局配置
- 添加 `.qrc` 文件打开支持
- 添加 `windeployqt.exe` 支持
- 实现 SDK 终端创建
- 添加单个 `.qml` 预览功能
- 添加 `qmlpreview.exe` 预览功能 

### 修复
- 修改 `.qrc` 模板文件

## [0.0.5] 2023-10-29 14:04:21

### 修改 
- `Qt Object` 支持 QObject, QWidget, QDialog, QMainWindow 类型的创建

## [0.0.3] - 2023-09-25 20:50

### 修复
- 修复根据安装目录查找 sdk 路径问题
- 修复启动工具路径错误问题

### 修改
- 修改配置文件更新逻辑


## [0.0.2] - 2023-09-24 20:45:41

### 修复

- 修正模块 `Mainwindow` 与 `Dialog` 的生成
- 修复生成模块，直接覆盖存在文件


## [0.0.1] - 2023-09-24 20:45:17

### 新增

- 工具发布
