class SceneDeckEdit extends Phaser.Scene {
    constructor() {
        super('SceneDeckEdit');
    }

    init(data) {
        this.deckId = data.deckId;
        // Edit a copy to allow canceling, but for prototype direct edit is fine.
        this.currentDeck = [...window.gameData.decks[this.deckId]];
    }

    create() {
        this.add.rectangle(640, 360, 1280, 720, 0x000000);

        this.titleText = this.add.text(640, 50, `EDIT DECK ${this.deckId}`, {
            fontSize: '48px',
            color: '#ffffff'
        }).setOrigin(0.5);

        this.countText = this.add.text(640, 100, `(${this.currentDeck.length}/20)`, {
            fontSize: '32px',
            color: this.currentDeck.length === 20 ? '#00ff00' : '#ff0000'
        }).setOrigin(0.5);

        this.setupPool();
        this.setupDeckView();

        // Save Button
        const btnSave = this.add.rectangle(1100, 50, 150, 50, 0x226622).setInteractive();
        this.add.text(1100, 50, '保存して戻る', { fontSize: '20px' }).setOrigin(0.5);
        btnSave.on('pointerdown', () => {
            if(this.currentDeck.length === 20) {
                window.gameData.decks[this.deckId] = [...this.currentDeck];
                this.scene.start('SceneDeckSelect');
            } else {
                this.cameras.main.flash(200, 255, 0, 0); // Warning flash
            }
        });

        // Cancel Button
        const btnBack = this.add.text(100, 50, '← キャンセル', { fontSize: '32px', color: '#aaaaaa' }).setInteractive();
        btnBack.on('pointerdown', () => {
             this.scene.start('SceneDeckSelect');
        });
    }

    setupPool() {
        this.add.text(320, 150, '追加可能なカード', { fontSize: '28px', color: '#aaaaaa' }).setOrigin(0.5);
        
        const availableCards = ['Sword', 'Bow', 'Magic', 'Ice', 'Shield', 'Bomb'];
        const WEAPONS = {
            'Sword':  { cost: 1, color: 0x888888, symbol: '剣' },
            'Bow':    { cost: 2, color: 0x00aa00, symbol: '弓' },
            'Magic':  { cost: 4, color: 0xaa00aa, symbol: '魔' },
            'Ice':    { cost: 2, color: 0x00aaaa, symbol: '氷' },
            'Shield': { cost: 2, color: 0xaaaa00, symbol: '盾' },
            'Bomb':   { cost: 3, color: 0xaa0000, symbol: '爆' }
        };

        availableCards.forEach((cardId, index) => {
            const x = 320;
            const y = 220 + index * 70;
            const info = WEAPONS[cardId];
            
            const btn = this.add.rectangle(x, y, 400, 60, info.color).setInteractive();
            btn.setStrokeStyle(2, 0xffffff);
            this.add.text(x, y, `追加: ${info.symbol} [Cost:${info.cost}]`, { fontSize: '24px' }).setOrigin(0.5);

            btn.on('pointerdown', () => {
                if(this.currentDeck.length < 20) {
                    this.currentDeck.push(cardId);
                    this.updateView();
                }
            });
        });
    }

    setupDeckView() {
        this.add.text(960, 150, 'デッキ内容 (クリックで削除)', { fontSize: '28px', color: '#aaaaaa' }).setOrigin(0.5);
        
        this.deckContainer = this.add.container(0, 0);
        this.updateView();
    }

    updateView() {
        this.deckContainer.removeAll(true); // clear old texts

        this.countText.setText(`(${this.currentDeck.length}/20)`);
        this.countText.setColor(this.currentDeck.length === 20 ? '#00ff00' : '#ff0000');

        // Group by card type to display
        const counts = {};
        this.currentDeck.forEach(c => {
            counts[c] = (counts[c] || 0) + 1;
        });

        let yOffset = 220;
        Object.keys(counts).forEach(cardId => {
            const count = counts[cardId];
            const btn = this.add.rectangle(960, yOffset, 300, 50, 0x333333).setInteractive();
            btn.setStrokeStyle(1, 0xffffff);
            
            const txt = this.add.text(960, yOffset, `${cardId}  x${count}`, { fontSize: '24px' }).setOrigin(0.5);
            
            this.deckContainer.add([btn, txt]);

            btn.on('pointerdown', () => {
                // remove 1 instance
                const index = this.currentDeck.indexOf(cardId);
                if(index > -1) {
                    this.currentDeck.splice(index, 1);
                    this.updateView();
                }
            });

            yOffset += 60;
        });
    }
}
