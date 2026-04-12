/* UIManager - DOM manipulation and display methods extracted from Game */
class UIManager {
    constructor() {
        this._messageTimeout = null;
        this._monsterStatusStackCount = 0;
        this._activeStatusVisual = null;
        this.anim = new AnimationRenderer();
        this.msg = new MessageSystem();
        // PCワイド画面 左パネル用キャッシュ
        this._desktopMonsterData = null;
        this._desktopPlayerData = null;
    }

    adjustScale() {
        const app = document.getElementById('app');

        // Viewport
        const viewport = window.visualViewport;
        const winW = viewport ? viewport.width : window.innerWidth;
        const winH = viewport ? viewport.height : window.innerHeight;

        if (viewport && window.innerHeight - winH > 150) {
            return;
        }

        // 常に縦画面レイアウト (800x1600)
        const baseW = 800;
        const baseH = 1600;

        app.classList.add('portrait-mode');

        // Calculate Scale to fit
        const scale = Math.min(winW / baseW, winH / baseH, window.innerHeight / baseH);

        // Apply CSS
        app.style.width = baseW + 'px';
        app.style.height = baseH + 'px';
        app.style.position = 'absolute';
        app.style.left = '50%';
        app.style.top = '50%';
        app.style.transform = `translate(-50%, -50%) scale(${scale})`;
        app.style.transformOrigin = 'center center';
        app.style.opacity = '1';
    }

    updatePlayerHp(current, max) {
        const bar = document.getElementById('player-hp-bar');
        const text = document.getElementById('player-hp-text');
        const ratio = current / max;

        // maxHPが変わった時のみボックス幅を再計算してロック（被ダメ時はリサイズしない）
        const hpBox = text.closest('.status-hp-box');
        if (hpBox && hpBox._lastMax !== max) {
            hpBox._lastMax = max;
            hpBox.style.width = '';
            text.textContent = `HP ${max}/${max}`;
            const w = hpBox.offsetWidth;
            if (w > 0) hpBox.style.width = w + 'px';
        }

        bar.style.width = `${ratio * 100}%`;
        if (ratio > 0.75) bar.style.backgroundColor = 'var(--success-color)';
        else if (ratio > 0.3) bar.style.backgroundColor = 'var(--accent-color)';
        else bar.style.backgroundColor = 'var(--danger-color)';
        text.textContent = `HP ${current}/${max}`;
        // デスクトップ左パネルの HP テキストをリアルタイム更新
        if (this._desktopPlayerData) {
            this._desktopPlayerData.hp = current;
            this._desktopPlayerData.maxHp = max;
            this._updateDesktopRow('desktop-player-rows', 'たいりょく', `${current} / ${max}`);
        }
    }

    updatePlayerLevel(level, exp, expNeeded, isMax) {
        const levelEl = document.getElementById('player-level-text');
        if (levelEl) {
            levelEl.textContent = isMax ? 'Lv MAX' : `Lv${level}`;
        }
        const expBar = document.getElementById('player-exp-bar');
        if (expBar) {
            const ratio = isMax ? 1 : (expNeeded > 0 ? Math.min(1, exp / expNeeded) : 1);
            expBar.style.width = `${ratio * 100}%`;
        }
        // デスクトップ左パネルの Lv / EXP を更新（ラベルが変わるので全再描画）
        if (this._desktopPlayerData) {
            this._desktopPlayerData.level = level;
            this._desktopPlayerData.exp = exp;
            this._desktopPlayerData.expNeeded = expNeeded;
            this._desktopPlayerData.isMaxLevel = isMax;
            this._redrawDesktopPanel();
        }
    }

