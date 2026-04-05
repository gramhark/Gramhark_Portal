/* MonsterHouseManager: モンスターハウス画面の管理 */
class MonsterHouseManager {
    constructor(game) {
        this.game = game;
        this.storage = game.storage;
        this.sound = game.sound;
        this.ui = game.ui;
        this._currentTab = 'monster';
        this._monsterSortKey = 'capturedAt'; // 'capturedAt' | 'name'
        this._medalSortKey = 'name'; // 'name' | 'effect'
        this._selectedMonsterName = null; // 詳細パネルで選択中のモンスター名
        this._farewell = false; // おわかれタブかどうか
        this._farewellSortKey = 'capturedAt'; // 'capturedAt' | 'name'
    }

    /** コンテンツエリア要素取得 */
    _getContentArea() {
        return document.querySelector('#monster-house-screen .mh-content-area');
    }

    /** コンテンツエリア表示 */
    _showContentArea() {
        const el = this._getContentArea();
        if (el) el.classList.remove('mh-hidden');
    }

    /** コンテンツエリア非表示 */
    _hideContentArea() {
        const el = this._getContentArea();
        if (el) el.classList.add('mh-hidden');
    }

    /** モンスターハウス入室時 */
    onEnter() {
        this._currentTab = null;
        this._selectedMonsterName = null;
        this._farewell = false;
        this._renderClerkQuote('enter');

        const pendingNotifications = this._collectPendingBerryNotifications();
        if (pendingNotifications.length > 0) {
            this._showNotificationQueue(pendingNotifications, () => this._onEnterAfterNotifications());
            return;
        }
        this._onEnterAfterNotifications();
    }

    /** 通知完了後の入室処理 */
    _onEnterAfterNotifications() {
        const companions = this.storage.loadCompanions();
        if (Object.keys(companions).length > 50) {
            this._showOverflowFlow();
            return;
        }
        this._hideContentArea();
        this._updateTabButtons();
    }

    /**
     * 未通知のゆうじょうのみ解放情報を収集する（フラグはまだ立てない）。
     * @returns {{ tier: number, message: string }[]}
     */
    _collectPendingBerryNotifications() {
        const companions = this.storage.loadCompanions();
        const count = Object.keys(companions).length;
        const notifications = [];

        const tiers = [
            { tier: 30, threshold: 0, name: 'ゆうじょうのみ★30★' },
            { tier: 60, threshold: 10, name: 'ゆうじょうのみ★60★' },
            { tier: 90, threshold: 20, name: 'ゆうじょうのみ★90★' },
            { tier: 100, threshold: 30, name: 'ゆうじょうのみ★100★' },
        ];
        for (const { tier, threshold, name } of tiers) {
            if (count >= threshold && !this.storage.isBerryNotified(tier)) {
                notifications.push({ tier, message: `ショップに<br>${name}が<br>ついかされた！` });
            }
        }
        return notifications;
    }

    /**
     * 通知バブルをキューで順番に表示し、表示完了後にフラグを立てる。
     * バブル要素が存在しない場合はフラグを立てずに終了する。
     * @param {{ tier: number, message: string }[]} notifications
     * @param {Function} onComplete
     */
    _showNotificationQueue(notifications, onComplete) {
        const bubble = document.getElementById('game-notification-bubble');
        if (!bubble) { onComplete(); return; }
        const show = (i) => {
            if (i >= notifications.length) { onComplete(); return; }
            const { tier, message } = notifications[i];
            bubble.innerHTML = message;
            bubble.classList.add('active');
            setTimeout(() => {
                bubble.classList.remove('active');
                this.storage.setBerryNotified(tier);
                setTimeout(() => show(i + 1), 400);
            }, 3000);
        };
        show(0);
    }

    /** リアクションメッセージ表示（shop-msg-overlay と同じ仕組み） */
    showMhMsg(msg) {
        const ov = document.getElementById('mh-msg-overlay');
        if (!ov) return;
        document.getElementById('mh-msg-text').textContent = msg;
        ov.classList.add('active');
        if (this._mhMsgTimeout) clearTimeout(this._mhMsgTimeout);
        this._mhMsgTimeout = setTimeout(() => ov.classList.remove('active'), 1000);
    }

