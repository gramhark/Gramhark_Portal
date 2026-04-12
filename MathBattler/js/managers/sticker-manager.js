/* StickerManager: がんばりシールの取得チェック・カウンター管理・ポップアップキュー */
class StickerManager {
    constructor(game) {
        this.game = game;
        this.storage = game.storage;
        this._pendingQueue = [];
        this._isShowingPopup = false;

        // 既存セーブデータへの移行（初回起動時のみ）
        if (!this.storage.isStickersMigrated()) {
            this._migrate();
        }
    }

    // ─────────────────────────────────────────
    // 既存データ移行
    // ─────────────────────────────────────────

    _migrate() {
        const stickers = this.storage.loadStickers();
        const now = new Date().toISOString();
        const earned = [];

        const maybeEarn = (id) => {
            if (!stickers[id]?.earned) {
                stickers[id] = { earned: true, earnedAt: now };
                earned.push(id);
            }
        };

        // フロアクリアシール（難易度問わず初クリア）
        const c1 = this.storage.loadClearedFloors(1);
        const c2 = this.storage.loadClearedFloors(2);
        const c3 = this.storage.loadClearedFloors(3);
        const floorMap = {
            1: 'dungeon_001', 10: 'dungeon_002', 20: 'dungeon_003',
            30: 'dungeon_004', 40: 'dungeon_005', 50: 'dungeon_006',
            60: 'dungeon_007', 70: 'dungeon_008', 80: 'dungeon_009',
            90: 'dungeon_010', 100: 'dungeon_011',
        };
        for (const [floorStr, id] of Object.entries(floorMap)) {
            const f = parseInt(floorStr);
            if (c1[f] || c2[f] || c3[f]) maybeEarn(id);
        }

        // 難易度別100フロアクリアシール
        if (c1[100]) maybeEarn('dungeon_012');
        if (c2[100]) maybeEarn('dungeon_013');
        if (c3[100]) maybeEarn('dungeon_014');

        // レベルマイルストーン
        const lv = this.storage.loadPlayerLevel();
        const levelMap = {
            10: 'chall_001', 20: 'chall_002', 30: 'chall_003', 40: 'chall_004',
            50: 'chall_005', 60: 'chall_006', 70: 'chall_007', 80: 'chall_008',
            90: 'chall_009', 100: 'chall_010',
        };
        for (const [thStr, id] of Object.entries(levelMap)) {
            if (lv >= parseInt(thStr)) maybeEarn(id);
        }

        if (earned.length > 0) {
            this.storage.saveStickers(stickers);
            this.storage.setNewStickers();
            this._pendingQueue.push(...earned);
        }
        this.storage.setStickersMigrated();
    }

    // ─────────────────────────────────────────
    // カウンターユーティリティ
    // ─────────────────────────────────────────

    _getCounter(stickers, key) {
        return stickers[key]?.progress || 0;
    }

    _setCounter(stickers, key, val) {
        stickers[key] = { earned: false, progress: val };
    }

    // ─────────────────────────────────────────
    // battleCount インクリメント（_onMonsterDefeated から呼ぶ）
    // ─────────────────────────────────────────

    incrementBattleCount() {
        const stickers = this.storage.loadStickers();
        const count = this._getCounter(stickers, '_battleCount') + 1;
        this._setCounter(stickers, '_battleCount', count);
        this.storage.saveStickers(stickers);
    }

    // ─────────────────────────────────────────
    // シール取得チェック
    // ─────────────────────────────────────────

