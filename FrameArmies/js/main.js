const config = {
    type: Phaser.AUTO,
    width: 1280,
    height: 720,
    parent: 'game-container',
    backgroundColor: '#000000',
    scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH
    },
    scene: [SceneBattle]
};

window.gameData = {
    decks: {
        1: ['Sword', 'Sword', 'Sword', 'Sword', 'Sword', 'Bow', 'Bow', 'Bow', 'Bow', 'Magic', 'Magic', 'Ice', 'Ice', 'Ice', 'Shield', 'Shield', 'Shield', 'Bomb', 'Bomb', 'Bomb'],
        2: ['Sword', 'Sword', 'Sword', 'Sword', 'Sword', 'Sword', 'Sword', 'Sword', 'Sword', 'Sword', 'Shield', 'Shield', 'Shield', 'Shield', 'Shield', 'Bomb', 'Bomb', 'Bomb', 'Bomb', 'Bomb'],
        3: ['Magic', 'Magic', 'Magic', 'Magic', 'Magic', 'Ice', 'Ice', 'Ice', 'Ice', 'Ice', 'Bomb', 'Bomb', 'Bomb', 'Bomb', 'Bomb', 'Shield', 'Shield', 'Shield', 'Shield', 'Shield']
    },
    selectedDeckId: 1
};

window.phaserGame = new Phaser.Game(config);