    updateMonsterHp(hpRatio, current, max) {
        const bar = document.getElementById('monster-hp-bar');
        bar.style.width = `${hpRatio * 100}%`;
        if (hpRatio > 0.75) bar.style.backgroundColor = 'var(--success-color)';
        else if (hpRatio > 0.3) bar.style.backgroundColor = 'var(--accent-color)';
        else bar.style.backgroundColor = 'var(--danger-color)';
        // デスクトップ左パネルの HP テキストをリアルタイム更新
        if (this._desktopMonsterData && current !== undefined) {
            this._desktopMonsterData.hp = current;
            this._desktopMonsterData.maxHp = max;
            this._updateDesktopRow('desktop-enemy-rows', 'たいりょく', `${current} / ${max}`);
        }
    }

    updateTimerBar(ratio) {
        const bar = document.getElementById('timer-bar');
        bar.style.width = `${ratio * 100}%`;
        if (ratio > 0.7) bar.style.backgroundColor = 'var(--primary-color)';
        else if (ratio > 0.3) bar.style.backgroundColor = 'var(--accent-color)';
        else bar.style.backgroundColor = 'var(--danger-color)';
    }

    /**
     * 連続回避カウントに応じてオーラ画像・必殺技ゲージを更新する
     */
    updateAuraUI(dodgeStreak, specialMoveReady) {
        const auraEl = document.getElementById('aura-img');
        const wrapper = document.getElementById('sword-aura-wrapper');

        if (auraEl) {
            if (specialMoveReady) {
                auraEl.src = 'assets/image/effect/ora04.webp';
                auraEl.style.animationDuration = '0.5s';
                auraEl.style.display = 'block';
            } else {
                auraEl.style.display = 'none';
            }
        }

        this.updateSpecialGauges(dodgeStreak);

        // デスクトップ左パネルのオーラレベルをリアルタイム更新
        if (this._desktopPlayerData) {
            this._desktopPlayerData.dodgeStreak = dodgeStreak;
            this._desktopPlayerData.specialMoveReady = specialMoveReady;
            let auraText, auraHighlight;
            if (specialMoveReady) {
                auraText = 'ひっさつ よういOK！';
                auraHighlight = true;
            } else if (dodgeStreak > 0) {
                auraText = `${dodgeStreak} / 4`;
            } else {
                auraText = 'なし';
            }
            this._updateDesktopRow('desktop-player-rows', 'オーラレベル', auraText, auraHighlight);
        }
    }

    /**
     * 必殺技ゲージ（4つ）の点灯状態を更新する
     */
    updateSpecialGauges(dodgeStreak) {
        for (let i = 1; i <= 4; i++) {
            const gauge = document.getElementById(`special-gauge-${i}`);
            if (gauge) gauge.classList.toggle('active', dodgeStreak >= i);
        }
    }

    /**
     * ダブルアタックゲージ（5つ）の点灯状態を更新する
     * @param {number} count - 現在のカウント（0–5）
     * @param {boolean} ready - 準備完了フラグ（trueなら全点灯）
     */
    updateDoubleAttackGauge(count, ready) {
        for (let i = 1; i <= 5; i++) {
            const gauge = document.getElementById(`double-gauge-${i}`);
            if (gauge) gauge.classList.toggle('active', ready || count >= i);
        }
        // デスクトップ左パネルをリアルタイム更新
        if (this._desktopPlayerData) {
            this._desktopPlayerData.normalAttackCount = count;
            this._desktopPlayerData.doubleAttackReady = ready;
            let text, highlight;
            if (ready) { text = 'よういOK！'; highlight = true; }
            else if (count > 0) { text = `${count} / 5`; }
            else { text = 'なし'; }
            this._updateDesktopRow('desktop-player-rows', 'ダブルアタック', text, highlight);
        }
    }

