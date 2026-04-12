class SceneBattle extends Phaser.Scene {
    constructor() {
        super('SceneBattle');
    }

    preload() {
        // No assets to load, using graphics
    }

    create() {
        this.isGameOver = false;

        // レイアウト定義
        const frameX = 50;
        const frameY = 50;
        const cellSize = 70;
        
        // システム初期化
        this.grid = new GridSystem(this, frameX, frameY, cellSize, 8, 8);
        this.em = new EntityManager(this, this.grid);
        this.deckSys = new DeckSystem(this, this.em);
        this.combatSys = new CombatSystem(this, this.grid, this.em);

        // UI連携
        this.setupDOMUI();

        // 入力制御
        this.setupInput();
        
        // 初期敵出現
        this.combatSys.spawnInitialEnemies();
        this.em.renderAll();
    }

    setupDOMUI() {
        const btnGo = document.getElementById('btn-go');
        const btnRemove = document.getElementById('btn-remove-mode');

        // イベントリスナーの重複を防ぐため一度クローンして置き換え
        const newBtnGo = btnGo.cloneNode(true);
        btnGo.parentNode.replaceChild(newBtnGo, btnGo);
        const newBtnRemove = btnRemove.cloneNode(true);
        btnRemove.parentNode.replaceChild(newBtnRemove, btnRemove);

        newBtnRemove.onclick = () => {
            this.deckSys.removalMode = !this.deckSys.removalMode;
            newBtnRemove.innerText = `パネル撤去: ${this.deckSys.removalMode ? 'ON' : 'OFF'}`;
            newBtnRemove.classList.toggle('on', this.deckSys.removalMode);
            this.deckSys.selectedHandIndex = -1;
            this.updateDeckUI();
        };

        newBtnGo.onclick = async () => {
            if(this.isGameOver) return;
            newBtnGo.disabled = true;
            newBtnGo.style.opacity = '0.5';
            
            await this.combatSys.processTurn();
            
            this.updateDeckUI();
            if(!this.isGameOver) {
                newBtnGo.disabled = false;
                newBtnGo.style.opacity = '1';
            }
        };

        this.updateDeckUI();
    }

    updateDeckUI() {
        if(!document.getElementById('hud-cost')) return; // Check if DOM loaded

        const cost = this.deckSys.recalculateCost();
        document.getElementById('hud-cost').innerText = `Cost: ${cost} / ${this.deckSys.maxCost}`;
        
        const remaining = this.deckSys.getDeckRemaining();
        const deckEl = document.getElementById('hud-deck');
        deckEl.innerText = `Deck: ${remaining}`;
        deckEl.style.color = remaining <= 5 ? '#ff0000' : (remaining <= 10 ? '#ffff00' : '#ffffff');

        document.getElementById('hud-turn').innerText = `Turn: ${this.combatSys.turn}`;

        const handContainer = document.getElementById('hud-hand-container');
        handContainer.innerHTML = '';

        this.deckSys.hand.forEach((cardId, i) => {
            const info = this.em.WEAPONS[cardId];
            const div = document.createElement('div');
            div.className = 'hand-card';
            if(this.deckSys.selectedHandIndex === i && !this.deckSys.removalMode) div.classList.add('selected');
            
            const colorHex = '#' + info.color.toString(16).padStart(6, '0');
            div.style.borderLeftColor = colorHex;
            
            div.innerHTML = `<span class="card-name">${info.symbol} ${cardId}</span><span class="card-cost">Cost: ${info.cost}</span>`;
            
            div.onclick = () => {
                if(!this.deckSys.removalMode) {
                    this.deckSys.selectedHandIndex = i;
                    this.updateDeckUI();
                }
            };
            handContainer.appendChild(div);
        });
    }

    setupInput() {
        // ドラッグ（方向指定）用の変数
        this.pointerDownGrid = null;

        this.input.on('pointerdown', (pointer) => {
            if(this.isGameOver) return;
            
            const cell = this.grid.getGridCellFromWorld(pointer.x, pointer.y);
            if(!cell) return;

            // 撤去モードの場合
            if(this.deckSys.removalMode) {
                const existing = this.em.getPanelAt(cell.row, cell.col);
                if(existing) {
                    this.em.removePanel(existing);
                    this.updateDeckUI();
                }
                return;
            }

            // カード配置
            if(this.deckSys.selectedHandIndex !== -1) {
                const cardType = this.deckSys.hand[this.deckSys.selectedHandIndex];
                const existing = this.em.getPanelAt(cell.row, cell.col);
                
                if (existing) return; // 既にパネルがある場合は置けない

                if(this.deckSys.canPlace(cardType)) {
                    if (this.em.DIRECTIONAL_WEAPONS.includes(cardType)) {
                        // 方向指定が必要な武器。ドラッグで決めるために記録
                        this.pointerDownGrid = cell;
                    } else {
                        // 方向不要の武器（魔法・爆弾・盾）、即配置
                        this.em.addPanel(cardType, cell.row, cell.col, null);
                        this.deckSys.useCardFromHand(this.deckSys.selectedHandIndex);
                        this.deckSys.selectedHandIndex = -1;
                        this.updateDeckUI();
                    }
                } else {
                    // コストオーバー時警告
                    this.cameras.main.flash(200, 255, 0, 0);
                }
            }
        });

        // ドラッグ完了時の処理（方向指定武器の配置）
        this.input.on('pointerup', (pointer) => {
            if(this.pointerDownGrid) {
                // 方向を計算
                const downWorld = this.grid.getWorldPos(this.pointerDownGrid.row, this.pointerDownGrid.col);
                const dx = pointer.x - downWorld.x;
                const dy = pointer.y - downWorld.y;
                
                let dir = null;
                if(Math.abs(dx) > Math.abs(dy)) {
                    if(dx > 30) dir = { row: 0, col: 1 };
                    else if(dx < -30) dir = { row: 0, col: -1 };
                } else {
                    if(dy > 30) dir = { row: 1, col: 0 };
                    else if(dy < -30) dir = { row: -1, col: 0 };
                }

                // デフォルトは上にする
                if(!dir) dir = { row: -1, col: 0 };

                const cardType = this.deckSys.hand[this.deckSys.selectedHandIndex];
                this.em.addPanel(cardType, this.pointerDownGrid.row, this.pointerDownGrid.col, dir);
                
                this.deckSys.useCardFromHand(this.deckSys.selectedHandIndex);
                this.deckSys.selectedHandIndex = -1;
                this.updateDeckUI();

                this.pointerDownGrid = null;
            }
        });
    }

    gameOver(message) {
        this.isGameOver = true;
        if(window.UIController) {
            window.UIController.showGameOver(message);
        }
    }
}
