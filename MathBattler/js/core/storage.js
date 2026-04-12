/* StorageManager: localStorageの読み書きを一元管理するクラス
 * 将来Firebaseへ移行する際は、このクラスのメソッドをasync化するだけで対応可能。
 */
class StorageManager {

    // --- プレイヤー基本設定 ---

    savePlayerName(name) {
        localStorage.setItem('math_battle_player_name', name);
    }

    loadPlayerName() {
        return localStorage.getItem('math_battle_player_name') || '';
    }

    // --- マール ---

    saveMalle(amount) {
        localStorage.setItem('math_battle_malle', amount);
    }

    loadMalle() {
        if (typeof DEBUG_MODE !== 'undefined' && DEBUG_MODE) return 100000;
        return Math.min(parseInt(localStorage.getItem('math_battle_malle')) || 0, Constants.MAX_MALLE);
    }

    // --- リュック（アイテム所持数） ---

    saveBackpack(backpack) {
        localStorage.setItem('math_battle_backpack', JSON.stringify(backpack));
    }

    loadBackpack() {
        try {
            const stored = JSON.parse(localStorage.getItem('math_battle_backpack') || '{}');
            const backpack = { items: {}, equipment: [] };
            const storedItems = stored.items || stored; // 後方互換
            // アイテム
            window.ITEM_LIST.forEach(item => {
                backpack.items[item.id] = Math.max(0, Math.min(Constants.MAX_ITEM,
                    parseInt(storedItems[item.id]) || 0));
            });
            // 武具（equipment配列）— 定義系フィールドはEQUIPMENT_LISTを正として上書きマージ
            backpack.equipment = Array.isArray(stored.equipment)
                ? stored.equipment.map(e => {
                    const master = window.EQUIPMENT_LIST && window.EQUIPMENT_LIST.find(m => m.id === e.id);
                    return master ? { ...master, equipped: e.equipped } : e;
                })
                : [];
            return backpack;
        } catch (e) {
            const backpack = { items: {}, equipment: [] };
            window.ITEM_LIST.forEach(item => { backpack.items[item.id] = 0; });
            return backpack;
        }
    }

    // --- 難易度 ---

    saveSelectedDifficulty(difficulty) {
        localStorage.setItem('math_battle_difficulty', difficulty);
    }

    loadSelectedDifficulty() {
        return parseInt(localStorage.getItem('math_battle_difficulty')) || Difficulty.HARD;
    }

    // --- クリア済み階数（難易度別） ---

    _floorKey(difficulty) {
        return `math_battle_cleared_floors_${difficulty}`;
    }

    saveFloorClear(floor, difficulty) {
        const cleared = this.loadClearedFloors(difficulty);
        cleared[floor] = true;
        localStorage.setItem(this._floorKey(difficulty), JSON.stringify(cleared));
    }

    loadClearedFloors(difficulty) {
        try {
            const stored = localStorage.getItem(this._floorKey(difficulty));
            if (stored) return JSON.parse(stored);
        } catch (e) { }
        return {};
    }

    saveAllClearedFloors(cleared, difficulty) {
        localStorage.setItem(this._floorKey(difficulty), JSON.stringify(cleared));
    }

    // --- モンスター図鑑 ---

    /**
     * 旧フォーマット（fastestTime が数値）を新フォーマットに移行する。
     * 旧フォーマットは ★1 の記録として引き継ぐ。
     */
    _migrateCollection(collection) {
        let migrated = false;
        for (const name of Object.keys(collection)) {
            if (name === '_checksum') continue;
            const rec = collection[name];
            if (typeof rec.fastestTime === 'number') {
                rec.fastestTime = { 1: rec.fastestTime, 2: null, 3: null };
                migrated = true;
            }
        }
        return migrated;
    }

    saveMonsterRecord(monsterName, record) {
        const collection = this.loadMonsterCollection();
        collection[monsterName] = record;
        try {
            localStorage.setItem('math_battle_collection_v1', JSON.stringify(collection));
        } catch (e) {
            console.warn("Storage write failed", e);
        }
    }

    saveMonsterDiary(monsterName, text) {
        const collection = this.loadMonsterCollection();
        if (!collection[monsterName]) return;
        collection[monsterName].diary = text;
        try {
            localStorage.setItem('math_battle_collection_v1', JSON.stringify(collection));
        } catch (e) {
            console.warn("Storage write failed", e);
        }
    }

