class GridSystem {
    constructor(scene, startX, startY, cellSize, rows, cols) {
        this.scene = scene;
        this.startX = startX;
        this.startY = startY;
        this.cellSize = cellSize;
        this.rows = rows;
        this.cols = cols;
        
        // 盤面の描画
        this.drawGrid();
    }

    drawGrid() {
        const graphics = this.scene.add.graphics();
        graphics.lineStyle(1, 0x333333, 1);

        for (let i = 0; i <= this.rows; i++) {
            graphics.moveTo(this.startX, this.startY + i * this.cellSize);
            graphics.lineTo(this.startX + this.cols * this.cellSize, this.startY + i * this.cellSize);
        }

        for (let j = 0; j <= this.cols; j++) {
            graphics.moveTo(this.startX + j * this.cellSize, this.startY);
            graphics.lineTo(this.startX + j * this.cellSize, this.startY + this.rows * this.cellSize);
        }
        graphics.strokePath();
    }

    getWorldPos(row, col) {
        return {
            x: this.startX + col * this.cellSize + this.cellSize / 2,
            y: this.startY + row * this.cellSize + this.cellSize / 2
        };
    }

    getGridCellFromWorld(worldX, worldY) {
        if (worldX < this.startX || worldX > this.startX + this.cols * this.cellSize ||
            worldY < this.startY || worldY > this.startY + this.rows * this.cellSize) {
            return null; // 範囲外
        }
        const col = Math.floor((worldX - this.startX) / this.cellSize);
        const row = Math.floor((worldY - this.startY) / this.cellSize);
        return { row, col };
    }
}
