const express = require('express');
const http = require('http');
const sio = require('socket.io');
const path = require('path');
const database = require('./database.js');

var app = express();
const publicDir = 'public';
const errorDir = path.join(publicDir, 'errors');
var server = http.Server(app);
var io = sio(server);
var port = process.env.PORT || 3000;
server.listen(port);

app.use(express.static(path.join(__dirname, publicDir)));

app.use(function(req, res, next) {
    return res.status(404).sendFile(path.join(__dirname, errorDir, '404.html'));
});

app.use(function(err, req, res, next) {
    return res.status(500).send(path.join(__dirname, errorDir, '500.html'));
});

function main(socket) {
    // all main application functionality, such as sending/receiving messages (put into other function)
    socket.on('newMessage', (data) => {
        console.log(data);
    });
}

function register(socket, data) {
    database.createUser(data.username, data.displayname, data.email, data.password, (res) => {
        socket.emit('validRegistration', { 'res': res });
    });
}

function login(socket, data) {
    database.verifyLogin(data.username, data.password, (res) => {
        socket.emit('validLogin', { 'res': res });
        if (res) {
            console.log('USER SUCCESSFULLY LOGGED IN');
            main(socket);
        }
    });
}

function start() {
    io.on('connection', (socket) => {
        // do key exchange
        var date = (new Date()).toString();
        console.log(`[${date}] user joined`);
        socket.on('register', (data) => { register(socket, data); });
        socket.on('login', (data) => { login(socket, data); });
        socket.on('disconnect', () => {
            date = (new Date()).toString();
            console.log(`[${date}] user left`);
        });
    });
}

start();
