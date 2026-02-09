"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.activate = activate;
exports.deactivate = deactivate;
const fs = require("fs");
const path = require("path");
const vscode = require("vscode");
const VIEW_TYPE = 'markdownLivePreview';
/** 读取本地的 marked.min.js 并转义后用于内联，失败返回 null */
function getMarkedInline(extensionUri) {
    try {
        const filePath = path.join(extensionUri.fsPath, 'media', 'marked.min.js');
        const code = fs.readFileSync(filePath, 'utf8');
        return code
            .replace(/<\/script>/gi, '<\\/script>')
            .replace(/\\/g, '\\\\')
            .replace(/`/g, '\\`')
            .replace(/\$\{/g, '\\${');
    }
    catch {
        return null;
    }
}
/** 把焦点放到左侧编辑组，这样从资源管理器打开的文件会开在左侧 */
function focusLeftGroup() {
    setTimeout(() => {
        void vscode.commands.executeCommand('workbench.action.focusFirstEditorGroup');
    }, 0);
}
function activate(context) {
    const extensionUri = context.extensionUri;
    context.subscriptions.push(vscode.commands.registerCommand('markdownLivePreview.open', () => {
        const editor = vscode.window.activeTextEditor;
        if (!editor || editor.document.languageId !== 'markdown') {
            vscode.window.showInformationMessage('请先打开一个 Markdown 文件后再使用实时预览。');
            return;
        }
        MarkdownLivePreviewPanel.createOrShow(extensionUri, editor.document);
    }));
    // 点击 .md → 打开/更新右侧预览；点击非 .md → 关闭右侧预览（若右侧只有预览则整列关闭）
    context.subscriptions.push(vscode.window.onDidChangeActiveTextEditor((editor) => {
        if (editor?.document.languageId === 'markdown') {
            MarkdownLivePreviewPanel.createOrShow(extensionUri, editor.document);
        }
        else if (editor !== undefined) {
            MarkdownLivePreviewPanel.close();
        }
    }));
    // 启动时若当前已是 Markdown 文件，也自动打开预览
    const activeEditor = vscode.window.activeTextEditor;
    if (activeEditor?.document.languageId === 'markdown') {
        MarkdownLivePreviewPanel.createOrShow(extensionUri, activeEditor.document);
    }
}
function getNonce() {
    let text = '';
    const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    for (let i = 0; i < 32; i++) {
        text += possible.charAt(Math.floor(Math.random() * possible.length));
    }
    return text;
}
class MarkdownLivePreviewPanel {
    constructor(panel, document, extensionUri) {
        this._disposables = [];
        this._panel = panel;
        this._document = document;
        this._extensionUri = extensionUri;
        this._panel.onDidDispose(() => this.dispose(), null, this._disposables);
        this._panel.webview.html = this._getHtmlForWebview(this._panel.webview, extensionUri);
        this._panel.webview.onDidReceiveMessage((msg) => {
            if (msg.type === 'ready')
                this._update();
        }, null, this._disposables);
        this._subscribeToDocument();
    }
    _subscribeToDocument() {
        this._changeSubscription?.dispose();
        this._changeSubscription = vscode.workspace.onDidChangeTextDocument((e) => {
            if (e.document.uri.toString() === this._document.uri.toString()) {
                this._update();
            }
        });
    }
    showDocument(document) {
        this._document = document;
        this._panel.title = `预览: ${document.fileName.split(/[/\\]/).pop() || '未命名'}`;
        this._subscribeToDocument();
        this._update();
    }
    static close() {
        if (!MarkdownLivePreviewPanel.singlePanel)
            return;
        MarkdownLivePreviewPanel.singlePanel._panel.dispose();
        // 不预览 Markdown 时直接关掉右侧整列（预览 + 任何误开到右侧的标签都会合到左侧）
        setTimeout(() => {
            const rightGroup = vscode.window.tabGroups.all.find((g) => g.viewColumn === vscode.ViewColumn.Two);
            if (rightGroup) {
                void vscode.window.tabGroups.close(rightGroup);
            }
        }, 0);
    }
    static createOrShow(extensionUri, document) {
        if (MarkdownLivePreviewPanel.singlePanel) {
            MarkdownLivePreviewPanel.singlePanel.showDocument(document);
            MarkdownLivePreviewPanel.singlePanel._panel.reveal(vscode.ViewColumn.Two);
            focusLeftGroup();
            return;
        }
        const panel = vscode.window.createWebviewPanel(VIEW_TYPE, `预览: ${document.fileName.split(/[/\\]/).pop() || '未命名'}`, vscode.ViewColumn.Two, {
            enableScripts: true,
            retainContextWhenHidden: true,
            localResourceRoots: []
        });
        MarkdownLivePreviewPanel.singlePanel = new MarkdownLivePreviewPanel(panel, document, extensionUri);
        focusLeftGroup();
    }
    _update() {
        this._panel.webview.postMessage({
            type: 'update',
            content: this._document.getText()
        });
    }
    _getHtmlForWebview(webview, extensionUri) {
        const nonce = getNonce();
        const markedInline = getMarkedInline(extensionUri);
        const markedScriptTag = markedInline !== null
            ? `<script nonce="${nonce}">${markedInline}</script>`
            : '';
        return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta http-equiv="Content-Security-Policy" content="default-src 'none'; script-src 'unsafe-inline'; style-src 'unsafe-inline'; font-src 'none';">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Markdown 预览</title>
  <style>
    body {
      box-sizing: border-box;
      min-height: 100vh;
      padding: 16px 24px;
      margin: 0;
      font-family: var(--vscode-font-family, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif);
      font-size: var(--vscode-font-size, 14px);
      line-height: 1.6;
      color: #333;
      background-color: #fff;
    }
    .markdown-body {
      background-color: #fff !important;
      color: #333 !important;
    }
    .markdown-body h1, .markdown-body h2, .markdown-body h3 { border-color: var(--vscode-editorWidget-border); }
    .markdown-body code { background: var(--vscode-textBlockQuote-background); }
    .markdown-body pre { background: var(--vscode-textBlockQuote-background); }
    .markdown-body a { color: var(--vscode-textLink-foreground); }
    .markdown-body table { border-collapse: collapse; width: 100%; margin: 1em 0; display: block; overflow: auto; }
    .markdown-body table th, .markdown-body table td { border: 1px solid #ddd; padding: 6px 13px; }
    .markdown-body table th { font-weight: 600; background: #f6f8fa; }
    .markdown-body table tr:nth-child(even) { background: #f9f9f9; }
    #content { min-height: 200px; }
  </style>
</head>
<body>
  <div id="content" class="markdown-body"></div>
  ${markedScriptTag}
  <script nonce="${nonce}">
    (function() {
      const content = document.getElementById('content');
      if (typeof marked !== 'undefined') {
        marked.setOptions({ gfm: true, breaks: true });
      }
      function render(md) {
        if (typeof marked !== 'undefined') {
          content.innerHTML = marked.parse(md || '');
        } else {
          content.textContent = md || '(缺少 media/marked.min.js，请执行 npm run copy-assets 后重新安装扩展)';
        }
      }
      window.addEventListener('message', function(event) {
        const msg = event.data;
        if (msg.type === 'update' && typeof msg.content === 'string') render(msg.content);
      });
      try { if (typeof acquireVsCodeApi === 'function') acquireVsCodeApi().postMessage({ type: 'ready' }); } catch (e) {}
    })();
  </script>
</body>
</html>`;
    }
    dispose() {
        MarkdownLivePreviewPanel.singlePanel = undefined;
        this._changeSubscription?.dispose();
        this._panel.dispose();
        this._disposables.forEach((d) => d.dispose());
    }
}
function deactivate() { }
//# sourceMappingURL=extension.js.map