/* NoteManager: モンスターノート・アイテムノートの管理 */
class NoteManager {
    constructor(game) {
        this.game = game;
        this.storage = game.storage;
        this.sound = game.sound;
        this.ui = game.ui;
    }

    showNoteHub() {
        this.game.state = GameState.NOTE;
        document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
        document.getElementById('note-hub-screen').classList.add('active');
        this.ui.adjustScale();
        this._syncMonsterNewBadge();
        this._syncItemNewBadge();
        this._syncStickerNewBadge();
    }

    hideNoteHub() {
        this.game.state = GameState.TOP;
        document.getElementById('note-hub-screen').classList.remove('active');
        document.getElementById('main-screen').classList.add('active');
        this.ui.adjustScale();
    }

    showNote() {
        this.game.state = GameState.MONSTER_NOTE;
        document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
        document.getElementById('note-screen').classList.add('active');
        this.ui.adjustScale();
        document.getElementById('note-genre-select').style.display = '';
        document.getElementById('note-card-view').style.display = 'none';
        this._renderNoteGenreSelect();
        this._updateNoteProgress();
    }

    hideNote() {
        this.game.state = GameState.NOTE;
        document.getElementById('note-screen').classList.remove('active');
        document.getElementById('note-hub-screen').classList.add('active');
        this.ui.adjustScale();
        this._syncMonsterNewBadge();
    }

    showItemNote() {
        this.game.state = GameState.ITEM_NOTE;
        document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
        document.getElementById('item-note-screen').classList.add('active');
        this.ui.adjustScale();
        if (!this._itemNoteTab) this._itemNoteTab = 'けん';
        this._updateItemNoteTabs();
        this._renderItemNoteGrid();
        this._updateItemNoteProgress();
    }

    _switchItemNoteTab(tab) {
        this._itemNoteTab = tab;
        this._updateItemNoteTabs();
        this._renderItemNoteGrid();
    }

