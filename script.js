// 游戏配置
const GRID_SIZE = 20;
const CANVAS_SIZE = 400;

// 游戏状态
let gameState = 'stopped'; // 'running', 'paused', 'stopped', 'gameOver'
let score = 0;
let highScore = localStorage.getItem('snakeHighScore') || 0;
let gameLoop;

// 游戏元素
let canvas, ctx;
let snake = [];
let food = {};
let direction = { x: 1, y: 0 };
let nextDirection = { x: 1, y: 0 };

// DOM元素
let scoreElement, highScoreElement;
let startBtn, pauseBtn, resetBtn;

// 初始化游戏
function init() {
    canvas = document.getElementById('gameCanvas');
    ctx = canvas.getContext('2d');
    
    scoreElement = document.getElementById('score');
    highScoreElement = document.getElementById('high-score');
    startBtn = document.getElementById('startBtn');
    pauseBtn = document.getElementById('pauseBtn');
    resetBtn = document.getElementById('resetBtn');
    
    // 显示最高分
    highScoreElement.textContent = highScore;
    
    // 绑定事件
    startBtn.addEventListener('click', startGame);
    pauseBtn.addEventListener('click', togglePause);
    resetBtn.addEventListener('click', resetGame);
    document.addEventListener('keydown', handleKeyPress);
    
    // 初始化游戏状态
    resetGame();
    drawGame();
}

// 重置游戏
function resetGame() {
    gameState = 'stopped';
    score = 0;
    scoreElement.textContent = score;
    
    // 初始化蛇
    snake = [
        { x: 10, y: 10 },
        { x: 9, y: 10 },
        { x: 8, y: 10 }
    ];
    
    // 初始化方向
    direction = { x: 1, y: 0 };
    nextDirection = { x: 1, y: 0 };
    
    // 生成食物
    generateFood();
    
    // 更新按钮状态
    updateButtonStates();
    
    // 清除游戏循环
    if (gameLoop) {
        clearInterval(gameLoop);
    }
}

// 开始游戏
function startGame() {
    if (gameState === 'stopped' || gameState === 'gameOver') {
        resetGame();
    }
    
    gameState = 'running';
    updateButtonStates();
    
    gameLoop = setInterval(() => {
        if (gameState === 'running') {
            update();
            drawGame();
        }
    }, 150);
}

// 暂停/继续游戏
function togglePause() {
    if (gameState === 'running') {
        gameState = 'paused';
    } else if (gameState === 'paused') {
        gameState = 'running';
    }
    updateButtonStates();
}

// 更新按钮状态
function updateButtonStates() {
    startBtn.disabled = gameState === 'running';
    pauseBtn.disabled = gameState === 'stopped' || gameState === 'gameOver';
    
    if (gameState === 'paused') {
        pauseBtn.textContent = '继续';
    } else {
        pauseBtn.textContent = '暂停';
    }
}

// 处理键盘输入
function handleKeyPress(event) {
    if (gameState !== 'running') return;
    
    switch (event.key) {
        case 'ArrowUp':
            if (direction.y === 0) {
                nextDirection = { x: 0, y: -1 };
            }
            break;
        case 'ArrowDown':
            if (direction.y === 0) {
                nextDirection = { x: 0, y: 1 };
            }
            break;
        case 'ArrowLeft':
            if (direction.x === 0) {
                nextDirection = { x: -1, y: 0 };
            }
            break;
        case 'ArrowRight':
            if (direction.x === 0) {
                nextDirection = { x: 1, y: 0 };
            }
            break;
        case ' ': // 空格键暂停
            event.preventDefault();
            togglePause();
            break;
    }
}

// 游戏更新逻辑
function update() {
    // 更新方向
    direction = { ...nextDirection };
    
    // 计算蛇头新位置
    const head = { ...snake[0] };
    head.x += direction.x;
    head.y += direction.y;
    
    // 检查碰撞
    if (checkCollision(head)) {
        gameOver();
        return;
    }
    
    // 添加新头部
    snake.unshift(head);
    
    // 检查是否吃到食物
    if (head.x === food.x && head.y === food.y) {
        score += 10;
        scoreElement.textContent = score;
        
        // 更新最高分
        if (score > highScore) {
            highScore = score;
            highScoreElement.textContent = highScore;
            localStorage.setItem('snakeHighScore', highScore);
        }
        
        generateFood();
    } else {
        // 没吃到食物，移除尾部
        snake.pop();
    }
}

