# ProkBot Host Patch

Self-host the Grok Bot server. Requires Python 3.10+ and Docker Compose. The Host image is built for the Docker machine's architecture (amd64 or arm64); the Linux desktop image is amd64.

[简体中文](README.md)

## Use

```sh
python3 release/build-docker.py
docker compose -f release/compose.yaml up -d
docker compose -f release/compose.yaml exec host cat /data/setup-key
```

Open `http://127.0.0.1:18080`, use the setup code to create an administrator account, configure a model and create a six-character pairing code.

For LAN access, run `export GROKBOT_LISTEN_ADDRESS=0.0.0.0` before starting Compose.

### Deploy tool

`deploy.py` wraps the steps above, plus upgrades, backups and recovery, as subcommands. Instance settings (`.env` and backups) live in `~/grokbot` by default:

```sh
python3 deploy.py doctor      # check Docker, Compose, architecture and whether the Linux desktop can run
python3 deploy.py init        # create .env; never overwrites an existing deployment
python3 deploy.py up          # build and start a new deployment
python3 deploy.py status
python3 deploy.py setup-key   # show the setup code
```

Use `update` to upgrade (it builds the new image first, then stops the old services, backs up and switches), `backup` to back up and `recover` to restore a backup as a new project. For a separate Host and Linux desktop, put `--host-only` before the subcommand. See `python3 deploy.py --help` for other options.

When Docker Engine is 26.0 or newer and Docker Compose is 2.26.0 or newer, `deploy.py` also turns on memory reading: the Bot can look through its memory files on its own Linux desktop, but cannot change them. With older versions it skips this and everything else works as usual. The plain Compose commands above leave it off; [Deployment and backups](docs/DEPLOYMENT.en.md) explains why and how to turn it on by hand.

`tools/host-admin.mjs` sets up the Host, configures models (all three API formats) and creates pairing codes from the command line; see `node tools/host-admin.mjs --help`.

The admin page's Web client section accepts a web interface bundle; browsers can then sign in with a pairing code. The bundle is built from the official Windows installer with the [ProkBot Plus](https://github.com/ferretgeek/prokbot-plus/blob/main/web/README.en.md) tools; nothing changes until one is uploaded. The web client is served on a separate Host port (18081 by default with Compose), so it runs on a different origin from the admin page and code in the bundle cannot use the administrator's session. Behind a reverse proxy, the web client needs an entry of its own; see [Deployment](docs/DEPLOYMENT.en.md#web-client).

Tests: `node --test "tests/*.test.mjs"`. The web client route test needs `npm ci --prefix server --omit=dev --ignore-scripts` first; otherwise it is skipped.

[Remote access, separate deployment and backups](docs/DEPLOYMENT.en.md) · [Application development](PLUGINS.en.md)

## License and support

Noncommercial use only. See [LICENSE](LICENSE). Most code in this project was generated with AI assistance.
