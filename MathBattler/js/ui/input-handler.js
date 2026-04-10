/* InputHandler: バトル入力・ターン制御の管理 */
class InputHandler {
    constructor(game) {
        this.game = game;
        this.storage = game.storage;
        this.sound = game.sound;
        this.ui = game.ui;
        this._timerWarnPlayed = false;
    }

    _handleInput(key) {
        if (this.game.state !== GameState.BATTLE) return;

        if (key === 'DEL') {
            this.game.inputBuffer = this.game.inputBuffer.slice(0, -1);
        } else if (key === 'ENTER') {
            this._submitAnswer();
            return; // Avoid calling _updateInputUI which clears the visually retained answer
        } else {
            if (this.game.inputBuffer.length < 6) {
                this.game.inputBuffer += key;
            }
        }
        const map = this.game.problem.blankDisplayMap;
        const displayBuf = (map && this.game.inputBuffer) ? (map[this.game.inputBuffer] || this.game.inputBuffer) : this.game.inputBuffer;
        this.ui.updateProblemDisplay(this.game.problem.displayText, displayBuf, this.game.isPlayerTurn, this.game.problem.fillInBlank);
    }

    _submitAnswer() {
        if (!this.game.inputBuffer) return;

        // ★ 解答送信時に即座に枠の色を戻す
        const problemSection = document.querySelector('.panel-section--problem');
        if (problemSection) {
            problemSection.classList.remove('player-turn', 'monster-turn');
        }

        const ans = parseInt(this.game.inputBuffer);
        if (isNaN(ans)) {
            this.game.inputBuffer = "";
            this.ui.updateProblemDisplay(this.game.problem.displayText, this.game.inputBuffer, this.game.isPlayerTurn, this.game.problem.fillInBlank);
            return;
        }

        const isCorrect = this.game.problem.check(this.game.inputBuffer);
        const elapsed = (Date.now() - this.game.timerStart) / 1000;

        // Save the current input buffer for display before clearing it internally
        const displayedAnswer = this.game.inputBuffer;
        this.game.inputBuffer = "";

        // Temporarily display the submitted answer until the next state resets it
        document.getElementById('answer-input').value = displayedAnswer;
        const problemEl = document.getElementById('problem-text');
        const displayText = this.game.problem.displayText || '';
        if (this.game.problem.fillInBlank && displayText.includes('□')) {
            const idx = displayText.indexOf('□');
            const before = displayText.slice(0, idx);
            const after = displayText.slice(idx + 1);
            const blankMap = this.game.problem.blankDisplayMap;
            const blankVal = (blankMap && blankMap[displayedAnswer]) ? blankMap[displayedAnswer] : displayedAnswer;
            problemEl.innerHTML = `<span class="problem-part">${before}</span><span class="answer-part">${blankVal}</span><span class="problem-part">${after}</span>`;
        } else {
            problemEl.innerHTML = `<span class="problem-part">${displayText}</span><span class="answer-part">${displayedAnswer}</span>`;
        }

        if (isCorrect) {
            this._onCorrect(elapsed);
        } else {
            this._onWrong();
        }
    }

