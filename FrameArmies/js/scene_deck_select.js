class SceneDeckSelect extends Phaser.Scene {
    constructor() {
        super('SceneDeckSelect');
    }

    create() {
        this.add.rectangle(640, 360, 1280, 720, 0x000000);

        this.add.text(640, 100, 'DECK SELECT', {
            fontSize: '56px',
            color: '#ffffff'
        }).setOrigin(0.5);

        for(let i=1; i<=3; i++) {
            const y = 150 + i * 120;
            const btn = this.add.rectangle(640, y, 600, 80, 0x333333).setInteractive();
            btn.setStrokeStyle(2, 0xaaaaaa);
            
            const deckCards = window.gameData.decks[i].length;
            const text = this.add.text(640, y, `DECK ${i} (${deckCards}/20)`, { fontSize: '32px' }).setOrigin(0.5);

            btn.on('pointerover', () => btn.setFillStyle(0x555555));
            btn.on('pointerout', () => btn.setFillStyle(0x333333));
            btn.on('pointerdown', () => {
                window.gameData.selectedDeckId = i;
                this.scene.start('SceneDeckEdit', { deckId: i });
            });
        }

        const btnBack = this.add.text(100, 50, '← 戻る', { fontSize: '32px', color: '#aaaaaa' }).setInteractive();
        btnBack.on('pointerdown', () => {
             this.scene.start('SceneMenu');
        });
    }
}
