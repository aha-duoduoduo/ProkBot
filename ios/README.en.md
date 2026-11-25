# ProkBot iOS Patch

Patch a decrypted Grok Bot 1.16.0 (23152), arm64 IPA. The app and all three extensions must be decrypted. Requires Python 3.10+.

[简体中文](README.md)

## Use

Inject `GrokBotLocal.dylib` into your own decrypted IPA with the patch tool, then sign and install it with your own certificate. `GrokBotLocal.dylib` is on the [releases page](https://github.com/aha-duoduoduo/ProkBot/releases); it is the same file as the one in `bin/`, and the tool checks its digest. Injecting the dylib alone is not enough: the tool also applies fixed byte patches, so always generate the app with the patch tool.

You can also sign and install the patched IPA on the [Gitee v2026.11.02 release](https://gitee.com/ahaduoduoduo/ProkBot/releases/tag/v2026.11.02); the cleaned original 1.16.0 (23152) IPA is on the [Gitee v2026.11.01 release](https://gitee.com/ahaduoduoduo/ProkBot/releases/tag/v2026.11.01). To generate it yourself:

```sh
python3 release/patch-ios.py \
  --input /path/to/GrokBot-decrypted.ipa \
  --output ./GrokBot-Patched \
  --bundle-id dev.grokbot.local
```

Outputs `GrokBot-Local-resignable.ipa`, `GrokBotLocal.dylib` and `extension-signing.json`. Sign and install with your own tools, then enter your Host address and six-character pairing code.

[Extension signing](docs/SIGNING.en.md) · Configure APNs or Bark in the Host console. Enable realtime voice in app settings.

## License and support

Noncommercial use only. See [LICENSE](LICENSE). Most code in this project was generated with AI assistance.
