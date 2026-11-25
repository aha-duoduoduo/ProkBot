# ProkBot Mac Patch

为 Grok Bot 0.71.2 macOS 客户端连接自己的 Host，支持 Apple Silicon 和 Intel（Intel 为实验支持，已有用户在 Intel Mac 上实测生成、配对和对话可用）。需要 Node.js 22.12+。

[English](README.en.md)

## 使用

```sh
node patchers/desktop/patch.mjs
```

工具按本机芯片自动下载并校验 0.71.2 原版（Apple Silicon 用 ARM64 版，Intel 用 x64 版），生成 `output.noindex/Grok Bot.app`。移入「应用程序」，填写 Host 地址和六位配对码。连接页的 Tailcat 开关只在粘贴 Host 管理页「远程访问」里的连接链接时打开，填局域网或 HTTPS 地址时保持关闭。给另一种芯片的 Mac 生成时，加 `--arch arm64` 或 `--arch x64`。Intel 版的补丁由 Apple Silicon 版对齐移植，加进去的代码完全相同（`patchers/desktop/x64/`），Tailcat 另外编译了 x86_64 版（`dist/network/x64/`）。

已有原版 `.app` 或 `.dmg` 时，可增加 `--source "/path/to/Grok Bot.app"`。DMG 按文件大小识别是哪种芯片的版本；`.app` 不是本机芯片的版本时，再加 `--arch`。

需要控制本机图形界面时，在命令中增加 `--identity auto`，使用已有签名证书。

## 许可与支持

仅限非商业使用，见 [LICENSE](LICENSE)。本项目多数代码由 AI 辅助生成。