// 检查碰撞
function checkCollision(head) {
    // 检查墙壁碰撞
    if (head.x < 0 || head.x >= CANVAS_SIZE / GRID_SIZE ||
        head.y < 0 || head.y >= CANVAS_SIZE / GRID_SIZE) {
        return true;
    }
    
    // 检查自身碰撞
    for (let segment of snake) {
        if (head.x === segment.x && head.y === segment.y) {
            return true;
        }
    }
    
    return false;
}

// 生成食物
function generateFood() {
    do {
        food = {
            x: Math.floor(Math.random() * (CANVAS_SIZE / GRID_SIZE)),
            y: Math.floor(Math.random() * (CANVAS_SIZE / GRID_SIZE))
        };
    } while (snake.some(segment => segment.x === food.x && segment.y === food.y));
}

// 游戏结束
function gameOver() {
    gameState = 'gameOver';
    clearInterval(gameLoop);
    updateButtonStates();
    
    // 显示游戏结束消息
    setTimeout(() => {
        alert(`游戏结束！\n得分: ${score}\n最高分: ${highScore}`);
    }, 100);
}

// 绘制游戏
function drawGame() {
    // 清空画布
    ctx.fillStyle = '#f7fafc';
    ctx.fillRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);
    
    // 绘制网格（可选）
    drawGrid();
    
    // 绘制蛇
    drawSnake();
    
    // 绘制食物
    drawFood();
    
    // 绘制游戏状态
    drawGameState();
}

// 绘制网格
function drawGrid() {
    ctx.strokeStyle = '#e2e8f0';
    ctx.lineWidth = 1;
    
    for (let i = 0; i <= CANVAS_SIZE; i += GRID_SIZE) {
        ctx.beginPath();
        ctx.moveTo(i, 0);
        ctx.lineTo(i, CANVAS_SIZE);
        ctx.stroke();
        
        ctx.beginPath();
        ctx.moveTo(0, i);
        ctx.lineTo(CANVAS_SIZE, i);
        ctx.stroke();
    }
}

// 绘制蛇
function drawSnake() {
    snake.forEach((segment, index) => {
        const x = segment.x * GRID_SIZE;
        const y = segment.y * GRID_SIZE;
        
        if (index === 0) {
            // 蛇头
            ctx.fillStyle = '#38a169';
            ctx.fillRect(x + 1, y + 1, GRID_SIZE - 2, GRID_SIZE - 2);
            
            // 眼睛
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(x + 4, y + 4, 3, 3);
            ctx.fillRect(x + 13, y + 4, 3, 3);
            
            ctx.fillStyle = '#000000';
            ctx.fillRect(x + 5, y + 5, 1, 1);
            ctx.fillRect(x + 14, y + 5, 1, 1);
        } else {
            // 蛇身
            ctx.fillStyle = '#48bb78';
            ctx.fillRect(x + 1, y + 1, GRID_SIZE - 2, GRID_SIZE - 2);
        }
    });
}

// 绘制食物
function drawFood() {
    const x = food.x * GRID_SIZE;
    const y = food.y * GRID_SIZE;
    
    // 绘制苹果
    ctx.fillStyle = '#e53e3e';
    ctx.fillRect(x + 2, y + 2, GRID_SIZE - 4, GRID_SIZE - 4);
    
    // 苹果叶子
    ctx.fillStyle = '#38a169';
    ctx.fillRect(x + 8, y + 1, 4, 6);
}

// 绘制游戏状态
function drawGameState() {
    if (gameState === 'paused') {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);
        
        ctx.fillStyle = '#ffffff';
        ctx.font = '30px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('游戏暂停', CANVAS_SIZE / 2, CANVAS_SIZE / 2);
        ctx.fillText('按空格继续', CANVAS_SIZE / 2, CANVAS_SIZE / 2 + 40);
    } else if (gameState === 'stopped') {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
        ctx.fillRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);
        
        ctx.fillStyle = '#4a5568';
        ctx.font = '24px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('点击开始游戏', CANVAS_SIZE / 2, CANVAS_SIZE / 2);
    }
}

// 页面加载完成后初始化游戏
document.addEventListener('DOMContentLoaded', init);