    async _onCorrect(elapsed) {
        this.game.state = GameState.TRANSITION; // Block input while processing

        if (!this.game.isPlayerTurn) {
            // Monster turn: Player dodges
            this.ui.attackScreen(); // ★ モンスターが拡大するアニメーション
            this.ui.showMessage(`こうげきを よけた！`, false, 1500, 'text-neutral');
            this.sound.playSe('player_dodge'); // ユーザーよけ音

            // 連続回避カウント更新
            const prevDodgeStreak = this.game.dodgeStreak;
            const prevSpecialMoveReady = this.game.specialMoveReady;
            const dodgeResult = this.game.battle.updateDodgeStreak(
                { dodgeStreak: this.game.dodgeStreak, specialMoveReady: this.game.specialMoveReady }, false, this.game.shieldLevel
            );
            this.game.dodgeStreak = dodgeResult.dodgeStreak;
            this.game.specialMoveReady = dodgeResult.specialMoveReady;
            this.ui.updateAuraUI(this.game.dodgeStreak, this.game.specialMoveReady);
            if (dodgeResult.specialMoveReady && !prevSpecialMoveReady) {
                this.sound.playSe('gauge_max');
            } else if (dodgeResult.dodgeStreak > prevDodgeStreak) {
                this.sound.playSe('gauge_up');
            }

            const afterMonsterTurn = () => this.game._afterMonsterTurnEffects(() => this.game.startPlayerTurn());
            if (dodgeResult.specialMoveReady && !prevSpecialMoveReady && !this.game.storage.isAuraTutorialSeen()) {
                this.game.storage.setAuraTutorialSeen();
                setTimeout(() => this.game._showAuraTutorial(afterMonsterTurn), 1500);
            } else {
                setTimeout(afterMonsterTurn, 1500);
            }
            return;
        }

        const isCrit = elapsed <= DIFFICULTY_TIMER.CRITICAL[this.game.difficulty || Difficulty.HARD];

        // ダメージ計算（必殺技は specialStandby で発動）
        const { damage, isSpecial } = this.game.battle.calcPlayerDamage(
            this.game._getEquippedSwordBonus(), this.game.swordBonus, isCrit, this.game.specialStandby,
            0
        );

        // 必殺技後の状態リセット
        if (isSpecial) {
            this.game.specialMoveReady = false;
            this.game.specialStandby = false;
            this.game.dodgeStreak = 0;
            this.ui.setSpecialStandby(false);
            this.ui.updateAuraUI(this.game.dodgeStreak, this.game.specialMoveReady);
        }

        const m = this.game.monsters[this.game.currentMonsterIdx];
        m.takeDamage(damage);
        this.ui.updateMonsterHp(m.hpRatio);

        // 攻撃エフェクト・SE・メッセージ（必殺技 > 剣装備 > 素手 の優先順）
        if (isSpecial) {
            this.ui.showAttackEffect('attack_SP');
            this.ui.showLightning();
            this.ui.flashScreen('sp');
            this.ui.showMessage(`ひっさつ！\n${damage}ダメージ！`, true, 1500, 'text-player-action');
            this.sound.playSe('special');
        } else if (this.game.swordLevel > 0 || this.game._getEquippedSwordBonus() > 0) {
            const specialEffectId = this.game._getEquippedSwordSpecialEffectId();
            let effectType;
            if (specialEffectId === 'Hitting') {
                effectType = isCrit ? 'critical_H' : 'attack_H';
            } else if (specialEffectId && specialEffectId.startsWith('Slash')) {
                const colorSuffix = specialEffectId.includes('_') ? '_' + specialEffectId.split('_')[1] : '';
                effectType = isCrit ? `critical_S${colorSuffix}` : `attack_S${colorSuffix}`;
            } else {
                effectType = isCrit ? 'critical' : 'attack';
            }
            this.ui.showAttackEffect(effectType);
            this.ui.flashScreen(isCrit ? 'critical' : 'normal');
            if (isCrit) {
                this.ui.showMessage(`クリティカル！\n${damage}ダメージ！`, true, 1500, 'text-player-action');
            } else {
                this.ui.showMessage(`${this.game.playerName}のこうげき！\n${damage}ダメージ！`, false, 1500, 'text-player-action');
            }
            if (specialEffectId === 'Hitting') {
                this.sound.playSe(isCrit ? 'hitting_crit' : 'hitting');
            } else if (specialEffectId && specialEffectId.startsWith('Slash')) {
                const colorSuffix = specialEffectId.includes('_') ? '_' + specialEffectId.split('_')[1] : '';
                this.sound.playSe(isCrit ? `slash_crit${colorSuffix}` : `slash${colorSuffix}`);
            } else {
                this.sound.playSe(isCrit ? 'sword_crit' : 'sword');
            }
        } else {
            this.ui.showAttackEffect(isCrit ? 'critical' : 'attack');
            this.ui.flashScreen(isCrit ? 'critical' : 'normal');
            if (isCrit) {
                this.ui.showMessage(`クリティカル！\n${damage}ダメージ！`, true, 1500, 'text-player-action');
            } else {
                this.ui.showMessage(`${this.game.playerName}のこうげき！\n${damage}ダメージ！`, false, 1500, 'text-player-action');
            }
            this.sound.playSe(isCrit ? 'punch_crit' : 'punch');
        }

        // 攻撃メッセージが終わるまで待機
        await new Promise(resolve => setTimeout(resolve, 1500));

        // コンパニオン名の取得（追加ダメージ・状態異常共通）
        let companionName = null;
        if (this.game.storage && this.game.storage.isMonsterHouseUnlocked()) {
            const _acn = this.game.storage.loadActiveCompanion();
            if (_acn) {
                const _comps = this.game.storage.loadCompanions();
                companionName = (_comps[_acn] || {}).name || _acn;
            }
        }

        // コンパニオン追加ダメージ（extra_damage）
        const extraDamage = isCrit ? Math.floor((this.game.companionExtraDamage || 0) * 1.5) : (this.game.companionExtraDamage || 0);
        if (extraDamage > 0 && companionName && m.hp > 0) {
            m.takeDamage(extraDamage);
            this.ui.updateMonsterHp(m.hpRatio);
            this.ui.showAttackEffect(isCrit ? 'critical_H' : 'attack_H');
            this.ui.flashScreen(isCrit ? 'critical' : 'normal');
            this.ui.showMessage(`${companionName}の こうげき！\n${extraDamage}ダメージ！`, false, 1500, 'text-player-action');
            this.sound.playSe(isCrit ? 'hitting_crit' : 'hitting');
            await new Promise(resolve => setTimeout(resolve, 1500));
        }

        // コンパニオンメダル状態異常チェック（プレイヤーターン・通常攻撃）
        if (!isSpecial && m.hp > 0 && companionName) {
            const _acn2 = this.game.storage.loadActiveCompanion();
            if (_acn2) {
                const companionMedals = this.game.storage.loadCompanionMedals();
                const medalId = companionMedals[_acn2];
                const medal = medalId && window.MEDAL_LIST ? window.MEDAL_LIST.find(md => md.id === medalId) : null;
                if (medal && ['poison', 'paralyze', 'stone'].includes(medal.type)) {
                    const isBoss = m.battleNumber === Constants.BOSS_BATTLE_NUMBER ||
                        (Constants.DEBUG_BOSS_ON_SECOND_BATTLE && m.battleNumber === 2);
                    if (!(medal.type === 'stone' && isBoss) && Math.random() < medal.value) {
                        if (medal.type === 'poison' && !m.isPoisoned) {
                            m.isPoisoned = true;
                            this.ui.applyMonsterStatusMask('poison');
                            this.sound.playSe('poison');
                            this.ui.showMessage(`${companionName}は どくをあたえた！`, false, 1500, 'text-player-action');
                            await new Promise(resolve => setTimeout(resolve, 1500));
                        } else if (medal.type === 'paralyze' && !m.isParalyzed) {
                            m.isParalyzed = true;
                            this.ui.applyMonsterStatusMask('paralyzed');
                            this.sound.playSe('paralyze');
                            this.ui.showMessage(`${companionName}は まひをあたえた！`, false, 1500, 'text-player-action');
                            await new Promise(resolve => setTimeout(resolve, 1500));
                        } else if (medal.type === 'stone' && !m.isStoned) {
                            m.isStoned = true;
                            this.sound.playSe('stone');
                            this.ui.showMessage(`${companionName}は せきかをあたえた！`, false, 1500, 'text-player-action');
                            await new Promise(resolve => setTimeout(resolve, 1500));
                        }
                    }
                }
            }
        }

        // hp=0 でもボスイベントが発火する可能性があるため、常に先にチェックする
        const hasEvent = await this.game._checkBossEvents(m);
        if (!hasEvent && m.hp <= 0) {
            // イベントなし＋HP0 → 撃破
            if (this.game.timerIntervalId) cancelAnimationFrame(this.game.timerIntervalId);
            this.game._onMonsterDefeated(m);
        } else if (!hasEvent) {
            // いかりチェック（HP残あり・未いかり・Rare/Heal以外・HP30%未満）
            let angerTriggered = false;
            if (!m.isAngry && m.hp > 0 && m.hpRatio < 0.3 && !m.isSuperRare && !m.isDungeonRare && !m.isHeal && !m.isSpecial) {
                const isBoss = m.battleNumber === Constants.BOSS_BATTLE_NUMBER ||
                    (Constants.DEBUG_BOSS_ON_SECOND_BATTLE && m.battleNumber === 2);
                const angerChance = isBoss ? 0.1 : 0.05;
                if (Math.random() < angerChance) {
                    m.isAngry = true;
                    m.attackPower = Math.round(m.attackPower * (isBoss ? 1.5 : 1.2));
                    document.querySelector('.monster-container').classList.add('angry');
                    this.sound.playAngryBgm(isBoss);
                    angerTriggered = true;
                }
            }

            if (angerTriggered) {
                this.ui.showMessage(`${m.name}は\nいかりくるった！`, false, 1500, 'text-monster-action');
                await new Promise(resolve => setTimeout(resolve, 1500));
                this.game.startMonsterTurn();
            } else {
                this.game.startMonsterTurn();
            }
        } else {
            // イベント発火（HP回復済み）→ モンスターターンへ
            this.game.startMonsterTurn();
        }
    }