    loadMonsterCollection() {
        try {
            const stored = localStorage.getItem('math_battle_collection_v1');
            if (stored) {
                const collection = JSON.parse(stored);
                if (this._migrateCollection(collection)) {
                    // 移行があったらそのまま保存
                    localStorage.setItem('math_battle_collection_v1', JSON.stringify(collection));
                }
                return collection;
            }
        } catch (e) {
            console.warn("Storage read failed", e);
        }
        return {};
    }

    /** バックアップ復元用: モンスターコレクション全体を上書き保存 */
    saveMonsterCollection(collection) {
        // バックアップ復元時も旧フォーマットをマイグレーション
        this._migrateCollection(collection);
        try {
            localStorage.setItem('math_battle_collection_v1', JSON.stringify(collection));
        } catch (e) {
            console.warn("Storage write failed", e);
        }
    }

    // --- アイテム図鑑 ---

    saveItemCollected(itemId) {
        const collection = this.loadItemCollection();
        collection[itemId] = true;
        localStorage.setItem('math_battle_item_collection_v1', JSON.stringify(collection));
    }

    loadItemCollection() {
        try {
            const stored = localStorage.getItem('math_battle_item_collection_v1');
            if (stored) return JSON.parse(stored);
        } catch (e) { }
        return {};
    }

    /** バックアップ復元用: アイテムコレクション全体を上書き保存 */
    saveItemCollection(collection) {
        localStorage.setItem('math_battle_item_collection_v1', JSON.stringify(collection));
    }

    // --- レベル・経験値 ---

    savePlayerLevel(level) {
        localStorage.setItem('math_battle_player_level', level);
    }

    loadPlayerLevel() {
        return Math.max(1, Math.min(
            Constants.PLAYER_MAX_LEVEL,
            parseInt(localStorage.getItem('math_battle_player_level')) || 1
        ));
    }

    savePlayerExp(exp) {
        localStorage.setItem('math_battle_player_exp', exp);
    }

    loadPlayerExp() {
        return parseInt(localStorage.getItem('math_battle_player_exp')) || 0;
    }

    // --- がんばりシール ---

    loadStickers() {
        try {
            return JSON.parse(localStorage.getItem('math_battle_stickers') || '{}');
        } catch (e) { return {}; }
    }

    saveStickers(stickers) {
        localStorage.setItem('math_battle_stickers', JSON.stringify(stickers));
    }

    hasNewStickers() {
        try {
            const stickers = JSON.parse(localStorage.getItem('math_battle_stickers') || '{}');
            const list = (typeof window !== 'undefined' && window.STICKER_LIST) ? window.STICKER_LIST : [];
            if (list.length === 0) return localStorage.getItem('math_battle_stickers_new') === 'true';
            return list.some(s => stickers[s.id]?.earned && !stickers[s.id]?.seen);
        } catch(e) { return false; }
    }

    setNewStickers() {
        // hasNewStickers() はstickersデータを直接スキャンするため、このフラグは参照されない
        // 既存の呼び出し元との互換性のため残す
    }

    clearNewStickers() {
        // 同上
    }

    // --- ノート NEWバッジ ---

    loadMonsterNew() {
        try { return JSON.parse(localStorage.getItem('math_battle_monster_new') || '{}'); }
        catch(e) { return {}; }
    }

    saveMonsterNew(data) {
        localStorage.setItem('math_battle_monster_new', JSON.stringify(data));
    }

    loadItemNew() {
        try { return JSON.parse(localStorage.getItem('math_battle_item_new') || '{}'); }
        catch(e) { return {}; }
    }

    saveItemNew(data) {
        localStorage.setItem('math_battle_item_new', JSON.stringify(data));
    }

    isStickersMigrated() {
        return localStorage.getItem('math_battle_stickers_migrated') === 'true';
    }

    setStickersMigrated() {
        localStorage.setItem('math_battle_stickers_migrated', 'true');
    }

    // --- バックアップ ---

    _calcChecksum(obj) {
        const str = JSON.stringify(obj);
        let sum = 0;
        for (let i = 0; i < str.length; i++) sum += str.charCodeAt(i);
        return (sum >>> 0).toString(16);
    }

