const express = require('express');
const enforce = require('express-sslify');
const http = require('http');
const sio = require('socket.io');
const path = require('path');
const database = require('./database');
const passwordReset = require('./passwordReset');

const publicDir = 'public';
const errorDir = path.join(__dirname, publicDir, 'errors');

var app = express();
app.use(enforce.HTTPS({ trustProtoHeader: true }));
var server = http.Server(app);
var io = sio(server);
var port = process.env.PORT || 3000;
server.listen(port, () => {
    console.log(`Server running on port ${port}`);
});

var address = 'https://www.indigio.co';

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
    if ('displayname' in data)
        database.setUserDisplayname(username, data.displayname);
}

function getImage(socket, username, data) {
    if (data) {
        if (!('username' in data)) {
            socket.emit('returnImage', { 'error': 'username expected' });
            return;
        }
        username = data.username;
    }
    database.getUserImage(username, (image) => {
        socket.emit('returnImage', { 'image': image });
    });
}

function setImage(username, data) {
    if ('image' in data)
        database.setUserImage(username, data.image);
}

function setPassword(username, data) {
    if ('password' in data)
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
    if ('username' in data)
        database.acceptIncomingFriendRequest(username, data.username);
}

function removeIncomingFriendRequest(username, data) {
    if ('username' in data)
        database.removeIncomingFriendRequest(username, data.username);
}

function getOutgoingFriendRequests(socket, username) {
    database.getOutgoingFriendRequests(username, (data) => {
        socket.emit('returnOutgoingFriendRequests', data);
    });
}

function newOutgoingFriendRequest(username, data) {
    if ('username' in data)
        database.newOutgoingFriendRequest(username, data.username);
}

function removeOutgoingFriendRequest(username, data) {
    if ('username' in data)
        database.removeOutgoingFriendRequest(username, data.username);
}

function getDMRoomID(socket, username, data) {
    if ('username' in data) {
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
    } else {
        socket.emit('returnDMRoomID', { 'error': 'username expected' });
    }
}

function addFriend(username, data) {
    if ('username' in data)
        database.newOutgoingFriendRequest(username, data.username);
}

function removeFriend(username, data) {
    if ('username' in data)
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
    if ('roomid' in data) {
        database.getDMImage(username, data.roomid, (imageurl) => {
            socket.emit('returnDMImage', { 'imageurl': imageurl });
        });
    } else {
        socket.emit('returnDMImage', { 'error': 'roomid expected' });
    }
}

function getMessages(socket, username, data) {
    if ('roomid' in data && 'size' in data) {
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
    } else {
        socket.emit('returnMessages', { 'error': 'roomid, size expected' });
    }
}

function getMoreMessages(socket, username, data) {
    if ('roomid' in data && 'size' in data && 'loadedMessages' in data) {
        database.userInRoom(username, data.roomid, (res) => {
            if (res) {
                database.getMoreMessages(data.roomid, data.size, data.loadedMessages, (data) => {
                    socket.emit('returnMoreMessages', data);
                });
            }
        });
    } else {
        socket.emit('returnMoreMessages', { 'error': 'roomid, size, loadedMessages expected' });
    }
}

