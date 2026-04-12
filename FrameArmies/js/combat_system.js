class CombatSystem {
    constructor(scene, grid, entityManager) {
        this.scene = scene;
        this.grid = grid;
        this.em = entityManager;
        this.turn = 1;
        this.wavesDefeated = false;
        this.maxTurns = 20; // 簡単なウェーブ想定
    }

    async processTurn() {
        if(this.wavesDefeated || this.scene.isGameOver) return;
        
        // 1. 爆弾カウントダウン
        this.em.panels.forEach(p => {
            if(p.active && p.type === 'Bomb') {
                p.bombCountdown--;
                p.countdownSprite.setText(p.bombCountdown.toString());
            }
        });

        // 2. 敵の移動処理
        let hasMoved = false;
        this.em.enemies.forEach(e => {
            if(!e.active) return;
            
            if(e.frozenTurns > 0) {
                e.frozenTurns--;
                return;
            }

            let moveSpeed = 1;
            if(e.type === 'Boar' || e.type === 'Bat') moveSpeed = 2;
            let moveDirs = [];

            if(e.type === 'Dragon') {
                // "2ターンごとに上下左右ランダムに1マス移動"
                if((this.turn - e.spawnTurn) % 2 === 1) { 
                    const dirs = [{r:-1,c:0},{r:1,c:0},{r:0,c:-1},{r:0,c:1}];
                    moveDirs.push(Phaser.Math.RND.pick(dirs));
                }
            } else if(e.type === 'Bat') {
                // "毎ターン上に2マス進み、 フレームにぶつかったら下に方向転換"
                for(let k=0; k<moveSpeed; k++) {
                    let nextR = e.row + e.dirR;
                    if(nextR < 0 || nextR >= this.grid.rows) {
                        e.dirR *= -1; // 方向転換
                    }
                    moveDirs.push({r: e.dirR, c: 0});
                }
            } else {
                // スライム、イノシシ、ゴースト
                for(let k=0; k<moveSpeed; k++) {
                    let nextC = e.col + e.dirC;
                    if(nextC < 0 || nextC >= this.grid.cols) {
                        e.dirC *= -1; // 方向転換
                    }
                    moveDirs.push({r: 0, c: e.dirC});
                }
            }

            moveDirs.forEach(md => {
                if(!e.active) return; // might have died during multi-step move
                let nextRow = e.row + md.r;
                let nextCol = e.col + md.c;
                
                // ドラゴンの壁衝突防止
                if(nextRow < 0) nextRow = 0; if(nextRow >= this.grid.rows) nextRow = this.grid.rows - 1;
                if(nextCol < 0) nextCol = 0; if(nextCol >= this.grid.cols) nextCol = this.grid.cols - 1;
                
                md.r = nextRow - e.row;
                md.c = nextCol - e.col;
                if(md.r === 0 && md.c === 0) return; // 動かない場合はスキップ

                // パネルとの衝突（蝙蝠は盾を飛び越える等）
                let panelCollision = this.em.getPanelAt(nextRow, nextCol);
                if(panelCollision) {
                    if(panelCollision.type === 'Shield') {
                        if(e.type === 'Bat') {
                            // Fly over
                        } else if (e.type === 'Ghost' || e.type === 'Dragon') {
                            // Immune to shield, destroy and keep moving
                            this.em.removePanel(panelCollision);
                        } else {
                            // Normal enemy hits shield, shield destroyed, enemy stops THIS movement step
                            this.em.removePanel(panelCollision);
                            md.r = 0; md.c = 0; // Cancel this step
                        }
                    } else { // Not shield
                        this.em.removePanel(panelCollision); // 進入時に破壊
                    }
                }
                
                if(md.r !== 0 || md.c !== 0) {
                    e.row += md.r;
                    e.col += md.c;
                    hasMoved = true;
                }
                // 下限突破による敗北条件は削除
            });
        });

        if(hasMoved) {
            this.em.renderAll();
            await this.sleep(400); // 演出用ディレイ
        }

        // 3. ドラゴンのパネル破壊処理 (dragon acts after moving)
        // "毎ターン隣接しているパネルを1つ破壊する。"
        this.em.enemies.forEach(e => {
            if(e.active && e.type === 'Dragon') {
                const adjPanels = this.getAdjacentPanels(e.row, e.col);
                if(adjPanels.length > 0) {
                    // Destroy a random adjacent panel
                    this.em.removePanel(adjPanels[0]);
                }
            }
        });

        // 4. パネルの攻撃判定＆ダメージ処理
        let hasAttacked = false;
        
        // Panels act
        this.em.panels.forEach(p => {
            if(!p.active) return;
            
            let targets = [];
            if(p.type === 'Bomb' && p.bombCountdown <= 0) {
                // Bomb explosion: 3x3
                targets = this.getTargetsInRadius(p.row, p.col, 1);
                this.em.removePanel(p); // 爆発して消える
            } else if(p.info.range === 'directional' && p.dir) {
                // Sword, Ice checks 1 cell in dir
                let tRow = p.row + p.dir.row;
                let tCol = p.col + p.dir.col;
                targets = this.em.getEnemiesAt(tRow, tCol);
            } else if(p.info.range === 'directional_far' && p.dir) {
                // Bow checks up to 2 cells in dir
                let tRow = p.row + p.dir.row * 2;
                let tCol = p.col + p.dir.col * 2;
                targets = this.em.getEnemiesAt(tRow, tCol);
            } else if(p.info.range === 'surrounding') {
                targets = this.getTargetsInRadius(p.row, p.col, 1);
            }
            
            if(targets.length > 0) {
                hasAttacked = true;
                // Attack logic
                if (p.info.range === 'surrounding') {
                    // Magic hits ALL in range
                    targets.forEach(t => this.applyDamage(t, p));
                } else if(p.type === 'Bomb' && p.bombCountdown <= 0) {
                    targets.forEach(t => this.applyDamage(t, p)); // Bomb also hits all
                } else {
                    // Others hit 1 target (or maybe all in that single cell)
                    targets.forEach(t => this.applyDamage(t, p)); // Assuming it hits all enemies stacked in that cell
                }
            }
        });

        if(hasAttacked) {
            this.em.renderAll();
            await this.sleep(500); // 演出用ディレイ
        }

        // Clean up dead enemies
        this.cleanupDeadEnemies();

        // 5. ターン終了判定
        this.turn++;
        while(this.scene.deckSys.hand.length < 3 && this.scene.deckSys.deck.length > 0) {
            this.scene.deckSys.drawCard(false);
        }
        
        // パネルコスト再計算など
        
        // 勝利・敗北判定
        if(this.em.enemies.length === 0) {
            this.scene.gameOver("勝利！すべてのモンスターを撃破しました。");
        } else if (this.scene.deckSys.getDeckRemaining() === 0 && this.scene.deckSys.hand.length === 0 && this.em.enemies.length > 0) {
             this.scene.gameOver("敗北：デッキが尽きました。");
        }

        return true;
    }

    applyDamage(target, panel) {
        if(panel.type === 'Ice') {
            target.frozenTurns = panel.info.freeze;
            // Visual feedback handled in render loop
        } else {
            let dmg = panel.info.attack;
            if(target.type === 'Ghost' && (panel.type === 'Sword' || panel.type === 'Bow')) {
                if(Math.random() < 0.5) {
                    dmg = 0; // 50% dodge
                    console.log("Ghost dodged!"); // Can add floating text
                }
            }
            target.hp -= dmg;
        }
    }

    cleanupDeadEnemies() {
        this.em.enemies.forEach(e => {
            if(e.hp <= 0) this.em.removeEnemy(e);
        });
    }

    getTargetsInRadius(row, col, radius) {
        let targets = [];
        for(let r = -radius; r <= radius; r++) {
            for(let c = -radius; c <= radius; c++) {
                targets.push(...this.em.getEnemiesAt(row + r, col + c));
            }
        }
        return targets;
    }

    getAdjacentPanels(row, col) {
        let targets = [];
        const ds = [{r:-1,c:0},{r:1,c:0},{r:0,c:-1},{r:0,c:1}];
        ds.forEach(d => {
            let p = this.em.getPanelAt(row+d.r, col+d.c);
            if(p) targets.push(p);
        });
        return targets;
    }

    spawnInitialEnemies() {
        const initialEnemies = [
            { type: 'Slime', row: 2, col: 1 },
            { type: 'Slime', row: 4, col: 6 },
            { type: 'Bat', row: 6, col: 2 },
            { type: 'Boar', row: 3, col: 3 },
            { type: 'Ghost', row: 1, col: 5 },
            { type: 'Dragon', row: 5, col: 4 }
        ];
        
        initialEnemies.forEach(e => {
            const enemyInst = this.em.spawnEnemy(e.type, e.col, this.turn);
            if(enemyInst) {
                enemyInst.row = e.row; // update row since spawnEnemy defaults to row 0
            }
        });
    }

    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}
