// Глобальные переменные
let deviceType = '';
let nickname = '';
let gameCanvas, ctx;
let players = {};
let bullets = [];
let obstacles = [];
let currentPlayerId = '';
let health = 100;
let kills = 0;
let deaths = 0;
let isAlive = true;
let respawnTimer = null;

// Инициализация игры
document.addEventListener('DOMContentLoaded', () => {
    // Выбор устройства
    document.getElementById('pc-btn').addEventListener('click', () => {
        deviceType = 'pc';
        showNicknameScreen();
    });
    
    document.getElementById('mobile-btn').addEventListener('click', () => {
        deviceType = 'mobile';
        showNicknameScreen();
    });
    
    // Ввод никнейма
    document.getElementById('play-btn').addEventListener('click', () => {
        const nicknameInput = document.getElementById('nickname-input').value.trim();
        const errorElement = document.getElementById('nickname-error');
        
        if (!nicknameInput || !/[a-zA-Zа-яА-Я]/.test(nicknameInput)) {
            errorElement.classList.remove('hidden');
            return;
        }
        
        nickname = nicknameInput;
        startGame();
    });
    
    // Кнопка списка игроков
    document.getElementById('players-list-btn').addEventListener('click', togglePlayersList);
    
    // Кнопка респавна
    document.getElementById('respawn-btn').addEventListener('click', respawnPlayer);
});

function showNicknameScreen() {
    document.getElementById('device-select').classList.add('hidden');
    document.getElementById('nickname-screen').classList.remove('hidden');
}

function startGame() {
    document.getElementById('nickname-screen').classList.add('hidden');
    document.getElementById('game-screen').classList.remove('hidden');
    
    if (deviceType === 'mobile') {
        document.getElementById('mobile-controls').classList.remove('hidden');
        initMobileControls();
    } else {
        initPCControls();
    }
    
    gameCanvas = document.getElementById('game-canvas');
    ctx = gameCanvas.getContext('2d');
    
    // Установка размеров canvas
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    
    // Создание препятствий
    createObstacles();
    
    // Подключение к серверу (заглушка)
    connectToServer();
    
    // Запуск игрового цикла
    gameLoop();
}

function resizeCanvas() {
    gameCanvas.width = window.innerWidth;
    gameCanvas.height = window.innerHeight;
}

function createObstacles() {
    // Создаем несколько препятствий на карте
    obstacles = [
        { x: 300, y: 200, width: 100, height: 50 },
        { x: 600, y: 400, width: 150, height: 70 },
        { x: 200, y: 500, width: 80, height: 120 },
        { x: 700, y: 150, width: 60, height: 200 }
    ];
}

function connectToServer() {
    // Здесь будет подключение к серверу через WebSocket
    // Заглушка для демонстрации
    currentPlayerId = 'player-' + Math.random().toString(36).substr(2, 9);
    
    // Добавляем текущего игрока
    players[currentPlayerId] = {
        id: currentPlayerId,
        x: Math.random() * gameCanvas.width,
        y: Math.random() * gameCanvas.height,
        color: getRandomColor(),
        nickname: nickname,
        health: 100,
        kills: 0,
        deaths: 0
    };
    
    // Добавляем несколько ботов для демонстрации
    for (let i = 0; i < 5; i++) {
        const botId = 'bot-' + i;
        players[botId] = {
            id: botId,
            x: Math.random() * gameCanvas.width,
            y: Math.random() * gameCanvas.height,
            color: getRandomColor(),
            nickname: 'Bot ' + i,
            health: 100,
            kills: Math.floor(Math.random() * 5),
            deaths: Math.floor(Math.random() * 5)
        };
    }
    
    updatePlayersList();
}

function getRandomColor() {
    const colors = ['#FF5252', '#FFEB3B', '#4CAF50', '#2196F3', '#9C27B0', '#FF9800'];
    return colors[Math.floor(Math.random() * colors.length)];
}

function gameLoop() {
    // Очистка canvas
    ctx.clearRect(0, 0, gameCanvas.width, gameCanvas.height);
    
    // Отрисовка препятствий
    drawObstacles();
    
    // Обновление и отрисовка игроков
    updatePlayers();
    
    // Обновление и отрисовка пуль
    updateBullets();
    
    // Проверка столкновений
    checkCollisions();
    
    // Запуск следующего кадра
    requestAnimationFrame(gameLoop);
}

