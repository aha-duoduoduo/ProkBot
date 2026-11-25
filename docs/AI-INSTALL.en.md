# AI installation guide

Goal: deploy ProkBot, configure its model and connect the clients. Project: https://github.com/aha-duoduoduo/ProkBot .

## Before starting

Ask together for: local or remote Host and working directory; Mac / iOS clients and local Mac control; LAN / Tailcat / existing HTTPS access; model API format (OpenAI Chat Completions, OpenAI Responses or Anthropic Messages), endpoint, API key and model ID; and the administrator password for a new deployment. Remote deployment also needs connection details.

Check architecture, memory, disk space and existing deployments. Reuse existing configuration and back up before updating. Install missing Python 3.10+ and Docker Compose. Mac patching runs on a Mac (Apple Silicon; Intel is experimental) with Node.js 22.12+.

## Inputs and outputs

| Resource | Processing | Output |
| --- | --- | --- |
| Linux desktop | Build tool pulls the pinned official `9d2ac1b` amd64 image | Execution computer container |
| Host | Tool downloads stable Host `d0a4baa`, applies patches and builds | `grokbot-host:local` image |
| Mac | Patcher downloads and verifies the 0.71.2 Apple Silicon original and patches it | `mac/output.noindex/Grok Bot.app` |
| iOS | Download the patched unsigned IPA from the Gitee releases, or build it from the cleaned original 1.16.0 (23152) IPA there | Unsigned IPA retaining all three extensions |

## Deploy the Host

Obtain the repository. Save access settings in `.env` in the deployment directory and add `--env-file .env` consistently to subsequent Compose commands. Set `GROKBOT_LISTEN_ADDRESS`, `GROKBOT_PUBLIC_PORT`, `GROKBOT_PUBLIC_URL` and the user's timezone `TZ`. LAN access uses `0.0.0.0`, with port 18080 by default. Store model credentials in Host configuration.

The example uses a new project named `prokbot`; reuse the project name and volumes of an existing deployment. Run from the repository root:

```sh
python3 host/release/build-docker.py
docker compose --env-file .env -p prokbot -f host/release/compose.yaml up -d
docker compose --env-file .env -p prokbot -f host/release/compose.yaml exec host cat /data/setup-key
```

A new deployment can also use `doctor`, `init`, `up` and `status` from `python3 host/deploy.py` for the same steps; see `--help`. Existing deployments keep their current commands.

Memory reading (the Bot looking through its memory directories, read-only, on its own Linux desktop) is turned on only by `deploy.py`, and only with Docker Engine 26.0 or newer and Docker Compose 2.26.0 or newer; `memoryMounts` in the `doctor` output shows whether it can be. The Compose commands above leave it off. Do not add `host/release/compose.memory.yaml` by hand on older versions: older Docker mounts the whole data volume, model keys included, into the Linux desktop.

The Host image is built for the Docker machine's architecture (amd64 or arm64). The Linux desktop image is amd64 only; on ARM machines Docker must run it under emulation, and the build tool checks this first. For a separate Host and execution computer, select the Compose files described in `host/docs/DEPLOYMENT.en.md`.

Open the administration page and initialize the administrator account. Under Models, add a model service (API format, address, key), create a model profile (a service plus a model ID), set the default route, test each profile and save; if the user wants, give individual Bots their own primary model, reasoning effort and backup models. Configure and verify Tailcat under Remote Access when selected.

Use the administration UI or consult `host/server/index.mjs` for the current request formats and sessions:

| Purpose | Endpoint |
| --- | --- |
| Initialization and login state | `GET /admin/api/session` |
| Initialize / log in | `POST /admin/api/setup`, `POST /admin/api/login` |
| Configure / test model | `PUT /admin/api/model`, `POST /admin/api/model/test` |
| Check conversation core | `host.connected` in `GET /admin/api/status` |
| Create pairing code | `POST /admin/api/pairing-keys` |

Management endpoints require a login cookie except session and setup/login routes. Mutations include the Host's `Origin`. Create a code when each client is ready: it lasts five minutes and can be used once.

## Mac client

On the user's Mac, run from the repository root:

```sh
node mac/patchers/desktop/patch.mjs
```

Before building, run `security find-identity -v -p codesigning`:

- If it lists an Apple Development or Developer ID Application certificate, add `--identity auto` to the command. The resulting app can use local graphical control.
- If there is no certificate, tell the user that an app built with the default command cannot use local graphical control, and suggest creating an Apple Development certificate in Xcode first; a free Apple account is enough. The steps are under "Mac signing and local control" in the [installation guide](INSTALL.en.md). The user has to sign in to their Apple account themselves. Once the certificate exists, build with `--identity auto`; if the user would rather not create one, use the default command.

If downloading fails, follow the Patcher's instructions: ask for an original `.app` / `.dmg` and use `--source`.

Install `mac/output.noindex/Grok Bot.app` into Applications. Zip an existing app before updating and preserve its user configuration. Keep builds and temporary apps in `.noindex` directories. Open the app, enter the Host address and a new pairing code, and enable Tailcat when selected. For local control, ask the user to grant Accessibility and Screen Recording access and verify a computer operation.

## iOS client

Use `ProkBot-iOS-1.16.0-unsigned.ipa` from the [Gitee v2026.11.02 release](https://gitee.com/ahaduoduoduo/ProkBot/releases/tag/v2026.11.02) for user signing and installation. To patch it yourself, use `GrokBot-1.16.0-23152-decrypted-clean.ipa` from the [Gitee v2026.11.01 release](https://gitee.com/ahaduoduoduo/ProkBot/releases/tag/v2026.11.01):

```sh
python3 ios/release/patch-ios.py \
  --input /path/to/GrokBot-decrypted.ipa \
  --output ./output.noindex/ios \
  --bundle-id dev.grokbot.local
```

Match an existing signing configuration's Bundle ID / App Group. See `ios/docs/SIGNING.en.md` and the generated `extension-signing.json`. Keep Widgets, Share and NotificationService. The user signs and installs the IPA, then connects with the Host address and a fresh pairing code.

## Verify and hand over

- Check container state, `/healthz`, the model connection test and the conversation core in the administration page.
- Connect the selected clients, read the Bot list and complete a short conversation. Verify access over the selected network.
- Provide the administration and client Host URLs, deployment directory, data volumes, app file locations and verification results. Report the actual progress of iOS signing and installation.
- Provide start, stop, logs, backup and update commands with the same Compose project, files and environment settings. Use `host/release/backup.py` for backups and preserve data volumes.
