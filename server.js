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
var server = require('http').Server(app);
var io = require('socket.io')(server);

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
   console.log('Sports tracker listening on port ' + PORT);
});

io.on('connection', function (socket) {
  console.log('new client');
  socket.emit('news', 'connection established');
  socket.on('post', function (data) {
    console.log('post to', data.room, ':', data.message);
    data.message.id = uuidV4();
    data.message.room = data.room;
    io.sockets.to(data.room).emit('post', data.message);
  });
  socket.on('join', function (data) {
    console.log(data.user, 'is joining', data.room);
    socket.join(data.room);
    socket.to(data.room).emit('new user', data.user);
  });
});