    exportBackup() {
        const data = {
            playerName:    localStorage.getItem('math_battle_player_name'),
            malle:         localStorage.getItem('math_battle_malle'),
            backpack:      localStorage.getItem('math_battle_backpack'),
            difficulty:    localStorage.getItem('math_battle_difficulty'),
            clearedFloors1: localStorage.getItem('math_battle_cleared_floors_1'),
            clearedFloors2: localStorage.getItem('math_battle_cleared_floors_2'),
            clearedFloors3: localStorage.getItem('math_battle_cleared_floors_3'),
            collection:    localStorage.getItem('math_battle_collection_v1'),
            itemCollection: localStorage.getItem('math_battle_item_collection_v1'),
            playerLevel:   localStorage.getItem('math_battle_player_level'),
            playerExp:     localStorage.getItem('math_battle_player_exp'),
            // モンスターハウス
            monsterHouseUnlocked:  localStorage.getItem('math_battle_monster_house_unlocked'),
            monsterHouseNotified:  localStorage.getItem('math_battle_monster_house_notified'),
            berry30Notified:       localStorage.getItem('math_battle_berry30_notified'),
            berry60Notified:       localStorage.getItem('math_battle_berry60_notified'),
            berry90Notified:       localStorage.getItem('math_battle_berry90_notified'),
            berry100Notified:      localStorage.getItem('math_battle_berry100_notified'),
            auraTutorialSeen:      localStorage.getItem('math_battle_aura_tutorial_seen'),
            companions:            localStorage.getItem('math_battle_companions'),
            activeCompanion:       localStorage.getItem('math_battle_active_companion'),
            lastSelectedCompanion: localStorage.getItem('math_battle_last_selected_companion'),
            medals:                localStorage.getItem('math_battle_medals'),
            companionMedals:       localStorage.getItem('math_battle_companion_medals'),
            // がんばりシール
            stickers:              localStorage.getItem('math_battle_stickers'),
            stickersNew:           localStorage.getItem('math_battle_stickers_new'),
        };
        data._checksum = this._calcChecksum(data);
        return data;
    }

    /** @returns {string|null} エラーメッセージ。nullなら成功。 */
    importBackup(data) {
        if (!data || typeof data !== 'object') return 'ファイルが正しくありません';
        const { _checksum, ...rest } = data;
        if (!_checksum || _checksum !== this._calcChecksum(rest)) {
            return 'データが壊れているか、改ざんされています';
        }
        const set = (key, val) => { if (val != null) localStorage.setItem(key, val); };
        set('math_battle_player_name',       rest.playerName);
        set('math_battle_malle',             rest.malle);
        set('math_battle_backpack',          rest.backpack);
        set('math_battle_difficulty',        rest.difficulty);
        set('math_battle_cleared_floors_1',  rest.clearedFloors1);
        set('math_battle_cleared_floors_2',  rest.clearedFloors2);
        set('math_battle_cleared_floors_3',  rest.clearedFloors3);
        set('math_battle_collection_v1',     rest.collection);
        set('math_battle_item_collection_v1',rest.itemCollection);
        set('math_battle_player_level',      rest.playerLevel);
        set('math_battle_player_exp',        rest.playerExp);
        // モンスターハウス
        set('math_battle_monster_house_unlocked',  rest.monsterHouseUnlocked);
        set('math_battle_monster_house_notified',  rest.monsterHouseNotified);
        set('math_battle_berry30_notified',        rest.berry30Notified);
        set('math_battle_berry60_notified',        rest.berry60Notified);
        set('math_battle_berry90_notified',        rest.berry90Notified);
        set('math_battle_berry100_notified',       rest.berry100Notified);
        set('math_battle_aura_tutorial_seen',       rest.auraTutorialSeen);
        set('math_battle_companions',              rest.companions);
        set('math_battle_active_companion',        rest.activeCompanion);
        set('math_battle_last_selected_companion', rest.lastSelectedCompanion);
        set('math_battle_medals',                  rest.medals);
        set('math_battle_companion_medals',        rest.companionMedals);
        // がんばりシール
        set('math_battle_stickers',                rest.stickers);
        set('math_battle_stickers_new',            rest.stickersNew);
        // 旧キー削除
        localStorage.removeItem('math_battle_cleared_floors');
        return null;
    }

    // --- せってい（おんがく・おんりょう） ---