    /** 退室可否チェック */
    canLeave() {
        const activeCompanionName = this.storage.loadActiveCompanion();
        if (!activeCompanionName) return true;
        const companionMedals = this.storage.loadCompanionMedals();
        if (companionMedals[activeCompanionName]) return true;
        // メダル未装備の場合
        this.showMhMsg('モンスターに\nメダルがついていないよ！');
        return false;
    }

    /** 退室アニメーション用セリフ */
    onLeave() {
        const quoteEl = document.getElementById('mh-clerk-quote');
        if (quoteEl) quoteEl.innerHTML = 'またきてね！';
    }

    /** セリフ更新 */
    _renderClerkQuote(mode) {
        const el = document.getElementById('mh-clerk-quote');
        if (!el) return;
        if (mode === 'enter') {
            el.innerHTML = 'やっほー！';
            const companions = this.storage.loadCompanions();
            const count = Object.keys(companions).length;
            setTimeout(() => {
                if (count === 0) {
                    el.innerHTML = 'ショップのおじさんから<br>ゆうじょうのみ★30★をかって<br>モンスターをつかまえてね！';
                } else {
                    const msgs = [
                        'おきにいりの モンスターに<br>ダンジョンで てにいれた<br>メダルをつけてあげてね！',
                        'つけたメダルの しゅるいで<br>こうかが かわるよ<br>いろいろ ためしてね！',
                        '★がおおいダンジョンは<br>いいメダルがでやすいよ！<br>がんばってね！',
                        'モンスターハウスに<br>いれておけるのは<br>50ひきまでだよ！',
                    ];
                    el.innerHTML = msgs[Math.floor(Math.random() * msgs.length)];
                }
            }, 1500);
        }
    }

    /** 51匹超過フロー */
    _showOverflowFlow() {
        const quoteEl = document.getElementById('mh-clerk-quote');
        if (quoteEl) quoteEl.innerHTML = 'もうはいらないから<br>１ひきおわかれしてね';
        this._currentTab = 'farewell';
        this._farewell = true;
        this._updateTabButtons();
        this._showContentArea();
        this._renderFarewellGrid(true); // immediate=true: 確認なし即削除
    }

    /** タブ切り替えボタン更新 */
    _updateTabButtons() {
        ['monster', 'medal', 'farewell'].forEach(tab => {
            const btn = document.getElementById(`mh-tab-${tab}`);
            if (btn) btn.classList.toggle('active', this._currentTab === tab);
        });
    }

    /** タブ切り替え */
    switchTab(tab) {
        this._currentTab = tab;
        this._selectedMonsterName = null;
        this._farewell = (tab === 'farewell');
        this._updateTabButtons();
        this._renderTab(tab);
    }

    _renderTab(tab) {
        this._showContentArea();

        const monsterPanel = document.getElementById('mh-panel-monster');
        const medalPanel = document.getElementById('mh-panel-medal');
        const farewellPanel = document.getElementById('mh-panel-farewell');
        if (monsterPanel) monsterPanel.style.display = tab === 'monster' ? '' : 'none';
        if (medalPanel) medalPanel.style.display = tab === 'medal' ? '' : 'none';
        if (farewellPanel) farewellPanel.style.display = tab === 'farewell' ? '' : 'none';

        if (tab === 'monster') this._renderMonsterGrid();
        else if (tab === 'medal') this._renderMedalGrid();
        else if (tab === 'farewell') this._renderFarewellGrid(false);
    }

    // ==================== モンスタータブ ====================