    async _onWrong() {
        this.game.state = GameState.TRANSITION; // Block input while processing messages

        if (this.game.isPlayerTurn) {
            this.ui.dodgeScreen(); // ★ モンスターがよけるアニメーション
            this.ui.showMessage(`ミス！\nあたらなかった！`, false, 1500, 'text-neutral');
            this.ui.showCorrectAnswerFeedback(this.game.problem.displayAnswer ?? this.game.problem.answer);
            this.sound.playSe('monster_miss'); // モンスターよけ音
            setTimeout(() => this.game.startMonsterTurn(), 1500);
            return;
        }

        const m = this.game.monsters[this.game.currentMonsterIdx];
        const isBossWrong = m.battleNumber === Constants.BOSS_BATTLE_NUMBER ||
            (Constants.DEBUG_BOSS_ON_SECOND_BATTLE && m.battleNumber === 2);
        // 連続回避カウント更新（被弾時）
        const wrongHitResult = this.game.battle.updateDodgeStreak(
            { dodgeStreak: this.game.dodgeStreak, specialMoveReady: this.game.specialMoveReady }, true, this.game._hasEquippedShield() ? 1 : 0, isBossWrong
        );
        this.game.dodgeStreak = wrongHitResult.dodgeStreak;
        this.game.specialMoveReady = wrongHitResult.specialMoveReady;
        if (!wrongHitResult.specialMoveReady && this.game.specialStandby) {
            this.game.specialStandby = false;
            this.ui.setSpecialStandby(false);
        }
        this.ui.updateAuraUI(this.game.dodgeStreak, this.game.specialMoveReady);

        const { damage } =
            this.game.battle.calcMonsterDamage(
                m,
                this.game._getEquippedShieldBonus(),
                this.game.defenseBonus
            );

        this.game.playerHp = Math.max(0, this.game.playerHp - damage);
        this.ui.updatePlayerHp(this.game.playerHp, this.game.playerMaxHp);

        this.ui.damageScreen(); // ★ モンスターからの攻撃（被弾）アニメーション
        this.ui.shakeScreen();
        this.ui.showMessage(`ミス！\n${damage}ダメージをうけた！`, false, 1500, 'text-monster-action');
        this.ui.showCorrectAnswerFeedback(this.game.problem.displayAnswer ?? this.game.problem.answer);

        if (this.game._getEquippedShieldBonus() > 0) {
            this.sound.playSe('shield_block');
        } else {
            this.sound.playSe('player_hit');
        }

        if (this.game.playerHp <= 0) {
            this.game._onGameOver();
            return;
        }

        await new Promise(resolve => setTimeout(resolve, 1500));

        // コンパニオン防御メッセージ
        if (this.game.companionDefenseBonus > 0 && this.game.storage && this.game.storage.isMonsterHouseUnlocked()) {
            const _acn = this.game.storage.loadActiveCompanion();
            if (_acn) {
                const _comps = this.game.storage.loadCompanions();
                const _cname = (_comps[_acn] || {}).name || _acn;
                this.ui.showMessage(`${_cname}は ${this.game.playerName}を まもった！`, false, 1500, 'text-player-action');
                await new Promise(resolve => setTimeout(resolve, 1500));
            }
        }

        this.ui.updateProblemDisplay(this.game.problem.displayText, this.game.inputBuffer, this.game.isPlayerTurn, this.game.problem.fillInBlank);
        this.game._afterMonsterTurnEffects(() => this.game.startPlayerTurn());
    }

