require('dotenv').config();

const express = require('express');
const path = require('path');
const uuidV4 = require('uuid/v4');
const bodyParser = require('body-parser');
const cookieSession = require('cookie-session');
const bcrypt = require('bcrypt');

const PORT = process.env.PORT || 8080;
const ENV = process.env.NODE_ENV || 'development';

const knexConfig = require('./knexfile');
const knex = require('knex')(knexConfig[ENV]);
const app = express();
const server = require('http').Server(app);
const io = require('socket.io')(server);

const router = require('./routes/auth')


app.use(express.static('build'));

app.use(cookieSession({
    name: 'session',
    keys: ['Lighthouse'],
    maxAge: 24 * 60 * 60 * 1000
  }));

app.use(bodyParser.urlencoded({ extended: true }));

app.use('/', router);

server.listen(PORT, () => {
  console.log(`Sports tracker listening on port ${PORT}`);
});

io.on('connection', (socket) => {
  console.log('new client');
  socket.emit('news', 'connection established');
  socket.on('post', (data) => {
    console.log('post to', data.room, ':', data.message);
    const newMessage = data.message;
    newMessage.id = uuidV4();
    newMessage.room = data.room;
    io.in(data.room).emit('post', newMessage);
  });
  socket.on('join', (data) => {
    console.log(data.user, 'is joining', data.room);
    socket.join(data.room);
    const onlineUsersMsg = {
      room: data.room,
      userCount: io.sockets.adapter.rooms[data.room].length
    };
    io.in(data.room).emit('user count', onlineUsersMsg);
  });
  socket.on('leave', (data) => {
    socket.leave(data.room);
    const onlineUsersMsg = {
      room: data.room,
      userCount: io.sockets.adapter.rooms[data.room].length
    };
    io.in(data.room).emit('user count', onlineUsersMsg);
  });
  socket.on('disconnect', (socket) => {
    // TODO notify rooms, see http://stackoverflow.com/a/13993971/7811614
  });
});
