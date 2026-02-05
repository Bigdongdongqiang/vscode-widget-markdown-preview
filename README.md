# Markdown 实时预览

在 Cursor / VS Code 中左侧编辑 Markdown，右侧实时预览。

## 功能

- **左右分栏**：左侧为编辑器，右侧为预览
- **实时更新**：编辑内容时，右侧预览即时刷新
- **GFM**：支持 GitHub 风格 Markdown（表格、删除线等）

## 使用方法

**打开任意 `.md` 文件**，右侧会自动打开实时预览，无需执行命令。切换不同 Markdown 标签页时，预览会跟随当前文件更新。

如需手动打开预览，可使用命令面板（`Ctrl+Shift+P` / `Cmd+Shift+P`）→ 输入「Markdown: 打开实时预览（右侧）」。

## 本地安装与调试

```bash
# 安装依赖
npm install

# 编译
npm run compile
```

在 VS Code/Cursor 中按 `F5` 启动“扩展开发主机”，在新窗口中打开一个 `.md` 文件，右侧会自动出现预览。

## 打包为 vsix（可选）

```bash
npm install -g @vscode/vsce
vsce package
```

生成 `.vsix` 后可在 Cursor/VS Code 中通过“从 VSIX 安装扩展”安装。
