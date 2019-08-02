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

function getDisplayname(socket, username) {
    database.getUserDisplayname(username, (displayname) => {
        socket.emit('returnDisplayname', { 'displayname': displayname });
    });
}

function setDisplayname(username, data) {
    database.setUserDisplayname(username, data.displayname);
}

function getImage(socket, username, data) {
    if (data) username = data.username;
    database.getUserImage(username, (image) => {
        socket.emit('returnImage', { 'image': image });
    });
}

function setImage(username, data) {
    database.setUserImage(username, data.image);
}

function setPassword(username, data) {
    database.setUserPassword(username, data.password);
}

/* function getFriends(socket, username) {
    database.getFriends(username, (friends) => {
        socket.emit('returnFriends', { 'friends': friends });
    });
} */

function getFriends(socket, username) {
    database.getFriends(username, (data) => {
        socket.emit('returnFriends', data);
    });
}

function getIncomingFriendRequests(socket, username) {
    database.getIncomingFriendRequests(username, (data) => {
        socket.emit('returnIncomingFriendRequests', data);
    });
}

function acceptIncomingFriendRequest(username, data) {
    database.acceptIncomingFriendRequest(username, data.username);
}

function removeIncomingFriendRequest(username, data) {
    database.removeIncomingFriendRequest(username, data.username);
}

function getOutgoingFriendRequests(socket, username) {
    database.getOutgoingFriendRequests(username, (data) => {
        socket.emit('returnOutgoingFriendRequests', data);
    });
}

function newOutgoingFriendRequest(username, data) {
    database.newOutgoingFriendRequest(username, data.username);
}

function removeOutgoingFriendRequest(username, data) {
    database.removeOutgoingFriendRequest(username, data.username);
}

function main(socket, username) {
    // TODO: handle getting rooms, messages, etc.
    socket.on('newMessage', (data) => {
        console.log(data);
    });
    socket.on('getDisplayname', () => { getDisplayname(socket, username); });
    socket.on('setDisplayname', (data) => { setDisplayname(username, data); });
    socket.on('getImage', (data) => { getImage(socket, username, data); });
    socket.on('setImage', (data) => { setImage(username, data); });
    socket.on('setPassword', (data) => { setPassword(username, data); });
    socket.on('getFriends', () => { getFriends(socket, username); });
    socket.on('getIncomingFriendRequests', () => { getIncomingFriendRequests(socket, username); });
    socket.on('acceptIncomingFriendRequest', (data) => { acceptIncomingFriendRequest(username, data); });
    socket.on('removeIncomingFriendRequest', (data) => { removeIncomingFriendRequest(username, data); });
    socket.on('getOutgoingFriendRequests', () => { getOutgoingFriendRequests(socket, username); });
    socket.on('newOutgoingFriendRequest', (data) => { newOutgoingFriendRequest(username, data); });
    socket.on('removeOutgoingFriendRequest', (data) => { removeOutgoingFriendRequest(username, data); });
    // TODO: implement friend searching
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
            main(socket, data.username);
        }
    });
}

function start() {
    io.on('connection', (socket) => {
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
