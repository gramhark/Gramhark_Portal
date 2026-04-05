/* AnimationRenderer - battle visual effects extracted from UIManager */
class AnimationRenderer {
    constructor() {
        this._battleFlashEl = null;
        this._statusFlashEl = null;
    }

    // ④⑤ バトルフラッシュ要素を初回のみ生成して使い回す
    _getBattleFlash() {
        if (!this._battleFlashEl) {
            const battleView = document.querySelector('.battle-view');
            if (!battleView) return null;
            const el = document.createElement('div');
            el.className = 'battle-white-flash';
            battleView.appendChild(el);
            this._battleFlashEl = el;
        }
        return this._battleFlashEl;
    }

    // ④⑤ ステータスフラッシュ要素を初回のみ生成して使い回す
    _getStatusFlash() {
        if (!this._statusFlashEl) {
            const panel = document.querySelector('.panel-section--status');
            if (!panel) return null;
            panel.style.position = 'relative';
            const el = document.createElement('div');
            el.className = 'damage-flash-overlay';
            panel.appendChild(el);
            this._statusFlashEl = el;
        }
        return this._statusFlashEl;
    }

    // ④ animation: none → rAF でアニメーション再起動（void offsetWidth 置き換え）
    _restartAnim(el, addFn) {
        el.style.animation = 'none';
        el.style.opacity = '0';
        requestAnimationFrame(() => {
            el.style.animation = '';
            el.style.opacity = '';
            if (addFn) addFn();
        });
    }

    /**
     * 攻撃エフェクト画像をモンスターの上にアニメーション表示する
     * @param {'attack'|'critical'|'attack_H'|'critical_H'|'attack_S'|'critical_S'|'attack_SP'} type
     */
    showAttackEffect(type) {
        const el = document.getElementById('attack-effect-img');
        if (!el) return;

        const src = `assets/image/effect/${type}.webp`;
        let animClass = '';

        if (type === 'attack_SP') {
            animClass = 'anim-sp-attack';
        } else if (type.startsWith('critical_S')) {
            animClass = 'anim-crescent';
        } else if (type.startsWith('attack_S')) {
            animClass = 'anim-slash';
        } else if (type === 'critical_H' || type === 'critical') {
            animClass = 'anim-critical-hit';
        } else {
            animClass = 'anim-hit';
        }

        el.className = 'attack-effect-img';
        el.src = src;
        el.style.animation = 'none';
        requestAnimationFrame(() => {
            el.style.animation = '';
            el.classList.add(animClass);
            el.addEventListener('animationend', () => {
                el.className = 'attack-effect-img';
                el.src = '';
            }, { once: true });
        });
    }

    /**
     * @param {'normal'|'critical'|'sp'} type
     */
    flashScreen(type = 'normal') {
        const monsterImg = document.getElementById('monster-img');
        const wrapper = document.querySelector('.monster-img-wrapper');

        // モンスター画像点滅
        const flashClass = type === 'sp' ? 'flash-sp' : type === 'critical' ? 'flash-critical' : 'flash-effect';
        monsterImg.classList.remove('flash-effect', 'flash-critical', 'flash-sp', 'dodge-effect', 'attack-effect');
        monsterImg.style.animation = 'none';
        requestAnimationFrame(() => {
            monsterImg.style.animation = '';
            monsterImg.classList.add(flashClass);
        });

        // モンスター画像ラッパー揺れ
        if (wrapper) {
            const shakeClass = (type === 'sp' || type === 'critical') ? 'shake-img-wrapper-crit' : 'shake-img-wrapper';
            wrapper.classList.remove('shake-img-wrapper', 'shake-img-wrapper-crit');
            wrapper.style.animation = 'none';
            requestAnimationFrame(() => {
                wrapper.style.animation = '';
                wrapper.classList.add(shakeClass);
                wrapper.addEventListener('animationend', () => {
                    wrapper.classList.remove(shakeClass);
                }, { once: true });
            });
        }

        // 必殺技時: バトルビュー全体を白いオーバーレイでフラッシュ（⑤ 使い回し）
        if (type === 'sp') {
            const el = this._getBattleFlash();
            if (el) {
                this._restartAnim(el);
            }
        }
    }

    shakeScreen() {
        const target = document.querySelector('.screen.active');
        if (!target) return;

        target.classList.remove('shake-effect');
        target.style.animation = 'none';
        requestAnimationFrame(() => {
            target.style.animation = '';
            target.classList.add('shake-effect');
        });

        // 被ダメージ時: ステータスウィンドウを赤いオーバーレイでフラッシュ（⑤ 使い回し）
        const flashEl = this._getStatusFlash();
        if (flashEl) {
            this._restartAnim(flashEl);
        }
    }

    dodgeScreen() {
        const monsterImg = document.getElementById('monster-img');
        monsterImg.classList.remove('flash-effect', 'dodge-effect', 'attack-effect', 'damage-effect');
        monsterImg.style.animation = 'none';
        requestAnimationFrame(() => {
            monsterImg.style.animation = '';
            monsterImg.classList.add('dodge-effect');
        });
    }

    attackScreen() {
        const monsterImg = document.getElementById('monster-img');
        monsterImg.classList.remove('flash-effect', 'dodge-effect', 'attack-effect', 'damage-effect');
        monsterImg.style.animation = 'none';
        requestAnimationFrame(() => {
            monsterImg.style.animation = '';
            monsterImg.classList.add('attack-effect');
        });
    }

