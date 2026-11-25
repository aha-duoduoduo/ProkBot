# v2026.11.25

Merges the server and Mac improvements from [ProkBot Plus](https://github.com/ferretgeek/prokbot-plus). Update the Host and the Mac app; iOS does not need an update. Back up the Host data with `release/backup.py` before upgrading.

- Host: adds the OpenAI Responses and Anthropic Messages model formats.
- Host: add several model services and set the model, reasoning effort and up to 8 backup models for all Bots or for one Bot; the Jev classifier can choose among three models by task difficulty, and judges difficulty more accurately.
- Host: fixes web search, image generation, the order of several messages and auto-review.
- Host: adds the `deploy.py` deployment tool and `tools/host-admin.mjs` command-line administration, and supports ARM64 servers.
- Host: the web client uses its own port (18081 by default); its bundle is built with the ProkBot Plus tools.
- Host: with `deploy.py` and Docker Engine 26 or newer, the Bot can read its memory on its own computer, read-only.
- Mac: supports Intel Macs.
- Mac: fixes pairing, reconnection, attachment uploads and saved settings, and the Codex project folder check that never ran.

# v2026.11.05

- Mac: fix Bot pins, sidebar groups and saved collapse state.
- No Host update required.

# v2026.11.02

- iOS: recover Tailcat automatically after suspension instead of remaining disconnected.

# v2026.11.01

First public patch release: use your own Host and models with Grok Bot's Mac and iOS interface.

- `ProkBot-Desktop-Patch.zip`: Mac patch with automatic download of the 0.71.2 Apple Silicon original.
- `ProkBot-iOS-Patch.zip`: iOS patch for a decrypted 1.16.0 (23152) IPA; sign the output yourself.
- `ProkBot-Host-Patch.zip`: Host patch and Docker deployment tools.
- The iOS IPAs (the cleaned original and the patched unsigned one, both with all three extensions) are only on the [Gitee release](https://gitee.com/ahaduoduoduo/ProkBot/releases/tag/v2026.11.01).

[Installation](docs/INSTALL.en.md) · Noncommercial use only.
