/* sticker_list.js: がんばりシール マスターデータ */
window.STICKER_LIST = [
    // ── バトル ──────────────────────────────────────────
    { id: 'battle_001', name: 'はじめてのしょうり', desc: 'てきをはじめてたおした', category: 'battle', emoji: '⚔️', color: { light: '#ffeb3b', dark: '#ff9800' } },
    { id: 'battle_002', name: 'ベテラン', desc: '100かいたたかった', category: 'battle', emoji: '💪', color: { light: '#ffeb3b', dark: '#ff9800' } },
    { id: 'battle_003', name: 'すばやい！', desc: 'クリティカルを10かいだした', category: 'battle', emoji: '⚡', color: { light: '#ffeb3b', dark: '#ff9800' } },
    { id: 'battle_004', name: 'もっとすばやい！', desc: 'クリティカルを50かいだした', category: 'battle', emoji: '⚡', color: { light: '#ffeb3b', dark: '#ff9800' } },
    { id: 'battle_005', name: 'かみなりのようなはやさ！', desc: 'クリティカルを100かいだした', category: 'battle', emoji: '⚡', color: { light: '#ffeb3b', dark: '#ff9800' } },
    { id: 'battle_006', name: 'ひっさつ！', desc: 'ひっさつわざを10かいつかった', category: 'battle', emoji: '🌟', color: { light: '#ffeb3b', dark: '#ff9800' } },
    { id: 'battle_007', name: 'れんぞくひっさつ！', desc: 'ひっさつわざを50かいつかった', category: 'battle', emoji: '🌟', color: { light: '#ffeb3b', dark: '#ff9800' } },
    { id: 'battle_008', name: 'ひっさつのつかいて！', desc: 'ひっさつわざを100かいつかった', category: 'battle', emoji: '🌟', color: { light: '#ffeb3b', dark: '#ff9800' } },
    { id: 'battle_009', name: 'ぜんもんせいかい', desc: '1かいそうをノーダメージでクリアした', category: 'battle', emoji: '👑', color: { light: '#ffeb3b', dark: '#ff9800' } },

    // ── ダンジョン ───────────────────────────────────────
    { id: 'dungeon_001', name: 'はじめのいっぽ', desc: 'はじめて1かいそうをクリアした', category: 'dungeon', emoji: '🗺️', color: { light: '#80deea', dark: '#0097a7' } },
    { id: 'dungeon_002', name: 'イコール・タウンのせいは！', desc: 'はじめて10かいそうをクリアした', category: 'dungeon', emoji: '🏅', color: { light: '#80deea', dark: '#0097a7' } },
    { id: 'dungeon_003', name: 'プラス・プレーンのせいは！', desc: 'はじめて20かいそうをクリアした', category: 'dungeon', emoji: '🏅', color: { light: '#80deea', dark: '#0097a7' } },
    { id: 'dungeon_004', name: 'マルチ・フォレストのせいは！', desc: 'はじめて30かいそうをクリアした', category: 'dungeon', emoji: '🏅', color: { light: '#80deea', dark: '#0097a7' } },
    { id: 'dungeon_005', name: 'マイナス・マンションのせいは！', desc: 'はじめて40かいそうをクリアした', category: 'dungeon', emoji: '🏅', color: { light: '#80deea', dark: '#0097a7' } },
    { id: 'dungeon_006', name: 'ディバイド・ステップのせいは！', desc: 'はじめて50かいそうをクリアした', category: 'dungeon', emoji: '🏅', color: { light: '#80deea', dark: '#0097a7' } },
    { id: 'dungeon_007', name: 'デジット・デザートのせいは！', desc: 'はじめて60かいそうをクリアした', category: 'dungeon', emoji: '🏅', color: { light: '#80deea', dark: '#0097a7' } },
    { id: 'dungeon_008', name: 'オーダー・サンクチュアリのせいは！', desc: 'はじめて70かいそうをクリアした', category: 'dungeon', emoji: '🏅', color: { light: '#80deea', dark: '#0097a7' } },
    { id: 'dungeon_009', name: 'リマインダー・ショアのせいは！', desc: 'はじめて80かいそうをクリアした', category: 'dungeon', emoji: '🏅', color: { light: '#80deea', dark: '#0097a7' } },
    { id: 'dungeon_010', name: 'ミックス・ピークのせいは！', desc: 'はじめて90かいそうをクリアした', category: 'dungeon', emoji: '🏅', color: { light: '#80deea', dark: '#0097a7' } },
    { id: 'dungeon_011', name: 'アンサー・キャッスルのせいは！', desc: 'はじめて100かいそうをクリアした', category: 'dungeon', emoji: '🏅', color: { light: '#80deea', dark: '#0097a7' } },
    { id: 'dungeon_012', name: '★でクリア', desc: '★で100かいそうをクリアした', category: 'dungeon', emoji: '☆', color: { light: '#80deea', dark: '#0097a7' } },
    { id: 'dungeon_013', name: '★★でクリア', desc: '★★で100かいそうをクリアした', category: 'dungeon', emoji: '⭐', color: { light: '#80deea', dark: '#0097a7' } },
    { id: 'dungeon_014', name: '★★★でクリア', desc: '★★★で100かいそうをクリアした', category: 'dungeon', emoji: '🔥', color: { light: '#80deea', dark: '#0097a7' } },

    // ── チャレンジ ───────────────────────────────────────
    { id: 'chall_001', name: 'まなびやそつぎょう', desc: 'レベル10になった', category: 'challenge', emoji: '📈', color: { light: '#ce93d8', dark: '#7b1fa2' } },
    { id: 'chall_002', name: 'ぼうけんしゃになった！', desc: 'レベル20になった', category: 'challenge', emoji: '📈', color: { light: '#ce93d8', dark: '#7b1fa2' } },
    { id: 'chall_003', name: 'ちゅうきゅうぼうけんしゃ', desc: 'レベル30になった', category: 'challenge', emoji: '📈', color: { light: '#ce93d8', dark: '#7b1fa2' } },
    { id: 'chall_004', name: 'なかなかのつわもの', desc: 'レベル40になった', category: 'challenge', emoji: '📈', color: { light: '#ce93d8', dark: '#7b1fa2' } },
    { id: 'chall_005', name: 'はんにんまえのゆうしゃ', desc: 'レベル50になった', category: 'challenge', emoji: '📈', color: { light: '#ce93d8', dark: '#7b1fa2' } },
    { id: 'chall_006', name: 'もうすぐめいじん', desc: 'レベル60になった', category: 'challenge', emoji: '📈', color: { light: '#ce93d8', dark: '#7b1fa2' } },
    { id: 'chall_007', name: 'じゅくれんのつわもの', desc: 'レベル70になった', category: 'challenge', emoji: '📈', color: { light: '#ce93d8', dark: '#7b1fa2' } },
    { id: 'chall_008', name: 'まちかどのえいゆう', desc: 'レベル80になった', category: 'challenge', emoji: '📈', color: { light: '#ce93d8', dark: '#7b1fa2' } },
    { id: 'chall_009', name: 'かみさまにちかいもの', desc: 'レベル90になった', category: 'challenge', emoji: '📈', color: { light: '#ce93d8', dark: '#7b1fa2' } },
    { id: 'chall_010', name: 'でんせつのつわもの', desc: 'レベル100になった', category: 'challenge', emoji: '💎', color: { light: '#ce93d8', dark: '#7b1fa2' } },
];
