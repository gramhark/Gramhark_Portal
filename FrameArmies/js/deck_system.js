class DeckSystem {
    constructor(scene, entityManager) {
        this.scene = scene;
        this.entityManager = entityManager;
        this.deck = [];
        this.hand = [];
        this.discardPile = [];
        this.maxCost = 15;
        this.currentCost = 0;
        
        // UI elements
        this.handSprites = [];
        this.selectedHandIndex = -1;
        this.removalMode = false;
        
        this.initDeck();
    }

    initDeck() {
        const selectedId = window.gameData ? window.gameData.selectedDeckId : 1;
        const initialCards = window.gameData ? [...window.gameData.decks[selectedId]] : [];
        
        // Shuffle
        this.deck = initialCards.sort(() => Math.random() - 0.5);
        
        // Draw initial 3 cards
        for (let i=0; i<3; i++) {
            this.drawCard(false); // Do not update UI yet, wait for scene setup
        }
    }

    drawCard(updateUI = true) {
        if (this.hand.length >= 3) return;
        if (this.deck.length === 0) return;
        
        const card = this.deck.pop();
        this.hand.push(card);
        if (updateUI && this.scene.costText) {
            this.scene.updateDeckUI();
        }
    }
    
    getDeckRemaining() {
        return this.deck.length;
    }

    recalculateCost() {
        let cost = 0;
        this.entityManager.panels.forEach(p => {
            if(p.active) cost += p.info.cost;
        });
        this.currentCost = cost;
        return cost;
    }

    canPlace(cardType) {
        const info = this.entityManager.WEAPONS[cardType];
        if(!info) return false;
        return (this.currentCost + info.cost <= this.maxCost);
    }
    
    useCardFromHand(index) {
        if(index >= 0 && index < this.hand.length) {
            const card = this.hand.splice(index, 1)[0];
            this.discardPile.push(card);
            this.scene.updateDeckUI();
        }
    }
}