    saveSettings(settings) {
        localStorage.setItem('math_battle_settings', JSON.stringify(settings));
    }

    loadSettings() {
        try {
            const stored = localStorage.getItem('math_battle_settings');
            if (stored) {
                const s = JSON.parse(stored);
                const fallbackVol = typeof s.volume === 'number' ? s.volume : 100;
                return {
                    bgmEnabled: s.bgmEnabled !== false,
                    seEnabled: s.seEnabled !== false,
                    bgmVolume: typeof s.bgmVolume === 'number' ? s.bgmVolume : fallbackVol,
                    seVolume: typeof s.seVolume === 'number' ? s.seVolume : fallbackVol,
                };
            }
        } catch (e) { }
        return { bgmEnabled: true, seEnabled: true, bgmVolume: 100, seVolume: 100 };
    }

    // --- チュートリアル（初回説明） ---

    isIntroSeen() {
        return localStorage.getItem('math_battle_intro_seen') === 'true';
    }

    setIntroSeen() {
        localStorage.setItem('math_battle_intro_seen', 'true');
    }

    isAuraTutorialSeen() {
        return localStorage.getItem('math_battle_aura_tutorial_seen') === 'true';
    }

    setAuraTutorialSeen() {
        localStorage.setItem('math_battle_aura_tutorial_seen', 'true');
    }

    // --- モンスターハウス解放 ---

    isMonsterHouseUnlocked() {
        return localStorage.getItem('math_battle_monster_house_unlocked') === 'true';
    }

    setMonsterHouseUnlocked() {
        localStorage.setItem('math_battle_monster_house_unlocked', 'true');
    }

    isMonsterHouseNotified() {
        return localStorage.getItem('math_battle_monster_house_notified') === 'true';
    }

    setMonsterHouseNotified() {
        localStorage.setItem('math_battle_monster_house_notified', 'true');
    }

    // --- ゆうじょうのみ ショップ解放通知（tier: 30/60/90/100） ---

    isBerryNotified(tier) {
        return localStorage.getItem(`math_battle_berry${tier}_notified`) === 'true';
    }

    setBerryNotified(tier) {
        localStorage.setItem(`math_battle_berry${tier}_notified`, 'true');
    }

    // --- 仲間モンスター ---

    loadCompanions() {
        try {
            const stored = localStorage.getItem('math_battle_companions');
            if (stored) return JSON.parse(stored);
        } catch (e) { console.warn('StorageManager.loadCompanions failed', e); }
        return {};
    }

    saveCompanions(companions) {
        try {
            localStorage.setItem('math_battle_companions', JSON.stringify(companions));
        } catch (e) { console.warn('StorageManager.saveCompanions failed', e); }
    }

    loadActiveCompanion() {
        return localStorage.getItem('math_battle_active_companion') || null;
    }

    saveActiveCompanion(name) {
        if (name == null) {
            localStorage.removeItem('math_battle_active_companion');
        } else {
            localStorage.setItem('math_battle_active_companion', name);
        }
    }

    loadLastSelectedCompanion() {
        return localStorage.getItem('math_battle_last_selected_companion') || null;
    }

    saveLastSelectedCompanion(name) {
        if (name == null) {
            localStorage.removeItem('math_battle_last_selected_companion');
        } else {
            localStorage.setItem('math_battle_last_selected_companion', name);
        }
    }

    // --- メダル ---

    loadMedals() {
        try {
            const stored = localStorage.getItem('math_battle_medals');
            if (stored) return JSON.parse(stored);
        } catch (e) { console.warn('StorageManager.loadMedals failed', e); }
        return {};
    }

    saveMedals(medals) {
        try {
            localStorage.setItem('math_battle_medals', JSON.stringify(medals));
        } catch (e) { console.warn('StorageManager.saveMedals failed', e); }
    }

    loadCompanionMedals() {
        try {
            const stored = localStorage.getItem('math_battle_companion_medals');
            if (stored) return JSON.parse(stored);
        } catch (e) { console.warn('StorageManager.loadCompanionMedals failed', e); }
        return {};
    }

    saveCompanionMedals(map) {
        try {
            localStorage.setItem('math_battle_companion_medals', JSON.stringify(map));
        } catch (e) { console.warn('StorageManager.saveCompanionMedals failed', e); }
    }

}
