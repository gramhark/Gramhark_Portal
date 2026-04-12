class SceneMenu extends Phaser.Scene {
    constructor() {
        super('SceneMenu');
    }

    create() {
        this.add.rectangle(640, 360, 1280, 720, 0x000000);

        this.add.text(640, 150, 'MAIN MENU', {
            fontSize: '56px',
            color: '#ffffff'
        }).setOrigin(0.5);

        // Stage Select Button
        const btnStage = this.add.rectangle(640, 350, 400, 80, 0x333333).setInteractive();
        btnStage.setStrokeStyle(2, 0xffffff);
        this.add.text(640, 350, '出撃 (Stage Select)', { fontSize: '32px' }).setOrigin(0.5);

        btnStage.on('pointerover', () => btnStage.setFillStyle(0x555555));
        btnStage.on('pointerout', () => btnStage.setFillStyle(0x333333));
        btnStage.on('pointerdown', () => {
            this.scene.start('SceneStageSelect');
        });

        // Deck Edit Button
        const btnDeck = this.add.rectangle(640, 480, 400, 80, 0x222222).setInteractive();
        btnDeck.setStrokeStyle(2, 0xffffff);
        this.add.text(640, 480, 'デッキ編成 (Deck Edit)', { fontSize: '32px' }).setOrigin(0.5);

        btnDeck.on('pointerover', () => btnDeck.setFillStyle(0x444444));
        btnDeck.on('pointerout', () => btnDeck.setFillStyle(0x222222));
        btnDeck.on('pointerdown', () => {
            this.scene.start('SceneDeckSelect');
        });
    }
}