function drawObstacles() {
    ctx.fillStyle = '#795548';
    obstacles.forEach(obstacle => {
        ctx.fillRect(obstacle.x, obstacle.y, obstacle.width, obstacle.height);
    });
}

function updatePlayers() {
    Object.values(players).forEach(player => {
        if (player.health <= 0) return;
        
        // Отрисовка игрока
        ctx.fillStyle = player.color;
        ctx.beginPath();
        ctx.arc(player.x, player.y, 20, 0, Math.PI * 2);
        ctx.fill();
        
        // Отрисовка никнейма
        ctx.fillStyle = 'white';
        ctx.font = '12px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(player.nickname, player.x, player.y - 25);
        
        // Отрисовка здоровья
        ctx.fillStyle = 'red';
        ctx.fillRect(player.x - 20, player.y - 35, 40, 5);
        ctx.fillStyle = 'green';
        ctx.fillRect(player.x - 20, player.y - 35, 40 * (player.health / 100), 5);
    });
}

function updateBullets() {
    bullets.forEach((bullet, index) => {
        // Перемещение пули
        bullet.x += bullet.dx;
        bullet.y += bullet.dy;
        
        // Проверка выхода за границы
        if (bullet.x < 0 || bullet.x > gameCanvas.width || 
            bullet.y < 0 || bullet.y > gameCanvas.height) {
            bullets.splice(index, 1);
            return;
        }
        
        // Отрисовка пули
        ctx.fillStyle = bullet.color;
        ctx.beginPath();
        ctx.arc(bullet.x, bullet.y, 5, 0, Math.PI * 2);
        ctx.fill();
    });
}

function checkCollisions() {
    bullets.forEach((bullet, bulletIndex) => {
        Object.values(players).forEach(player => {
            if (player.health <= 0 || player.id === bullet.playerId) return;
            
            // Проверка столкновения пули с игроком
            const dx = bullet.x - player.x;
            const dy = bullet.y - player.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance < 25) { // 20 (радиус игрока) + 5 (радиус пули)
                // Попадание
                player.health -= 20;
                
                // Обновление статистики
                if (player.health <= 0) {
                    deaths++;
                    player.deaths++;
                    
                    if (players[bullet.playerId]) {
                        players[bullet.playerId].kills++;
                        kills = players[currentPlayerId].kills;
                    }
                    
                    if (player.id === currentPlayerId) {
                        playerDied();
                    }
                }
                
                // Удаление пули
                bullets.splice(bulletIndex, 1);
                
                // Обновление UI
                updateHealthBar();
                updatePlayersList();
            }
        });
        
        // Проверка столкновения пули с препятствиями
        obstacles.forEach(obstacle => {
            if (bullet.x > obstacle.x && bullet.x < obstacle.x + obstacle.width &&
                bullet.y > obstacle.y && bullet.y < obstacle.y + obstacle.height) {
                bullets.splice(bulletIndex, 1);
            }
        });
    });
}

function shoot(fromX, fromY, toX, toY) {
    if (!isAlive) return;
    
    const dx = toX - fromX;
    const dy = toY - fromY;
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    const bullet = {
        x: fromX,
        y: fromY,
        dx: (dx / distance) * 10,
        dy: (dy / distance) * 10,
        color: players[currentPlayerId].color,
        playerId: currentPlayerId
    };
    
    bullets.push(bullet);
}

function playerDied() {
    isAlive = false;
    document.getElementById('death-screen').classList.remove('hidden');
    
    let seconds = 5;
    document.getElementById('respawn-timer').textContent = `Респавн через: ${seconds}`;
    
    const timer = setInterval(() => {
        seconds--;
        document.getElementById('respawn-timer').textContent = `Респавн через: ${seconds}`;
        
        if (seconds <= 0) {
            clearInterval(timer);
            document.getElementById('respawn-timer').classList.add('hidden');
            document.getElementById('respawn-btn').classList.remove('hidden');
        }
    }, 1000);
}

