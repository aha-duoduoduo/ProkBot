# ProkBot Mac Patch

Connect Grok Bot 0.71.2 for macOS to your Host, on Apple Silicon and, experimentally, on Intel Macs (a user has confirmed building, pairing and chatting on an Intel Mac). Requires Node.js 22.12+.

[简体中文](README.md)

## Use

```sh
node patchers/desktop/patch.mjs
```

Automatically downloads and verifies the 0.71.2 original for this Mac's chip (ARM64 on Apple Silicon, x64 on Intel), then generates `output.noindex/Grok Bot.app`. Move it into Applications and enter your Host address and six-character pairing code. Turn on the Tailcat switch on the connect screen only when pasting the connection link from Remote access in the Host console; leave it off for a LAN or HTTPS address. To build for a Mac with the other chip, add `--arch arm64` or `--arch x64`. The Intel recipes are aligned ports of the Apple Silicon ones and add exactly the same code (`patchers/desktop/x64/`); Tailcat has an x86_64 build (`dist/network/x64/`).

To use an existing `.app` or `.dmg`, add `--source "/path/to/Grok Bot.app"`. A DMG is recognized by its size; for an `.app` built for the other chip, also add `--arch`.

## Signing and local control

The default command signs the app ad hoc, so it has no Team ID. Chat, pairing and remote access all work, but a Bot cannot operate this Mac's graphical interface, because the original local-control helper only accepts signatures that carry a Team ID.

If you already have a certificate, this is the recommended way to build:

```sh
node patchers/desktop/patch.mjs --identity auto
```

Run `security find-identity -v -p codesigning` in Terminal; an Apple Development or Developer ID Application certificate in the list will work. `--identity auto` prefers Developer ID Application, then Apple Development. If it finds no usable certificate, it stops with an error and does not build the app. To pick a specific certificate, replace `auto` with its name or SHA-1.

If you don't have one yet, we suggest creating one first; a free Apple account is enough:

1. Install Xcode, open Xcode → Settings → Accounts, click "+" at the bottom left and sign in with your Apple account.
2. Select the team under the account, click "Manage Certificates…", then click "+" and choose "Apple Development".
3. Check with the command above that the certificate is listed, then build again with `--identity auto`.

You can also skip the certificate and use the default command. You just can't use local control; everything else is unaffected. The first time you use local control, grant Accessibility and Screen Recording access when macOS asks.

## License and support

Noncommercial use only. See [LICENSE](LICENSE). Most code in this project was generated with AI assistance.
