class SceneBoot extends Phaser.Scene {
    constructor() {
        super('SceneBoot');
    }

    create() {
        // 背景
        this.add.rectangle(640, 360, 1280, 720, 0x000000);

        this.add.text(640, 300, 'FrameArmies \nLoading...', {
            fontSize: '48px',
            color: '#ffffff',
            align: 'center'
        }).setOrigin(0.5);

        const tapText = this.add.text(640, 500, '画面をタップ/クリックしてスタート', {
            fontSize: '32px',
            color: '#aaaaaa'
        }).setOrigin(0.5);

        // 点滅エフェクト
        this.tweens.add({
            targets: tapText,
            alpha: 0.2,
            duration: 800,
            yoyo: true,
            repeat: -1
        });

        // モバイル等のAudioContext制約を解除するため、ユーザー入力で次へ
        this.input.once('pointerdown', () => {
            // ここでHowlerの初期化などを呼ぶ想定
            // Howler.volume(1.0);
            this.scene.start('SceneTitle');
        });
    }
}
