class Minesweeper {
    constructor() {
        this.board = [];
        this.rows = 9;
        this.cols = 9;
        this.mineCount = 10;
        this.flagCount = 0;
        this.revealedCount = 0;
        this.gameState = 'ready'; // ready, playing, won, lost
        this.timer = 0;
        this.timerInterval = null;
        this.firstClick = true;
        
        this.difficulties = {
            easy: { rows: 9, cols: 9, mines: 10 },
            medium: { rows: 16, cols: 16, mines: 40 },
            hard: { rows: 30, cols: 16, mines: 99 }
        };
        
        this.initializeElements();
        this.createBoard();
        this.setupEventListeners();
    }
    
    initializeElements() {
        this.gameBoard = document.getElementById('game-board');
        this.mineCountDisplay = document.getElementById('mine-count');
        this.timerDisplay = document.getElementById('timer');
        this.gameStatus = document.getElementById('game-status');
        this.restartBtn = document.getElementById('restart-btn');
        this.difficultySelect = document.getElementById('difficulty');
    }
    
    setupEventListeners() {
        this.restartBtn.addEventListener('click', () => this.restart());
        this.difficultySelect.addEventListener('change', (e) => this.changeDifficulty(e.target.value));
        
        // Prevent context menu on game board
        this.gameBoard.addEventListener('contextmenu', (e) => e.preventDefault());
    }
    
    changeDifficulty(difficulty) {
        const config = this.difficulties[difficulty];
        this.rows = config.rows;
        this.cols = config.cols;
        this.mineCount = config.mines;
        this.restart();
    }
    
    createBoard() {
        this.board = [];
        this.gameBoard.innerHTML = '';
        this.gameBoard.style.gridTemplateColumns = `repeat(${this.cols}, 30px)`;
        this.gameBoard.style.display = 'grid';
        this.gameBoard.style.gap = '1px';
        
        // Initialize board array
        for (let row = 0; row < this.rows; row++) {
            this.board[row] = [];
            for (let col = 0; col < this.cols; col++) {
                this.board[row][col] = {
                    isMine: false,
                    isRevealed: false,
                    isFlagged: false,
                    isQuestioned: false,
                    neighborMines: 0,
                    element: null
                };
            }
        }
        
        // Create DOM elements
        for (let row = 0; row < this.rows; row++) {
            for (let col = 0; col < this.cols; col++) {
                const cell = document.createElement('div');
                cell.className = 'cell';
                cell.dataset.row = row;
                cell.dataset.col = col;
                
                cell.addEventListener('click', (e) => this.handleCellClick(e, row, col));
                cell.addEventListener('contextmenu', (e) => this.handleRightClick(e, row, col));
                
                this.gameBoard.appendChild(cell);
                this.board[row][col].element = cell;
            }
        }
        
        this.updateDisplay();
    }
    
    placeMines(excludeRow, excludeCol) {
        let minesPlaced = 0;
        
        while (minesPlaced < this.mineCount) {
            const row = Math.floor(Math.random() * this.rows);
            const col = Math.floor(Math.random() * this.cols);
            
            // Don't place mine on first clicked cell or if already has mine
            if ((row === excludeRow && col === excludeCol) || this.board[row][col].isMine) {
                continue;
            }
            
            this.board[row][col].isMine = true;
            minesPlaced++;
        }
        
        // Calculate neighbor mine counts
        this.calculateNeighborMines();
    }
    
    calculateNeighborMines() {
        for (let row = 0; row < this.rows; row++) {
            for (let col = 0; col < this.cols; col++) {
                if (!this.board[row][col].isMine) {
                    this.board[row][col].neighborMines = this.countNeighborMines(row, col);
                }
            }
        }
    }
    
    countNeighborMines(row, col) {
        let count = 0;
        for (let i = -1; i <= 1; i++) {
            for (let j = -1; j <= 1; j++) {
                const newRow = row + i;
                const newCol = col + j;
                if (this.isValidCell(newRow, newCol) && this.board[newRow][newCol].isMine) {
                    count++;
                }
            }
        }
        return count;
    }
    
    isValidCell(row, col) {
        return row >= 0 && row < this.rows && col >= 0 && col < this.cols;
    }
    
    handleCellClick(e, row, col) {
        e.preventDefault();
        
        if (this.gameState === 'won' || this.gameState === 'lost') {
            return;
        }
        
        const cell = this.board[row][col];
        
        if (cell.isFlagged || cell.isRevealed) {
            return;
        }
        
        // First click - place mines and start timer
        if (this.firstClick) {
            this.placeMines(row, col);
            this.startTimer();
            this.gameState = 'playing';
            this.firstClick = false;
        }
        
        if (cell.isMine) {
            this.explodeCell(row, col);
            this.gameOver(false);
        } else {
            this.revealCell(row, col);
            this.checkWin();
        }
    }
    