    _renderMonsterGrid() {
        const grid = document.getElementById('mh-monster-grid');
        const detailPanel = document.getElementById('mh-monster-detail');
        const medalSubPanel = document.getElementById('mh-medal-sub');
        if (!grid) return;
        if (detailPanel) detailPanel.style.display = 'none';
        if (medalSubPanel) medalSubPanel.style.display = 'none';
        grid.style.display = '';

        const companions = this.storage.loadCompanions();
        const activeCompanionName = this.storage.loadActiveCompanion();
        const companionMedals = this.storage.loadCompanionMedals();
        const list = Object.values(companions);

        // ソート
        if (this._monsterSortKey === 'name') {
            list.sort((a, b) => (a.name || '').localeCompare(b.name || '', 'ja'));
        } else {
            list.sort((a, b) => (b.capturedAt || 0) - (a.capturedAt || 0));
        }

        grid.innerHTML = '';

        // ソートバー
        const sortBar = document.createElement('div');
        sortBar.className = 'mh-sort-bar';
        [['capturedAt', 'なかまじゅん'], ['name', 'なまえじゅん']].forEach(([key, label]) => {
            const btn = document.createElement('button');
            btn.className = 'mh-sort-btn' + (this._monsterSortKey === key ? ' active' : '');
            btn.textContent = label + (this._monsterSortKey === key ? '▼' : '');
            btn.addEventListener('click', () => {
                this.sound.playSe('equip_sort');
                this._monsterSortKey = key;
                this._renderMonsterGrid();
            });
            sortBar.appendChild(btn);
        });
        grid.appendChild(sortBar);

        if (list.length === 0) {
            const msg = document.createElement('p');
            msg.className = 'mh-empty-msg';
            msg.textContent = 'なかまがいないよ\nゆうじょうのみを つかって つかまえてね！';
            grid.appendChild(msg);
            return;
        }

        const cardContainer = document.createElement('div');
        cardContainer.className = 'mh-monster-card-grid';
        list.forEach(companion => {
            const card = document.createElement('div');
            card.className = 'mh-monster-card';
            const isActive = companion.name === activeCompanionName;
            if (isActive) card.classList.add('active-partner');
            const medalId = companionMedals[companion.name];
            const medal = medalId && window.MEDAL_LIST ? window.MEDAL_LIST.find(m => m.id === medalId) : null;

            card.innerHTML = `
                <img src="${companion.imageSrc || ''}" class="mh-monster-card-img" alt="${companion.name}" onerror="this.removeAttribute('src')">
                <div class="mh-monster-card-name">${companion.name}</div>
                ${medal ? `<div class="mh-medal-badge">${medal.name.replace(/（.*?）/, '')}</div>` : ''}
                ${isActive ? '<div class="mh-partner-badge">パートナー</div>' : ''}
            `;
            card.addEventListener('click', () => {
                this.sound.playSe('note_grid');
                this._showMonsterDetail(companion.name);
            });
            cardContainer.appendChild(card);
        });
        grid.appendChild(cardContainer);
    }

