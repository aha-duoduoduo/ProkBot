# ProkBot iOS Patch

为已解密的 Grok Bot 1.16.0（23152）arm64 IPA 注入补丁，主程序与三个扩展都必须是已解密的。需要 Python 3.10+。

[English](README.en.md)

## 使用

已注入补丁、可以直接签名安装的 IPA 在 [Gitee v2026.11.02 发行页](https://gitee.com/ahaduoduoduo/ProkBot/releases/tag/v2026.11.02)；想自己注入时，清理后的 1.16.0（23152）原版 IPA 在 [Gitee v2026.11.01 发行页](https://gitee.com/ahaduoduoduo/ProkBot/releases/tag/v2026.11.01)。

```sh
python3 release/patch-ios.py \
  --input /path/to/GrokBot-decrypted.ipa \
  --output ./GrokBot-Patched \
  --bundle-id dev.grokbot.local
```

输出 `GrokBot-Local-resignable.ipa`、`GrokBotLocal.dylib` 和 `extension-signing.json`。用自己的工具签名并安装，再填写 Host 地址和六位配对码。

[扩展签名](docs/SIGNING.md) · 推送使用 APNs 或 Bark，在 Host 管理页配置。实时通话在 App 设置中开启。

## 许可与支持

仅限非商业使用，见 [LICENSE](LICENSE)。本项目多数代码由 AI 辅助生成。