    /**
     * はんげきゲージ（3つ）の点灯状態を更新する
     * @param {number} count - 現在のカウント（0–3）
     * @param {boolean} ready - 準備完了フラグ（trueなら全点灯）
     */
    updateRevengeGauge(count, ready) {
        for (let i = 1; i <= 3; i++) {
            const gauge = document.getElementById(`revenge-gauge-${i}`);
            if (gauge) gauge.classList.toggle('active', ready || count >= i);
        }
        // 背景赤オーバーレイは常に非表示（フラッシュは flashRevengeBg() で制御）
        const overlay = document.getElementById('revenge-bg-overlay');
        if (overlay) overlay.style.display = 'none';
        // デスクトップ左パネルをリアルタイム更新
        if (this._desktopPlayerData) {
            this._desktopPlayerData.revengeCount = count;
            this._desktopPlayerData.revengeReady = ready;
            let text, highlight;
            if (ready) { text = 'よういOK！'; highlight = true; }
            else if (count > 0) { text = `${count} / 3`; }
            else { text = 'なし'; }
            this._updateDesktopRow('desktop-player-rows', 'はんげきゲージ', text, highlight);
        }
    }

    /**
     * 必殺技待機状態のテンキー赤オーバーレイ＋雷エフェクトを表示/非表示にする
     */
    setSpecialStandby(active) {
        const overlay = document.getElementById('numpad-special-overlay');
        if (!overlay) return;
        overlay.style.display = active ? 'block' : 'none';
    }

    // --- Animation delegation ---
    showAttackEffect(type, mirrored = false) { return this.anim.showAttackEffect(type, mirrored); }
    flashScreen(type = 'normal') { return this.anim.flashScreen(type); }
    flashRevengeBg() { return this.anim.flashRevengeBg(); }
    shakeScreen() { return this.anim.shakeScreen(); }
    dodgeScreen() { return this.anim.dodgeScreen(); }
    attackScreen() { return this.anim.attackScreen(); }
    damageScreen() { return this.anim.damageScreen(); }
    showLightning() { return this.anim.showLightning(); }
    showAtkUpEffect() { return this.anim.showAtkUpEffect(); }
    showHealEffect() { return this.anim.showHealEffect(); }
    showDefUpEffect() { return this.anim.showDefUpEffect(); }
    showGoldUpEffect() { return this.anim.showGoldUpEffect(); }
    showExpUpEffect() { return this.anim.showExpUpEffect(); }

    // --- Message delegation ---
    showMessage(text, isCrit = false, duration = 1500, extraClass = null) { return this.msg.showMessage(text, isCrit, duration, extraClass); }
    clearMessageLog() {
        this.msg.clearMessageLog();
        // デスクトップ問題ログに区切り線を追加（モンスター切り替え時）
        const log = document.getElementById('desktop-problem-log');
        if (log && log.children.length > 0) {
            const sep = document.createElement('div');
            sep.className = 'desktop-log-separator';
            log.appendChild(sep);
            if (log.parentElement) log.parentElement.scrollTop = log.parentElement.scrollHeight;
        }
    }

    /** バトル開始時にデスクトップサイドパネルを表示する */
    showDesktopPanels() {
        document.body.classList.add('battle-active');
    }

    /** メインメニューに戻る際にデスクトップ左右パネルを非表示にしてコンテンツをリセットする */
    clearDesktopPanels() {
        document.body.classList.remove('battle-active');
        // 左パネル: 情報をリセット
        this._desktopMonsterData = null;
        this._desktopPlayerData = null;
        const enemyEl = document.getElementById('desktop-enemy-rows');
        const playerEl = document.getElementById('desktop-player-rows');
        if (enemyEl) enemyEl.innerHTML = '';
        if (playerEl) playerEl.innerHTML = '';

        // 右パネル: 問題ログをクリア
        const log = document.getElementById('desktop-problem-log');
        if (log) log.innerHTML = '';
    }

    /**
     * デスクトップ右パネルの問題一覧に1エントリー追加する。
     * @param {string} problemText - 完成した問題文（解答が埋め込まれた状態）
     * @param {boolean} isCorrect  - 正解なら true（○）、不正解なら false（×）
     */
    addDesktopProblemLog(problemText, isCorrect) {
        const log = document.getElementById('desktop-problem-log');
        if (!log) return;
        // 上限 300 エントリー
        while (log.children.length >= 300) log.removeChild(log.firstChild);

        const entry = document.createElement('div');
        entry.className = 'desktop-problem-entry';
        const textSpan = document.createElement('span');
        textSpan.className = 'desktop-problem-text';
        textSpan.textContent = problemText;
        const resultSpan = document.createElement('span');
        resultSpan.className = `desktop-problem-result ${isCorrect ? 'correct' : 'wrong'}`;
        resultSpan.textContent = isCorrect ? '○' : '×';
        entry.appendChild(textSpan);
        entry.appendChild(resultSpan);
        log.appendChild(entry);

        // 常に最下段へスクロール
        if (log.parentElement) log.parentElement.scrollTop = log.parentElement.scrollHeight;
    }

