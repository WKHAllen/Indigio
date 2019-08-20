const express = require('express');
const http = require('http');
const sio = require('socket.io');
const path = require('path');
const database = require('./database.js');
const passwordReset = require('./passwordReset.js');

var app = express();
const publicDir = 'public';
const errorDir = path.join(__dirname, publicDir, 'errors');
var server = http.Server(app);
var io = sio(server);
var host = process.env.HOST || 'localhost';
var port = process.env.PORT || 3000;
server.listen(port, host, () => {
    console.log(`Server running on ${host}:${port}`);
});

var address;
if (port !== 80) address = 'http://' + host + ':' + port;
else address = 'http://' + host;

var userSockets = new Map();
var userSocketsReversed = new Map();
var userRooms = new Map();

app.use(express.static(path.join(__dirname, publicDir)));

app.use(function(req, res, next) {
    return res.status(404).sendFile(path.join(__dirname, errorDir, '404.html'));
});

app.use(function(err, req, res, next) {
    return res.status(500).send(path.join(__dirname, errorDir, '500.html'));
});

function getTime() {
    return Math.floor(new Date().getTime() / 1000);
}

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

function getDMRoomID(socket, username, data) {
    database.getDMRoomID(username, data.username, (roomid) => {
        if (roomid === null) {
            database.createRoom(username, database.dmRoomType, `${username}, ${data.username}`, (newRoomid) => {
                database.addToRoom(newRoomid, username);
                database.addToRoom(newRoomid, data.username);
                socket.emit('returnDMRoomID', { 'roomid': newRoomid });
            });
        } else {
            socket.emit('returnDMRoomID', { 'roomid': roomid });
        }
    });
}

function addFriend(username, data) {
    database.newOutgoingFriendRequest(username, data.username);
}

function removeFriend(username, data) {
    database.removeFriend(username, data.username);
}

function getRooms(socket, username) {
    database.getRooms(username, (data) => {
        socket.emit('returnRooms', data);
        for (var room of data) {
            socket.join(room.id.toString());
            if (!userRooms.has(room.id))
                userRooms.set(room.id, new Map());
            userRooms.get(room.id).set(username, socket);
        }
    });
}

function getDMImage(socket, username, data) {
    database.getDMImage(username, data.roomid, (data) => {
        socket.emit('returnDMImage', data);
    });
}

function getMessages(socket, username, data) {
    database.userInRoom(username, data.roomid, (res) => {
        if (res) {
            database.getRoomType(data.roomid, (roomType) => {
                if (roomType === database.normalRoomType) {
                    database.getMessages(data.roomid, data.size, (data) => {
                        socket.emit('returnMessages', { 'messages': data, 'blocked': false });
                    });
                } else if (roomType === database.dmRoomType) {
                    database.getOtherDMMemberUsername(data.roomid, username, (otherUsername) => {
                        database.isBlocked(username, otherUsername, (blocked1) => {
                            database.isBlocked(otherUsername, username, (blocked2) => {
                                database.getMessages(data.roomid, data.size, (data) => {
                                    if (blocked1 || blocked2)
                                        socket.emit('returnMessages', { 'messages': data, 'blocked': true });
                                    else
                                        socket.emit('returnMessages', { 'messages': data, 'blocked': false });
                                });
                            });
                        });
                    });
                }
            });
        }
    });
}

function getMoreMessages(socket, username, data) {
    database.userInRoom(username, data.roomid, (res) => {
        if (res) {
            database.getMoreMessages(data.roomid, data.size, data.loadedMessages, (data) => {
                socket.emit('returnMoreMessages', data);
            });
        }
    });
}

function newMessage(username, data) {
    database.userInRoom(username, data.roomid, (res) => {
        if (res) {
            database.getRoomType(data.roomid, (roomType) => {
                if (roomType === database.normalRoomType) {
                    database.createMessage(data.text, username, data.roomid, (messageID) => {
                        var now = getTime();
                        database.getUserDisplayname(username, (displayname) => {
                            database.getUserImage(username, (image) => {
                                io.to(data.roomid.toString()).emit('incomingMessage', { 'id': messageID, 'text': data.text, 'username': username, 'displayname': displayname, 'imageURL': image, 'roomid': data.roomid, 'timestamp': now });
                            });
                        });
                    });
                } else if (roomType === database.dmRoomType) {
                    database.getOtherDMMemberUsername(data.roomid, username, (otherUsername) => {
                        database.isBlocked(username, otherUsername, (res) => {
                            if (!res) {
                                database.isBlocked(otherUsername, username, (res) => {
                                    if (!res) {
                                        database.createMessage(data.text, username, data.roomid, (messageID) => {
                                            var now = getTime();
                                            database.getUserDisplayname(username, (displayname) => {
                                                database.getUserImage(username, (image) => {
                                                    io.to(data.roomid.toString()).emit('incomingMessage', { 'id': messageID, 'text': data.text, 'username': username, 'displayname': displayname, 'imageURL': image, 'roomid': data.roomid, 'timestamp': now });
                                                });
                                            });
                                        });
                                    }
                                });
                            }
                        });
                    });
                }
            });
        }
    });
}

