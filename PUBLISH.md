# 发布到 VS Code / Cursor 应用市场

按下面步骤操作即可把本扩展发布到 [VS Code 市场](https://marketplace.visualstudio.com/)。

## 1. 发布前修改 package.json

在 `package.json` 里把 **publisher** 改成你的发布者 ID（只能用一次，之后发布都用这个）：

- 打开 https://marketplace.visualstudio.com/
- 用 Microsoft 账号登录
- 点击右侧「Publish extensions」→「Create Publisher」
- 填一个唯一的 **Publisher ID**（例如：`leaf-markdown` 或你的英文昵称），创建

把 `package.json` 里的 `"publisher": "local"` 改成你的 Publisher ID，例如：

```json
"publisher": "leaf-markdown",
```

可选：如有 GitHub 仓库，可加上（方便用户点进源码）：

```json
"repository": {
  "type": "git",
  "url": "https://github.com/你的用户名/markdown-live-preview"
},
```

## 2. 安装 vsce 并打包

建议使用 **Node.js 20+**（vsce 在 Node 18 下可能报错）。如用 nvm，可先切到 20：

```bash
nvm use 20
# 或 nvm install 20 && nvm use 20
```

在项目根目录执行：

```bash
cd "/Users/leaf/Documents/vscode工具/markdown-preview"

# 安装打包工具（全局）
npm install -g @vscode/vsce

# 编译并打包成 .vsix
npm run compile
vsce package --no-dependencies
```

成功后当前目录会生成 `markdown-live-preview-0.1.0.vsix`。

## 3. 登录并发布

首次发布需要登录发布者账号（会要 **Personal Access Token**）：

1. 打开 https://dev.azure.com → 用 Microsoft 账号登录  
2. 右上角用户头像 → **Personal access tokens**  
3. **+ New Token**：  
   - Name 随意（如 `vsce-publish`）  
   - Organization 选 **All accessible organizations**  
   - Scopes 选 **Custom defined** → 勾选 **Marketplace** → **Manage**  
4. 创建后**复制 token**（只显示一次）

在终端执行（把 `你的PublisherID` 换成 package.json 里的 publisher）：

```bash
vsce login 你的PublisherID
```

按提示粘贴刚才的 token。

然后发布：

```bash
vsce publish
```

或只打包不发布（方便本地安装 .vsix）：

```bash
vsce publish --no-dependencies
```

发布完成后，过几分钟在 https://marketplace.visualstudio.com/ 搜索「Markdown 实时预览」即可看到你的扩展。之后在 Cursor / VS Code 里也可以从扩展市场直接安装。

## 4. 以后更新版本

1. 在 `package.json` 里改 `version`（如 `0.1.1`）  
2. 执行：`vsce publish`（或先 `vsce package` 再在 VS Code 里「从 VSIX 安装」做本地测试）

---

**常见问题**

- **vsce 报错 `File is not defined`**：换成 Node 20+ 再试（`nvm use 20`）。  
- **发布失败 401**：重新执行 `vsce login 你的PublisherID` 再发布。  
- **想先本地测 .vsix**：VS Code / Cursor 里「扩展」→ 右上角「…」→「从 VSIX 安装」→ 选生成的 `.vsix` 文件。