    _showMonsterDetail(name) {
        const companions = this.storage.loadCompanions();
        const companion = companions[name];
        if (!companion) return;
        this._selectedMonsterName = name;

        const grid = document.getElementById('mh-monster-grid');
        const detailPanel = document.getElementById('mh-monster-detail');
        const medalSubPanel = document.getElementById('mh-medal-sub');
        if (grid) grid.style.display = 'none';
        if (medalSubPanel) medalSubPanel.style.display = 'none';
        if (!detailPanel) return;
        detailPanel.style.display = '';

        const activeCompanionName = this.storage.loadActiveCompanion();
        const companionMedals = this.storage.loadCompanionMedals();
        const medalId = companionMedals[name];
        const medal = medalId && window.MEDAL_LIST ? window.MEDAL_LIST.find(m => m.id === medalId) : null;

        const isActivePartner = name === activeCompanionName;
        detailPanel.classList.toggle('mh-detail-panel--partner', isActivePartner);
        detailPanel.innerHTML = `
            ${isActivePartner ? '<div class="mh-detail-partner-badge">パートナー</div>' : ''}
            <div class="mh-detail-img-wrapper">
                <img src="${companion.imageSrc || ''}" class="mh-monster-detail-img" alt="${companion.name}" onerror="this.removeAttribute('src')">
            </div>
            <div class="mh-monster-detail-name">${companion.name}</div>
            ${medal ? `<div class="mh-detail-medal-label"><img src="assets/image/item/medal/${medal.img}" class="mh-detail-medal-icon" alt="${medal.name}">${medal.name}</div>` : '<div class="mh-detail-medal-label mh-no-medal">メダルなし</div>'}
            <div class="mh-detail-buttons">
                <button class="primary-btn mh-detail-btn" id="mh-detail-partner-btn">${isActivePartner ? 'つれていかない' : 'つれていく'}</button>
                <button class="green-btn mh-detail-btn" id="mh-detail-medal-btn">メダルをつける</button>
                <button class="orange-btn mh-detail-btn" id="mh-detail-medal-remove-btn"${!medal ? ' disabled' : ''}>メダルをはずす</button>
                <button class="orange-btn mh-detail-btn" id="mh-detail-back-btn">やめる</button>
            </div>
        `;

        document.getElementById('mh-detail-partner-btn').addEventListener('click', () => {
            this.sound.playSe('btn');
            if (name === activeCompanionName) {
                this.storage.saveActiveCompanion(null);
            } else {
                this.storage.saveActiveCompanion(name);
            }
            this._showMonsterDetail(name);
        });
        document.getElementById('mh-detail-medal-btn').addEventListener('click', () => {
            this.sound.playSe('btn');
            this._showMedalSubPanel(name);
        });
        document.getElementById('mh-detail-medal-remove-btn').addEventListener('click', () => {
            if (!medal) return;
            this.sound.playSe('equip_remove');
            const updated = this.storage.loadCompanionMedals();
            delete updated[name];
            this.storage.saveCompanionMedals(updated);
            this._showMonsterDetail(name);
        });
        document.getElementById('mh-detail-back-btn').addEventListener('click', () => {
            this.sound.playSe('back');
            detailPanel.classList.remove('mh-detail-panel--partner');
            detailPanel.style.display = 'none';
            grid.style.display = '';
            this._renderMonsterGrid();
        });
    }

