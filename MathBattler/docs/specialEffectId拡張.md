新しい `specialEffectId` の定義と、それに対応させるべき必要なアセット（画像・音源）のリストです。
### 新規 specialEffectId と必要アセット一覧（カラー拡張版）

| specialEffectId | 効果内容 | 攻撃エフェクト画像 (通常/クリティカル) | 再生SE音源ファイル (通常/クリティカル) |
| :--- | :--- | :--- | :--- |
| **Slash_red** | 赤い斬撃 | `attack_S_red.webp` / `critical_S_red.webp` | `slash_red.mp3` / `slash_crit_red.mp3` |
| **Slash_blue** | 青い斬撃 | `attack_S_blue.webp` / `critical_S_blue.webp` | `slash_blue.mp3` / `slash_crit_blue.mp3` |
| **Slash_green** | 緑の斬撃 | `attack_S_green.webp` / `critical_S_green.webp` | `slash_green.mp3` / `slash_crit_green.mp3` |
| **Slash_yellow** | 黄色の斬撃 | `attack_S_yellow.webp` / `critical_S_yellow.webp` | `slash_yellow.mp3` / `slash_crit_yellow.mp3` |
| **Slash_black** | 黒い斬撃 | `attack_S_black.webp` / `critical_S_black.webp` | `slash_black.mp3` / `slash_crit_black.mp3` |
| **Slash_white** | 白い斬撃 | `attack_S_white.webp` / `critical_S_white.webp` | `slash_white.mp3` / `slash_crit_white.mp3` |

---

### アセットの保存場所 (参考)
プロジェクトの構成に合わせ、以下のディレクトリへ配置することを想定しています。

*   **エフェクト画像 (`.webp`)**: `assets/image/effects/`
*   **SE音源 (`.mp3`)**: `assets/sound/se/`