    damageScreen() {
        const monsterImg = document.getElementById('monster-img');
        monsterImg.classList.remove('flash-effect', 'dodge-effect', 'attack-effect', 'damage-effect');
        monsterImg.style.animation = 'none';
        requestAnimationFrame(() => {
            monsterImg.style.animation = '';
            monsterImg.classList.add('damage-effect');
        });
    }

    /**
     * ⑦ 雷エフェクトは削除（パフォーマンス最適化）
     */
    showLightning() {}

    /**
     * Special_モンスター撃破時: 青いグラデーションを下から上に走らせるエフェクト
     */
    showAtkUpEffect() {
        const statusPanel = document.querySelector('.panel-section--status');
        if (!statusPanel) return;

        const oldClip = statusPanel.querySelector('.atkup-clip');
        if (oldClip) oldClip.remove();

        const prevPosition = statusPanel.style.position;
        statusPanel.style.position = 'relative';

        const clipDiv = document.createElement('div');
        clipDiv.className = 'atkup-clip';
        clipDiv.style.cssText = 'position:absolute;top:0;left:0;right:0;bottom:0;overflow:hidden;pointer-events:none;z-index:25;';
        statusPanel.appendChild(clipDiv);

        const el = document.createElement('div');
        el.className = 'atkup-effect';
        clipDiv.appendChild(el);

        el.addEventListener('animationend', () => {
            clipDiv.remove();
            statusPanel.style.position = prevPosition;
        }, { once: true });
    }

    /**
     * かいふくモンスター回復時: 緑グラデーションを下から上に走らせるエフェクト
     */
    showHealEffect() {
        const statusPanel = document.querySelector('.panel-section--status');
        if (!statusPanel) return;

        const oldClip = statusPanel.querySelector('.healup-clip');
        if (oldClip) oldClip.remove();

        const prevPosition = statusPanel.style.position;
        statusPanel.style.position = 'relative';

        const clipDiv = document.createElement('div');
        clipDiv.className = 'healup-clip';
        clipDiv.style.cssText = 'position:absolute;top:0;left:0;right:0;bottom:0;overflow:hidden;pointer-events:none;z-index:25;';
        statusPanel.appendChild(clipDiv);

        const el = document.createElement('div');
        el.className = 'healup-effect';
        clipDiv.appendChild(el);

        el.addEventListener('animationend', () => {
            clipDiv.remove();
            statusPanel.style.position = prevPosition;
        }, { once: true });
    }

    /**
     * ぼうぎょだま使用時: 青いグラデーションを下から上に走らせるエフェクト
     */
    showDefUpEffect() {
        const statusPanel = document.querySelector('.panel-section--status');
        if (!statusPanel) return;

        const oldClip = statusPanel.querySelector('.defup-clip');
        if (oldClip) oldClip.remove();

        const prevPosition = statusPanel.style.position;
        statusPanel.style.position = 'relative';

        const clipDiv = document.createElement('div');
        clipDiv.className = 'defup-clip';
        clipDiv.style.cssText = 'position:absolute;top:0;left:0;right:0;bottom:0;overflow:hidden;pointer-events:none;z-index:25;';
        statusPanel.appendChild(clipDiv);

        const el = document.createElement('div');
        el.className = 'defup-effect';
        clipDiv.appendChild(el);

        el.addEventListener('animationend', () => {
            clipDiv.remove();
            statusPanel.style.position = prevPosition;
        }, { once: true });
    }

    /**
     * ミスターきんか効果時: 黄色いグラデーションを下から上に走らせるエフェクト
     */
    showGoldUpEffect() {
        const statusPanel = document.querySelector('.panel-section--status');
        if (!statusPanel) return;

        const oldClip = statusPanel.querySelector('.goldup-clip');
        if (oldClip) oldClip.remove();

        const prevPosition = statusPanel.style.position;
        statusPanel.style.position = 'relative';

        const clipDiv = document.createElement('div');
        clipDiv.className = 'goldup-clip';
        clipDiv.style.cssText = 'position:absolute;top:0;left:0;right:0;bottom:0;overflow:hidden;pointer-events:none;z-index:25;';
        statusPanel.appendChild(clipDiv);

        const el = document.createElement('div');
        el.className = 'goldup-effect';
        clipDiv.appendChild(el);

        el.addEventListener('animationend', () => {
            clipDiv.remove();
            statusPanel.style.position = prevPosition;
        }, { once: true });
    }

    /**
     * ミスターねんりん効果時: 紫のグラデーションを下から上に走らせるエフェクト
     */
    showExpUpEffect() {
        const statusPanel = document.querySelector('.panel-section--status');
        if (!statusPanel) return;

        const oldClip = statusPanel.querySelector('.expup-clip');
        if (oldClip) oldClip.remove();

        const prevPosition = statusPanel.style.position;
        statusPanel.style.position = 'relative';

        const clipDiv = document.createElement('div');
        clipDiv.className = 'expup-clip';
        clipDiv.style.cssText = 'position:absolute;top:0;left:0;right:0;bottom:0;overflow:hidden;pointer-events:none;z-index:25;';
        statusPanel.appendChild(clipDiv);

        const el = document.createElement('div');
        el.className = 'expup-effect';
        clipDiv.appendChild(el);

        el.addEventListener('animationend', () => {
            clipDiv.remove();
            statusPanel.style.position = prevPosition;
        }, { once: true });
    }
}