    handleRightClick(e, row, col) {
        e.preventDefault();
        
        if (this.gameState === 'won' || this.gameState === 'lost') {
            return;
        }
        
        const cell = this.board[row][col];
        
        if (cell.isRevealed) {
            return;
        }
        
        if (!cell.isFlagged && !cell.isQuestioned) {
            // Flag the cell
            cell.isFlagged = true;
            cell.element.classList.add('flagged');
            this.flagCount++;
        } else if (cell.isFlagged) {
            // Change to question mark
            cell.isFlagged = false;
            cell.isQuestioned = true;
            cell.element.classList.remove('flagged');
            cell.element.classList.add('questioned');
            this.flagCount--;
        } else {
            // Remove question mark
            cell.isQuestioned = false;
            cell.element.classList.remove('questioned');
        }
        
        this.updateDisplay();
    }
    
    revealCell(row, col) {
        const cell = this.board[row][col];
        
        if (cell.isRevealed || cell.isFlagged) {
            return;
        }
        
        cell.isRevealed = true;
        cell.element.classList.add('revealed');
        this.revealedCount++;
        
        if (cell.neighborMines > 0) {
            cell.element.textContent = cell.neighborMines;
            cell.element.classList.add(`num-${cell.neighborMines}`);
        } else {
            // Reveal adjacent cells if no neighboring mines
            for (let i = -1; i <= 1; i++) {
                for (let j = -1; j <= 1; j++) {
                    const newRow = row + i;
                    const newCol = col + j;
                    if (this.isValidCell(newRow, newCol)) {
                        this.revealCell(newRow, newCol);
                    }
                }
            }
        }
    }
    
    explodeCell(row, col) {
        const cell = this.board[row][col];
        cell.element.classList.add('exploded');
        cell.element.textContent = '💥';
    }
    
    revealAllMines() {
        for (let row = 0; row < this.rows; row++) {
            for (let col = 0; col < this.cols; col++) {
                const cell = this.board[row][col];
                if (cell.isMine && !cell.isFlagged) {
                    cell.element.classList.add('mine');
                    cell.element.textContent = '💣';
                } else if (!cell.isMine && cell.isFlagged) {
                    // Show incorrect flags
                    cell.element.classList.add('mine');
                    cell.element.classList.remove('flagged');
                    cell.element.textContent = '❌';
                }
            }
        }
    }
    
    checkWin() {
        const totalCells = this.rows * this.cols;
        const safeCells = totalCells - this.mineCount;
        
        if (this.revealedCount === safeCells) {
            this.gameOver(true);
        }
    }
    
    gameOver(won) {
        this.gameState = won ? 'won' : 'lost';
        this.stopTimer();
        
        if (won) {
            this.gameStatus.textContent = '🎉 恭喜你赢了！';
            this.gameStatus.className = 'game-status status-win';
            // Auto-flag remaining mines
            this.autoFlagMines();
        } else {
            this.gameStatus.textContent = '💥 游戏结束！';
            this.gameStatus.className = 'game-status status-lose';
            this.revealAllMines();
        }
    }
    
    autoFlagMines() {
        for (let row = 0; row < this.rows; row++) {
            for (let col = 0; col < this.cols; col++) {
                const cell = this.board[row][col];
                if (cell.isMine && !cell.isFlagged) {
                    cell.isFlagged = true;
                    cell.element.classList.add('flagged');
                    this.flagCount++;
                }
            }
        }
        this.updateDisplay();
    }
    
    startTimer() {
        this.timerInterval = setInterval(() => {
            this.timer++;
            this.updateTimerDisplay();
        }, 1000);
    }
    
    stopTimer() {
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
            this.timerInterval = null;
        }
    }
    
    updateTimerDisplay() {
        this.timerDisplay.textContent = this.timer.toString().padStart(3, '0');
    }
    
    updateDisplay() {
        const remainingMines = this.mineCount - this.flagCount;
        this.mineCountDisplay.textContent = remainingMines.toString().padStart(2, '0');
    }
    
    restart() {
        this.stopTimer();
        this.timer = 0;
        this.flagCount = 0;
        this.revealedCount = 0;
        this.gameState = 'ready';
        this.firstClick = true;
        this.gameStatus.textContent = '';
        this.gameStatus.className = 'game-status';
        this.createBoard();
        this.updateTimerDisplay();
    }
}

// Initialize the game when the page loads
document.addEventListener('DOMContentLoaded', () => {
    new Minesweeper();
});