function createRoom(socket, username) {
    database.createRoom(username, database.normalRoomType, database.defaultRoomName, (roomid) => {
        database.addToRoom(roomid, username, () => {
            var now = getTime();
            socket.emit('newRoom', { 'id': roomid, 'roomType': database.normalRoomType, 'updateTimestamp': now, 'name': database.defaultRoomName, 'imageURL': database.defaultRoomImageURL });
            socket.join(roomid.toString());
            userRooms.set(roomid, new Map());
            userRooms.get(roomid).set(username, socket);
        });
    });
}

function getRoomName(socket, username, data) {
    database.userInRoom(username, data.roomid, (res) => {
        if (res) {
            database.getRoomName(data.roomid, (name) => {
                socket.emit('returnRoomName', { 'roomName': name });
            });
        }
    });
}

function setRoomName(username, data) {
    database.userInRoom(username, data.roomid, (res) => {
        if (res) {
            database.setRoomName(data.roomid, data.roomName);
        }
    });
}

function getRoomImage(socket, username, data) {
    database.userInRoom(username, data.roomid, (res) => {
        if (res) {
            database.getRoomImage(data.roomid, (image) => {
                socket.emit('returnRoomImage', { 'roomImage': image });
            });
        }
    });
}

function setRoomImage(username, data) {
    database.userInRoom(username, data.roomid, (res) => {
        if (res) {
            database.setRoomImage(data.roomid, data.roomImage);
        }
    });
}

function checkValidRoom(socket, username, data) {
    database.userInRoom(username, data.roomid, (res) => {
        database.getRoomType(data.roomid, (roomType) => {
            if (!res || roomType === null || roomType === database.dmRoomType) {
                socket.emit('validRoom', { 'res': false });
            } else {
                database.isRoomCreator(username, data.roomid, (isCreator) => {
                    socket.emit('validRoom', { 'res': true, 'creator': isCreator });
                });
            }
        });
    });
}

function deleteRoom(username, data) {
    database.isRoomCreator(username, data.roomid, (isCreator) => {
        if (isCreator) {
            database.getRoomType(data.roomid, (roomType) => {
                if (roomType !== null && roomType !== database.dmRoomType) {
                    database.deleteRoom(data.roomid);
                    if (!userRooms.has(data.roomid))
                        userRooms.set(data.roomid, new Map());
                    userRooms.get(data.roomid).forEach((socket, name, map) => {
                        socket.emit('roomKick', { 'roomid': data.roomid });
                        socket.leave(data.roomid.toString());
                    });
                    userRooms.delete(data.roomid);
                }
            });
        }
    });
}

function removeRoomMember(username, data) {
    database.isRoomCreator(username, data.roomid, (isCreator) => {
        if (isCreator) {
            database.removeFromRoom(data.roomid, data.memberUsername, () => {
                database.deleteRoomIfEmpty(data.roomid, (deleted) => {
                    if (!deleted && username === data.memberUsername) {
                        database.reassignCreator(data.roomid);
                    }
                    if (!userRooms.has(data.roomid))
                        userRooms.set(data.roomid, new Map());
                    userRooms.get(data.roomid).get(data.memberUsername).emit('roomKick', { 'roomid': data.roomid });
                    userRooms.get(data.roomid).get(data.memberUsername).leave(data.roomid.toString());
                    if (deleted) {
                        userRooms.delete(data.roomid);
                    } else {
                        userRooms.get(data.roomid).delete(data.memberUsername);
                    }
                });
            });
        }
    });
}