    /**
     * ミス・時間切れ時に解答欄を正解の赤字に切り替える
     * リセットは次ターンの updateProblemDisplay / clearProblemDisplay が自動で行う
     * @param {number} answer 正解の数値
     */
    showCorrectAnswerFeedback(answer) {
        const problemEl = document.getElementById('problem-text');
        if (!problemEl) return;
        const answerPart = problemEl.querySelector('.answer-part');
        if (!answerPart) return;
        answerPart.textContent = answer;
        answerPart.classList.remove('empty');
        answerPart.style.color = '#ff4b4b';
    }

    updateStageProgress(monsters, currentIdx, totalMonsters) {
        const container = document.getElementById('stage-progress');
        if (!container) return;

        // Create dots if empty (first run)
        if (container.children.length === 0) {
            for (let i = 0; i < totalMonsters; i++) {
                const dot = document.createElement('div');
                dot.className = 'stage-dot';
                // Boss marker
                if (i === totalMonsters - 1) {
                    dot.classList.add('boss');
                }
                container.appendChild(dot);
            }
        }

        // Update states
        const dots = container.querySelectorAll('.stage-dot');
        dots.forEach((dot, index) => {
            const m = monsters[index];

            // Reset classes (keep base and boss)
            dot.className = 'stage-dot';
            if (index === totalMonsters - 1) dot.classList.add('boss');

            // Status classes
            if (index < currentIdx) {
                dot.classList.add('cleared');
                // Type classes only shown AFTER battle (cleared)
                if (m.isRare) dot.classList.add('rare');
                if (m.isHeal) dot.classList.add('heal');
            } else if (index === currentIdx) {
                dot.classList.add('current');
            }
            // Future monsters: stay as default white dot (no type class)
        });
    }

    /**
     * モンスターに状態異常カラーフィルターをかける。
     */
    applyMonsterStatusMask(type) {
        this._monsterStatusStackCount = (this._monsterStatusStackCount || 0) + 1;
        this._activeStatusVisual = type;
        const monsterImg = document.getElementById('monster-img');
        if (!monsterImg) return;
        const filterMap = {
            poison: 'drop-shadow(0 0 2px rgba(220,100,255,0.9)) drop-shadow(0 0 8px rgba(140,0,255,0.7)) sepia(1) saturate(6) hue-rotate(260deg) brightness(0.72)',
            paralyzed: 'drop-shadow(0 0 2px rgba(255,255,120,0.9)) drop-shadow(0 0 8px rgba(255,210,0,0.8)) sepia(1) saturate(7) hue-rotate(18deg) brightness(1.05)',
            stone: 'drop-shadow(0 0 2px rgba(160,160,160,0.6)) grayscale(1) brightness(0.52) contrast(0.85)'
        };
        monsterImg.style.filter = filterMap[type] || '';
    }

    /** モンスターのステータスカラーフィルターをクリアする */
    clearMonsterStatusMask() {
        this._activeStatusVisual = null;
        this._monsterStatusStackCount = 0;
        const monsterImg = document.getElementById('monster-img');
        if (monsterImg) monsterImg.style.filter = '';
    }

    hideInfoOverlay() {
        document.getElementById('info-overlay').classList.remove('active');
    }

    fitInfoRows() {
        document.querySelectorAll('#info-overlay .info-row').forEach(row => {
            if (row.scrollWidth <= row.clientWidth) return;
            let fs = parseFloat(window.getComputedStyle(row).fontSize);
            while (row.scrollWidth > row.clientWidth && fs > 14) {
                fs -= 1;
                row.style.fontSize = fs + 'px';
            }
        });
    }

