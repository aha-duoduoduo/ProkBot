# Installation

[Install with AI](AI-INSTALL.en.md).

## 1. Deploy the Host

Requires Python 3.10+ and Docker Compose. The runtime is Linux amd64; Apple Silicon Macs use emulation.

From `host/` in the repository or extracted patch archive:

```sh
python3 release/build-docker.py
docker compose -f release/compose.yaml up -d
docker compose -f release/compose.yaml exec host cat /data/setup-key
```

Open `http://127.0.0.1:18080` and create an administrator account with the setup code. Enter a model endpoint and API key, then create a six-character pairing code under Devices & Notifications.

Deployed this way, the Bot cannot read its memory files on its own Linux desktop; everything else works the same. For that feature, deploy with `python3 deploy.py` instead, on Docker Engine 26.0 and Docker Compose 2.26.0 or newer; see the [Host guide](../host/README.en.md).

## 2. Install an app

| App | Original input | Instructions |
| --- | --- | --- |
| Mac | Automatically downloads Grok Bot 0.71.2 for the Mac's chip (Apple Silicon; Intel is experimental) | [Patch the app](../mac/README.en.md) and move it into Applications |
| iOS | Decrypted Grok Bot 1.16.0 (23152), arm64 IPA including all three decrypted extensions; or the patched unsigned IPA on the [Gitee release](https://gitee.com/ahaduoduoduo/ProkBot/releases/tag/v2026.11.02) | [Patch the IPA](../ios/README.en.md), then sign and install it |

Open the app and enter the Host address and six-character pairing code.

### Mac signing and local control

The default command signs the Mac app ad hoc, so it has no Team ID. Chat, pairing and remote access all work, but a Bot cannot operate this Mac's graphical interface, because the original local-control helper only accepts signatures that carry a Team ID.

- **You already have a certificate**: add `--identity auto` to the command; this is the recommended way. Run `security find-identity -v -p codesigning` in Terminal; an Apple Development or Developer ID Application certificate in the list will work. The tool prefers Developer ID Application, then Apple Development. If it finds no usable certificate, it stops with an error and does not build the app.
- **You don't have one yet**: we suggest creating one first; a free Apple account is enough. Install Xcode, open Xcode → Settings → Accounts, click "+" at the bottom left and sign in with your Apple account. Select the team under the account, click "Manage Certificates…", then click "+" and choose "Apple Development". Once it exists, build again with `--identity auto`.
- **You'd rather not create one**: the default command works too. You just can't use local control; everything else is unaffected.

See [Extension signing](../ios/docs/SIGNING.en.md) for the iOS app and extensions.

## 3. Connect other devices

For LAN access, set the listen address from `host/`, then start Compose. Enter this computer's LAN IP and port `18080` in the client.

```sh
export GROKBOT_LISTEN_ADDRESS=0.0.0.0
docker compose -f release/compose.yaml up -d
```

For remote access, enable Tailcat under Remote Access on the Host and in the client's connection settings. An existing Tailscale network or HTTPS address also works.

[Separate deployment and backups](../host/docs/DEPLOYMENT.en.md) · [Application development](../host/PLUGINS.en.md)