    check(trigger, context = {}) {
        if (trigger === 'mainMenu') {
            this._flushPending();
            return;
        }

        const stickers = this.storage.loadStickers();
        const now = new Date().toISOString();
        let changed = false;

        const earn = (id) => {
            if (!stickers[id]?.earned) {
                stickers[id] = { ...stickers[id], earned: true, earnedAt: now };
                this._pendingQueue.push(id);
                changed = true;
            }
        };

        if (trigger === 'battleWin') {
            const { floor, difficulty, wrongAnswerCount, isFirstClear } = context;

            // バトル数シール
            const battleCount = this._getCounter(stickers, '_battleCount');
            if (battleCount >= 1)   earn('battle_001');
            if (battleCount >= 100) earn('battle_002');

            // ノーダメージクリア
            if (wrongAnswerCount === 0) earn('battle_009');

            // フロアクリアシール（初回のみ）
            const floorStickerMap = {
                1: 'dungeon_001', 10: 'dungeon_002', 20: 'dungeon_003',
                30: 'dungeon_004', 40: 'dungeon_005', 50: 'dungeon_006',
                60: 'dungeon_007', 70: 'dungeon_008', 80: 'dungeon_009',
                90: 'dungeon_010', 100: 'dungeon_011',
            };
            if (floorStickerMap[floor] && isFirstClear) {
                earn(floorStickerMap[floor]);
            }

            // 難易度別100フロアクリア
            if (floor === 100) {
                if (difficulty === 1) earn('dungeon_012');
                if (difficulty === 2) earn('dungeon_013');
                if (difficulty === 3) earn('dungeon_014');
            }

        } else if (trigger === 'levelUp') {
            const { level } = context;
            const levelMap = {
                10: 'chall_001', 20: 'chall_002', 30: 'chall_003', 40: 'chall_004',
                50: 'chall_005', 60: 'chall_006', 70: 'chall_007', 80: 'chall_008',
                90: 'chall_009', 100: 'chall_010',
            };
            for (const [thStr, id] of Object.entries(levelMap)) {
                if (level >= parseInt(thStr)) earn(id);
            }

        } else if (trigger === 'critical') {
            const count = this._getCounter(stickers, '_criticalCount') + 1;
            this._setCounter(stickers, '_criticalCount', count);
            changed = true;
            if (count >= 10)  earn('battle_003');
            if (count >= 50)  earn('battle_004');
            if (count >= 100) earn('battle_005');

        } else if (trigger === 'specialMove') {
            const count = this._getCounter(stickers, '_specialMoveCount') + 1;
            this._setCounter(stickers, '_specialMoveCount', count);
            changed = true;
            if (count >= 10)  earn('battle_006');
            if (count >= 50)  earn('battle_007');
            if (count >= 100) earn('battle_008');
        }

        if (changed) {
            this.storage.saveStickers(stickers);
            if (this._pendingQueue.length > 0) {
                this.storage.setNewStickers();
            }
        }
    }

    // ─────────────────────────────────────────
    // ポップアップ
    // ─────────────────────────────────────────

    _flushPending() {
        if (this._pendingQueue.length === 0 || this._isShowingPopup) return;
        this._showNextPopup();
    }

    _showNextPopup() {
        if (this._pendingQueue.length === 0) {
            this._isShowingPopup = false;
            this._syncNewBadge();
            return;
        }
        this._isShowingPopup = true;
        const id = this._pendingQueue.shift();
        this._showPopup(id);
    }

    _showPopup(id) {
        const def = (window.STICKER_LIST || []).find(s => s.id === id);
        if (!def) { this._showNextPopup(); return; }

        const popup = document.getElementById('sticker-popup');
        if (!popup) { this._isShowingPopup = false; return; }

        const nameEl  = popup.querySelector('.sticker-popup-name');
        const badgeEl = popup.querySelector('.sticker-popup-badge');
        if (nameEl)  nameEl.textContent = `「${def.name}」`;
        if (badgeEl) {
            badgeEl.style.setProperty('--sticker-light', def.color.light);
            badgeEl.style.setProperty('--sticker-dark',  def.color.dark);
            badgeEl.textContent = def.emoji;
        }

        popup.classList.add('active');

        let dismissed = false;
        const dismiss = () => {
            if (dismissed) return;
            dismissed = true;
            clearTimeout(autoTimer);
            popup.removeEventListener('click', onTap);
            popup.classList.remove('active');
            setTimeout(() => this._showNextPopup(), 350);
        };

        const autoTimer = setTimeout(dismiss, 2500);
        const onTap = () => dismiss();
        popup.addEventListener('click', onTap, { once: true });
    }

    // NEWバッジの表示状態を同期する
    _syncNewBadge() {
        const badge = document.getElementById('note-hub-sticker-new-badge');
        if (!badge) return;
        badge.style.display = this.storage.hasNewStickers() ? '' : 'none';
    }

    // ─────────────────────────────────────────
    // シール画面用: 取得済み件数
    // ─────────────────────────────────────────

    getEarnedCount() {
        const stickers = this.storage.loadStickers();
        return (window.STICKER_LIST || []).filter(s => stickers[s.id]?.earned).length;
    }

    getTotalCount() {
        return (window.STICKER_LIST || []).length;
    }
}