function respawnPlayer() {
    isAlive = true;
    players[currentPlayerId].health = 100;
    players[currentPlayerId].x = Math.random() * gameCanvas.width;
    players[currentPlayerId].y = Math.random() * gameCanvas.height;
    
    document.getElementById('death-screen').classList.add('hidden');
    document.getElementById('respawn-btn').classList.add('hidden');
    document.getElementById('respawn-timer').textContent = `Респавн через: 5`;
    document.getElementById('respawn-timer').classList.remove('hidden');
    
    updateHealthBar();
}

function updateHealthBar() {
    document.getElementById('health-bar').textContent = `HP: ${players[currentPlayerId].health}`;
}

function togglePlayersList() {
    const list = document.getElementById('players-list');
    list.classList.toggle('hidden');
}

function updatePlayersList() {
    const listContent = document.getElementById('players-list-content');
    listContent.innerHTML = '';
    
    Object.values(players).forEach(player => {
        const li = document.createElement('li');
        li.textContent = `${player.nickname}: ${player.kills}/${player.deaths}`;
        li.style.color = player.color;
        listContent.appendChild(li);
    });
    
    document.getElementById('kills-count').textContent = kills;
    document.getElementById('deaths-count').textContent = deaths;
}

// Управление для PC
function initPCControls() {
    // Движение
    const keys = {};
    document.addEventListener('keydown', (e) => {
        keys[e.key] = true;
    });
    
    document.addEventListener('keyup', (e) => {
        keys[e.key] = false;
    });
    
    // Стрельба
    gameCanvas.addEventListener('click', (e) => {
        const rect = gameCanvas.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;
        
        shoot(players[currentPlayerId].x, players[currentPlayerId].y, mouseX, mouseY);
    });
    
    // Игровой цикл для управления
    function controlLoop() {
        if (!isAlive) return;
        
        const speed = 5;
        const player = players[currentPlayerId];
        
        if (keys['w'] || keys['W'] || keys['ArrowUp']) player.y -= speed;
        if (keys['s'] || keys['S'] || keys['ArrowDown']) player.y += speed;
        if (keys['a'] || keys['A'] || keys['ArrowLeft']) player.x -= speed;
        if (keys['d'] || keys['D'] || keys['ArrowRight']) player.x += speed;
        
        // Проверка границ
        player.x = Math.max(20, Math.min(gameCanvas.width - 20, player.x));
        player.y = Math.max(20, Math.min(gameCanvas.height - 20, player.y));
        
        // Проверка столкновений с препятствиями
        obstacles.forEach(obstacle => {
            // Упрощенная проверка столкновений
            const closestX = Math.max(obstacle.x, Math.min(player.x, obstacle.x + obstacle.width));
            const closestY = Math.max(obstacle.y, Math.min(player.y, obstacle.y + obstacle.height));
            
            const dx = player.x - closestX;
            const dy = player.y - closestY;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance < 20) {
                // Отталкивание от препятствия
                player.x += dx / distance * 5;
                player.y += dy / distance * 5;
            }
        });
    }
    
    // Запуск цикла управления
    setInterval(controlLoop, 1000 / 60);
}

// Управление для мобильных устройств
function initMobileControls() {
    // Джойстик для движения
    const moveJoystick = new VirtualJoystick({
        container: document.getElementById('joystick-move'),
        mouseSupport: true
    });
    
    // Джойстик для стрельбы
    const shootJoystick = new VirtualJoystick({
        container: document.getElementById('joystick-shoot'),
        mouseSupport: true
    });
    
    // Игровой цикл для управления
    function controlLoop() {
        if (!isAlive) return;
        
        const player = players[currentPlayerId];
        const speed = 5;
        
        // Движение
        if (moveJoystick.deltaX() !== 0 || moveJoystick.deltaY() !== 0) {
            player.x += moveJoystick.deltaX() / 50 * speed;
            player.y += moveJoystick.deltaY() / 50 * speed;
        }
        
        // Проверка границ
        player.x = Math.max(20, Math.min(gameCanvas.width - 20, player.x));
        player.y = Math.max(20, Math.min(gameCanvas.height - 20, player.y));
        
        // Проверка столкновений с препятствиями
        obstacles.forEach(obstacle => {
            // Упрощенная проверка столкновений
            const closestX = Math.max(obstacle.x, Math.min(player.x, obstacle.x + obstacle.width));
            const closestY = Math.max(obstacle.y, Math.min(player.y, obstacle.y + obstacle.height));
            
            const dx = player.x - closestX;
            const dy = player.y - closestY;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance < 20) {
                // Отталкивание от препятствия
                player.x += dx / distance * 5;
                player.y += dy / distance * 5;
            }
        });
        
        // Стрельба
        if (shootJoystick.deltaX() !== 0 || shootJoystick.deltaY() !== 0) {
            const angle = Math.atan2(shootJoystick.deltaY(), shootJoystick.deltaX());
            const toX = player.x + Math.cos(angle) * 100;
            const toY = player.y + Math.sin(angle) * 100;
            
            shoot(player.x, player.y, toX, toY);
        }
    }
    
    // Запуск цикла управления
    setInterval(controlLoop, 1000 / 60);
}