    /**
     * @param {object} monster - Monster instance
     * @param {object} playerStats - { hp, maxHp, atk, def, hasShield, dodgeStreak, specialMoveReady }
     */
    showInfoOverlay(monster, playerStats) {
        const m = monster;
        const { hp, maxHp, atk, def, hasShield, dodgeStreak, specialMoveReady,
                level, exp, expNeeded, isMaxLevel,
                normalAttackCount, doubleAttackReady, revengeCount, revengeReady } = playerStats;

        // 必殺技ゲージテキスト
        let auraText, auraHighlight;
        if (specialMoveReady) {
            auraText = 'ひっさつ よういOK！';
            auraHighlight = true;
        } else if (dodgeStreak > 0) {
            auraText = `${dodgeStreak} / 4`;
        } else {
            auraText = 'なし';
        }

        // ダブルアタックゲージテキスト
        let doubleText, doubleHighlight;
        if (doubleAttackReady) {
            doubleText = 'よういOK！';
            doubleHighlight = true;
        } else if (normalAttackCount > 0) {
            doubleText = `${normalAttackCount} / 5`;
        } else {
            doubleText = 'なし';
        }

        // はんげきゲージテキスト
        let revengeText, revengeHighlight;
        if (revengeReady) {
            revengeText = 'よういOK！';
            revengeHighlight = true;
        } else if (revengeCount > 0) {
            revengeText = `${revengeCount} / 3`;
        } else {
            revengeText = 'なし';
        }

        const enemyRows = [
            { label: 'なまえ', value: m.name },
            { label: 'たいりょく', value: `${m.hp} / ${m.maxHp}` },
            { label: 'こうげきりょく', value: String(m.attackPower) },
        ];

        const expValue = isMaxLevel ? 'MAX' : `${exp} / ${expNeeded}`;
        const playerRows = [
            { label: 'たいりょく', value: `${hp} / ${maxHp}` },
            { label: 'こうげきりょく', value: String(atk) },
            { label: 'ぼうぎょりょく', value: hasShield ? String(def) : 'なし' },
            { label: 'オーラレベル', value: auraText, highlight: auraHighlight },
            { label: 'ダブルアタック', value: doubleText, highlight: doubleHighlight },
            { label: 'はんげきゲージ', value: revengeText, highlight: revengeHighlight },
            { label: `Lv${level} けいけんち`, value: expValue },
        ];

        const renderRows = (el, rows) => {
            el.innerHTML = rows.map(r =>
                `<div class="info-row">
                    <span class="info-label">${r.label}</span>
                    <span class="info-value${r.highlight ? ' sp-ready' : ''}">${r.value}</span>
                </div>`
            ).join('');
        };

        renderRows(document.getElementById('info-enemy-rows'), enemyRows);
        renderRows(document.getElementById('info-player-rows'), playerRows);
        document.getElementById('info-overlay').classList.add('active');
        // 表示後にはみ出しチェック → フォント縮小
        requestAnimationFrame(() => this.fitInfoRows());

        // デスクトップ左パネルにも同じデータを反映
        this.updateDesktopInfoPanel(monster, playerStats);
    }

    /* ============================================================
       PCワイド画面 左パネル（デスクトップじょうほうパネル）
       ============================================================ */

    /**
     * デスクトップ左パネルのデータを設定して再描画する。
     * @param {object|null} monster - Monster インスタンス（または同形状のオブジェクト）
     * @param {object|null} playerStats - showInfoOverlay と同じ playerStats オブジェクト
     */
    updateDesktopInfoPanel(monster, playerStats) {
        if (monster) {
            this._desktopMonsterData = {
                name: monster.name,
                hp: monster.hp,
                maxHp: monster.maxHp,
                attackPower: monster.attackPower
            };
        }
        if (playerStats) {
            this._desktopPlayerData = { ...playerStats };
        }
        this._redrawDesktopPanel();
    }

