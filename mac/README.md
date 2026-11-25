# ProkBot Mac Patch

为 Grok Bot 0.71.2 macOS 客户端连接自己的 Host，支持 Apple Silicon 和 Intel（Intel 为实验支持，已有用户在 Intel Mac 上实测生成、配对和对话可用）。需要 Node.js 22.12+。

[English](README.en.md)

## 使用

```sh
node patchers/desktop/patch.mjs
```

工具按本机芯片自动下载并校验 0.71.2 原版（Apple Silicon 用 ARM64 版，Intel 用 x64 版），生成 `output.noindex/Grok Bot.app`。移入「应用程序」，填写 Host 地址和六位配对码。连接页的 Tailcat 开关只在粘贴 Host 管理页「远程访问」里的连接链接时打开，填局域网或 HTTPS 地址时保持关闭。给另一种芯片的 Mac 生成时，加 `--arch arm64` 或 `--arch x64`。Intel 版的补丁由 Apple Silicon 版对齐移植，加进去的代码完全相同（`patchers/desktop/x64/`），Tailcat 另外编译了 x86_64 版（`dist/network/x64/`）。

已有原版 `.app` 或 `.dmg` 时，可增加 `--source "/path/to/Grok Bot.app"`。DMG 按文件大小识别是哪种芯片的版本；`.app` 不是本机芯片的版本时，再加 `--arch`。

## 签名与本机控制

默认命令生成的 App 使用临时签名，没有 Team ID。对话、配对和远程访问都能正常使用，但 Bot 不能操作这台 Mac 的图形界面，因为原版的本机控制辅助程序只接受带 Team ID 的签名。

已有证书时，推荐这样生成：

```sh
node patchers/desktop/patch.mjs --identity auto
```

在终端运行 `security find-identity -v -p codesigning`，列出 Apple Development 或 Developer ID Application 证书就可以用。`--identity auto` 优先使用 Developer ID Application，其次是 Apple Development；找不到可用的证书时会报错退出，不会生成 App。想指定某一个证书时，把 `auto` 换成证书名称或 SHA-1。

还没有证书时，建议先创建一个，免费的 Apple 账号就可以：

1. 安装 Xcode，打开菜单 Xcode → Settings → Accounts，点左下角的「+」登录 Apple 账号。
2. 选中账号下的团队，点「Manage Certificates…」，再点「+」选择「Apple Development」。
3. 用上面的命令确认证书已经出现，再加 `--identity auto` 重新生成。

不想创建证书也可以直接用默认命令，代价是用不了本机控制，其他功能不受影响。第一次使用本机控制时，按系统提示授予辅助功能和屏幕录制权限。

## 许可与支持

仅限非商业使用，见 [LICENSE](LICENSE)。本项目多数代码由 AI 辅助生成。
