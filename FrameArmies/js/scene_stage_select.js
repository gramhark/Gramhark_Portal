class SceneStageSelect extends Phaser.Scene {
    constructor() {
        super('SceneStageSelect');
    }

    create() {
        this.add.rectangle(640, 360, 1280, 720, 0x000000);

        this.add.text(640, 100, 'STAGE SELECT', {
            fontSize: '56px',
            color: '#ffffff'
        }).setOrigin(0.5);

        // Stage 1 Button
        const btnStage1 = this.add.rectangle(640, 300, 800, 120, 0x224422).setInteractive();
        btnStage1.setStrokeStyle(2, 0x00ff00);
        this.add.text(640, 300, 'STAGE 1: ゴブリンの森（仮）\n\nここからバトル画面へ遷移します', { 
            fontSize: '28px', 
            color: '#ffffff',
            align: 'center'
        }).setOrigin(0.5);

        btnStage1.on('pointerover', () => btnStage1.setFillStyle(0x336633));
        btnStage1.on('pointerout', () => btnStage1.setFillStyle(0x224422));
        btnStage1.on('pointerdown', () => {
            this.scene.start('SceneBattle');
        });

        // Back Button
        const btnBack = this.add.text(100, 50, '← 戻る', { fontSize: '32px', color: '#aaaaaa' }).setInteractive();
        btnBack.on('pointerdown', () => {
             this.scene.start('SceneMenu');
        });
    }
}
