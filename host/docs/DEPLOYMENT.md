# 部署与备份

## 构建

需要 Python 3.10+、Docker 和 Compose。支持 Linux x86_64 和 ARM64：Host 镜像按 Docker 所在机器的架构构建；Linux 桌面镜像只有 amd64，在 ARM 机器（包括 Apple Silicon Mac）上通过转译运行，构建工具会先检查能否运行。

```sh
python3 release/build-docker.py --host-archive /path/to/sand-host-bundle-d0a4baa.tgz
docker compose -f release/compose.yaml up -d
```

省略 `--host-archive` 时从固定来源下载。离线 Box 归档使用 `--box-archive /path/to/box.tar.gz`；构建工具校验后设置本地标签 `grokbot-box-input:9d2ac1b`，Compose 直接使用该镜像。原始资源严格校验，版本见 `recipes/host/manifest.json` 和 `release/build-docker.py`。

打开 `http://127.0.0.1:18080`，读取初始化码并设置管理员密码：

```sh
docker compose -f release/compose.yaml exec host cat /data/setup-key
```

在管理页配置模型，生成六位配对码，再从客户端连接。局域网部署可设置 `GROKBOT_LISTEN_ADDRESS=0.0.0.0`；端口由 `GROKBOT_PUBLIC_PORT` 设置。需要公网访问时使用 HTTPS 反向代理或启用 Tailcat。

## 网页版

网页版由 Host 的第二个端口提供（容器内 8001），管理页和客户端仍然使用 8000。两个端口是两个不同的网址：界面包里是官方界面的代码，放在单独的网址上，即使同一个浏览器登录过管理页，这些代码也调用不了管理接口。网页版端口只提供登录页、界面包和网页版用到的设备接口；旧的 `/web/` 链接会从管理页地址跳转过去。

Compose 默认把网页版映射到 18081 端口，用 `GROKBOT_WEB_PUBLIC_PORT` 修改，监听地址和管理页一样由 `GROKBOT_LISTEN_ADDRESS` 决定。直接用 IP 或域名加端口访问时不需要别的设置，管理页「网页版」显示的地址就是同一个主机名加上网页版端口。同一台机器上运行多个实例时，每个实例要使用不同的 `GROKBOT_WEB_PUBLIC_PORT`。

使用 HTTPS 反向代理时，给网页版单独配置一个入口，建议用单独的子域名，并在 `.env` 里写上两个地址。两个地址不能相同，相同时 Host 不会启动；也不要用路径（例如 `https://bot.example.org/web/`）把网页版放在管理页的网址下面。

```sh
GROKBOT_PUBLIC_URL=https://bot.example.org
GROKBOT_WEB_PUBLIC_URL=https://web.bot.example.org
```

网页版的入口转发到 `127.0.0.1:18081`，并允许 WebSocket，Bot 电脑的画面和实时语音都要用到。以 nginx 为例：

```nginx
server {
    listen 443 ssl;
    server_name web.bot.example.org;
    # 按你的证书填写 ssl_certificate 和 ssl_certificate_key
    location / {
        proxy_pass http://127.0.0.1:18081;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_read_timeout 1h;
    }
}
```

## 数据与更新

Compose 持久保存 `host-data`、`box-home`、`box-workspace` 三个卷。备份工具暂停正在运行的容器，保存卷与摘要后恢复运行。恢复到一个新的 Compose 项目，不覆盖现有卷：

```sh
python3 release/backup.py backup --project grokbot --directory backups/2026-10-21 --image grokbot-host:local
python3 release/backup.py restore --project grokbot-restored --directory backups/2026-10-21 --image grokbot-host:local
docker compose -p grokbot-restored -f release/compose.yaml up -d
```

恢复时使用备份对应的镜像。恢复实例与原实例共享同一身份，切换前停止原实例。

## Bot 读记忆

Host 和 Linux 桌面在同一台机器上时，Bot 可以在自己的 Linux 桌面上查阅记忆。这个功能放在单独的 `release/compose.memory.yaml` 里：它把 `host-data` 卷中的 `agents`、`user-memory`、`workflows`、`plugins`、`managed-skills` 五个目录以只读方式挂到 Linux 桌面的 `/data/runtime/host-data/<目录>`，路径和原版 Host 一致，原版的文件保护照样生效。Bot 只能读这些文件，改不了任何 Bot 的设置或自动任务；`model.env`、`auth.json`、连接器密钥、`agent-transcripts` 等其他数据不会挂入。

`deploy.py` 在 `up`、`update`、`recover` 时检查版本：Docker Engine 26.0 或更新（API 1.45 或更新）、Docker Compose 2.26.0 或更新时，先用 `data_init.py` 补建缺少的目录，再加上这个文件启动；版本不够就提示并跳过，部署照常进行。`deploy.py doctor` 输出里的 `memoryMounts` 表示当前能否开启。

直接用 Compose 部署时（包括群晖 Container Manager 这类 NAS 界面）默认不开启。只有确认版本满足后才能手动加这个文件：Docker Engine 26 以下会忽略子目录设置，把整个 `host-data` 卷挂进 Linux 桌面，里面有模型 API Key 和登录凭据；Compose 2.26 以下则无法启动。手动开启时先创建目录，之后每条 Compose 命令都带上两个文件：

```sh
docker compose -f release/compose.yaml run --rm --no-deps --user 0:0 --entrypoint python3 host /opt/grokbot/release/data_init.py /data/runtime/host-data
docker compose -f release/compose.yaml -f release/compose.memory.yaml up -d
```

## 独立执行电脑与插件

只部署 Host 使用 `release/compose.host.yaml`。另外一台电脑部署执行节点：

```sh
python3 release/build-docker.py --box-only
# 设置至少 32 位随机 GROKBOT_NODE_TOKEN；离线镜像可在上条命令增加 --box-archive
docker compose -f release/compose.execution.yaml up -d --build
```

在 Host 管理页填写执行节点地址和密钥。局域网可设置 `GROKBOT_NODE_LISTEN_ADDRESS=0.0.0.0`，端口默认 18443；启用内嵌网络使用 `GROKBOT_TAILCAT_ENABLED=1`，高级选项为 `GROKBOT_TAILCAT_RELAY` 和 `GROKBOT_TAILCAT_DERP_MAP_URL`。

应用统一在管理页导入、配置和导出分享。代码应用直接运行在现有执行电脑上，无需额外容器。

包格式、授权、附带技能见 [应用开发](../PLUGINS.md)。

`release/patch-host.py --archive ORIGINAL --output NEW_DIRECTORY` 可单独生成 Host 文件并记录补丁耗时。生成过程仅执行固定字节复制与新增规则，不调用 AI 或反编译软件。