// Простая реализация виртуального джойстика
class VirtualJoystick {
    constructor(options) {
        this.container = options.container;
        this.mouseSupport = options.mouseSupport || false;
        
        this.deltaX = () => 0;
        this.deltaY = () => 0;
        
        this.init();
    }
    
    init() {
        const stick = document.createElement('div');
        stick.style.width = '40px';
        stick.style.height = '40px';
        stick.style.backgroundColor = 'rgba(255, 255, 255, 0.5)';
        stick.style.borderRadius = '50%';
        stick.style.position = 'absolute';
        stick.style.top = '50%';
        stick.style.left = '50%';
        stick.style.transform = 'translate(-50%, -50%)';
        
        this.container.appendChild(stick);
        this.stick = stick;
        
        const rect = this.container.getBoundingClientRect();
        this.centerX = rect.left + rect.width / 2;
        this.centerY = rect.top + rect.height / 2;
        this.maxDist = rect.width / 3;
        
        if (this.mouseSupport) {
            document.addEventListener('mousemove', this.handleMouseMove.bind(this));
            document.addEventListener('mouseup', this.handleMouseUp.bind(this));
            this.container.addEventListener('mousedown', this.handleMouseDown.bind(this));
        } else {
            this.container.addEventListener('touchmove', this.handleTouchMove.bind(this), { passive: false });
            this.container.addEventListener('touchend', this.handleTouchEnd.bind(this));
            this.container.addEventListener('touchstart', this.handleTouchStart.bind(this), { passive: false });
        }
        
        this.active = false;
        this.currentX = 0;
        this.currentY = 0;
    }
    
    handleMouseDown(e) {
        this.active = true;
        this.updatePosition(e.clientX, e.clientY);
        e.preventDefault();
    }
    
    handleMouseMove(e) {
        if (!this.active) return;
        this.updatePosition(e.clientX, e.clientY);
    }
    
    handleMouseUp() {
        this.active = false;
        this.resetPosition();
    }
    
    handleTouchStart(e) {
        if (e.touches.length > 0) {
            this.active = true;
            const touch = e.touches[0];
            this.updatePosition(touch.clientX, touch.clientY);
            e.preventDefault();
        }
    }
    
    handleTouchMove(e) {
        if (!this.active || e.touches.length === 0) return;
        const touch = e.touches[0];
        this.updatePosition(touch.clientX, touch.clientY);
        e.preventDefault();
    }
    
    handleTouchEnd() {
        this.active = false;
        this.resetPosition();
    }
    
    updatePosition(clientX, clientY) {
        const dx = clientX - this.centerX;
        const dy = clientY - this.centerY;
        const dist = Math.sqrt(dx * dx + dy * dy);
        
        if (dist > this.maxDist) {
            const angle = Math.atan2(dy, dx);
            this.currentX = Math.cos(angle) * this.maxDist;
            this.currentY = Math.sin(angle) * this.maxDist;
        } else {
            this.currentX = dx;
            this.currentY = dy;
        }
        
        this.stick.style.transform = `translate(${this.currentX}px, ${this.currentY}px)`;
        
        this.deltaX = () => this.currentX;
        this.deltaY = () => this.currentY;
    }
    
    resetPosition() {
        this.currentX = 0;
        this.currentY = 0;
        this.stick.style.transform = 'translate(-50%, -50%)';
        
        this.deltaX = () => 0;
        this.deltaY = () => 0;
    }
}
