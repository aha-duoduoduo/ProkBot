# v2026.11.26

Host 和 Mac 都建议更新，iOS 不需要。升级 Host 前，先用 `release/backup.py` 备份数据；Mac 要用新版补丁工具重新生成 App，再替换已安装的 App。

- Host：设备离线很久、积压的通知太多时，订阅连接会被 Host 断开并反复重连，前台收不到通知。这个问题已经修复。
- Host：内置的 Tailcat 换成和 iOS v2026.11.02 相同的修复版本，休眠或切换网络后不再误报已连接。
- Host：启动时也会核对运行文件引用的模块，文件被改动过时拒绝启动。
- Mac：主程序和 Helper 改用独立的 UUID，避免和官方客户端共用本地网络权限；替换后第一次连接局域网 Host 时，系统可能会重新询问本地网络授权。
- Mac：安装说明补充了签名的做法。有证书时加 `--identity auto` 生成，Bot 才能操作这台 Mac；没有证书可以先用 Xcode 免费创建一个，也可以直接用默认命令，只是用不了本机控制。

# v2026.11.25

合并 [ProkBot Plus](https://github.com/ferretgeek/prokbot-plus) 的服务端和 Mac 改进。Host 和 Mac 都需要更新，iOS 不需要。升级 Host 前，先用 `release/backup.py` 备份数据。

- Host：新增 OpenAI Responses 和 Anthropic Messages 两种模型接口。
- Host：可以添加多个模型服务，给所有 Bot 或单个 Bot 指定模型、思考强度和最多 8 个备用模型；Jev 分类器可以按任务难度在三档模型之间选择，难度判断也更准确。
- Host：修复联网搜索、生图、多条消息的顺序和自动审查的多处问题。
- Host：新增 `deploy.py` 部署工具和 `tools/host-admin.mjs` 命令行管理，支持 ARM64 服务器。
- Host：网页版改用单独的端口（默认 18081），界面包用 ProkBot Plus 的工具生成。
- Host：用 `deploy.py` 部署且 Docker Engine 26 以上时，Bot 可以在自己的电脑上只读查看记忆。
- Mac：支持 Intel 芯片的 Mac。
- Mac：修复配对、断线重连、附件上传和设置保存的问题，以及 Codex 项目目录检查没有生效的问题。

# v2026.11.05

- Mac：修复 Bot 置顶、分组及折叠状态保存。
- Host 无需更新。

# v2026.11.02

- iOS：修复锁屏后 Tailcat 持续重连，回到前台可自动恢复连接。

# v2026.11.01

首个公开补丁版本：使用自己的 Host 和模型，保留 Grok Bot 的 Mac、iOS 界面。

- `ProkBot-Desktop-Patch.zip`：Mac 补丁，自动下载 0.71.2 Apple Silicon 原版并生成客户端。
- `ProkBot-iOS-Patch.zip`：iOS 补丁，支持已解密的 1.16.0（23152）IPA，生成后自行签名。
- `ProkBot-Host-Patch.zip`：Host 补丁与 Docker 部署工具。
- iOS 安装包（清理后的原版 IPA 和已注入补丁的未签名 IPA，均保留三个扩展）只在 [Gitee 发行页](https://gitee.com/ahaduoduoduo/ProkBot/releases/tag/v2026.11.01)提供。

[安装说明](docs/INSTALL.md) · 仅限非商业使用。
