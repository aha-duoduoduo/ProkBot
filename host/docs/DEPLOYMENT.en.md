# Deployment and backups

Requires Python 3.10+, Docker and Compose. Linux x86_64 and ARM64 are supported: the Host image is built for the Docker machine's architecture, and the Linux desktop image is amd64 only. On ARM machines, including Apple Silicon Macs, the desktop runs under emulation, and the build tool checks that it can run first.

```sh
python3 release/build-docker.py --host-archive /path/to/sand-host-bundle-d0a4baa.tgz
docker compose -f release/compose.yaml up -d
docker compose -f release/compose.yaml exec host cat /data/setup-key
```

Open `http://127.0.0.1:18080`, initialize the administrator account, configure a model and create a six-character pairing code. Omitting `--host-archive` downloads the pinned input. `--box-archive` accepts an offline docker-save archive. After verification, the build tool assigns `grokbot-box-input:9d2ac1b` for Compose to use locally. Inputs are verified against fixed identities.

Use `GROKBOT_LISTEN_ADDRESS=0.0.0.0` for LAN access and `GROKBOT_PUBLIC_PORT` for a different port. For remote access, use HTTPS or optional Tailcat.

## Web client

The web client is served on a second Host port (8001 in the container); the admin page and the apps keep using 8000. The two ports are two different origins: the bundle contains the official interface's code, and on an origin of its own that code cannot call the admin API, even in a browser that has signed in to the admin page. The web client port serves only the sign-in page, the bundle and the device API the web client uses; old `/web/` links on the admin address redirect there.

Compose maps the web client to port 18081 by default; change it with `GROKBOT_WEB_PUBLIC_PORT`. It listens on the same address as the admin page, set by `GROKBOT_LISTEN_ADDRESS`. Direct access by IP address or host name plus port needs nothing else: the address shown under Web client on the admin page is the same host name with the web client port. When several instances run on one machine, give each its own `GROKBOT_WEB_PUBLIC_PORT`.

Behind an HTTPS reverse proxy, give the web client an entry of its own, preferably its own subdomain, and set both addresses in `.env`. They must differ, or the Host refuses to start; do not put the web client under a path of the admin address either, such as `https://bot.example.org/web/`.

```sh
GROKBOT_PUBLIC_URL=https://bot.example.org
GROKBOT_WEB_PUBLIC_URL=https://web.bot.example.org
```

The web client entry forwards to `127.0.0.1:18081` and allows WebSocket, which the Bot computer view and realtime voice use. With nginx:

```nginx
server {
    listen 443 ssl;
    server_name web.bot.example.org;
    # ssl_certificate and ssl_certificate_key for your certificate
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

## Data and updates

The `host-data`, `box-home` and `box-workspace` volumes retain data. The backup tool pauses running containers, saves all project volumes with checksums and resumes them. Restore into a new project without overwriting existing volumes:

```sh
python3 release/backup.py backup --project grokbot --directory backups/2026-10-21 --image grokbot-host:local
python3 release/backup.py restore --project grokbot-restored --directory backups/2026-10-21 --image grokbot-host:local
docker compose -p grokbot-restored -f release/compose.yaml up -d
```

Use the image version matching the backup. The restored instance retains the same identity; stop the original instance before starting the restored one.

## The Bot reading its memory

When the Host and the Linux desktop run on the same machine, the Bot can look through its memory on its own Linux desktop. This lives in a separate file, `release/compose.memory.yaml`. It mounts five directories of the `host-data` volume, `agents`, `user-memory`, `workflows`, `plugins` and `managed-skills`, read-only at `/data/runtime/host-data/<directory>` on the Linux desktop. That is the original Host path, so the original file protection still applies. The Bot can read these files but cannot change any Bot's settings or automations; `model.env`, `auth.json`, connector secrets, `agent-transcripts` and other data stay out.

`deploy.py` checks versions on `up`, `update` and `recover`. With Docker Engine 26.0 or newer (API 1.45 or newer) and Docker Compose 2.26.0 or newer, it creates any missing directories with `data_init.py` and starts with this file added; with older versions it says so and deploys without it. `memoryMounts` in the output of `deploy.py doctor` shows whether it can be turned on.

Plain Compose deployments, including NAS interfaces such as Synology Container Manager, leave it off. Add the file by hand only after confirming the versions: Docker Engine before 26 ignores the subdirectory setting and mounts the whole `host-data` volume, model API keys and sign-in credentials included, into the Linux desktop, and Compose before 2.26 refuses to start. To turn it on by hand, create the directories first, then pass both files to every Compose command:

```sh
docker compose -f release/compose.yaml run --rm --no-deps --user 0:0 --entrypoint python3 host /opt/grokbot/release/data_init.py /data/runtime/host-data
docker compose -f release/compose.yaml -f release/compose.memory.yaml up -d
```

## Separate execution computer and applications

Use `release/compose.host.yaml` for a standalone Host. Deploy an execution node on another computer:

```sh
python3 release/build-docker.py --box-only
# Set a random GROKBOT_NODE_TOKEN of at least 32 characters. Add --box-archive above for an offline image.
docker compose -f release/compose.execution.yaml up -d --build
```

Configure its address and key in the Host console. Set `GROKBOT_NODE_LISTEN_ADDRESS=0.0.0.0` for LAN access on port 18443. Enable optional embedded networking with `GROKBOT_TAILCAT_ENABLED=1`; advanced options are `GROKBOT_TAILCAT_RELAY` and `GROKBOT_TAILCAT_DERP_MAP_URL`.

Manage, import and export all applications from Applications. Code apps run on the existing execution computer without extra containers.

See [Application development](../PLUGINS.en.md) for package format, OAuth and bundled skills.