    startBattle() {
        document.getElementById('interval-overlay').classList.remove('active', 'boss-entrance');
        document.getElementById('interval-blackout').classList.remove('fade-out');
        this.game.state = GameState.TRANSITION; // Block during announcement

        // メッセージログをクリア（新しいバトル開始時）
        this.ui.clearMessageLog();

        // モンスター1体ごとのアイテム使用回数リセット（rainbowOrbUsed・attackOrb・defenseOrbはダンジョン全体で有効なので引き継ぐ）
        this.game._monsterItemUsage = { spikeOrb: 0, poisonOrb: false, paralyzeOrb: false, stoneOrb: false, attackOrb: this.game._monsterItemUsage.attackOrb, defenseOrb: this.game._monsterItemUsage.defenseOrb, rainbowOrbUsed: this.game._monsterItemUsage.rainbowOrbUsed, friendshipBerry30: 0, friendshipBerry60: 0, friendshipBerry90: 0, friendshipBerry100: 0 };
        // swordBonus・defenseBonus はダンジョン中継続（次のダンジョン侵入時に startGame でリセット）

        // モンスターのステータス状態をリセット
        const bm = this.game.monsters[this.game.currentMonsterIdx];
        bm.isPoisoned = false;
        bm.isParalyzed = false;
        bm.isStoned = false;
        this.ui.clearMonsterStatusMask();

        // ★ バトル開始前に問題表示を即座にクリア（前回の問題文の残像防止）
        this._clearProblemDisplay();

        this.game.problem = bm.isSuperRare
            ? new SRareMathProblem()
            : new MathProblem(this.game.currentFloor, this.game.difficulty);
        this.game.monsterBattleStart = Date.now();

        // 最初のバトル開始時に きのけん(sword01) をアイテムノートに登録する
        this.game._updateItemCollection('きのけん');

        // かいふくモンスターはバトルなし：回復して去るフローへ
        if (bm.isHeal) {
            this.game._onHealMonsterLeave(bm);
            return;
        }

        // スペシャルモンスターはバトルなし：バフを付与して去るフローへ
        if (bm.isSpecial) {
            this.game._onSpecialMonsterLeave(bm);
            return;
        }

        // ボス欠如イベント
        if (bm.isMissingBoss) {
            this.game.state = GameState.TRANSITION;
            this.sound.stopBgm();
            this.ui.showMessage(bm.missingBossMessage, false, 4000);
            setTimeout(() => {
                // 5の倍数フロアの未入手装備をドロップ
                const floor = this.game.currentFloor;
                const equipList = (window.EQUIPMENT_LIST && window.EQUIPMENT_LIST.length > 0) ? window.EQUIPMENT_LIST : null;
                let dropItems = [];
                if (equipList && floor % 5 === 0) {
                    const itemCollection = this.storage.loadItemCollection();
                    dropItems = equipList.filter(e => e.minFloor % 5 === 0 && e.minFloor === floor && !itemCollection[e.name]);
                }
                if (dropItems.length > 0) {
                    this.ui.showMessage('なにか おちている・・・', false, 2500);
                    setTimeout(() => {
                        const chainDrop = (remaining) => {
                            if (remaining.length === 0) { this.game._onGameClear(); return; }
                            const [first, ...rest] = remaining;
                            this.game._doEquipDrop(first, () => chainDrop(rest), 500);
                        };
                        chainDrop(dropItems);
                    }, 2500);
                } else {
                    this.game._onGameClear();
                }
            }, 4000);
            return;
        }

        this.game.startPlayerTurn();
    }

