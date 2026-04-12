class SceneTitle extends Phaser.Scene {
    constructor() {
        super('SceneTitle');
    }

    create() {
        this.add.rectangle(640, 360, 1280, 720, 0x000000);

        this.add.text(640, 250, 'Frame Armies', {
            fontSize: '72px',
            color: '#ffffff',
            fontStyle: 'bold'
        }).setOrigin(0.5);

        const startText = this.add.text(640, 450, '- PRESS ANYWHERE TO START -', {
            fontSize: '32px',
            color: '#ffffff'
        }).setOrigin(0.5);

        this.tweens.add({
            targets: startText,
            alpha: 0,
            duration: 1000,
            yoyo: true,
            repeat: -1
        });

        this.input.once('pointerdown', () => {
            this.scene.start('SceneMenu');
        });
    }
}
