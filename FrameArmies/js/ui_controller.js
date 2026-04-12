class UIController {
    static init() {
        this.screens = {
            boot: document.getElementById('screen-boot'),
            title: document.getElementById('screen-title'),
            menu: document.getElementById('screen-menu'),
            stageSelect: document.getElementById('screen-stage-select'),
            deckSelect: document.getElementById('screen-deck-select'),
            deckEdit: document.getElementById('screen-deck-edit'),
            battleHud: document.getElementById('hud-battle'),
            gameover: document.getElementById('screen-gameover')
        };

        this.setupEventListeners();
        
        // Wait a bit to simulate loading
        setTimeout(() => {
            this.showScreen('title');
        }, 1500);
    }

    static showScreen(screenName) {
        Object.values(this.screens).forEach(s => s.classList.add('hidden'));
        if(this.screens[screenName]) {
            this.screens[screenName].classList.remove('hidden');
        }
    }

    static setupEventListeners() {
        // Title -> Menu
        this.screens.title.addEventListener('click', () => this.showScreen('menu'));

        // Menu buttons
        document.getElementById('btn-goto-stage').addEventListener('click', () => this.showScreen('stageSelect'));
        document.getElementById('btn-goto-deck').addEventListener('click', () => {
            this.renderDeckSelect();
            this.showScreen('deckSelect');
        });

        // Stage Select -> Menu
        document.getElementById('btn-stage-back').addEventListener('click', () => this.showScreen('menu'));
        
        // Deck Select -> Menu
        document.getElementById('btn-ds-back').addEventListener('click', () => this.showScreen('menu'));
        
        // Deck Edit -> Deck Select
        document.getElementById('btn-de-back').addEventListener('click', () => this.showScreen('deckSelect'));

        // Stage 1 Start
        document.getElementById('btn-start-stage1').addEventListener('click', () => {
            this.showScreen('battleHud'); // Show HUD
            // Start Phaser Battle Scene
            if(window.phaserGame) {
                // If it was already active, restart it
                const scene = window.phaserGame.scene.getScene('SceneBattle');
                if(scene && scene.scene.isActive()) {
                    scene.scene.restart();
                } else {
                    window.phaserGame.scene.start('SceneBattle');
                }
            }
        });

        // Game Over -> Title
        document.getElementById('btn-go-title').addEventListener('click', () => {
            this.showScreen('title');
            const scene = window.phaserGame.scene.getScene('SceneBattle');
            if(scene) scene.scene.stop();
        });
    }

    static renderDeckSelect() {
        const container = document.getElementById('deck-list-container');
        container.innerHTML = '';
        for(let i=1; i<=3; i++) {
            const btn = document.createElement('button');
            btn.className = 'btn-deck-select';
            const count = window.gameData.decks[i].length;
            btn.innerHTML = `DECK ${i} <span style="color:${count===20?'#0f0':'#f00'}; margin-left:15px;">(${count}/20)</span>`;
            btn.addEventListener('click', () => {
                window.gameData.selectedDeckId = i;
                this.renderDeckEdit(i);
                this.showScreen('deckEdit');
            });
            container.appendChild(btn);
        }
    }

    static renderDeckEdit(deckId) {
        document.getElementById('deck-edit-title').innerText = `EDIT DECK ${deckId}`;
        const currentDeck = [...window.gameData.decks[deckId]];
        
        const WEAPONS = {
            'Sword':  { cost: 1, color: '#888888', symbol: '剣' },
            'Bow':    { cost: 2, color: '#00aa00', symbol: '弓' },
            'Magic':  { cost: 4, color: '#aa00aa', symbol: '魔' },
            'Ice':    { cost: 2, color: '#00aaaa', symbol: '氷' },
            'Shield': { cost: 2, color: '#aaaa00', symbol: '盾' },
            'Bomb':   { cost: 3, color: '#aa0000', symbol: '爆' }
        };

        const drawAvailable = () => {
            const availContainer = document.getElementById('available-cards-container');
            availContainer.innerHTML = '';
            Object.keys(WEAPONS).forEach(cardId => {
                const info = WEAPONS[cardId];
                const btn = document.createElement('button');
                btn.className = 'card-btn pool-card';
                btn.style.borderLeftColor = info.color;
                btn.innerHTML = `<span>${info.symbol} ${cardId}</span><span>C:${info.cost}</span>`;
                btn.onclick = () => {
                    if(currentDeck.length < 20) {
                        currentDeck.push(cardId);
                        drawCurrent();
                    }
                };
                availContainer.appendChild(btn);
            });
        };

        const drawCurrent = () => {
            const currContainer = document.getElementById('current-deck-container');
            currContainer.innerHTML = '';
            const countEl = document.getElementById('deck-edit-count');
            countEl.innerText = `(${currentDeck.length}/20)`;
            countEl.className = currentDeck.length === 20 ? 'card-count ok' : 'card-count ng';

            const counts = {};
            currentDeck.forEach(c => counts[c] = (counts[c]||0)+1);
            
            Object.keys(counts).forEach(cardId => {
                const btn = document.createElement('button');
                btn.className = 'card-btn deck-card';
                btn.style.borderLeftColor = WEAPONS[cardId].color;
                btn.innerHTML = `<span>${cardId}</span><span>x${counts[cardId]}</span>`;
                btn.onclick = () => {
                    const idx = currentDeck.indexOf(cardId);
                    if(idx > -1) {
                        currentDeck.splice(idx, 1);
                        drawCurrent();
                    }
                };
                currContainer.appendChild(btn);
            });
        };

        drawAvailable();
        drawCurrent();

        // Save
        const btnSave = document.getElementById('btn-de-save');
        btnSave.onclick = () => {
            if(currentDeck.length === 20) {
                window.gameData.decks[deckId] = [...currentDeck];
                this.renderDeckSelect();
                this.showScreen('deckSelect');
            } else {
                btnSave.style.background = '#ff0000';
                setTimeout(() => btnSave.style.background='', 500);
            }
        };
    }
    
    static showGameOver(message) {
        document.getElementById('gameover-text').innerText = message;
        this.showScreen('gameover');
    }
}

window.addEventListener('DOMContentLoaded', () => UIController.init());
