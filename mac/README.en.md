# ProkBot Mac Patch

Connect Grok Bot 0.71.2 for macOS to your Host, on Apple Silicon and, experimentally, on Intel Macs (a user has confirmed building, pairing and chatting on an Intel Mac). Requires Node.js 22.12+.

[简体中文](README.md)

## Use

```sh
node patchers/desktop/patch.mjs
```

Automatically downloads and verifies the 0.71.2 original for this Mac's chip (ARM64 on Apple Silicon, x64 on Intel), then generates `output.noindex/Grok Bot.app`. Move it into Applications and enter your Host address and six-character pairing code. Turn on the Tailcat switch on the connect screen only when pasting the connection link from Remote access in the Host console; leave it off for a LAN or HTTPS address. To build for a Mac with the other chip, add `--arch arm64` or `--arch x64`. The Intel recipes are aligned ports of the Apple Silicon ones and add exactly the same code (`patchers/desktop/x64/`); Tailcat has an x86_64 build (`dist/network/x64/`).

To use an existing `.app` or `.dmg`, add `--source "/path/to/Grok Bot.app"`. A DMG is recognized by its size; for an `.app` built for the other chip, also add `--arch`.

For local graphical control, add `--identity auto` to sign with an existing certificate.

## License and support

Noncommercial use only. See [LICENSE](LICENSE). Most code in this project was generated with AI assistance.
