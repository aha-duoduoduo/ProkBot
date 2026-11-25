# ProkBot iOS Patch

为已解密的 Grok Bot 1.16.0（23152）arm64 IPA 注入补丁，主程序与三个扩展都必须是已解密的。需要 Python 3.10+。

[English](README.en.md)

## 使用

用补丁工具把 `GrokBotLocal.dylib` 注入自备的已解密 IPA，再用自己的证书签名安装。`GrokBotLocal.dylib` 在[发行页](https://github.com/aha-duoduoduo/ProkBot/releases)提供，和 `bin/` 里的是同一个文件，工具会核对摘要。只注入 dylib 不够，工具还会应用固定的字节补丁，所以一定要用补丁工具生成。

也可以直接签名安装 [Gitee v2026.11.02 发行页](https://gitee.com/ahaduoduoduo/ProkBot/releases/tag/v2026.11.02)里已注入补丁的 IPA；清理后的 1.16.0（23152）原版 IPA 在 [Gitee v2026.11.01 发行页](https://gitee.com/ahaduoduoduo/ProkBot/releases/tag/v2026.11.01)。自己生成的命令：

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