    _showMedalSubPanel(monsterName) {
        const detailPanel = document.getElementById('mh-monster-detail');
        const medalSubPanel = document.getElementById('mh-medal-sub');
        if (detailPanel) detailPanel.style.display = 'none';
        if (!medalSubPanel) return;
        medalSubPanel.style.display = '';

        const medals = this.storage.loadMedals();
        const companionMedals = this.storage.loadCompanionMedals();
        const currentMedalId = companionMedals[monsterName];

        // ソートバー
        let sortKey = this._medalSortKey || 'name';

        const renderSub = () => {
            medalSubPanel.innerHTML = '';
            const header = document.createElement('div');
            header.className = 'mh-medal-sub-header';
            header.innerHTML = `<span>メダルをえらんでね</span>`;
            medalSubPanel.appendChild(header);

            const sortBar = document.createElement('div');
            sortBar.className = 'mh-sort-bar';
            [['name', 'なまえじゅん'], ['effect', 'こうかじゅん']].forEach(([key, label]) => {
                const btn = document.createElement('button');
                btn.className = 'mh-sort-btn' + (sortKey === key ? ' active' : '');
                btn.textContent = label;
                btn.addEventListener('click', () => { this.sound.playSe('equip_sort'); sortKey = key; this._medalSortKey = key; renderSub(); });
                sortBar.appendChild(btn);
            });
            medalSubPanel.appendChild(sortBar);

            const ownedMedals = window.MEDAL_LIST
                ? window.MEDAL_LIST.filter(m => (medals[m.id] || 0) > 0)
                : [];

            if (sortKey === 'name') {
                ownedMedals.sort((a, b) => (a.name || '').localeCompare(b.name || '', 'ja'));
            } else {
                ownedMedals.sort((a, b) => (b.value || 0) - (a.value || 0));
            }

            const cardGrid = document.createElement('div');
            cardGrid.className = 'mh-medal-card-grid';

            if (ownedMedals.length === 0) {
                const msg = document.createElement('p');
                msg.className = 'mh-empty-msg';
                msg.textContent = 'ボスをたおしてメダルをてにいれよう！';
                cardGrid.appendChild(msg);
            }

            ownedMedals.forEach(medal => {
                const count = medals[medal.id] || 0;
                const isEquipped = medal.id === currentMedalId;
                const card = document.createElement('div');
                card.className = 'mh-medal-card' + (isEquipped ? ' equipped' : '');
                const rarityClass = `rarity-${medal.rarity}`;
                card.innerHTML = `
                    <img src="assets/image/item/medal/${medal.img}" class="mh-medal-card-img ${rarityClass}" alt="${medal.name}" onerror="this.style.display='none'">
                    <div class="mh-medal-card-name">${medal.name}</div>
                    <div class="mh-medal-card-count">×${count}</div>
                    ${isEquipped ? '<div class="mh-medal-equipped-badge">そうびちゅう</div>' : ''}
                `;
                card.addEventListener('click', () => {
                    if (isEquipped) return;
                    this.sound.playSe('equip_set');
                    const updated = this.storage.loadCompanionMedals();
                    if (updated[monsterName] === medal.id) {
                        delete updated[monsterName];
                    } else {
                        updated[monsterName] = medal.id;
                    }
                    this.storage.saveCompanionMedals(updated);
                    medalSubPanel.style.display = 'none';
                    if (detailPanel) {
                        detailPanel.style.display = '';
                        this._showMonsterDetail(monsterName);
                    }
                });
                cardGrid.appendChild(card);
            });

            medalSubPanel.appendChild(cardGrid);

            const backBtn = document.createElement('button');
            backBtn.className = 'orange-btn mh-detail-btn';
            backBtn.textContent = 'もどる';
            backBtn.addEventListener('click', () => {
                this.sound.playSe('back');
                medalSubPanel.style.display = 'none';
                if (detailPanel) {
                    detailPanel.style.display = '';
                    this._showMonsterDetail(monsterName);
                }
            });
            const backBtnWrapper = document.createElement('div');
            backBtnWrapper.className = 'mh-detail-buttons';
            backBtnWrapper.appendChild(backBtn);
            medalSubPanel.appendChild(backBtnWrapper);
        };

        renderSub();
    }

    // ==================== メダルタブ ====================

    _renderMedalGrid() {
        const container = document.getElementById('mh-medal-list');
        if (!container) return;
        container.innerHTML = '';
        if (!window.MEDAL_LIST) return;

        const medals = this.storage.loadMedals();
        const ownedMedals = window.MEDAL_LIST.filter(m => (medals[m.id] || 0) > 0);

        if (ownedMedals.length === 0) {
            const msg = document.createElement('p');
            msg.className = 'mh-empty-msg';
            msg.textContent = 'メダルがないよ\nダンジョンのボスを たおして\nメダルをてにいれよう！';
            container.appendChild(msg);
            return;
        }

        let sortKey = this._medalTabSortKey || 'name';

        const render = () => {
            container.innerHTML = '';

            const sortBar = document.createElement('div');
            sortBar.className = 'mh-sort-bar';
            [['name', 'なまえじゅん'], ['effect', 'こうかじゅん']].forEach(([key, label]) => {
                const btn = document.createElement('button');
                btn.className = 'mh-sort-btn' + (sortKey === key ? ' active' : '');
                btn.textContent = label;
                btn.addEventListener('click', () => {
                    this.sound.playSe('equip_sort');
                    sortKey = key;
                    this._medalTabSortKey = key;
                    render();
                });
                sortBar.appendChild(btn);
            });
            container.appendChild(sortBar);

            const sorted = [...ownedMedals];
            if (sortKey === 'name') {
                sorted.sort((a, b) => (a.name || '').localeCompare(b.name || '', 'ja'));
            } else {
                sorted.sort((a, b) => (b.value || 0) - (a.value || 0));
            }

            const grid = document.createElement('div');
            grid.className = 'mh-medal-card-grid';
            sorted.forEach(medal => {
                const count = medals[medal.id] || 0;
                const rarityClass = `rarity-${medal.rarity}`;
                const card = document.createElement('div');
                card.className = 'mh-medal-card';
                card.innerHTML = `
                    <img src="assets/image/item/medal/${medal.img}" class="mh-medal-card-img ${rarityClass}" alt="${medal.name}" onerror="this.style.display='none'">
                    <div class="mh-medal-card-name">${medal.name}</div>
                    <div class="mh-medal-card-count">×${count}</div>
                `;
                card.addEventListener('click', () => {
                    this.sound.playSe('note_details');
                    this._showMedalDetail(medal);
                });
                grid.appendChild(card);
            });
            container.appendChild(grid);
        };

        render();
    }