    /** デスクトップ左パネルをキャッシュデータから全再描画する */
    _redrawDesktopPanel() {
        const enemyEl = document.getElementById('desktop-enemy-rows');
        const playerEl = document.getElementById('desktop-player-rows');
        if (!enemyEl || !playerEl) return;

        const renderRows = (el, rows) => {
            el.innerHTML = rows.map(r =>
                `<div class="info-row" data-key="${r.label}">` +
                `<span class="info-label">${r.label}</span>` +
                `<span class="info-value${r.highlight ? ' sp-ready' : ''}">${r.value}</span>` +
                `</div>`
            ).join('');
        };

        if (this._desktopMonsterData) {
            const m = this._desktopMonsterData;
            renderRows(enemyEl, [
                { label: 'なまえ', value: m.name },
                { label: 'たいりょく', value: `${m.hp} / ${m.maxHp}` },
                { label: 'こうげきりょく', value: String(m.attackPower) },
            ]);
        }

        if (this._desktopPlayerData) {
            const p = this._desktopPlayerData;
            let auraText, auraHighlight;
            if (p.specialMoveReady) {
                auraText = 'ひっさつ よういOK！';
                auraHighlight = true;
            } else if (p.dodgeStreak > 0) {
                auraText = `${p.dodgeStreak} / 4`;
            } else {
                auraText = 'なし';
            }
            let doubleText2, doubleHighlight2;
            if (p.doubleAttackReady) {
                doubleText2 = 'よういOK！';
                doubleHighlight2 = true;
            } else if (p.normalAttackCount > 0) {
                doubleText2 = `${p.normalAttackCount} / 5`;
            } else {
                doubleText2 = 'なし';
            }
            let revengeText2, revengeHighlight2;
            if (p.revengeReady) {
                revengeText2 = 'よういOK！';
                revengeHighlight2 = true;
            } else if (p.revengeCount > 0) {
                revengeText2 = `${p.revengeCount} / 3`;
            } else {
                revengeText2 = 'なし';
            }
            const expValue = p.isMaxLevel ? 'MAX' : `${p.exp} / ${p.expNeeded}`;
            renderRows(playerEl, [
                { label: 'たいりょく', value: `${p.hp} / ${p.maxHp}` },
                { label: 'こうげきりょく', value: String(p.atk) },
                { label: 'ぼうぎょりょく', value: p.hasShield ? String(p.def) : 'なし' },
                { label: 'オーラレベル', value: auraText, highlight: auraHighlight },
                { label: 'ダブルアタック', value: doubleText2, highlight: doubleHighlight2 },
                { label: 'はんげきゲージ', value: revengeText2, highlight: revengeHighlight2 },
                { label: `Lv${p.level} けいけんち`, value: expValue },
            ]);
        }
    }

    /**
     * デスクトップ左パネルの特定行の値だけを更新する（高頻度 HP 更新用）。
     * @param {string} containerId - 'desktop-enemy-rows' | 'desktop-player-rows'
     * @param {string} key - data-key 属性値（= info-label テキスト）
     * @param {string} newValue - 新しい値テキスト
     * @param {boolean} [highlight] - sp-ready クラスを付与するか
     */
    _updateDesktopRow(containerId, key, newValue, highlight = false) {
        const container = document.getElementById(containerId);
        if (!container) return;
        const row = container.querySelector(`[data-key="${key}"]`);
        if (!row) return;
        const valueEl = row.querySelector('.info-value');
        if (!valueEl) return;
        valueEl.textContent = newValue;
        valueEl.classList.toggle('sp-ready', highlight);
    }