function leaveRoom(username, data) {
    database.isRoomCreator(username, data.roomid, (isCreator) => {
        database.removeFromRoom(data.roomid, username, () => {
            database.deleteRoomIfEmpty(data.roomid, (deleted) => {
                if (!deleted && isCreator) {
                    database.reassignCreator(data.roomid);
                }
                if (!userRooms.has(data.roomid))
                    userRooms.set(data.roomid, new Map());
                userRooms.get(data.roomid).get(username).emit('roomKick', { 'roomid': data.roomid });
                userRooms.get(data.roomid).get(username).leave(data.roomid.toString());
                if (deleted) {
                    userRooms.delete(data.roomid);
                } else {
                    userRooms.get(data.roomid).delete(username);
                }
            });
        });
    });
}

function getRoomMembers(socket, username, data) {
    database.userInRoom(username, data.roomid, (res) => {
        if (res) {
            database.getUsersInRoom(data.roomid, (data) => {
                socket.emit('returnRoomMembers', data);
            });
        }
    });
}

function addRoomMember(username, data) {
    database.isBlocked(username, data.memberUsername, (res) => {
        if (!res) {
            database.isBlocked(data.memberUsername, username, (res) => {
                if (!res) {
                    database.userInRoom(username, data.roomid, (res) => {
                        if (res) {
                            database.userExists(data.memberUsername, (res) => {
                                if (res) {
                                    database.addToRoom(data.roomid, data.memberUsername);
                                    if (userSockets.has(data.memberUsername)) {
                                        if (!userRooms.has(data.roomid))
                                            userRooms.set(data.roomid, new Map());
                                        userRooms.get(data.roomid).set(data.memberUsername, userSockets.get(data.memberUsername));
                                        database.getRoomInfo(data.roomid, (roomData) => {
                                            userSockets.get(data.memberUsername).emit('roomJoin', { 'id': roomData.id, 'roomType': roomData.roomType, 'updateTimestamp': roomData.updateTimestamp, 'name': roomData.name, 'imageURL': roomData.imageURL });
                                        });
                                    }
                                }
                            });
                        }
                    });
                }
            });
        }
    });
}

function getOtherDMMemberUsername(socket, username, data) {
    database.getOtherDMMemberUsername(data.roomid, username, (memberUsername) => {
        socket.emit('returnOtherDMMemberUsername', { 'username': memberUsername });
    });
}

function checkIsFriend(socket, username, data) {
    database.checkIsFriend(username, data.username, (res) => {
        socket.emit('isFriend', { 'res': res });
    });
}

function checkIsBlocked(socket, username, data) {
    database.isBlocked(username, data.username, (res) => {
        socket.emit('isBlocked', { 'res': res });
    });
}

function blockUser(username, data) {
    database.blockUser(username, data.username);
    if (userSockets.has(data.username)) {
        database.getDMRoomID(username, data.username, (roomid) => {
            userSockets.get(data.username).emit('blocked', { 'roomid': roomid });
        });
    }
}

function unblockUser(username, data) {
    database.unblockUser(username, data.username);
    database.isBlocked(data.username, username, (res) => {
        if (!res && userSockets.has(data.username)) {
            database.getDMRoomID(username, data.username, (roomid) => {
                userSockets.get(data.username).emit('unblocked', { 'roomid': roomid });
            });
        }
    });
}

function getBlockedUsers(socket, username) {
    database.getBlockedUsers(username, (data) => {
        socket.emit('returnBlockedUsers', data);
    });
}

function checkValidMessage(socket, username, data) {
    database.canManageMessage(username, data.messageid, (res) => {
        socket.emit('validMessage', { 'res': res });
    });
}

function getMessageInfo(socket, username, data) {
    database.canManageMessage(username, data.messageid, (res) => {
        if (res) {
            database.getMessageInfo(data.messageid, (data) => {
                socket.emit('returnMessageInfo', data);
            });
        }
    });
}

function editMessage(username, data) {
    database.canManageMessage(username, data.messageid, (res) => {
        if (res) {
            database.roomOfMessage(data.messageid, (roomID) => {
                database.editMessage(data.messageid, data.messageContent, () => {
                    io.to(roomID.toString()).emit('editedMessage', { 'roomid': roomID, 'messageid': data.messageid, 'messageContent': data.messageContent });
                });
            });
        }
    });
}

function deleteMessage(username, data) {
    database.canManageMessage(username, data.messageid, (res) => {
        if (res) {
            database.roomOfMessage(data.messageid, (roomID) => {
                database.deleteMessage(data.messageid, () => {
                    io.to(roomID.toString()).emit('deletedMessage', { 'roomid': roomID, 'messageid': data.messageid });
                });
            });
        }
    });
}

function readMessage(username, data) {
    database.readMessage(username, data.roomid);
}

