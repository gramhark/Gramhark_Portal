class SoundManager {
    constructor() {
        // ---- State ----
        this.currentBgm = null;          // Howl instance currently playing (or null)
        this.isPausedByVisibility = false;
        this.bgmEnabled    = true;
        this.seEnabled     = true;
        this.bgmVolumeRate = 100;
        this.seVolumeRate  = 100;

        this._seMap = {};
        this._initialized = false;

        this._bindVisibilityChange();
    }

    initHowls() {
        if (this._initialized) return;
        this._initialized = true;

        Howler.html5PoolSize = 50;

        // ---- BGM Howl instances ----
        this.bgmTitle        = this._bgm('assets/audio/BGM/ui/title.mp3');
        this.bgmMenu         = this._bgm('assets/audio/BGM/ui/menu.mp3');
        this.bgmDungeon      = this._bgm('assets/audio/BGM/ui/dungeon.mp3');
        this.bgmBoss         = this._bgm('assets/audio/BGM/boss/boss.mp3');
        this.bgmBossNext     = this._bgm('assets/audio/BGM/boss/boss_next.mp3');
        this.bgmBossAngry    = this._bgm('assets/audio/BGM/boss/boss_angry.mp3');
        this.bgmMonsterAngry = this._bgm('assets/audio/BGM/battle/monster_angry.mp3');
        this.bgmSrare        = this._bgm('assets/audio/BGM/encounter/srare.mp3');
        this.bgmRare         = this._bgm('assets/audio/BGM/encounter/rare.mp3');
        this.bgmHeal         = this._bgm('assets/audio/BGM/encounter/heal.mp3');
        this.bgmSpecial      = this._bgm('assets/audio/BGM/encounter/special.mp3');
        this.bgmShop         = this._bgm('assets/audio/BGM/ui/shop.mp3');
        this.bgmClear        = this._bgm('assets/audio/BGM/result/clear.mp3', false); // not looped
        this.bgmGameover     = this._bgm('assets/audio/BGM/result/gameover.mp3');
        this.bgmMonsterHouse = this._bgm('assets/audio/BGM/ui/monster_house.mp3');

        // battle BGMs: [0]=floors 1-10 … [9]=floors 91-100
        this.bgmBattle = [];
        for (let i = 1; i <= 10; i++) {
            this.bgmBattle.push(
                this._bgm(`assets/audio/BGM/battle/battle_${String(i).padStart(2, '0')}.mp3`)
            );
        }

        // ---- SE Howl instances ----
        // battle
        this.sePunch           = this._se('assets/audio/SE/battle/punch.mp3');
        this.sePunchCrit       = this._se('assets/audio/SE/battle/punch_crit.mp3');
        this.seSword           = this._se('assets/audio/SE/battle/sword.mp3?v=20260408');
        this.seSwordCrit       = this._se('assets/audio/SE/battle/sword_crit.mp3?v=20260409');
        this.seHitting         = this._se('assets/audio/SE/battle/hitting.mp3');
        this.seHittingCrit     = this._se('assets/audio/SE/battle/hitting_crit.mp3');
        this.seSlash           = this._se('assets/audio/SE/battle/slash.mp3?v=20260408');
        this.seSlashCrit       = this._se('assets/audio/SE/battle/slash_crit.mp3?v=20260409');
        this.seSlashRed        = this._se('assets/audio/SE/battle/slash_red.mp3?v=20260408');
        this.seSlashCritRed    = this._se('assets/audio/SE/battle/slash_crit_red.mp3');
        this.seSlashBlue       = this._se('assets/audio/SE/battle/slash_blue.mp3?v=20260408');
        this.seSlashCritBlue   = this._se('assets/audio/SE/battle/slash_crit_blue.mp3');
        this.seSlashGreen      = this._se('assets/audio/SE/battle/slash_green.mp3?v=20260408');
        this.seSlashCritGreen  = this._se('assets/audio/SE/battle/slash_crit_green.mp3');
        this.seSlashYellow     = this._se('assets/audio/SE/battle/slash_yellow.mp3?v=20260408');
        this.seSlashCritYellow = this._se('assets/audio/SE/battle/slash_crit_yellow.mp3');
        this.seSlashBlack      = this._se('assets/audio/SE/battle/slash_black.mp3?v=20260408');
        this.seSlashCritBlack  = this._se('assets/audio/SE/battle/slash_crit_black.mp3');
        this.seSlashWhite      = this._se('assets/audio/SE/battle/slash_white.mp3?v=20260408');
        this.seSlashCritWhite  = this._se('assets/audio/SE/battle/slash_crit_white.mp3');
        this.seSpecial         = this._se('assets/audio/SE/battle/special.mp3');
        this.sePlayerHit       = this._se('assets/audio/SE/battle/player_hitX.mp3');
        this.seShieldBlock     = this._se('assets/audio/SE/battle/shield_block.mp3');
        this.sePlayerDodge     = this._se('assets/audio/SE/battle/player_dodge.mp3');
        this.seMonsterMiss     = this._se('assets/audio/SE/battle/monster_miss.mp3');
        this.seGaugeUp         = this._se('assets/audio/SE/battle/gauge_up.mp3?v=20260409');
        this.seGaugeMax        = this._se('assets/audio/SE/battle/gauge_maxX.mp3');
        this.seStandby         = this._se('assets/audio/SE/battle/gauge_standby.mp3');
        // status
        this.sePoison          = this._se('assets/audio/SE/status/poison_set.mp3');
        this.sePoisonTick      = this._se('assets/audio/SE/status/poison_tick.mp3');
        this.seParalyze        = this._se('assets/audio/SE/status/paralyze_set.mp3');
        this.seParalyzed       = this._se('assets/audio/SE/status/paralyzed.mp3');
        this.seStone           = this._se('assets/audio/SE/status/stone_throw.mp3');
        this.seStoneProc       = this._se('assets/audio/SE/status/stone_proc.mp3');
        // item
        this.seHeal            = this._se('assets/audio/SE/item/heal.mp3?v=20260408');
        this.seAtkUp           = this._se('assets/audio/SE/item/atk_up.mp3');
        this.seDefUp           = this._se('assets/audio/SE/item/def_up.mp3');
        this.seThrow           = this._se('assets/audio/SE/item/spike_throw.mp3');
        this.seEquipGet        = this._se('assets/audio/SE/item/equip_get.mp3');
        this.seEquipSet        = this._se('assets/audio/SE/item/equip_setX.mp3');
        this.seEquipRemove     = this._se('assets/audio/SE/item/equip_removeX.mp3');
        this.seMalle           = this._se('assets/audio/SE/item/malle_get.mp3');
        // event
        this.seDefeat          = this._se('assets/audio/SE/event/defeat.mp3');
        this.seBossDestroyed   = this._se('assets/audio/SE/event/boss_destroyed.mp3');
        this.seBossEnter       = this._se('assets/audio/SE/event/boss_enter.mp3');
        this.seTransform       = this._se('assets/audio/SE/event/boss_transform.mp3');
        this.seBossResurrection= this._se('assets/audio/SE/event/boss_resurrection.mp3');
        this.seMonsterRecover  = this._se('assets/audio/SE/event/monster_recover.mp3');
        this.seLevelUp         = this._se('assets/audio/SE/event/level_up.mp3?v=20260408');
        this.seClear           = this._se('assets/audio/SE/event/dungeon_clearX.mp3');
        this.seGameover        = this._se('assets/audio/SE/event/gameover.mp3');
        this.seNote            = this._se('assets/audio/SE/event/note_reg.mp3');
        // ui
        this.seNumpad          = this._se('assets/audio/SE/ui/numpadX.mp3');
        this.seSlideOpen       = this._se('assets/audio/SE/ui/screen_slide_open.mp3');
        this.seSlideClose      = this._se('assets/audio/SE/ui/screen_slide_closeX.mp3?v=20260408');
        this.seTitleTap        = this._se('assets/audio/SE/ui/title_tap.mp3');
        this.seBuy             = this._se('assets/audio/SE/ui/buy.mp3');
        this.seSell            = this._se('assets/audio/SE/ui/buy.mp3');
        this.seTimerWarn       = this._se('assets/audio/SE/ui/timer_warn.mp3');
        this.seTimerOut        = this._se('assets/audio/SE/ui/timer_out.mp3');
        this.seDungeonPin01    = this._se('assets/audio/SE/ui/dungeon_pin_01.mp3');
        this.seDungeonPin02    = this._se('assets/audio/SE/ui/dungeon_pin_02.mp3');
        this.seDungeonPin03    = this._se('assets/audio/SE/ui/dungeon_pin_03.mp3');
        this.seDungeonTab      = this._se('assets/audio/SE/ui/dungeon_tub.mp3');
        this.seBattleStart     = this._se('assets/audio/SE/ui/battlestart.mp3');
        this.seBtn             = this._se('assets/audio/SE/ui/btn.mp3');
        this.seNoteDetails     = this._se('assets/audio/SE/ui/note_details.mp3');
        this.seBack            = this._se('assets/audio/SE/ui/back.mp3');
        this.seEquipSort       = this._se('assets/audio/SE/item/equip_sort.mp3');
        this.seShopTub         = this._se('assets/audio/SE/ui/shop_tub.mp3');
        this.seEquipTub        = this._se('assets/audio/SE/item/equip_tub.mp3');
        this.seNoteGrid        = this._se('assets/audio/SE/ui/note_grid.mp3');
        // monster house
        this.seCapture         = this._se('assets/audio/SE/battle/capture.mp3');
        this.seCompanionCutin  = this._se('assets/audio/SE/battle/companion_cutin.mp3');
        this.seFriendshipBerry = this._se('assets/audio/SE/item/friendship_berry.mp3');
        this.seCompanionGo     = this._se('assets/audio/SE/ui/companion_go.mp3');

        // ③ SE マップを一度だけ構築
        this._seMap = {
            'punch':               this.sePunch,
            'punch_crit':          this.sePunchCrit,
            'sword':               this.seSword,
            'sword_crit':          this.seSwordCrit,
            'hitting':             this.seHitting,
            'hitting_crit':        this.seHittingCrit,
            'slash':               this.seSlash,
            'slash_crit':          this.seSlashCrit,
            'slash_red':           this.seSlashRed,
            'slash_crit_red':      this.seSlashCritRed,
            'slash_blue':          this.seSlashBlue,
            'slash_crit_blue':     this.seSlashCritBlue,
            'slash_green':         this.seSlashGreen,
            'slash_crit_green':    this.seSlashCritGreen,
            'slash_yellow':        this.seSlashYellow,
            'slash_crit_yellow':   this.seSlashCritYellow,
            'slash_black':         this.seSlashBlack,
            'slash_crit_black':    this.seSlashCritBlack,
            'slash_white':         this.seSlashWhite,
            'slash_crit_white':    this.seSlashCritWhite,
            'special':             this.seSpecial,
            'player_hit':          this.sePlayerHit,
            'shield_block':        this.seShieldBlock,
            'player_dodge':        this.sePlayerDodge,
            'monster_miss':        this.seMonsterMiss,
            'gauge_up':            this.seGaugeUp,
            'gauge_max':           this.seGaugeMax,
            'standby':             this.seStandby,
            'poison':              this.sePoison,
            'poison_tick':         this.sePoisonTick,
            'paralyze':            this.seParalyze,
            'paralyzed':           this.seParalyzed,
            'stone':               this.seStone,
            'stone_proc':          this.seStoneProc,
            'heal':                this.seHeal,
            'atk_up':              this.seAtkUp,
            'def_up':              this.seDefUp,
            'throw':               this.seThrow,
            'equip_get':           this.seEquipGet,
            'equip_set':           this.seEquipSet,
            'equip_remove':        this.seEquipRemove,
            'malle':               this.seMalle,
            'defeat':              this.seDefeat,
            'boss_destroyed':      this.seBossDestroyed,
            'boss_enter':          this.seBossEnter,
            'transform':           this.seTransform,
            'boss_resurrection':   this.seBossResurrection,
            'monster_recover':     this.seMonsterRecover,
            'level_up':            this.seLevelUp,
            'clear':               this.seClear,
            'gameover':            this.seGameover,
            'note':                this.seNote,
            'numpad':              this.seNumpad,
            'slide_open':          this.seSlideOpen,
            'slide_close':         this.seSlideClose,
            'title_tap':           this.seTitleTap,
            'buy':                 this.seBuy,
            'sell':                this.seSell,
            'timer_warn':          this.seTimerWarn,
            'timer_out':           this.seTimerOut,
            'dungeon_tab':         this.seDungeonTab,
            'battle_start':        this.seBattleStart,
            'btn':                 this.seBtn,
            'note_details':        this.seNoteDetails,
            'back':                this.seBack,
            'equip_sort':          this.seEquipSort,
            'shop_tub':            this.seShopTub,
            'equip_tub':           this.seEquipTub,
            'note_grid':           this.seNoteGrid,
            'capture':             this.seCapture,
            'companion_cutin':     this.seCompanionCutin,
            'friendship_berry':    this.seFriendshipBerry,
            'companion_go':        this.seCompanionGo,
        };
    }

    // ------------------------------------------------------------------ helpers

    _bgm(src, loop = true) {
        return new Howl({ src: [src], loop, volume: 0, preload: false, html5: true, pool: 1 });
    }

    _se(src) {
        return new Howl({ src: [src], preload: false, html5: true, pool: 1 });
    }

    _getBgmVol() { return (this.bgmVolumeRate / 100) * 0.5; }
    _getSeVol()  { return (this.seVolumeRate  / 100) * 1.0; }

    // Return the battle BGM Howl for a given floor (1-based)
    _getBattleBgmHowl(floor) {
        const idx = Math.min(10, Math.ceil((floor || 1) / 10)) - 1;
        return this.bgmBattle[idx];
    }

    // Stop the current BGM:
    //   - battle BGMs → pause (preserve playback position)
    //   - all others  → stop  (reset to beginning)
    _pauseOrStopCurrent() {
        if (!this.currentBgm) return;

        if (this.currentBgm._customFade) {
            clearInterval(this.currentBgm._customFade);
            this.currentBgm._customFade = null;
        }

        if (this.bgmBattle.includes(this.currentBgm)) {
            this.currentBgm.pause();
        } else {
            this.currentBgm.stop();
        }
    }

    // ------------------------------------------------------------------ settings

    applySettings(bgmEnabled, seEnabled, bgmVolumeRate, seVolumeRate) {
        this.bgmEnabled    = bgmEnabled;
        this.seEnabled     = seEnabled;
        this.bgmVolumeRate = bgmVolumeRate;
        this.seVolumeRate  = seVolumeRate;
        if (this.currentBgm) {
            if (!bgmEnabled) {
                this.currentBgm.pause();
            } else {
                this.currentBgm.volume(this._getBgmVol());
                if (!this.currentBgm.playing() && !this.isPausedByVisibility) {
                    this.currentBgm.play();
                }
            }
        }
    }

    // ------------------------------------------------------------------ visibility

    _bindVisibilityChange() {
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                if (this.currentBgm && this.currentBgm.playing()) {
                    this.currentBgm.pause();
                    this.isPausedByVisibility = true;
                }
            } else {
                if (this.isPausedByVisibility && this.currentBgm) {
                    this.currentBgm.play();
                }
                this.isPausedByVisibility = false;
            }
        });
    }

    // ------------------------------------------------------------------ fade helpers

    fadeInBgm(howl, targetVolume = 0.5, durationMs = 500) {
        if (!howl) return;
        howl.volume(0);
        if (!howl.playing()) {
            howl.play();
        }

        if (howl._customFade) {
            clearInterval(howl._customFade);
        }

        let elapsed = 0;
        const tick = 50;
        howl._customFade = setInterval(() => {
            elapsed += tick;
            if (elapsed >= durationMs) {
                howl.volume(targetVolume);
                clearInterval(howl._customFade);
                howl._customFade = null;
            } else {
                howl.volume(targetVolume * (elapsed / durationMs));
            }
        }, tick);
    }

    // Fade a BGM Howl out then stop it.
    fadeOutBgm(howl, durationMs = 500) {
        if (!howl || !howl.playing()) return;

        if (howl._customFade) {
            clearInterval(howl._customFade);
        }

        const startVol = howl.volume();
        let elapsed = 0;
        const tick = 50;

        howl._customFade = setInterval(() => {
            elapsed += tick;
            if (elapsed >= durationMs) {
                howl.volume(0);
                howl.stop();
                clearInterval(howl._customFade);
                howl._customFade = null;
            } else {
                howl.volume(startVol * (1 - (elapsed / durationMs)));
            }
        }, tick);
    }

    // ------------------------------------------------------------------ BGM playback

    // Internal: switch to a target Howl, optionally with fade-in.
    _switchTo(target, fadeIn = false) {
        if (this.currentBgm === target) {
            if (!target.playing()) {
                target.volume(this._getBgmVol());
                target.play();
            }
            return;
        }
        this._pauseOrStopCurrent();
        this.currentBgm = target;
        if (fadeIn) {
            this.fadeInBgm(target, this._getBgmVol(), 1000);
        } else {
            target.volume(this._getBgmVol());
            target.play();
        }
    }

    playBgm({ isBoss = false, isSuperRare = false, isDungeonRare = false, isHeal = false, isSpecial = false, floor = 1 } = {}) {
        if (!this.bgmEnabled) return;

        let target = this._getBattleBgmHowl(floor);
        if      (isBoss)       target = this.bgmBoss;
        else if (isSuperRare)  target = this.bgmSrare;
        else if (isDungeonRare)target = this.bgmRare;
        else if (isHeal)       target = this.bgmHeal;
        else if (isSpecial)    target = this.bgmSpecial;

        const useFadeIn = target === this.bgmSrare || target === this.bgmRare ||
                          target === this.bgmHeal  || target === this.bgmSpecial;
        this._switchTo(target, useFadeIn);
    }

    playTitleBgm()        { if (!this.bgmEnabled) return; this._switchTo(this.bgmTitle,        false); }
    playMenuBgm()         { if (!this.bgmEnabled) return; this._switchTo(this.bgmMenu,         false); }
    playDungeonBgm()      { if (!this.bgmEnabled) return; this._switchTo(this.bgmDungeon,      false); }
    playShopBgm()         { if (!this.bgmEnabled) return; this._switchTo(this.bgmShop,         true);  }
    playMonsterHouseBgm() { if (!this.bgmEnabled) return; this._switchTo(this.bgmMonsterHouse, true);  }

    playBossNextBgm() {
        if (!this.bgmEnabled) return;
        this._pauseOrStopCurrent();
        this.currentBgm = this.bgmBossNext;
        this.bgmBossNext.stop();
        this.fadeInBgm(this.bgmBossNext, this._getBgmVol(), 500);
    }

    playAngryBgm(isBoss) {
        if (!this.bgmEnabled) return;
        const target = isBoss ? this.bgmBossAngry : this.bgmMonsterAngry;
        this._pauseOrStopCurrent();
        this.currentBgm = target;
        target.stop();
        this.fadeInBgm(target, this._getBgmVol(), 500);
    }

    stopBgm() {
        const all = [
            this.bgmTitle, this.bgmMenu, this.bgmDungeon,
            ...this.bgmBattle,
            this.bgmBoss, this.bgmBossNext, this.bgmBossAngry, this.bgmMonsterAngry,
            this.bgmSrare, this.bgmRare, this.bgmHeal, this.bgmSpecial,
            this.bgmShop, this.bgmClear, this.bgmGameover, this.bgmMonsterHouse,
        ].filter(Boolean);
        all.forEach(h => h.stop());
        this.currentBgm = null;
        this.isPausedByVisibility = false;
    }

    // ------------------------------------------------------------------ SE playback

    playSe(type, difficulty = 1) {
        if (!this.seEnabled) return;
        if (document.hidden) return;

        // dungeon_pin は difficulty に応じて動的に選択
        let se;
        if (type === 'dungeon_pin') {
            se = difficulty === 3 ? this.seDungeonPin03
               : difficulty === 2 ? this.seDungeonPin02
               : this.seDungeonPin01;
        } else {
            se = this._seMap[type];
        }

        if (se) {
            // ② pool: 1 で運用するため、再生中の場合は先に stop() してリセット。
            //    元コードの `currentTime = 0; play()` と同等の「上書き再生」挙動を再現。
            se.stop();
            se.volume(this._getSeVol());
            se.play();
        }
    }

    // ------------------------------------------------------------------ iOS unlock

    // Howler.js automatically unlocks the AudioContext on the first user interaction.
    // This method is kept for API compatibility but is a no-op.
    unlockAll() { /* handled by Howler */ }
}
