const express = require('express');
const http = require('http');
const socketIo = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

let userCount = 0;
let responses = { yes: 0, no: 0 };
let users = {};

const generateUsername = () => {
    const adjectives = ['Cool', 'Happy', 'Bright', 'Sharp', 'Swift', 'Brave'];
    const nouns = ['Tiger', 'Eagle', 'Shark', 'Panther', 'Lion', 'Wolf'];
    const adjective = adjectives[Math.floor(Math.random() * adjectives.length)];
    const noun = nouns[Math.floor(Math.random() * nouns.length)];
    return `${adjective}${noun}${Math.floor(Math.random() * 1000)}`;
};

const resetData = () => {
    responses = { yes: 0, no: 0 };
    io.emit('responseUpdate', { yesPercentage: 0, noPercentage: 0 });
};

setInterval(resetData, 5 * 60 * 1000); // Reset every 5 minutes

io.on('connection', (socket) => {
    const username = generateUsername();
    users[socket.id] = { username, hasVoted: false };
    userCount++;
    io.emit('userCountUpdate', { userCount, users });

    socket.on('response', (response) => {
        if (users[socket.id].hasVoted) {
            return;
        }
        if (response === 'yes' || response === 'no') {
            responses[response]++;
            users[socket.id].hasVoted = true;
            setTimeout(() => {
                users[socket.id].hasVoted = false;
            }, 30000); // 30 seconds timeout
            const total = responses.yes + responses.no;
            const yesPercentage = total === 0 ? 0 : (responses.yes / total) * 100;
            const noPercentage = total === 0 ? 0 : (responses.no / total) * 100;
            io.emit('responseUpdate', { yesPercentage, noPercentage });
        }
    });

    socket.on('disconnect', () => {
        delete users[socket.id];
        userCount--;
        io.emit('userCountUpdate', { userCount, users });
    });
});

app.use(express.static('public'));

server.listen(3000, () => {
    console.log('Server is running on http://localhost:3000');
});
