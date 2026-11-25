# ProkBot Host Patch

自建 Grok Bot 服务端。需要 Python 3.10+、Docker Compose。Host 镜像按 Docker 所在机器的架构构建（amd64 或 arm64），Linux 桌面镜像为 amd64。

[English](README.en.md)

## 使用

```sh
python3 release/build-docker.py
docker compose -f release/compose.yaml up -d
docker compose -f release/compose.yaml exec host cat /data/setup-key
```

打开 `http://127.0.0.1:18080`，用初始化码设置管理员账号，配置模型并生成六位配对码。

需要局域网访问时，先设置 `export GROKBOT_LISTEN_ADDRESS=0.0.0.0`，再运行 Compose。

### 部署工具

`deploy.py` 把上面的步骤以及升级、备份、恢复做成了子命令，实例配置（`.env` 和备份）默认放在 `~/grokbot`：

```sh
python3 deploy.py doctor      # 检查 Docker、Compose、架构，以及 Linux 桌面能否运行
python3 deploy.py init        # 生成 .env，不覆盖已有部署
python3 deploy.py up          # 构建并启动新部署
python3 deploy.py status
python3 deploy.py setup-key   # 显示初始化码
```

升级用 `update`（先构建新镜像，再停止旧服务、备份并切换），备份用 `backup`，从备份恢复成新项目用 `recover`。Host 和 Linux 桌面分开部署时，在子命令前加 `--host-only`。其他选项见 `python3 deploy.py --help`。

用 `deploy.py` 部署时，如果 Docker Engine 是 26.0 或更新、Docker Compose 是 2.26.0 或更新，会顺带开启「Bot 读记忆」：Bot 可以在自己的 Linux 桌面上查阅记忆文件，但不能修改。版本不够时会跳过这项，其他功能照常。直接用上面的 Compose 命令部署时不开启，原因和手动开启的方法见[部署与备份](docs/DEPLOYMENT.md)。

`tools/host-admin.mjs` 可以在命令行初始化、配置模型（三种接口格式）和生成配对码，见 `node tools/host-admin.mjs --help`。

管理页的「网页版」可以上传网页版界面包，浏览器用配对码登录后就能使用。界面包用 [ProkBot Plus](https://github.com/ferretgeek/prokbot-plus/blob/main/web/README.md) 的工具从官方 Windows 安装包生成；不上传就没有变化。网页版由 Host 的另一个端口提供（Compose 默认 18081），和管理页是两个不同的网址，所以界面包里的代码用不了管理员的登录状态。通过反向代理访问时，需要给网页版单独配置一个入口，见[部署文档](docs/DEPLOYMENT.md#网页版)。

运行测试：`node --test "tests/*.test.mjs"`。网页版路由测试需要先执行 `npm ci --prefix server --omit=dev --ignore-scripts`，否则跳过。

[远程访问、分开部署与备份](docs/DEPLOYMENT.md) · [应用开发](PLUGINS.md)

## 许可与支持

仅限非商业使用，见 [LICENSE](LICENSE)。本项目多数代码由 AI 辅助生成。
