const express = require('express');
const path = require('path');
const http = require('http');
const socketIo = require('socket.io');
const Filter = require('bad-words');

const { generateMessage, generateLocationMessage } = require('./utils/messages');
const { addUser, removeUser, getUser, getUsersInRoom } = require('./utils/user');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

const port = process.env.port || 3000;
const publicDirectoryPath = path.join(__dirname, '../public');

app.use(express.static(publicDirectoryPath));

io.on('connection', (socket) => {
    console.log('New web socket connection');

    socket.on('join', (options, callback) => {
        const {error, user } = addUser({ id: socket.id, ...options });
        if (error) {
            return callback(error);
        }
        socket.join(user.room);

        socket.emit('message', generateMessage('Admin',' Welcome!'));
        socket.broadcast.to(user.room).emit('message', generateMessage(user.username,' has joined!'));
        io.to(user.room).emit('roomData', {
            room: user.room,
            users: getUsersInRoom(user.room)
        });
        callback();
    });

    socket.on('sendMessage', (message, callback) => {
        const user = getUser(socket.id);
        const filter = new Filter();
        if (filter.isProfane(message)) {
            return callback('Profanity is not allowed');
        }
        io.to(user.room).emit('message', generateMessage(user.username, message));
        callback();
    });

    socket.on('sendLocation', (location, callback) => {
        const user = getUser(socket.id);
        io.to(user.room).emit('locationMessage', generateLocationMessage(user.username, `https://www.google.com/maps?q=${location.latitud},${location.longitud}`));
        callback();
    });

    socket.on('disconnect', () => {
        const user = removeUser(socket.id);
        if (user) {
            io.to(user.room).emit('message', generateMessage(user.username, ' has left!'));
            io.to(user.room).emit('roomData', {
                room: user.room,
                users: getUsersInRoom(user.room)
            });
        }
    });

    // socket.emit('countUpdated', count);

    // socket.on('increment', () => { // on hears and event called increment
    //     count++;
    //     // socket.emit('countUpdated', count); // emits a value needs the event name and the value to a single connection
    //     io.emit('countUpdated', count); // emits a value to all connections
    // });
});

server.listen(port, () => {
    console.log('Server is on port ', port);
});