    _updateItemNoteTabs() {
        document.querySelectorAll('#item-note-tabs .item-note-tab-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.tab === this._itemNoteTab);
        });
    }

    hideItemNote() {
        this.game.state = GameState.NOTE;
        document.getElementById('item-note-screen').classList.remove('active');
        document.getElementById('note-hub-screen').classList.add('active');
        this.ui.adjustScale();
        this._syncItemNewBadge();
    }

    showSticker() {
        this.game.state = GameState.STICKER;
        document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
        document.getElementById('sticker-screen').classList.add('active');
        this.ui.adjustScale();
        this._renderStickerScreen();
    }

    hideSticker() {
        this.game.state = GameState.NOTE;
        document.getElementById('sticker-screen').classList.remove('active');
        document.getElementById('note-hub-screen').classList.add('active');
        this.ui.adjustScale();
        this._syncStickerNewBadge();
    }

    _renderStickerScreen(filterCat = 'all') {
        const stickers = this.storage.loadStickers();
        const total  = window.STICKER_LIST.length;
        const earned = window.STICKER_LIST.filter(s => stickers[s.id]?.earned).length;
        const pct    = total > 0 ? Math.round(earned / total * 100) : 0;

        const bar  = document.getElementById('sticker-progress-bar');
        const text = document.getElementById('sticker-progress-text');
        if (bar)  bar.style.width  = `${pct}%`;
        if (text) text.textContent = `${earned} / ${total}`;

        // タブのアクティブ状態
        document.querySelectorAll('.sticker-tab-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.cat === filterCat);
        });

        // グリッド描画
        const grid = document.getElementById('sticker-grid');
        if (!grid) return;
        grid.innerHTML = '';

        const list = filterCat === 'all'
            ? window.STICKER_LIST
            : window.STICKER_LIST.filter(s => s.category === filterCat);

        list.forEach(def => {
            const record   = stickers[def.id];
            const isEarned = !!(record?.earned);
            const isNew    = isEarned && !record?.seen;

            const cell = document.createElement('div');
            cell.className = 'sticker-cell' + (isEarned ? '' : ' locked');
            cell.dataset.id = def.id;

            const badge = document.createElement('div');
            badge.className = 'sticker-badge' + (isEarned ? '' : ' locked');
            badge.style.setProperty('--sticker-light', def.color.light);
            badge.style.setProperty('--sticker-dark',  def.color.dark);
            badge.textContent = def.emoji;

            // バッジ＋NEWバッジのラッパー（NEWバッジの基準点）
            const wrap = document.createElement('div');
            wrap.className = 'sticker-badge-wrap';
            wrap.appendChild(badge);
            if (isNew) {
                const nb = document.createElement('span');
                nb.className = 'sticker-cell-new-badge';
                nb.textContent = 'NEW';
                wrap.appendChild(nb);
            }
            cell.appendChild(wrap);
            cell.addEventListener('click', () => this._showStickerDetail(def, record, isEarned));
            grid.appendChild(cell);
        });
    }

    _showStickerDetail(def, record, isEarned = true) {
        const overlay = document.getElementById('sticker-detail-overlay');
        if (!overlay) return;

        const badge = document.getElementById('sticker-detail-badge');
        badge.style.setProperty('--sticker-light', def.color.light);
        badge.style.setProperty('--sticker-dark',  def.color.dark);
        badge.textContent = def.emoji;
        badge.classList.toggle('locked', !isEarned);

        const nameEl = document.getElementById('sticker-detail-name');
        nameEl.textContent = isEarned ? def.name : '???';
        nameEl.classList.toggle('locked', !isEarned);

        document.getElementById('sticker-detail-desc').textContent = def.desc;

        const dateEl = document.getElementById('sticker-detail-date');
        if (isEarned && record?.earnedAt) {
            const d = new Date(record.earnedAt);
            const y = d.getFullYear();
            const m = String(d.getMonth() + 1).padStart(2, '0');
            const day = String(d.getDate()).padStart(2, '0');
            dateEl.textContent = `${y}/${m}/${day} にとれた！`;
        } else if (!isEarned) {
            dateEl.textContent = 'まだとれていない...';
            dateEl.style.color = '#666';
        } else {
            dateEl.textContent = '';
        }

        overlay.classList.add('active');
        this.sound.playSe('note_details');

        // 取得済みシールを「見た」としてマーク → セル内NEWバッジを消す
        if (isEarned && !record?.seen) {
            const stickers = this.storage.loadStickers();
            if (stickers[def.id]) {
                stickers[def.id].seen = true;
                this.storage.saveStickers(stickers);
            }
            const cell = document.querySelector(`.sticker-cell[data-id="${def.id}"]`);
            if (cell) {
                const nb = cell.querySelector('.sticker-cell-new-badge');
                if (nb) nb.remove();
            }
            this._syncStickerNewBadge();
        }
    }

    _getNoteTabDefs() {
        return [
            { label: '1～10', folder: 'Normal', filter: f => f.startsWith('01_') },
            { label: '11～20', folder: 'Normal', filter: f => f.startsWith('02_') },
            { label: '21～30', folder: 'Normal', filter: f => f.startsWith('03_') },
            { label: '31～40', folder: 'Normal', filter: f => f.startsWith('04_') },
            { label: '41～50', folder: 'Normal', filter: f => f.startsWith('05_') },
            { label: '51～60', folder: 'Normal', filter: f => f.startsWith('06_') },
            { label: '61～70', folder: 'Normal', filter: f => f.startsWith('07_') },
            { label: '71～80', folder: 'Normal', filter: f => f.startsWith('08_') },
            { label: '81～90', folder: 'Normal', filter: f => f.startsWith('09_') },
            { label: '91～100', folder: 'Normal', filter: f => f.startsWith('10_') },
            { label: 'ボス', folder: 'Boss', filter: f => /^boss\d+_/i.test(f) && !/next_/i.test(f) },
            { label: 'とくべつ', folder: 'Special', filter: f => /^special_/i.test(f) },
            { label: 'かいふく', folder: 'Heal', filter: f => /^heal_/i.test(f) },
            { label: 'レア', folder: 'Rare', filter: f => /^d\d+_/i.test(f) },
            { label: 'げきレア', folder: 'SuperRare', filter: f => /^srare_/i.test(f) },
        ];
    }

    _updateNoteProgress(filterList = null) {
        const collection = this.storage.loadMonsterCollection();
        let list;
        if (filterList) {
            list = filterList;
        } else {
            const assets = getMonsterAssets();
            const tabs = this._getNoteTabDefs();
            const getLists = () => {
                if (assets._legacy) {
                    return tabs.map(tab => assets._legacy.filter(tab.filter));
                }
                return tabs.map(tab => (assets[tab.folder] || []).filter(tab.filter));
            };
            list = getLists().flat();
        }
        const totalCount = list.length;
        const totalDefeated = list.filter(f => {
            const name = this._getMonsterName(f);
            return !!(collection[name] && collection[name].defeated);
        }).length;
        const pct = totalCount > 0 ? Math.floor(totalDefeated / totalCount * 100) : 0;
        const textEl = document.getElementById('note-progress-text');
        const pctEl = document.getElementById('note-progress-pct');
        const barEl = document.getElementById('note-progress-bar');
        if (textEl) textEl.textContent = `${totalDefeated}/${totalCount}たい`;
        if (pctEl) pctEl.textContent = `（${pct}%）`;
        if (barEl) barEl.style.width = `${pct}%`;
    }

    _renderNoteGenreSelect() {
        const el = document.getElementById('note-genre-select');
        el.innerHTML = '';
        const assets = getMonsterAssets();
        const collection = this.storage.loadMonsterCollection();
        const monsterNew = this.storage.loadMonsterNew();
        const tabs = this._getNoteTabDefs();

        if (assets._legacy) {
            // 旧構造: 全ファイルをプレフィックスで分類
            const all = assets._legacy;
            const legacyTabs = tabs.map(tab => {
                const list = all.filter(f => tab.filter(f));
                return { ...tab, folder: '', list };
            }).filter(t => t.list.length > 0);
            legacyTabs.forEach(tab => this._appendGenreBtn(el, tab, tab.list, collection, monsterNew));
        } else {
            tabs.forEach(tab => {
                const list = (assets[tab.folder] || []).filter(tab.filter);
                if (list.length === 0) return;
                this._appendGenreBtn(el, tab, list, collection, monsterNew);
            });
        }
    }

    _appendGenreBtn(container, tab, list, collection, monsterNew = {}) {
        const defeated = list.filter(f => {
            const name = this._getMonsterName(f);
            return !!(collection[name] && collection[name].defeated);
        }).length;
        const isCompleted = list.length > 0 && defeated === list.length;
        const hasNew = list.some(f => {
            const name = this._getMonsterName(f);
            return !!(collection[name] && collection[name].defeated && monsterNew[name]);
        });
        const btn = document.createElement('button');
        btn.className = 'note-genre-btn' + (isCompleted ? ' note-genre-completed' : '');
        btn.innerHTML = `<span class="note-genre-label">${tab.label}</span>`
            + `<span class="note-genre-count-row">`
            + `<span class="note-genre-count">${defeated}/${list.length}</span>`
            + (isCompleted ? `<span class="note-genre-medal">◎</span>` : '')
            + `</span>`
            + (hasNew ? `<span class="note-genre-new-badge">NEW</span>` : '');
        btn.addEventListener('click', () => { this.sound.playSe('note_grid'); this._showNoteCategory(tab, list); });
        container.appendChild(btn);
    }

    _showNoteCategory(tab, list) {
        this._currentCategoryList = list;
        document.getElementById('note-genre-select').style.display = 'none';
        document.getElementById('note-card-view').style.display = 'flex';
        document.getElementById('note-current-category').textContent = tab.label;
        this._updateNoteProgress(list);
        const grid = document.getElementById('note-grid');
        grid.innerHTML = '';
        const collection = this.storage.loadMonsterCollection();
        const monsterNew = this.storage.loadMonsterNew();
        list.forEach(f => this._addNoteCard(grid, f, tab.folder, collection, monsterNew));
        requestAnimationFrame(() => this._fitNoteCardNames());
    }

    _fitNoteCardNames(selector = '#note-grid .note-name') {
        document.querySelectorAll(selector).forEach(el => {
            el.style.fontSize = '';
            let size = parseFloat(getComputedStyle(el).fontSize);
            while (el.scrollWidth > el.offsetWidth && size > 8) {
                size -= 1;
                el.style.fontSize = size + 'px';
            }
        });
    }

    _addNoteCard(grid, filename, folder, collection, monsterNew = {}) {
        const displayName = this._getMonsterName(filename);
        const record = collection[displayName];
        const isDefeated = !!(record && record.defeated);
        const isNew = isDefeated && !!monsterNew[displayName];
        // Normal はサブフォルダ構成: "NN_name.webp" → "Normal/NN/NN_name.webp"
        let resolvedFilename = filename;
        if (folder === 'Normal') {
            const subMatch = filename.match(/^(\d+)_/);
            if (subMatch) resolvedFilename = `${subMatch[1]}/${filename}`;
        }
        const imgPath = folder
            ? `assets/image/monster/${folder}/${resolvedFilename}`
            : `assets/image/monster/${filename}`;

        // Rare/Boss の出現フロア番号を抽出
        let floorLabel = null;
        if (folder === 'Rare') {
            const m = filename.match(/^d(\d+)_/i);
            if (m) {
                const floor = parseInt(m[1], 10);
                if (floor > 0) floorLabel = `ダンジョン${floor}`;
            }
        } else if (folder === 'Boss') {
            const m = filename.match(/^boss(\d+)_/i);
            if (m) {
                const floor = parseInt(m[1], 10);
                if (floor > 0) floorLabel = `ダンジョン${floor}`;
            }
        }

        const card = document.createElement('div');
        card.className = 'note-card';
        const imgContainer = document.createElement('div');
        imgContainer.className = 'note-img-container';
        const imgEl = document.createElement('img');
        imgEl.src = imgPath;
        imgEl.className = 'note-img';
        const nameEl = document.createElement('div');
        nameEl.className = 'note-name';
        if (!isDefeated) {
            card.classList.add('undefeated');
            imgEl.classList.add('silhouette');
            nameEl.textContent = '？？？';
        } else {
            nameEl.textContent = displayName;
            if (isNew) {
                const nb = document.createElement('span');
                nb.className = 'note-card-new-badge';
                nb.textContent = 'NEW';
                card.appendChild(nb);
            }
            card.addEventListener('click', () => {
                // 「見た」としてマーク
                const newData = this.storage.loadMonsterNew();
                if (newData[displayName]) {
                    delete newData[displayName];
                    this.storage.saveMonsterNew(newData);
                    const nb = card.querySelector('.note-card-new-badge');
                    if (nb) nb.remove();
                    this._syncMonsterNewBadge();
                }
                this.sound.playSe('note_details');
                this.ui.openImageModal(imgPath, displayName, record, false, null, (text) => {
                    this.storage.saveMonsterDiary(displayName, text);
                    record.diary = text;
                });
            });
        }
        imgContainer.appendChild(imgEl);
        card.appendChild(imgContainer);
        card.appendChild(nameEl);
        if (isDefeated) {
            const ft = (record && typeof record.fastestTime === 'object') ? record.fastestTime : { 1: null, 2: null, 3: null };
            const diffs = [
                { key: 1, stars: '★', cls: 'diff-bronze' },
                { key: 2, stars: '★★', cls: 'diff-silver' },
                { key: 3, stars: '★★★', cls: 'diff-malle' },
            ];
            const badgesEl = document.createElement('div');
            badgesEl.className = 'note-diff-badges';
            diffs.forEach(({ key, stars, cls }) => {
                const time = ft[key];
                const cleared = time !== null && time !== undefined;
                const row = document.createElement('div');
                row.className = 'note-diff-row';
                const badge = document.createElement('span');
                badge.className = `diff-badge ${cls}${cleared ? ' cleared' : ''}`;
                badge.textContent = '●';
                const starsEl = document.createElement('span');
                starsEl.className = 'diff-stars';
                starsEl.textContent = stars;
                const timeEl = document.createElement('span');
                timeEl.className = 'diff-time';
                timeEl.textContent = cleared ? `${time.toFixed(1)}びょう` : '--';
                row.appendChild(badge);
                row.appendChild(starsEl);
                row.appendChild(timeEl);
                badgesEl.appendChild(row);
            });
            card.appendChild(badgesEl);
        }
        if (floorLabel) {
            const floorEl = document.createElement('div');
            floorEl.className = 'note-floor-label';
            floorEl.textContent = floorLabel;
            card.appendChild(floorEl);
        }
        grid.appendChild(card);
    }

    _backToGenreSelect() {
        // カテゴリ内の未確認NEWフラグをすべてクリアしてからジャンル選択を再描画
        if (this._currentCategoryList) {
            const newData = this.storage.loadMonsterNew();
            let changed = false;
            this._currentCategoryList.forEach(f => {
                const name = this._getMonsterName(f);
                if (newData[name]) {
                    delete newData[name];
                    changed = true;
                }
            });
            if (changed) this.storage.saveMonsterNew(newData);
            this._currentCategoryList = null;
        }
        document.getElementById('note-card-view').style.display = 'none';
        document.getElementById('note-genre-select').style.display = '';
        this._renderNoteGenreSelect();
        this._updateNoteProgress();
    }

    _renderNoteGrid() {
        document.getElementById('note-genre-select').style.display = '';
        document.getElementById('note-card-view').style.display = 'none';
        this._renderNoteGenreSelect();
        this._updateNoteProgress();
    }

    _updateItemNoteProgress() {
        const collection = this.storage.loadItemCollection();
        const equipList = window.EQUIPMENT_LIST || [];
        const allItems = [
            ...equipList.filter(e => e.type === 'sword').map(d => d.name),
            ...equipList.filter(e => e.type === 'shield').map(d => d.name),
            ...(window.ITEM_LIST || []).filter(d => !d.requiresUnlock || (d.requiresUnlock === 'monster_house' && this.storage.isMonsterHouseUnlocked())).map(d => d.name),
        ];
        const totalCount = allItems.length;
        const totalDefeated = allItems.filter(name => !!collection[name]).length;
        const pct = totalCount > 0 ? Math.floor(totalDefeated / totalCount * 100) : 0;
        const textEl = document.getElementById('item-note-progress-text');
        const pctEl = document.getElementById('item-note-progress-pct');
        const barEl = document.getElementById('item-note-progress-bar');
        if (textEl) textEl.textContent = `${totalDefeated}/${totalCount}こ`;
        if (pctEl) pctEl.textContent = `（${pct}%）`;
        if (barEl) barEl.style.width = `${pct}%`;
    }

    _renderItemNoteGrid() {
        const grid = document.getElementById('item-note-grid');
        if (!grid) return;
        grid.innerHTML = '';

        const collection = this.storage.loadItemCollection();
        const itemNew = this.storage.loadItemNew();

        const equipList = window.EQUIPMENT_LIST || [];
        const categories = [
            {
                label: 'けん',
                items: equipList.filter(e => e.type === 'sword').map(d => ({ name: d.name, img: d.img, dir: 'equipment/sword', attack: d.attack || 0, defense: d.defense || 0 }))
            },
            {
                label: 'たて',
                items: equipList.filter(e => e.type === 'shield').map(d => ({ name: d.name, img: d.img, dir: 'equipment/shield', attack: d.attack || 0, defense: d.defense || 0 }))
            },
            {
                label: 'どうぐ',
                items: (window.ITEM_LIST || []).filter(d => !d.requiresUnlock || (d.requiresUnlock === 'monster_house' && this.storage.isMonsterHouseUnlocked())).map(d => ({ name: d.name, img: d.img, dir: 'item', desc: d.desc }))
            },
        ];

        const activeCat = categories.find(c => c.label === (this._itemNoteTab || 'けん')) || categories[0];
        const activeCats = [activeCat];

        activeCats.forEach(cat => {
            cat.items.forEach(item => {
                const isRegistered = !!collection[item.name];
                const isItemNew = isRegistered && !!itemNew[item.name];
                const card = document.createElement('div');
                card.className = 'note-card';

                const imgContainer = document.createElement('div');
                imgContainer.className = 'note-img-container';

                const imgEl = document.createElement('img');
                imgEl.src = `assets/image/${item.dir}/${item.img}`;
                imgEl.className = 'note-img';

                const nameEl = document.createElement('div');
                nameEl.className = 'note-name';

                if (!isRegistered) {
                    card.classList.add('undefeated');
                    imgEl.classList.add('silhouette');
                    nameEl.textContent = '？？？';
                } else {
                    imgEl.classList.add('item-note-glow');
                    nameEl.textContent = item.name;
                    if (isItemNew) {
                        const nb = document.createElement('span');
                        nb.className = 'note-card-new-badge';
                        nb.textContent = 'NEW';
                        card.appendChild(nb);
                    }
                    const equipData = (item.attack !== undefined)
                        ? { attack: item.attack || 0, defense: item.defense || 0 }
                        : (item.desc ? { desc: item.desc } : null);
                    card.addEventListener('click', () => {
                        // 「見た」としてマーク
                        const newData = this.storage.loadItemNew();
                        if (newData[item.name]) {
                            delete newData[item.name];
                            this.storage.saveItemNew(newData);
                            const nb = card.querySelector('.note-card-new-badge');
                            if (nb) nb.remove();
                            this._syncItemNewBadge();
                        }
                        this.sound.playSe('note_details');
                        this.ui.openImageModal(`assets/image/${item.dir}/${item.img}`, item.name, null, true, equipData);
                    });
                }

                imgContainer.appendChild(imgEl);
                card.appendChild(imgContainer);
                card.appendChild(nameEl);
                grid.appendChild(card);
            });
        });
        requestAnimationFrame(() => this._fitNoteCardNames('#item-note-grid .note-name'));
    }

    _updateItemCollection(itemName) {
        const collection = this.storage.loadItemCollection();
        const isNewItem = !collection[itemName];
        this.storage.saveItemCollected(itemName);
        if (isNewItem) {
            const newData = this.storage.loadItemNew();
            newData[itemName] = true;
            this.storage.saveItemNew(newData);
        }
    }

    _getMonsterName(filename) {
        // ファイル名のみ取得（パスを除去）
        const basename = filename.split('/').pop();
        let name = basename.replace(/\.(webp|png|jpg|jpeg)$/i, '');
        name = name.replace(/^(rare_|heal_|special_|srare_|boss\d+next_|boss\d+_|\d+_|d\d+_|lastboss_)/i, '');
        return name;
    }

    _saveMonsterRecord(m, time) {
        // ファイル名の番号配変に対応するため、モンスター名をキーに使用
        const parts = m.imageSrc.split('/');
        const filename = parts[parts.length - 1];
        const monsterName = this._getMonsterName(filename);

        if (!monsterName) return false; // 画像なし → 登録スキップ

        const collection = this.storage.loadMonsterCollection();
        const d = this.game.difficulty || Difficulty.HARD;
        const isNew = !collection[monsterName];
        let record;
        if (isNew) {
            const ft = { 1: null, 2: null, 3: null };
            ft[d] = time;
            record = { defeated: true, fastestTime: ft, count: 1 };
        } else {
            const rec = { ...collection[monsterName] };
            rec.count = (rec.count || 0) + 1;
            // migration 済みのオブジェクト形式を保証
            if (!rec.fastestTime || typeof rec.fastestTime !== 'object') {
                rec.fastestTime = { 1: null, 2: null, 3: null };
            }
            if (rec.fastestTime[d] === null || time < rec.fastestTime[d]) {
                rec.fastestTime[d] = time;
            }
            // 不要なプロパティを削除（クリーンアップ）
            if (rec.imageSrc) delete rec.imageSrc;
            record = rec;
        }

        this.storage.saveMonsterRecord(monsterName, record);

        // 初登録ならNEWフラグを立てる
        if (isNew) {
            const newData = this.storage.loadMonsterNew();
            newData[monsterName] = true;
            this.storage.saveMonsterNew(newData);
        }

        return isNew;
    }

    // ── NEWバッジ同期ヘルパー ──

    _syncMonsterNewBadge() {
        const badge = document.getElementById('note-hub-monster-new-badge');
        if (!badge) return;
        const data = this.storage.loadMonsterNew();
        badge.style.display = Object.keys(data).length > 0 ? '' : 'none';
    }

    _syncItemNewBadge() {
        const badge = document.getElementById('note-hub-item-new-badge');
        if (!badge) return;
        const data = this.storage.loadItemNew();
        badge.style.display = Object.keys(data).length > 0 ? '' : 'none';
    }

    _syncStickerNewBadge() {
        const badge = document.getElementById('note-hub-sticker-new-badge');
        if (!badge) return;
        badge.style.display = this.storage.hasNewStickers() ? '' : 'none';
    }

    _showNoteRegistration(monsterName, onComplete) {
        this.sound.playSe('note');
        this.ui.showMessage(`${monsterName}が\nノートにとうろくされた！`, false, 2000, 'text-neutral');
        setTimeout(onComplete, 2000);
    }
}