function newMessage(username, data) {
    if ('roomid' in data && 'text' in data) {
        if (typeof data.text === 'string' && data.text.length <= 1000) {
            database.userInRoom(username, data.roomid, (res) => {
                if (res) {
                    database.getRoomType(data.roomid, (roomType) => {
                        if (roomType === database.normalRoomType) {
                            database.createMessage(data.text, username, data.roomid, (messageID) => {
                                var now = getTime();
                                database.getUserDisplayname(username, (displayname) => {
                                    database.getUserImage(username, (image) => {
                                        io.to(data.roomid.toString()).emit('incomingMessage', { 'id': messageID, 'text': data.text, 'username': username, 'displayname': displayname, 'imageurl': image, 'roomid': data.roomid, 'timestamp': now });
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
                                                            io.to(data.roomid.toString()).emit('incomingMessage', { 'id': messageID, 'text': data.text, 'username': username, 'displayname': displayname, 'imageurl': image, 'roomid': data.roomid, 'timestamp': now });
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
    }
}

function createRoom(socket, username) {
    database.createRoom(username, database.normalRoomType, database.defaultRoomName, (roomid) => {
        database.addToRoom(roomid, username, () => {
            var now = getTime();
            socket.emit('newRoom', { 'id': roomid, 'roomtype': database.normalRoomType, 'updatetimestamp': now, 'name': database.defaultRoomName, 'imageurl': database.defaultRoomImageURL });
            socket.join(roomid.toString());
            userRooms.set(roomid, new Map());
            userRooms.get(roomid).set(username, socket);
        });
    });
}

function getRoomName(socket, username, data) {
    if ('roomid' in data) {
        database.userInRoom(username, data.roomid, (res) => {
            if (res) {
                database.getRoomName(data.roomid, (name) => {
                    socket.emit('returnRoomName', { 'roomName': name });
                });
            }
        });
    } else {
        socket.emit('returnRoomName', { 'error': 'roomid expected' });
    }
}

function setRoomName(username, data) {
    if ('roomid' in data && 'roomName' in data) {
        database.userInRoom(username, data.roomid, (res) => {
            if (res) {
                database.setRoomName(data.roomid, data.roomName);
            }
        });
    }
}

function getRoomImage(socket, username, data) {
    if ('roomid' in data) {
        database.userInRoom(username, data.roomid, (res) => {
            if (res) {
                database.getRoomImage(data.roomid, (image) => {
                    socket.emit('returnRoomImage', { 'roomImage': image });
                });
            }
        });
    } else {
        socket.emit('returnRoomImage', { 'error': 'roomid expected' });
    }
}

function setRoomImage(username, data) {
    if ('roomid' in data && 'roomImage' in data) {
        database.userInRoom(username, data.roomid, (res) => {
            if (res) {
                database.setRoomImage(data.roomid, data.roomImage);
            }
        });
    }
}

function checkValidRoom(socket, username, data) {
    if ('roomid' in data) {
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
}

function deleteRoom(username, data) {
    if ('roomid' in data) {
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
}

function removeRoomMember(username, data) {
    if ('roomid' in data && 'memberUsername' in data) {
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
}

function leaveRoom(username, data) {
    if ('roomid' in data) {
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
}

function getRoomMembers(socket, username, data) {
    if ('roomid' in data) {
        database.userInRoom(username, data.roomid, (res) => {
            if (res) {
                database.getUsersInRoom(data.roomid, (data) => {
                    socket.emit('returnRoomMembers', data);
                });
            }
        });
    } else {
        socket.emit('returnRoomMembers', { 'error': 'roomid expected' });
    }
}

function addRoomMember(username, data) {
    if ('memberUsername' in data && 'roomid' in data) {
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
                                                userSockets.get(data.memberUsername).emit('roomJoin', roomData);
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
}

function getOtherDMMemberUsername(socket, username, data) {
    if ('roomid' in data) {
        database.getOtherDMMemberUsername(data.roomid, username, (memberUsername) => {
            socket.emit('returnOtherDMMemberUsername', { 'username': memberUsername });
        });
    } else {
        socket.emit('returnOtherDMMemberUsername', { 'error': 'roomid expected' });
    }
}

function checkIsFriend(socket, username, data) {
    if ('username' in data) {
        database.checkIsFriend(username, data.username, (res) => {
            socket.emit('isFriend', { 'res': res });
        });
    }
}

function checkIsBlocked(socket, username, data) {
    if ('username' in data) {
        database.isBlocked(username, data.username, (res) => {
            socket.emit('isBlocked', { 'res': res });
        });
    }
}

function blockUser(username, data) {
    if ('username' in data) {
        database.blockUser(username, data.username);
        if (userSockets.has(data.username)) {
            database.getDMRoomID(username, data.username, (roomid) => {
                userSockets.get(data.username).emit('blocked', { 'roomid': roomid });
            });
        }
    }
}

function unblockUser(username, data) {
    if ('username' in data) {
        database.unblockUser(username, data.username);
        database.isBlocked(data.username, username, (res) => {
            if (!res && userSockets.has(data.username)) {
                database.getDMRoomID(username, data.username, (roomid) => {
                    userSockets.get(data.username).emit('unblocked', { 'roomid': roomid });
                });
            }
        });
    }
}

function getBlockedUsers(socket, username) {
    database.getBlockedUsers(username, (data) => {
        socket.emit('returnBlockedUsers', data);
    });
}

function checkValidMessage(socket, username, data) {
    if ('messageid' in data) {
        database.canManageMessage(username, data.messageid, (res) => {
            socket.emit('validMessage', { 'res': res });
        });
    } else {
        socket.emit('validMessages', { 'error': 'messageid expected' });
    }
}

function getMessageInfo(socket, username, data) {
    if ('messageid' in data) {
        database.canManageMessage(username, data.messageid, (res) => {
            if (res) {
                database.getMessageInfo(data.messageid, (data) => {
                    socket.emit('returnMessageInfo', data);
                });
            }
        });
    } else {
        socket.emit('returnMessageInfo', { 'error': 'messageid expected' });
    }
}

function editMessage(username, data) {
    if ('messageid' in data && 'messageContent' in data) {
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
}

function deleteMessage(username, data) {
    if ('messageid' in data) {
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
}

function readMessage(username, data) {
    if ('roomid' in data)
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
    if ('username' in data && 'displayname' in data && 'email' in data && 'password' in data) {
        if (typeof data.username === 'string' && 2 <= data.username.length && data.username.length <= 32) {
            if (typeof data.displayname === 'string' && 2 <= data.displayname.length && data.displayname.length <= 32) {
                if (typeof data.email === 'string' && data.email.length <= 32 && data.email.match(/^([A-Za-z0-9.]+)@([a-z0-9]+)\.([a-z]+)$/g) !== null) {
                    if (typeof data.password === 'string' && 8 <= data.password.length && data.password.length <= 32) {
                        database.createUser(data.username, data.displayname, data.email, data.password, (res) => {
                            socket.emit('validRegistration', { 'res': res });
                        });
                    } else {
                        socket.emit('validRegistration', { 'res': false, 'error': 'password must be between 8 and 64 characters' });
                    }
                } else {
                    socket.emit('validRegistration', { 'res': false, 'error': 'email must be less than 32 characters, and must be in the proper format' });
                }
            } else {
                socket.emit('validRegistration', { 'res': false, 'error': 'displayname must be between 2 and 32 characters' });
            }
        } else {
            socket.emit('validRegistration', { 'res': false, 'error': 'username must be between 2 and 32 characters' });
        }
    } else {
        socket.emit('validRegistration', { 'res': false, 'error': 'username, displayname, email, password expected' });
    }
}

function login(socket, data) {
    if ('username' in data && 'password' in data) {
        database.verifyLogin(data.username, data.password, (res, username) => {
            socket.emit('validLogin', { 'res': res, 'username': username });
            if (res) {
                userSockets.set(data.username, socket);
                userSocketsReversed.set(socket, data.username);
                main(socket, data.username);
            }
        });
    } else {
        socket.emit('validLogin', { 'res': false, 'error': 'username, password expected' });
    }
}

function resetPassword(socket, data) {
    if ('email' in data) {
        database.emailExists(data.email, (res) => {
            socket.emit('validPasswordReset', { 'res': res });
            if (res) {
                passwordReset.passwordReset(data.email, address);
            }
        });
    } else {
        socket.emit('validPasswordReset', { 'res': false, 'error': 'email expected' });
    }
}

function checkPasswordResetID(socket, data) {
    if ('passwordResetID' in data) {
        database.checkPasswordResetID(data.passwordResetID, (res) => {
            socket.emit('validPasswordResetID', { 'res': res });
            if (res) {
                socket.on('resetPassword', (newData) => {
                    if ('newPassword' in newData) {
                        database.resetPassword(data.passwordResetID, newData.newPassword);
                    }
                });
            }
        });
    } else {
        socket.emit('validPasswordResetID', { 'res': false, 'error': 'passwordResetID, newPassword expected' });
    }
}

function getUserInfo(socket, data) {
    if ('username' in data) {
        database.getUserInfo(data.username, (userInfo) => {
            socket.emit('returnUserInfo', userInfo);
        });
    } else {
        socket.emit('returnUserInfo', { 'error': 'username expected' });
    }
}

function start() {
    io.on('connection', (socket) => {
        socket.on('register', (data) => { register(socket, data); });
        socket.on('login', (data) => { login(socket, data); });
        socket.on('passwordReset', (data) => { resetPassword(socket, data); });
        socket.on('checkPasswordResetID', (data) => { checkPasswordResetID(socket, data); });
        socket.on('getUserInfo', (data) => { getUserInfo(socket, data); });
        socket.on('disconnect', () => {
            userSockets.delete(userSocketsReversed.get(socket));
            userSocketsReversed.delete(socket);
        });
    });
}

start();