function main(socket, username) {
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
    socket.on('getDMRoomID', (data) => { getDMRoomID(socket, username, data); });
    socket.on('addFriend', (data) => { addFriend(username, data); });
    socket.on('removeFriend', (data) => { removeFriend(username, data); });
    socket.on('getRooms', () => { getRooms(socket, username); });
    socket.on('getDMImage', (data) => { getDMImage(socket, username, data); });
    socket.on('getMessages', (data) => { getMessages(socket, username, data); });
    socket.on('getMoreMessages', (data) => { getMoreMessages(socket, username, data); });
    socket.on('newMessage', (data) => { newMessage(username, data); });
    socket.on('createRoom', () => { createRoom(socket, username); });
    socket.on('getRoomName', (data) => { getRoomName(socket, username, data); });
    socket.on('setRoomName', (data) => { setRoomName(username, data); });
    socket.on('getRoomImage', (data) => { getRoomImage(socket, username, data); });
    socket.on('setRoomImage', (data) => { setRoomImage(username, data); });
    socket.on('checkValidRoom', (data) => { checkValidRoom(socket, username, data); });
    socket.on('deleteRoom', (data) => { deleteRoom(username, data); });
    socket.on('removeRoomMember', (data) => { removeRoomMember(username, data); });
    socket.on('leaveRoom', (data) => { leaveRoom(username, data); });
    socket.on('getRoomMembers', (data) => { getRoomMembers(socket, username, data); });
    socket.on('addRoomMember', (data) => { addRoomMember(username, data); });
    socket.on('getOtherDMMemberUsername', (data) => { getOtherDMMemberUsername(socket, username, data); });
    socket.on('checkIsFriend', (data) => { checkIsFriend(socket, username, data); });
    socket.on('checkIsBlocked', (data) => { checkIsBlocked(socket, username, data); });
    socket.on('blockUser', (data) => { blockUser(username, data); });
    socket.on('unblockUser', (data) => { unblockUser(username, data); });
    socket.on('getBlockedUsers', () => { getBlockedUsers(socket, username); });
    socket.on('checkValidMessage', (data) => { checkValidMessage(socket, username, data); });
    socket.on('getMessageInfo', (data) => { getMessageInfo(socket, username, data); });
    socket.on('editMessage', (data) => { editMessage(username, data); });
    socket.on('deleteMessage', (data) => { deleteMessage(username, data); });
    socket.on('readMessage', (data) => { readMessage(username, data); });
}

function register(socket, data) {
    database.createUser(data.username, data.displayname, data.email, data.password, (res) => {
        socket.emit('validRegistration', { 'res': res });
    });
}

function login(socket, data) {
    database.verifyLogin(data.username, data.password, (res, username) => {
        socket.emit('validLogin', { 'res': res, 'username': username });
        if (res) {
            console.log('USER SUCCESSFULLY LOGGED IN');
            userSockets.set(data.username, socket);
            userSocketsReversed.set(socket, data.username);
            main(socket, data.username);
        }
    });
}

function resetPassword(socket, data) {
    database.emailExists(data.email, (res) => {
        socket.emit('validPasswordReset', { 'res': res });
        if (res) {
            passwordReset.passwordReset(data.email, address);
        }
    });
}

function checkPasswordResetID(socket, data) {
    database.checkPasswordResetID(data.passwordResetID, (res) => {
        socket.emit('validPasswordResetID', { 'res': res });
        if (res) {
            socket.on('resetPassword', (newData) => {
                database.resetPassword(data.passwordResetID, newData.newPassword);
            });
        }
    });
}

function getUserInfo(socket, data) {
    database.getUserInfo(data.username, (userInfo) => {
        socket.emit('returnUserInfo', userInfo);
    });
}

function start() {
    io.on('connection', (socket) => {
        var date = (new Date()).toString();
        console.log(`[${date}] user joined`);
        socket.on('register', (data) => { register(socket, data); });
        socket.on('login', (data) => { login(socket, data); });
        socket.on('passwordReset', (data) => { resetPassword(socket, data); });
        socket.on('checkPasswordResetID', (data) => { checkPasswordResetID(socket, data); });
        socket.on('getUserInfo', (data) => { getUserInfo(socket, data); });
        socket.on('disconnect', () => {
            date = (new Date()).toString();
            console.log(`[${date}] user left`);
            userSockets.delete(userSocketsReversed.get(socket));
            userSocketsReversed.delete(socket);
        });
    });
}

start();
