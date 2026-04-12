class Panel {
    constructor(type, info, row, col, dir = null) {
        this.type = type; // 'Sword', 'Bow', etc.
        this.info = info; // { cost: 1, attack: 1, ... }
        this.row = row;
        this.col = col;
        this.dir = dir; // {row: 0, col: -1} (up: row-1, col:0 etc.)
        this.sprite = null;
        this.text = null;
        this.dirIndicator = null;
        this.countdownSprite = null; // For bomb
        this.active = true;
        this.isShield = (type === 'Shield');
        this.bombCountdown = (type === 'Bomb') ? 2 : 0;
    }

    destroyGameObjects() {
        if(this.sprite) this.sprite.destroy();
        if(this.text) this.text.destroy();
        if(this.dirIndicator) this.dirIndicator.destroy();
        if(this.countdownSprite) this.countdownSprite.destroy();
    }
}

class Enemy {
    constructor(type, info, row, col, id, currentTurn) {
        this.id = id;
        this.type = type;
        this.info = info; // { hp: 1, pattern: '...', etc. }
        this.hp = info.hp;
        this.row = row;
        this.col = col;
        this.sprite = null;
        this.text = null;
        this.hpText = null;
        this.active = true;
        
        // Status effects
        this.frozenTurns = 0;
        
        // For Dragon movement timing
        this.spawnTurn = currentTurn;
        
        // Movement directions
        this.dirC = 1; // Right by default
        this.dirR = -1; // Up by default
    }

    destroyGameObjects() {
        if(this.sprite) this.sprite.destroy();
        if(this.text) this.text.destroy();
        if(this.hpText) this.hpText.destroy();
    }
}

class EntityManager {
    constructor(scene, grid) {
        this.scene = scene;
        this.grid = grid;
        this.panels = [];
        this.enemies = [];
        this.enemyIdCounter = 0;

        // Weapon Info
        this.WEAPONS = {
            'Sword':  { cost: 1, attack: 1, range: 'directional', color: 0x888888, symbol: '剣' },
            'Bow':    { cost: 2, attack: 1, range: 'directional_far', color: 0x00aa00, symbol: '弓' },
            'Magic':  { cost: 4, attack: 1, range: 'surrounding', color: 0xaa00aa, symbol: '魔' },
            'Ice':    { cost: 2, attack: 0, range: 'directional', color: 0x00aaaa, symbol: '氷', freeze: 1 },
            'Shield': { cost: 2, attack: 0, range: 'self', color: 0xaaaa00, symbol: '盾' },
            'Bomb':   { cost: 3, attack: 3, range: 'surrounding', color: 0xaa0000, symbol: '爆' }
        };

        // Enemy Info
        this.ENEMIES = {
            'Slime':  { hp: 1, color: 0x00ff00, symbol: 'S' },
            'Bat':    { hp: 1, color: 0x555555, symbol: 'B', flying: true },
            'Boar':   { hp: 2, color: 0x884400, symbol: 'I', speed: 2 },
            'Ghost':  { hp: 1, color: 0xffffff, symbol: 'G', dodgeP: 0.5 },
            'Dragon': { hp: 5, color: 0xff0000, symbol: 'D', slow: true, destroyRadius: 1 }
        };
        
        // Panels that require direction upon placement
        this.DIRECTIONAL_WEAPONS = ['Sword', 'Bow', 'Ice'];
    }

    addPanel(type, row, col, dir) {
        const info = this.WEAPONS[type];
        if(!info) return null;

        const panel = new Panel(type, info, row, col, dir);
        this.panels.push(panel);
        this.renderPanel(panel);
        return panel;
    }

    removePanel(panel) {
        panel.active = false;
        panel.destroyGameObjects();
        this.panels = this.panels.filter(p => p !== panel);
    }

    getPanelAt(row, col) {
        return this.panels.find(p => p.row === row && p.col === col && p.active);
    }

    spawnEnemy(type, col, currentTurn) {
        const info = this.ENEMIES[type];
        if(!info) return null;
        const enemy = new Enemy(type, info, 0, col, this.enemyIdCounter++, currentTurn);
        this.enemies.push(enemy);
        this.renderEnemy(enemy);
        return enemy;
    }