    _showMedalDetail(medal) {
        const overlay = document.getElementById('mh-medal-detail-overlay');
        if (!overlay) return;
        const medals = this.storage.loadMedals();
        const count = medals[medal.id] || 0;
        const rarityLabel = { bronze: '銅', silver: '銀', gold: '金', diamond: 'ダイヤ' }[medal.rarity] || medal.rarity;
        const rarityColor = { bronze: '#cd7f32', silver: '#c0c0c0', gold: '#ffd700', diamond: '#b9f2ff' }[medal.rarity] || '#fff';

        overlay.innerHTML = `
            <div class="mh-medal-detail-content">
                <img src="assets/image/item/medal/${medal.img}" class="mh-medal-detail-img" alt="${medal.name}" onerror="this.style.display='none'">
                <div class="mh-medal-detail-name" style="color:${rarityColor}">${medal.name}</div>
                <div class="mh-medal-detail-rarity" style="color:${rarityColor}">レアリティ: ${rarityLabel}</div>
                <div class="mh-medal-detail-effect">${medal.desc}</div>
                <div class="mh-medal-detail-count">もちすう: ${count}まい</div>
                <div class="mh-detail-buttons">
                    <button class="orange-btn mh-detail-btn" id="mh-medal-detail-close">とじる</button>
                </div>
            </div>
        `;
        overlay.classList.add('active');
        document.getElementById('mh-medal-detail-close').addEventListener('click', () => {
            this.sound.playSe('btn');
            overlay.classList.remove('active');
        });
    }

    // ==================== おわかれタブ ====================

    _renderFarewellGrid(immediate) {
        const grid = document.getElementById('mh-farewell-grid');
        if (!grid) return;
        grid.innerHTML = '';

        const companions = this.storage.loadCompanions();
        const activeCompanionName = this.storage.loadActiveCompanion();
        const companionMedals = this.storage.loadCompanionMedals();
        const list = Object.values(companions);

        // ソート
        if (this._farewellSortKey === 'name') {
            list.sort((a, b) => (a.name || '').localeCompare(b.name || '', 'ja'));
        } else {
            list.sort((a, b) => (b.capturedAt || 0) - (a.capturedAt || 0));
        }

        // ソートバー
        const sortBar = document.createElement('div');
        sortBar.className = 'mh-sort-bar';
        [['capturedAt', 'なかまじゅん'], ['name', 'なまえじゅん']].forEach(([key, label]) => {
            const btn = document.createElement('button');
            btn.className = 'mh-sort-btn' + (this._farewellSortKey === key ? ' active' : '');
            btn.textContent = label + (this._farewellSortKey === key ? '▼' : '');
            btn.addEventListener('click', () => {
                this.sound.playSe('equip_sort');
                this._farewellSortKey = key;
                this._renderFarewellGrid(immediate);
            });
            sortBar.appendChild(btn);
        });
        grid.appendChild(sortBar);

        if (list.length === 0) {
            const msg = document.createElement('p');
            msg.className = 'mh-empty-msg';
            msg.textContent = 'なかまがいないよ';
            grid.appendChild(msg);
            return;
        }

        const cardContainer = document.createElement('div');
        cardContainer.className = 'mh-monster-card-grid';
        list.forEach(companion => {
            const card = document.createElement('div');
            card.className = 'mh-monster-card mh-farewell-card';
            const isActive = companion.name === activeCompanionName;
            if (isActive) card.classList.add('active-partner');
            const medalId = companionMedals[companion.name];
            const medal = medalId && window.MEDAL_LIST ? window.MEDAL_LIST.find(m => m.id === medalId) : null;

            card.innerHTML = `
                <img src="${companion.imageSrc || ''}" class="mh-monster-card-img" alt="${companion.name}" onerror="this.removeAttribute('src')">
                <div class="mh-monster-card-name">${companion.name}</div>
                ${medal ? `<div class="mh-medal-badge">${medal.name.replace(/（.*?）/, '')}</div>` : ''}
                ${isActive ? '<div class="mh-partner-badge">パートナー</div>' : ''}
            `;
            card.addEventListener('click', () => {
                this.sound.playSe('btn');
                if (immediate) {
                    this._doFarewell(companion.name, activeCompanionName);
                } else {
                    this._confirmFarewell(companion.name, activeCompanionName);
                }
            });
            cardContainer.appendChild(card);
        });
        grid.appendChild(cardContainer);
    }

