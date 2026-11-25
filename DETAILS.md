# 文件职责 / Module responsibilities

| 目录 | 职责 / Responsibility |
| --- | --- |
| `mac/patchers/desktop` | 原输入校验、字节补丁、ASAR 打包、应用签名 / Input validation, patching, packaging and app signing |
| `mac/clients/desktop` | 连接、原 UI 适配、通知、语音、本机操作 / Connection, original UI adapters, notifications, voice and local execution |
| `ios/release` | 用户 IPA 校验与未签名输出 / User IPA validation and unsigned export |
| `ios/clients/ios` | 注入源码、原生界面与功能适配 / Injection source and native adapters |
| `ios/bin` | 本项目预编译 dylib / Precompiled project dylib |
| `host/server` | 管理网页、认证、设备、模型与供应商服务 / Administration, authentication, devices, models and providers |
| `host/runtime` | 原 Host/Harness 的本地适配 / Local Host/Harness adapters |
| `host/deploy` | Host 监督进程、独立执行节点 / Host supervisor and execution node |
| `host/release` | 原资源获取、Docker 构建、Compose 与备份恢复 / Original input acquisition, Docker, Compose and volume backups |
| `*/recipes` | 从用户原文件复制字节并添加本项目修改 / Copy original bytes from user input and add project modifications |
| `*/network`、`*/clients/shared` | Tailcat 构建与进程管理 / Tailcat build and process management |
| `*/THIRD_PARTY` | 第三方许可证 / Third-party notices |

- `mac/clients/desktop/attachment-uploads.mjs`：原版附件暂存、分块提交和进度。
- `ios/clients/ios/GBVoiceSocket.m`：已配对 Host 的系统 WebSocket 语音传输。
- `host/runtime/host-attachments.mjs`：Host 附件复制到独立执行节点。

- `mac/clients/desktop/external-links.mjs`、`external-url.mjs`：外部链接与原生菜单 / External links and native menus.
- `mac/clients/desktop/link-preview*.mjs`：按需预览、固定 DNS、站点图标与有界缓存 / On-demand previews, pinned DNS, site icons and bounded cache.
- `ios/clients/ios/GBNetwork.m`：串行隧道状态、延迟启动和同端口恢复 / Serialized tunnel lifecycle, lazy startup and same-port recovery.

- `RELEASE.md` / `RELEASE.en.md`：本次发布说明 / Release notes.
- `docs/INSTALL*.md`：安装与连接 / Installation and connection.
- `docs/ARCHITECTURE*.md`：功能对照与实现原理 / Feature map and architecture.
- `ios/docs/SIGNING*.md`：iOS 扩展签名 / Extension signing.
- `host/docs/DEPLOYMENT*.md`：分开部署与备份 / Separate deployment and backups.

- `mac/patchers/desktop/download-original.mjs`：固定原版下载、缓存与校验 / Pinned original download, caching and verification.

- `docs/AI-INSTALL*.md`：供 AI 执行的部署、配置与验收指南 / AI deployment, configuration and verification guide.

- `mac/clients/desktop/local-services.mjs`：置顶与分组的原 Host 设置适配、账户缓存恢复。 / Native Host settings for pins and groups, with account cache restoration.

- `host/runtime/openai-chat.mjs`、`openai-responses.mjs`、`anthropic-messages.mjs`、`model-common.mjs`：三种模型接口格式的适配 / Adapters for the three model API formats.
- `host/runtime/model-classification.mjs`：Jev 判断任务难度的标准和任务内容提取 / Jev's difficulty criteria and task extraction.
- `host/runtime/reliability/tool-order.mjs`：一次模型回复中的消息按顺序送达 / Delivers the messages of one model response in order.
- `host/deploy.py`、`host/release/platforms.py`：部署、升级、备份恢复与架构检查 / Deployment, upgrades, backup and recovery, and architecture checks.
- `host/release/compose*.yaml`：同机、只部署 Host、独立执行电脑三种 Compose 配置；`compose.memory.yaml` 是可选的只读记忆挂载，`deploy.py` 在 Docker 版本满足时才加入 / Compose files for the same-machine, Host-only and execution-computer setups; `compose.memory.yaml` is the optional read-only memory overlay that `deploy.py` adds only when Docker is new enough.
- `host/tools/host-admin.mjs`：命令行管理 / Command-line administration.
- `mac/clients/desktop/platform.mjs`：桌面客户端的平台差异 / Platform differences of the desktop client.
- `host/tests/`、`mac/tests/`、`ios/tests/`：测试，用 `node --test "host/tests/*.test.mjs"`、`node --test "mac/tests/*.test.mjs"` 运行 / Tests; run with `node --test "host/tests/*.test.mjs"` and `node --test "mac/tests/*.test.mjs"`.