    removeEnemy(enemy) {
        enemy.active = false;
        enemy.destroyGameObjects();
        this.enemies = this.enemies.filter(e => e !== enemy);
    }

    getEnemiesAt(row, col) {
        return this.enemies.filter(e => e.row === row && e.col === col && e.active);
    }
    
    renderAll() {
        this.panels.forEach(p => this.renderPanel(p));
        this.enemies.forEach(e => this.renderEnemy(e));
    }

    renderPanel(panel) {
        if(!panel.active) return;
        
        const pos = this.grid.getWorldPos(panel.row, panel.col);
        const size = this.grid.cellSize * 0.8;
        
        if(!panel.sprite) {
            panel.sprite = this.scene.add.rectangle(pos.x, pos.y, size, size, panel.info.color);
            panel.sprite.setStrokeStyle(2, 0xffffff);
            
            panel.text = this.scene.add.text(pos.x, pos.y, panel.info.symbol, {
                fontFamily: 'monospace',
                fontSize: '24px',
                color: '#ffffff'
            }).setOrigin(0.5);
            
            if (panel.type === 'Bomb') {
                panel.countdownSprite = this.scene.add.text(pos.x + size/3, pos.y - size/3, panel.bombCountdown.toString(), {
                    fontFamily: 'monospace',
                    fontSize: '16px',
                    color: '#ff0000',
                    backgroundColor: '#ffffff'
                }).setOrigin(0.5);
            }

            if (panel.dir) {
                // Draw a small indicator for direction
                panel.dirIndicator = this.scene.add.triangle(
                    pos.x, pos.y,
                    0, -size/3,
                    size/6, -size/6,
                    -size/6, -size/6,
                    0xffffff
                );
                
                let angle = 0;
                if(panel.dir.row === 1) angle = 180;
                else if(panel.dir.col === 1) angle = 90;
                else if(panel.dir.col === -1) angle = -90;
                
                panel.dirIndicator.setAngle(angle);
            }
        } else {
            // Tween for smooth movement if needed, or just set pos
            panel.sprite.setPosition(pos.x, pos.y);
            panel.text.setPosition(pos.x, pos.y);
            if(panel.dirIndicator) {
                panel.dirIndicator.setPosition(pos.x, pos.y);
            }
            if(panel.countdownSprite) {
                panel.countdownSprite.setPosition(pos.x + size/3, pos.y - size/3);
                panel.countdownSprite.setText(panel.bombCountdown.toString());
            }
        }
    }

    renderEnemy(enemy) {
        if(!enemy.active) return;
        
        const pos = this.grid.getWorldPos(enemy.row, enemy.col);
        const size = this.grid.cellSize * 0.6;
        
        if(!enemy.sprite) {
            enemy.sprite = this.scene.add.circle(pos.x, pos.y, size/2, enemy.info.color);
            enemy.sprite.setStrokeStyle(2, 0xff0000);
            
            enemy.text = this.scene.add.text(pos.x, pos.y, enemy.info.symbol, {
                fontFamily: 'monospace',
                fontSize: '20px',
                color: '#000000'
            }).setOrigin(0.5);
            
            enemy.hpText = this.scene.add.text(pos.x + size/2, pos.y - size/2, enemy.hp.toString(), {
                fontFamily: 'monospace',
                fontSize: '14px',
                color: '#ff0000',
                backgroundColor: '#ffffff'
            }).setOrigin(0.5);
        } else {
            this.scene.tweens.add({
                targets: [enemy.sprite, enemy.text],
                x: pos.x,
                y: pos.y,
                duration: 200,
                ease: 'Sine.easeInOut'
            });
            // Update HP text immediately
            enemy.hpText.setText(enemy.hp.toString());
            this.scene.tweens.add({
                targets: [enemy.hpText],
                x: pos.x + size/2,
                y: pos.y - size/2,
                duration: 200,
                ease: 'Sine.easeInOut'
            });
            
            // Color feedback for freezing
            if(enemy.frozenTurns > 0) {
                 enemy.sprite.setFillStyle(0x00ffff);
            } else {
                 enemy.sprite.setFillStyle(enemy.info.color);
            }
        }
    }
}