    startPlayerTurn() {
        this.game.isPlayerTurn = true;
        this.game.state = GameState.TRANSITION;
        this._clearProblemDisplay(); // ★ 新しく追加：画面上の問題を消去
        this.ui.showMessage(`${this.game.playerName}の こうげき！`, false, 1500, 'text-neutral');
        setTimeout(() => {
            if (this.game.state !== GameState.RESULT && this.game.state !== GameState.GAMEOVER) {
                this.game.nextProblem();
            }
        }, 1500);
    }

    startMonsterTurn() {
        this.game.isPlayerTurn = false;
        this.game.state = GameState.TRANSITION;
        const m = this.game.monsters[this.game.currentMonsterIdx];
        this._clearProblemDisplay(); // ★ 新しく追加：画面上の問題を消去
        // ★ モンスターの攻撃はダメージ色（赤）に変更
        this.ui.showMessage(`こうげきがくる！\nよけろ！`, false, 1500, 'text-neutral');
        setTimeout(() => {
            if (this.game.state !== GameState.RESULT && this.game.state !== GameState.GAMEOVER) {
                this.game.nextProblem();
            }
        }, 1500);
    }

    _clearProblemDisplay() {
        this.game.inputBuffer = "";
        this.ui.clearProblemDisplay();
    }