    _confirmFarewell(name, activeCompanionName) {
        const overlay = document.getElementById('mh-farewell-confirm-overlay');
        if (!overlay) {
            this._doFarewell(name, activeCompanionName);
            return;
        }
        const msgEl = document.getElementById('mh-farewell-confirm-msg');
        if (msgEl) msgEl.textContent = `${name}と\nおわかれする？`;
        overlay.classList.add('active');

        const yesBtn = document.getElementById('mh-farewell-yes-btn');
        const noBtn = document.getElementById('mh-farewell-no-btn');
        const cleanup = () => {
            overlay.classList.remove('active');
            yesBtn.onclick = null;
            noBtn.onclick = null;
        };
        yesBtn.onclick = () => { this.sound.playSe('btn'); cleanup(); this._doFarewell(name, activeCompanionName); };
        noBtn.onclick = () => { this.sound.playSe('btn'); cleanup(); };
    }

    _doFarewell(name, activeCompanionName) {
        const companions = this.storage.loadCompanions();
        const companionMedals = this.storage.loadCompanionMedals();

        // メダル返却
        if (companionMedals[name]) {
            const medals = this.storage.loadMedals();
            medals[companionMedals[name]] = Math.min((medals[companionMedals[name]] || 0) + 1, 99);
            this.storage.saveMedals(medals);
            delete companionMedals[name];
            this.storage.saveCompanionMedals(companionMedals);
        }

        delete companions[name];
        this.storage.saveCompanions(companions);

        // activeがこのモンスターなら解除
        if (this.storage.loadActiveCompanion() === name) {
            this.storage.saveActiveCompanion(null);
        }
        if (this.storage.loadLastSelectedCompanion() === name) {
            this.storage.saveLastSelectedCompanion(null);
        }

        this._renderFarewellGrid(false);

        // 51匹超過フローを終了
        const count = Object.keys(companions).length;
        if (count <= 50 && this._farewell) {
            this._showOverflowResolved();
        }
    }

    _showOverflowResolved() {
        this._farewell = false;
        const quoteEl = document.getElementById('mh-clerk-quote');
        if (quoteEl) quoteEl.innerHTML = 'ありがとう！<br>これからもよろしくね！';
        this._currentTab = 'monster';
        this._updateTabButtons();
        this._renderTab('monster');
    }

    // ==================== メダル売却（ショップ統合） ====================

    getMedalSellItems() {
        if (!window.MEDAL_LIST) return [];
        const medals = this.storage.loadMedals();
        return window.MEDAL_LIST
            .filter(m => (medals[m.id] || 0) > 0)
            .map(m => ({ ...m, category: 'medal', count: medals[m.id] }));
    }

    executeMedalSell(medalId) {
        const medal = window.MEDAL_LIST ? window.MEDAL_LIST.find(m => m.id === medalId) : null;
        if (!medal) return false;
        const medals = this.storage.loadMedals();
        if ((medals[medal.id] || 0) <= 0) return false;
        medals[medal.id]--;
        if (medals[medal.id] <= 0) delete medals[medal.id];
        this.storage.saveMedals(medals);
        return true;
    }
}
