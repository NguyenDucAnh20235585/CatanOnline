const express = require('express');
const http = require('http');
const socketIo = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

app.use(express.static('public'));

const games = {};

io.on('connection', (socket) => {
  console.log('Người chơi kết nối:', socket.id);

  socket.on('joinRoom', (roomId) => {
    socket.join(roomId);
    if (!games[roomId]) {
      games[roomId] = { players: [], hexes: [], currentPlayer: null, dice: [0, 0] };
    }
    games[roomId].players.push(socket.id);
    if (games[roomId].players.length === 1) {
      games[roomId].currentPlayer = socket.id;
    }
    io.to(roomId).emit('gameState', games[roomId]);
  });

  socket.on('rollDice', (roomId) => {
    const dice1 = Math.floor(Math.random() * 6) + 1;
    const dice2 = Math.floor(Math.random() * 6) + 1;
    games[roomId].dice = [dice1, dice2];
    const currentIdx = games[roomId].players.indexOf(games[roomId].currentPlayer);
    games[roomId].currentPlayer = games[roomId].players[(currentIdx + 1) % games[roomId].players.length];
    io.to(roomId).emit('gameState', games[roomId]);
  });

  socket.on('disconnect', () => {
    for (let roomId in games) {
      games[roomId].players = games[roomId].players.filter(id => id !== socket.id);
      if (games[roomId].currentPlayer === socket.id) {
        games[roomId].currentPlayer = games[roomId].players[0] || null;
      }
      io.to(roomId).emit('gameState', games[roomId]);
    }
  });
});

server.listen(3000, () => {
  console.log('Server chạy tại http://localhost:3000');
});