    nextProblem() {
        this._timerWarnPlayed = false;
        this.game.state = GameState.BATTLE;
        this.game.problem.generate();
        this.game.inputBuffer = "";
        this.ui.updateProblemDisplay(this.game.problem.displayText, this.game.inputBuffer, this.game.isPlayerTurn, this.game.problem.fillInBlank);
        this.ui.updateProblemHint(this.game.problem.hintText || '');

        document.getElementById('timer-bar').style.visibility = 'visible';
        this.game.timerStart = Date.now();
        this._startTimerLoop();
    }

    _timerLoop() {
        if (this.game.state !== GameState.BATTLE) return;

        const cm = this.game.monsters[this.game.currentMonsterIdx];
        const d = this.game.difficulty || Difficulty.HARD;
        const timerSeconds = this.game.isPlayerTurn
            ? DIFFICULTY_TIMER.ATTACK[d]
            : (cm && cm.isParalyzed ? DIFFICULTY_TIMER.MAHI_DODGE[d] : DIFFICULTY_TIMER.DODGE[d]);

        const elapsed = (Date.now() - this.game.timerStart) / 1000;
        const remaining = Math.max(0, timerSeconds - elapsed);
        const ratio = remaining / timerSeconds;
        this.ui.updateTimerBar(ratio);

        // ★ モンスターターン: 残り5秒で警告SE（1回のみ）
        if (!this.game.isPlayerTurn && remaining <= 5 && remaining > 0 && !this._timerWarnPlayed) {
            this._timerWarnPlayed = true;
            this.sound.playSe('timer_warn');
        }

        // ★ モンスターターンでゲージが0になったら被ダメージ
        if (!this.game.isPlayerTurn && remaining <= 0) {
            // タイマーを止めてから処理（二重発火防止）
            if (this.game.timerIntervalId) {
                cancelAnimationFrame(this.game.timerIntervalId);
                this.game.timerIntervalId = null;
            }
            this._onTimerExpiredMonsterTurn();
        }
    }

    // ⑧ rAFベースのタイマーループ開始
    _startTimerLoop() {
        if (this.game.timerIntervalId) cancelAnimationFrame(this.game.timerIntervalId);
        this._timerLoop();
        const tick = () => {
            if (this.game.state !== GameState.BATTLE || this.game.timerIntervalId === null) return;
            this._timerLoop();
            if (this.game.state === GameState.BATTLE && this.game.timerIntervalId !== null) {
                this.game.timerIntervalId = requestAnimationFrame(tick);
            }
        };
        if (this.game.state === GameState.BATTLE) {
            this.game.timerIntervalId = requestAnimationFrame(tick);
        }
    }

