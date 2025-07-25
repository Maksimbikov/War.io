const express = require('express');
const app = express();
const server = require('http').createServer(app);
const io = require('socket.io')(server);
const path = require('path');

// Статические файлы
app.use(express.static(path.join(__dirname, 'public')));

// Маршрут для главной страницы
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Обработка подключений Socket.io
io.on('connection', (socket) => {
    console.log('Новое подключение:', socket.id);
    
    // Отправляем текущих игроков новому подключению
    const players = {};
    for (let [id, socket] of io.sockets.sockets) {
        if (socket.playerData) {
            players[id] = socket.playerData;
        }
    }
    socket.emit('currentPlayers', players);
    
    // Создаем нового игрока
    socket.on('newPlayer', (playerData) => {
        console.log('Новый игрок:', playerData.nickname);
        
        // Сохраняем данные игрока
        socket.playerData = {
            id: socket.id,
            x: Math.floor(Math.random() * 800),
            y: Math.floor(Math.random() * 600),
            color: playerData.color,
            nickname: playerData.nickname,
            health: 100,
            kills: 0,
            deaths: 0
        };
        
        // Рассылаем нового игрока всем
        socket.broadcast.emit('newPlayer', socket.playerData);
        
        // Отправляем препятствия новому игроку
        const obstacles = [
            { x: 300, y: 200, width: 100, height: 50 },
            { x: 600, y: 400, width: 150, height: 70 },
            { x: 200, y: 500, width: 80, height: 120 },
            { x: 700, y: 150, width: 60, height: 200 }
        ];
        socket.emit('obstacles', obstacles);
    });
    
    // Обработка движения игрока
    socket.on('playerMovement', (movementData) => {
        if (socket.playerData) {
            socket.playerData.x = movementData.x;
            socket.playerData.y = movementData.y;
            socket.broadcast.emit('playerMoved', {
                id: socket.id,
                x: movementData.x,
                y: movementData.y
            });
        }
    });
    
    // Обработка выстрелов
    socket.on('bulletShot', (bulletData) => {
        socket.broadcast.emit('newBullet', bulletData);
    });
    
    // Обработка попаданий
    socket.on('playerHit', (hitData) => {
        const shooterSocket = io.sockets.sockets.get(hitData.shooterId);
        const targetSocket = io.sockets.sockets.get(hitData.targetId);
        
        if (shooterSocket && shooterSocket.playerData && targetSocket && targetSocket.playerData) {
            targetSocket.playerData.health -= 20;
            
            if (targetSocket.playerData.health <= 0) {
                targetSocket.playerData.deaths++;
                shooterSocket.playerData.kills++;
                
                io.emit('playerDied', {
                    targetId: targetSocket.id,
                    killerId: shooterSocket.id
                });
                
                // Респавн через 5 секунд
                setTimeout(() => {
                    targetSocket.playerData.health = 100;
                    targetSocket.playerData.x = Math.floor(Math.random() * 800);
                    targetSocket.playerData.y = Math.floor(Math.random() * 600);
                    
                    io.emit('playerRespawned', {
                        id: targetSocket.id,
                        x: targetSocket.playerData.x,
                        y: targetSocket.playerData.y,
                        health: 100
                    });
                }, 5000);
            } else {
                io.emit('playerHealthUpdate', {
                    id: targetSocket.id,
                    health: targetSocket.playerData.health
                });
            }
        }
    });
    
    // Обработка отключения игрока
    socket.on('disconnect', () => {
        console.log('Игрок отключился:', socket.id);
        if (socket.playerData) {
            io.emit('playerDisconnected', socket.id);
        }
    });
});

// Запуск сервера
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Сервер запущен на порту ${PORT}`);
});

module.exports = app;
