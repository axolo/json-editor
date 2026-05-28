# 智能体行为指南

本项目是一个 JSON 编辑器 Web Component。

## 智能体行为规范

- 对话交流语言：简体中文
- 文件命名风格：kebab-case
- 编码简洁克制：10行代码能实现就别写20行

## 命令行工具

```bash
npm run dev    # 开发测试
npm run build  # 构建编译
```

## 项目目录结构

```
├── dist/                     # 发布目录
|   ├── json-editor.es.js     # ES 模块版本
│   └── json-editor.umd.js    # UMD 版本，支持 CommonJS、AMD、浏览器环境
├── src/                      # 源码目录
│   ├── json-editor.html      # 主库模板
│   ├── json-editor.scss      # 主库样式
│   └── json-editor.js        # 主库文件
├── test/                     # 测试目录
│   ├── index.html            # HTML 测试页面
│   └── vue.html              # Vue 测试页面
└── README.md                 # 项目说明文档
```
