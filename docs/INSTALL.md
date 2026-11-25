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
| iOS | 已解密的 Grok Bot 1.16.0（23152）arm64 IPA，主应用及三个扩展都必须是已解密的；也可以直接用 [Gitee 发行页](https://gitee.com/ahaduoduoduo/ProkBot/releases/tag/v2026.11.02)已注入的未签名 IPA | 按 [iOS 说明](../ios/README.md)生成 IPA，自行签名安装 |

打开客户端，填写 Host 地址和六位配对码。

Mac 本机图形控制需要证书签名；iOS 主应用及扩展的签名配置见[扩展签名](../ios/docs/SIGNING.md)。

## 3. 连接其他设备

局域网访问：在 `host/` 中设置监听地址，再启动 Compose。客户端填写这台机器的局域网 IP 和端口 `18080`。

```sh
export GROKBOT_LISTEN_ADDRESS=0.0.0.0
docker compose -f release/compose.yaml up -d
```

远程访问：在 Host 的「远程访问」启用 Tailcat，再在客户端连接设置中启用；也可使用已有的 Tailscale 网络或 HTTPS 地址。

[分开部署与备份](../host/docs/DEPLOYMENT.md) · [应用开发](../host/PLUGINS.md)
