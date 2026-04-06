/* MEDAL_LIST: メダル定義 */
window.MEDAL_LIST = [
    // --- 防御メダル ---
    { id: 'defense_bronze',  type: 'defense',      rarity: 'bronze',   name: 'ぼうぎょメダル（どう）',     img: 'medal_defense_bronze.webp',       value: 10,   sellPrice: 100, desc: 'ぼうぎょりょく +10', effectLabel: 'ぼうぎょりょく +10' },
    { id: 'defense_silver',  type: 'defense',      rarity: 'silver',   name: 'ぼうぎょメダル（ぎん）',     img: 'medal_defense_silver.webp',       value: 20,   sellPrice: 200, desc: 'ぼうぎょりょく +20', effectLabel: 'ぼうぎょりょく +20' },
    { id: 'defense_gold',    type: 'defense',      rarity: 'gold',     name: 'ぼうぎょメダル（きん）',     img: 'medal_defense_gold.webp',         value: 40,   sellPrice: 300, desc: 'ぼうぎょりょく +40', effectLabel: 'ぼうぎょりょく +40' },
    { id: 'defense_diamond', type: 'defense',      rarity: 'diamond',  name: 'ぼうぎょメダル（ダイヤ）', img: 'medal_defense_diamond.webp',      value: 70,   sellPrice: 500, desc: 'ぼうぎょりょく +70', effectLabel: 'ぼうぎょりょく +70' },
    // --- 追加ダメージメダル ---
    { id: 'extra_damage_bronze',  type: 'extra_damage', rarity: 'bronze',  name: 'ダメージメダル（どう）',     img: 'medal_extra_damage_bronze.webp',  value: 10,  sellPrice: 100, desc: 'ついかダメージ +10', effectLabel: 'ついかダメージ +10' },
    { id: 'extra_damage_silver',  type: 'extra_damage', rarity: 'silver',  name: 'ダメージメダル（ぎん）',     img: 'medal_extra_damage_silver.webp',  value: 20,  sellPrice: 200, desc: 'ついかダメージ +20', effectLabel: 'ついかダメージ +20' },
    { id: 'extra_damage_gold',    type: 'extra_damage', rarity: 'gold',    name: 'ダメージメダル（きん）',     img: 'medal_extra_damage_gold.webp',    value: 40,  sellPrice: 300, desc: 'ついかダメージ +40', effectLabel: 'ついかダメージ +40' },
    { id: 'extra_damage_diamond', type: 'extra_damage', rarity: 'diamond', name: 'ダメージメダル（ダイヤ）', img: 'medal_extra_damage_diamond.webp', value: 70,  sellPrice: 500, desc: 'ついかダメージ +70', effectLabel: 'ついかダメージ +70' },
    // --- マールメダル ---
    { id: 'malle_bronze',    type: 'malle',        rarity: 'bronze',   name: 'マールメダル（どう）',     img: 'medal_malle_bronze.webp',         value: 0.10, sellPrice: 100, desc: 'マールかくとく +10%', effectLabel: 'マールかくとく +10%' },
    { id: 'malle_silver',    type: 'malle',        rarity: 'silver',   name: 'マールメダル（ぎん）',     img: 'medal_malle_silver.webp',         value: 0.20, sellPrice: 200, desc: 'マールかくとく +20%', effectLabel: 'マールかくとく +20%' },
    { id: 'malle_gold',      type: 'malle',        rarity: 'gold',     name: 'マールメダル（きん）',     img: 'medal_malle_gold.webp',           value: 0.35, sellPrice: 300, desc: 'マールかくとく +35%', effectLabel: 'マールかくとく +35%' },
    { id: 'malle_diamond',   type: 'malle',        rarity: 'diamond',  name: 'マールメダル（ダイヤ）', img: 'medal_malle_diamond.webp',        value: 0.50, sellPrice: 500, desc: 'マールかくとく +50%', effectLabel: 'マールかくとく +50%' },
    // --- 経験値メダル ---
    { id: 'exp_bronze',      type: 'exp',          rarity: 'bronze',   name: 'けいけんちメダル（どう）',     img: 'medal_exp_bronze.webp',           value: 0.10, sellPrice: 100, desc: 'けいけんちかくとく +10%', effectLabel: 'けいけんちかくとく +10%' },
    { id: 'exp_silver',      type: 'exp',          rarity: 'silver',   name: 'けいけんちメダル（ぎん）',     img: 'medal_exp_silver.webp',           value: 0.20, sellPrice: 200, desc: 'けいけんちかくとく +20%', effectLabel: 'けいけんちかくとく +20%' },
    { id: 'exp_gold',        type: 'exp',          rarity: 'gold',     name: 'けいけんちメダル（きん）',     img: 'medal_exp_gold.webp',             value: 0.35, sellPrice: 300, desc: 'けいけんちかくとく +35%', effectLabel: 'けいけんちかくとく +35%' },
    { id: 'exp_diamond',     type: 'exp',          rarity: 'diamond',  name: 'けいけんちメダル（ダイヤ）', img: 'medal_exp_diamond.webp',          value: 0.50, sellPrice: 500, desc: 'けいけんちかくとく +50%', effectLabel: 'けいけんちかくとく +50%' },
    // --- どくメダル ---
    { id: 'poison_bronze',   type: 'poison',       rarity: 'bronze',   name: 'どくメダル（どう）',       img: 'medal_poison_bronze.webp',        value: 0.15, sellPrice: 100, desc: 'どくふよかくりつ 15%', effectLabel: 'どくふよかくりつ 15%' },
    { id: 'poison_silver',   type: 'poison',       rarity: 'silver',   name: 'どくメダル（ぎん）',       img: 'medal_poison_silver.webp',        value: 0.30, sellPrice: 200, desc: 'どくふよかくりつ 30%', effectLabel: 'どくふよかくりつ 30%' },
    { id: 'poison_gold',     type: 'poison',       rarity: 'gold',     name: 'どくメダル（きん）',       img: 'medal_poison_gold.webp',          value: 0.50, sellPrice: 300, desc: 'どくふよかくりつ 50%', effectLabel: 'どくふよかくりつ 50%' },
    { id: 'poison_diamond',  type: 'poison',       rarity: 'diamond',  name: 'どくメダル（ダイヤ）',   img: 'medal_poison_diamond.webp',       value: 0.70, sellPrice: 500, desc: 'どくふよかくりつ 70%', effectLabel: 'どくふよかくりつ 70%' },
    // --- まひメダル ---
    { id: 'paralyze_bronze',  type: 'paralyze',    rarity: 'bronze',   name: 'まひメダル（どう）',       img: 'medal_paralyze_bronze.webp',      value: 0.10, sellPrice: 100, desc: 'まひふよかくりつ 10%', effectLabel: 'まひふよかくりつ 10%' },
    { id: 'paralyze_silver',  type: 'paralyze',    rarity: 'silver',   name: 'まひメダル（ぎん）',       img: 'medal_paralyze_silver.webp',      value: 0.20, sellPrice: 200, desc: 'まひふよかくりつ 20%', effectLabel: 'まひふよかくりつ 20%' },
    { id: 'paralyze_gold',    type: 'paralyze',    rarity: 'gold',     name: 'まひメダル（きん）',       img: 'medal_paralyze_gold.webp',        value: 0.35, sellPrice: 300, desc: 'まひふよかくりつ 35%', effectLabel: 'まひふよかくりつ 35%' },
    { id: 'paralyze_diamond', type: 'paralyze',    rarity: 'diamond',  name: 'まひメダル（ダイヤ）',   img: 'medal_paralyze_diamond.webp',     value: 0.50, sellPrice: 500, desc: 'まひふよかくりつ 50%', effectLabel: 'まひふよかくりつ 50%' },
    // --- せきかメダル ---
    { id: 'stone_bronze',    type: 'stone',        rarity: 'bronze',   name: 'せきかメダル（どう）',     img: 'medal_stone_bronze.webp',         value: 0.05, sellPrice: 100, desc: 'せきかふよかくりつ 5%', effectLabel: 'せきかふよかくりつ 5%' },
    { id: 'stone_silver',    type: 'stone',        rarity: 'silver',   name: 'せきかメダル（ぎん）',     img: 'medal_stone_silver.webp',         value: 0.10, sellPrice: 200, desc: 'せきかふよかくりつ 10%', effectLabel: 'せきかふよかくりつ 10%' },
    { id: 'stone_gold',      type: 'stone',        rarity: 'gold',     name: 'せきかメダル（きん）',     img: 'medal_stone_gold.webp',           value: 0.20, sellPrice: 300, desc: 'せきかふよかくりつ 20%', effectLabel: 'せきかふよかくりつ 20%' },
    { id: 'stone_diamond',   type: 'stone',        rarity: 'diamond',  name: 'せきかメダル（ダイヤ）', img: 'medal_stone_diamond.webp',        value: 0.30, sellPrice: 500, desc: 'せきかふよかくりつ 30%', effectLabel: 'せきかふよかくりつ 30%' },
];

/* メダルドロップテーブル: [bronze, silver, gold, diamond] の確率 */
window.MEDAL_DROP_TABLE = {
    1: { // EASY
        '1-25':   [0.85, 0.13, 0.02, 0.00],
        '26-50':  [0.60, 0.33, 0.07, 0.00],
        '51-75':  [0.35, 0.50, 0.14, 0.01],
        '76-100': [0.15, 0.50, 0.33, 0.02],
    },
    2: { // NORMAL
        '1-25':   [0.70, 0.25, 0.05, 0.00],
        '26-50':  [0.40, 0.43, 0.15, 0.02],
        '51-75':  [0.20, 0.47, 0.30, 0.03],
        '76-100': [0.05, 0.35, 0.55, 0.05],
    },
    3: { // HARD
        '1-25':   [0.55, 0.33, 0.11, 0.01],
        '26-50':  [0.22, 0.42, 0.28, 0.08],
        '51-75':  [0.08, 0.35, 0.47, 0.10],
        '76-100': [0.02, 0.20, 0.65, 0.13],
    }
};
