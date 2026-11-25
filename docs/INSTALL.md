# 安装

[交给 AI 安装](AI-INSTALL.md)。

## 1. 部署 Host

需要 Python 3.10+、Docker Compose，运行 Linux amd64 镜像。Apple Silicon Mac 使用转译运行。

进入仓库或解压后的 `host/` 目录：

```sh
python3 release/build-docker.py
docker compose -f release/compose.yaml up -d
docker compose -f release/compose.yaml exec host cat /data/setup-key
```

打开 `http://127.0.0.1:18080`，使用初始化码设置管理员账号。在「对话模型」填写模型接口地址与 Key，再到「设备与通知」生成六位配对码。

这样部署的 Bot 在自己的 Linux 桌面上读不到记忆文件，其他功能不受影响。想要这个功能，改用 `python3 deploy.py` 部署，并使用 Docker Engine 26.0 和 Docker Compose 2.26.0 或更新的版本，见 [Host 说明](../host/README.md)。

## 2. 安装客户端

| 客户端 | 原文件 | 操作 |
| --- | --- | --- |
| Mac | 工具按本机芯片自动下载 Grok Bot 0.71.2 原版（Apple Silicon；Intel 为实验支持） | 按 [Mac 说明](../mac/README.md)生成 App，移入「应用程序」 |
| iOS | 自备已解密的 Grok Bot 1.16.0（23152）arm64 IPA，主应用及三个扩展都必须是已解密的；也可以直接用 [Gitee 发行页](https://gitee.com/ahaduoduoduo/ProkBot/releases/tag/v2026.11.02)已注入补丁的未签名 IPA | 按 [iOS 说明](../ios/README.md)用补丁工具注入[发行页](https://github.com/aha-duoduoduo/ProkBot/releases)的 `GrokBotLocal.dylib` 并应用字节补丁，再自行签名安装 |

打开客户端，填写 Host 地址和六位配对码。

### Mac 签名与本机控制

默认命令生成的 Mac App 使用临时签名，没有 Team ID。对话、配对和远程访问都能正常使用，但 Bot 不能操作这台 Mac 的图形界面，因为原版的本机控制辅助程序只接受带 Team ID 的签名。

- **已有证书**：推荐在命令后加 `--identity auto`。在终端运行 `security find-identity -v -p codesigning`，列出 Apple Development 或 Developer ID Application 证书就可以用。工具优先使用 Developer ID Application，其次是 Apple Development；找不到可用的证书时会报错退出，不会生成 App。
- **还没有证书**：建议先创建一个，免费的 Apple 账号就可以。安装 Xcode，打开菜单 Xcode → Settings → Accounts，点左下角的「+」登录 Apple 账号；选中账号下的团队，点「Manage Certificates…」，再点「+」选择「Apple Development」。创建好以后，加 `--identity auto` 重新生成。
- **不想创建证书**：直接用默认命令也可以，代价是用不了本机控制，其他功能不受影响。

iOS 主应用及扩展的签名配置见[扩展签名](../ios/docs/SIGNING.md)。

## 3. 连接其他设备

局域网访问：在 `host/` 中设置监听地址，再启动 Compose。客户端填写这台机器的局域网 IP 和端口 `18080`。

```sh
export GROKBOT_LISTEN_ADDRESS=0.0.0.0
docker compose -f release/compose.yaml up -d
```

远程访问：在 Host 的「远程访问」启用 Tailcat，再在客户端连接设置中启用；也可使用已有的 Tailscale 网络或 HTTPS 地址。

[分开部署与备份](../host/docs/DEPLOYMENT.md) · [应用开发](../host/PLUGINS.md)