    _openImageModal(src, name, record = null, isItem = false, equipData = null, onDiarySave = null) {
        const modal = document.getElementById('image-modal');
        const modalImg = document.getElementById('image-modal-img');
        const captionText = document.getElementById('caption');
        modal.classList.add('active');
        modalImg.src = src;

        // Apply yellow glow for items, otherwise default (monster) glow
        if (isItem) {
            modalImg.classList.add('item-zoom-glow');
        } else {
            modalImg.classList.remove('item-zoom-glow');
        }

        captionText.innerHTML = '';

        const nameEl = document.createElement('span');
        nameEl.className = 'modal-name';
        nameEl.textContent = name;
        captionText.appendChild(nameEl);

        if (equipData) {
            const statsEl = document.createElement('div');
            statsEl.className = 'modal-equip-stats';
            if (equipData.attack > 0) {
                const atkEl = document.createElement('span');
                atkEl.className = 'equip-stat atk';
                atkEl.textContent = `こうげき +${equipData.attack}`;
                statsEl.appendChild(atkEl);
            }
            if (equipData.defense > 0) {
                const defEl = document.createElement('span');
                defEl.className = 'equip-stat def';
                defEl.textContent = `ぼうぎょ +${equipData.defense}`;
                statsEl.appendChild(defEl);
            }
            if (equipData.desc) {
                const descEl = document.createElement('span');
                descEl.className = 'equip-stat item-desc';
                descEl.textContent = equipData.desc;
                statsEl.appendChild(descEl);
            }
            captionText.appendChild(statsEl);
        }

        if (record) {
            const count = record.count || 0;
            const ft = (record.fastestTime && typeof record.fastestTime === 'object')
                ? record.fastestTime
                : { 1: null, 2: null, 3: null };

            const diffs = [
                { key: 1, stars: '★', cls: 'diff-bronze' },
                { key: 2, stars: '★★', cls: 'diff-silver' },
                { key: 3, stars: '★★★', cls: 'diff-malle' },
            ];
            const badgesEl = document.createElement('div');
            badgesEl.className = 'modal-diff-badges';
            diffs.forEach(({ key, stars, cls }) => {
                const time = ft[key];
                const cleared = time !== null && time !== undefined;
                const row = document.createElement('div');
                row.className = 'note-diff-row modal-diff-row';
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
            captionText.appendChild(badgesEl);

            const countEl = document.createElement('span');
            countEl.className = 'modal-count';
            countEl.textContent = `${count}かいたおした`;
            captionText.appendChild(countEl);

            if (onDiarySave) {
                const diaryWrapper = document.createElement('div');
                diaryWrapper.className = 'modal-diary-wrapper';
const diaryInput = document.createElement('textarea');
                diaryInput.className = 'modal-diary-input';
                diaryInput.maxLength = 20;
                diaryInput.rows = 2;
                diaryInput.placeholder = 'メモをかこう（20もじまで）';
                diaryInput.value = record.diary || '';
                diaryInput.addEventListener('click', (e) => e.stopPropagation());
                diaryInput.addEventListener('keydown', (e) => {
                    if (e.key === 'Enter') e.preventDefault();
                });
                diaryInput.addEventListener('input', () => {
                    onDiarySave(diaryInput.value);
                });
                diaryWrapper.appendChild(diaryInput);
                captionText.appendChild(diaryWrapper);
            }
        }
    }

    openImageModal(src, name, record = null, isItem = false, equipData = null, onDiarySave = null) {
        this._openImageModal(src, name, record, isItem, equipData, onDiarySave);
    }

    updateProblemDisplay(displayText, inputBuffer, isPlayerTurn, fillInBlank = false) {
        document.getElementById('answer-input').value = inputBuffer;
        // Render single-line problem: 12＋5＝[answer]
        const problemEl = document.getElementById('problem-text');

        // 非表示状態から復帰させる
        problemEl.style.visibility = 'visible';

        // ★ 問題枠の色変更処理 (問題が表示された瞬間に反映されるようにここで行う)
        const problemSection = document.querySelector('.panel-section--problem');
        if (problemSection) {
            problemSection.classList.remove('player-turn', 'monster-turn');
            if (isPlayerTurn) {
                problemSection.classList.add('player-turn');
            } else {
                problemSection.classList.add('monster-turn');
            }
        }

        const dText = displayText || '';
        const answerVal = inputBuffer || '';
        const isEmpty = answerVal === '';
        if (fillInBlank && dText.includes('□')) {
            const idx = dText.indexOf('□');
            const before = dText.slice(0, idx);
            const after = dText.slice(idx + 1);
            const answerDisplay = isEmpty ? '□' : answerVal;
            problemEl.innerHTML = `<span class="problem-part">${before}</span><span class="answer-part${isEmpty ? ' empty' : ''}">${answerDisplay}</span><span class="problem-part">${after}</span>`;
        } else {
            problemEl.innerHTML = `<span class="problem-part">${dText}</span><span class="answer-part${isEmpty ? ' empty' : ''}">${answerVal}</span>`;
        }

        if (!isPlayerTurn) {
            problemEl.classList.add('monster-turn-text');
        } else {
            problemEl.classList.remove('monster-turn-text');
        }

        // Auto-shrink letter-spacing if content overflows
        problemEl.style.letterSpacing = '';  // reset to CSS default
        problemEl.style.fontSize = '';       // reset to CSS default
        problemEl.style.whiteSpace = 'nowrap';
        const maxWidth = problemEl.parentElement.clientWidth;
        let currentSpacing = 4;  // starting letter-spacing in px
        const minSpacing = -10;  // minimum letter spacing
        while (problemEl.scrollWidth > maxWidth && currentSpacing > minSpacing) {
            currentSpacing -= 0.5;
            problemEl.style.letterSpacing = currentSpacing + 'px';
        }
        // B案: letter-spacingで収まらない場合はfont-sizeも縮小
        if (problemEl.scrollWidth > maxWidth) {
            let fs = parseInt(getComputedStyle(problemEl).fontSize) || 78;
            while (problemEl.scrollWidth > maxWidth && fs > 36) {
                fs -= 2;
                problemEl.style.fontSize = fs + 'px';
            }
        }
    }

    clearProblemDisplay() {
        document.getElementById('answer-input').value = "";
        const problemEl = document.getElementById('problem-text');
        problemEl.style.visibility = 'hidden';
        const problemSection = document.querySelector('.panel-section--problem');
        if (problemSection) {
            problemSection.classList.remove('player-turn', 'monster-turn');
        }
        this.updateTimerBar(1);
        this.updateProblemHint('');
    }

    updateProblemHint(text) {
        const el = document.getElementById('problem-hint');
        if (!el) return;
        el.textContent = text;
        el.style.display = text ? '' : 'none';
    }

    hideSword() {
        const el = document.getElementById('sword-aura-wrapper');
        if (el) el.classList.remove('has-sword');
        const label = document.getElementById('sword-label');
        if (label) label.style.visibility = 'hidden';
    }

    hideShield() {
        const el = document.getElementById('shield-label');
        if (!el) return;
        el.style.display = 'none';
        el.classList.remove('equip-flash');
    }

    /** 新装備システム用: EQUIPMENT_LIST アイテムを直接受け取って剣UIを更新 */
    updateSwordEquipUI(item) {
        if (!item) return;
        const el = document.getElementById('sword-label');
        if (!el) return;
        el.src = 'assets/image/equipment/sword/' + item.img;
        el.style.visibility = 'visible';
        el.classList.remove('equip-flash');
        el.style.animation = 'none';
        requestAnimationFrame(() => {
            el.style.animation = '';
            el.classList.add('equip-flash');
        });
        const w2 = document.getElementById('sword-aura-wrapper');
        if (w2) w2.classList.add('has-sword');
    }

    /** 新装備システム用: EQUIPMENT_LIST アイテムを直接受け取って盾UIを更新 */
    updateShieldEquipUI(item) {
        if (!item) return;
        const el = document.getElementById('shield-label');
        if (!el) return;
        el.src = 'assets/image/equipment/shield/' + item.img;
        el.style.display = '';
        el.classList.remove('equip-flash');
        el.style.animation = 'none';
        requestAnimationFrame(() => {
            el.style.animation = '';
            el.classList.add('equip-flash');
        });
    }
}