    async _onTimerExpiredMonsterTurn() {
        // state が BATTLE のときだけ実行（二重呼び出し対策）
        if (this.game.state !== GameState.BATTLE) return;

        this.sound.playSe('timer_out');
        this.game.state = GameState.TRANSITION; // 入力をブロック

        const m = this.game.monsters[this.game.currentMonsterIdx];
        const isBossTimer = m.battleNumber === Constants.BOSS_BATTLE_NUMBER ||
            (Constants.DEBUG_BOSS_ON_SECOND_BATTLE && m.battleNumber === 2);
        // 連続回避カウント更新（被弾時）
        const timerHitResult = this.game.battle.updateDodgeStreak(
            { dodgeStreak: this.game.dodgeStreak, specialMoveReady: this.game.specialMoveReady }, true, this.game._hasEquippedShield() ? 1 : 0, isBossTimer
        );
        this.game.dodgeStreak = timerHitResult.dodgeStreak;
        this.game.specialMoveReady = timerHitResult.specialMoveReady;
        if (!timerHitResult.specialMoveReady && this.game.specialStandby) {
            this.game.specialStandby = false;
            this.ui.setSpecialStandby(false);
        }
        this.ui.updateAuraUI(this.game.dodgeStreak, this.game.specialMoveReady);
        const { damage } =
            this.game.battle.calcMonsterDamage(
                m,
                this.game._getEquippedShieldBonus(),
                this.game.defenseBonus
            );

        // 通常被ダメージ
        this.game.playerHp = Math.max(0, this.game.playerHp - damage);
        this.ui.updatePlayerHp(this.game.playerHp, this.game.playerMaxHp);

        this.ui.damageScreen();
        this.ui.shakeScreen();
        this.ui.showMessage(`じかんぎれ！\n${damage}ダメージをうけた！`, false, 1500, 'text-neutral');
        this.ui.showCorrectAnswerFeedback(this.game.problem.displayAnswer ?? this.game.problem.answer);

        if (this.game._getEquippedShieldBonus() > 0) {
            this.sound.playSe('shield_block');
        } else {
            this.sound.playSe('player_hit');
        }

        if (this.game.playerHp <= 0) {
            this.game._onGameOver();
            return;
        }

        await new Promise(resolve => setTimeout(resolve, 1500));

        // コンパニオン防御メッセージ
        if (this.game.companionDefenseBonus > 0 && this.game.storage && this.game.storage.isMonsterHouseUnlocked()) {
            const _acn = this.game.storage.loadActiveCompanion();
            if (_acn) {
                const _comps = this.game.storage.loadCompanions();
                const _cname = (_comps[_acn] || {}).name || _acn;
                this.ui.showMessage(`${_cname}は ${this.game.playerName}を まもった！`, false, 1500, 'text-player-action');
                await new Promise(resolve => setTimeout(resolve, 1500));
            }
        }

        this.ui.updateProblemDisplay(this.game.problem.displayText, this.game.inputBuffer, this.game.isPlayerTurn, this.game.problem.fillInBlank);
        this.game._afterMonsterTurnEffects(() => this.game.startPlayerTurn());
    }

    _onQuitBattleBtnClick() {
        // もしすでに確認画面が出ていたら何もしない
        if (document.getElementById('quit-confirm-overlay').classList.contains('active')) return;

        // ゲームオーバー・リザルト・処理中は受け付けない
        if (this.game.state === GameState.GAME_OVER || this.game.state === GameState.RESULT || this.game.state === GameState.TRANSITION) return;

        // タイマーを停止
        if (this.game.timerIntervalId) {
            cancelAnimationFrame(this.game.timerIntervalId);
            this.game.timerIntervalId = null;
        }
        // 一時停止前の状態と経過時間を保存
        this.game._pausedState = this.game.state;
        this.game._pausedElapsed = this.game.timerStart ? Date.now() - this.game.timerStart : 0;
        this.game.state = GameState.TRANSITION;

        document.getElementById('quit-confirm-overlay').classList.add('active');
    }

    _resumeFromQuitConfirm() {
        document.getElementById('quit-confirm-overlay').classList.remove('active');

        // 一時停止前の状態から再開（BATTLE状態だった場合のみタイマーを経過時間分ずらして再起動）
        this.game.state = this.game._pausedState || GameState.BATTLE;
        if (this.game.state === GameState.BATTLE) {
            this.game.timerStart = Date.now() - (this.game._pausedElapsed || 0);
            this._startTimerLoop();
        }

        this.game._pausedState = null;
        this.game._pausedElapsed = 0;
    }


}
