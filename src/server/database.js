const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const bcrypt = require('bcrypt');
const db = require('./db.js');

const dbDir = 'db';
const dbFile = path.join(dbDir, 'main.db');
const saltRounds = 14;
const dmRoomType = 0;

var mainDB = new db.DB(path.join(__dirname, dbFile));

function getTime() {
    return Math.floor(new Date().getTime() / 1000);
}

function init() {
    var usersTable = `
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY,
            username TEXT NOT NULL,
            displayname TEXT NOT NULL,
            email TEXT NOT NULL,
            password TEXT NOT NULL,
            imageURL TEXT,
            joinTimestamp INT NOT NULL,
            lastLogin INT
        );
    `;
    var roomsTable = `
        CREATE TABLE IF NOT EXISTS rooms (
            id INTEGER PRIMARY KEY,
            roomType INT NOT NULL,
            name TEXT,
            imageURL TEXT,
            createTimestamp INT NOT NULL
        );
    `;
    var roomUsersTable = `
        CREATE TABLE IF NOT EXISTS roomUsers (
            roomid INT NOT NULL,
            userid INT NOT NULL,
            joinTimestamp INT NOT NULL
        );
    `;
    var messagesTable = `
        CREATE TABLE IF NOT EXISTS messages (
            id INTEGER PRIMARY KEY,
            text TEXT NOT NULL,
            userid INT NOT NULL,
            roomid INT NOT NULL,
            createTimestamp INT NOT NULL
        );
    `;
    var friendsTable = `
        CREATE TABLE IF NOT EXISTS friends (
            id1 INT NOT NULL,
            id2 INT NOT NULL,
            addTimestamp INT NOT NULL
        );
    `;
    var friendRequestsTable = `
        CREATE TABLE IF NOT EXISTS friendRequests (
            id1 INT NOT NULL,
            id2 INT NOT NULL,
            requestTimestamp INT NOT NULL
        );
    `;
    mainDB.executeMany([usersTable, roomsTable, roomUsersTable, messagesTable, friendsTable, friendRequestsTable], (err, rows) => {
        if (err) throw err;
    });
}

function createUser(username, displayname, email, password, callback) {
    var sql = `SELECT username, email FROM users WHERE username = ? OR email = ?;`;
    var params = [username, email];
    mainDB.execute(sql, params, (err, rows) => {
        if (err) throw err;
        if (rows.length > 0) {
            if (callback) callback(false);
        } else {
            bcrypt.hash(password, saltRounds, (err, hash) => {
                if (err) throw err;
                sql = `INSERT INTO users (username, displayname, email, password, joinTimestamp) VALUES (?, ?, ?, ?, ?);`;
                params = [username, displayname, email, hash, getTime()];
                mainDB.execute(sql, params, (err, rows) => {
                    if (err) throw err;
                });
                if (callback) callback(true);
            });
        }
    });
}

function setUserPassword(username, newPassword) {
    bcrypt.hash(newPassword, saltRounds, (err, hash) => {
        var sql = `UPDATE users SET password = ? WHERE username = ?;`;
        var params = [hash, username];
        mainDB.execute(sql, params, (err, rows) => {
            if (err) throw err;
        });
    });
}

function getUserDisplayname(username, callback) {
    var sql = `SELECT displayname FROM users WHERE username = ?;`;
    var params = [username];
    mainDB.execute(sql, params, (err, rows) => {
        if (err) throw err;
        if (callback) callback(rows[0].displayname);
    });
}

function setUserDisplayname(username, newDisplayname) {
    var sql = `UPDATE users SET displayname = ? WHERE username = ?;`;
    var params = [newDisplayname, username];
    mainDB.execute(sql, params, (err, rows) => {
        if (err) throw err;
    });
}

function getUserImage(username, callback) {
    var sql = `SELECT imageURL FROM users WHERE username = ?;`;
    var params = [username];
    mainDB.execute(sql, params, (err, rows) => {
        if (err) throw err;
        if (callback) callback(rows[0].imageURL);
    });
}

function setUserImage(username, imageURL) {
    var sql = `UPDATE users SET imageURL = ? WHERE username = ?;`;
    var params = [imageURL, username];
    mainDB.execute(sql, params, (err, rows) => {
        if (err) throw err;
    });
}

function addFriend(username1, username2) {
    var sql = `
        SELECT id1 FROM friends WHERE id1 = (
            SELECT id FROM users WHERE username = ?
        ) AND id2 = (
            SELECT id FROM users WHERE username = ?
        );`;
    var params = [username1, username2];
    mainDB.execute(sql, params, (err, rows) => {
        if (err) throw err;
        if (rows.length === 0) {
            params = [username2, username1];
            mainDB.execute(sql, params, (err, rows) => {
                if (err) throw err;
                if (rows.length === 0) {
                    var now = getTime();
                    sql = `
                        INSERT INTO friends (
                            id1, id2, addTimestamp
                        ) VALUES (
                            (SELECT id FROM users WHERE username = ?), 
                            (SELECT id FROM users WHERE username = ?), 
                            ?
                        );`;
                    params = [username1, username2, now];
                    mainDB.execute(sql, params, (err, rows) => {
                        if (err) throw err;
                    });
                    params = [username2, username1, now];
                    mainDB.execute(sql, params, (err, rows) => {
                        if (err) throw err;
                    });
                }
            });
        }
    });
}

function removeFriend(username1, username2) {
    var sql = `
        DELETE FROM friends WHERE id1 = (
            SELECT id FROM users WHERE username = ?
        ) AND id2 = (
            SELECT id FROM users WHERE username = ?
        );`;
    var params = [username1, username2];
    mainDB.execute(sql, params, (err, rows) => {
        if (err) throw err;
    });
    params = [username2, username1];
    mainDB.execute(sql, params, (err, rows) => {
        if (err) throw err;
    });
}

function getFriends(username, callback) {
    var sql = `
        SELECT username, displayname, imageURL FROM users JOIN (
            SELECT id2 FROM friends WHERE id1 = (
                SELECT id FROM users WHERE username = ?
            )
        ) userFriends ON users.id = userFriends.id2;`;
    var params = [username];
    mainDB.execute(sql, params, (err, rows) => {
        if (err) throw err;
        if (callback) callback(rows);
    });
}

function getIncomingFriendRequests(username, callback) {
    var sql = `
        SELECT username, displayname, imageURL FROM users JOIN (
            SELECT id1 FROM friendRequests WHERE id2 = (
                SELECT id FROM users WHERE username = ?
            )
        ) userRequests ON users.id = userRequests.id1;`;
    var params = [username];
    mainDB.execute(sql, params, (err, rows) => {
        if (err) throw err;
        if (callback) callback(rows);
    });
}

function acceptIncomingFriendRequest(username1, username2) {
    removeIncomingFriendRequest(username1, username2);
    removeIncomingFriendRequest(username2, username1); // just in case
    addFriend(username1, username2);
}

function removeIncomingFriendRequest(username1, username2) {
    var sql = `
        DELETE FROM friendRequests WHERE id2 = (
            SELECT id FROM users WHERE username = ?
        ) AND id1 = (
            SELECT id FROM users WHERE username = ?
        );`;
    var params = [username1, username2];
    mainDB.execute(sql, params, (err, rows) => {
        if (err) throw err;
    });
}

function getOutgoingFriendRequests(username, callback) {
    var sql = `
        SELECT username, displayname, imageURL FROM users JOIN (
            SELECT id2 FROM friendRequests WHERE id1 = (
                SELECT id FROM users WHERE username = ?
            )
        ) userRequests ON users.id = userRequests.id2;`;
    var params = [username];
    mainDB.execute(sql, params, (err, rows) => {
        if (err) throw err;
        if (callback) callback(rows);
    });
}

function newOutgoingFriendRequest(username1, username2) {
    if (username1 !== username2) {
        var sql = `SELECT id FROM users WHERE username = ?;`;
        var params = [username2];
        mainDB.execute(sql, params, (err, rows) => {
            if (err) throw err;
            if (rows.length > 0) {
                sql = `
                    SELECT * FROM friendRequests WHERE id1 = (
                        SELECT id FROM users WHERE username = ?
                    ) AND id2 = (
                        SELECT id FROM users WHERE username = ?
                    );`;
                params = [username1, username2];
                mainDB.execute(sql, params, (err, rows) => {
                    if (err) throw err;
                    if (rows.length === 0) {
                        sql = `
                            INSERT INTO friendRequests (
                                id1, id2, requestTimestamp
                            ) VALUES (
                                (SELECT id FROM users WHERE username = ?), 
                                (SELECT id FROM users WHERE username = ?), 
                                ?
                            );`;
                        params = [username1, username2, getTime()];
                        mainDB.execute(sql, params, (err, rows) => {
                            if (err) throw err;
                        });
                    }
                });
            }
        });
    }
}

function removeOutgoingFriendRequest(username1, username2) {
    var sql = `
        DELETE FROM friendRequests WHERE id1 = (
            SELECT id FROM users WHERE username = ?
        ) AND id2 = (
            SELECT id FROM users WHERE username = ?
        );`;
    var params = [username1, username2];
    mainDB.execute(sql, params, (err, rows) => {
        if (err) throw err;
    });
}

function getDMRoomID(username1, username2, callback) {
    var sql = `
        SELECT commonRooms.roomid FROM (
            (
                SELECT roomid FROM roomUsers WHERE userid = (
                    SELECT id FROM users WHERE username = ?
                )
            ) user1 JOIN (
                SELECT roomid from roomUsers WHERE userid = (
                    SELECT id FROM users WHERE username = ?
                ) 
            ) user2 ON user1.roomid = user2.roomid
        ) commonRooms JOIN (
            SELECT id FROM rooms WHERE roomType = ?
        ) DMs ON commonRooms.roomid = DMs.id;`;
    var params = [username1, username2, dmRoomType];
    mainDB.execute(sql, params, (err, rows) => {
        if (err) throw err;
        if (callback) callback(rows);
    });
}

function createRoom(roomType, name, callback) {
    var sql = `
        INSERT INTO rooms (
            roomType, name, createTimestamp
        ) VALUES (
            ?, 
            ?, 
            ?
        );`;
    var params = [roomType, name, getTime()];
    var sqlAfter = `SELECT id FROM rooms ORDER BY id DESC LIMIT 1;`;
    mainDB.executeAfter(sql, params, (err, rows) => {
        if (err) throw err;
    }, sqlAfter, [], (err, rows) => {
        if (err) throw err;
        if (callback) callback(rows[0].id);
    });
}

function deleteRoom(roomID) {
    var sql = `DELETE FROM rooms WHERE id = ?;`;
    var params = [roomID];
    mainDB.execute(sql, params, (err, rows) => {
        if (err) throw err;
    });
    sql = `DELETE FROM roomUsers WHERE roomid = ?;`;
    mainDB.execute(sql, params, (err, rows) => {
        if (err) throw err;
    });
    sql = `DELETE FROM messages WHERE roomid = ?;`;
    mainDB.execute(sql, params, (err, rows) => {
        if (err) throw err;
    });
}

function addToRoom(roomID, username) {
    var sql = `
        SELECT roomid FROM roomUsers WHERE roomid = ? AND userid = (
            SELECT id FROM users WHERE username = ?
        );`;
    var params = [roomID, username];
    mainDB.execute(sql, params, (err, rows) => {
        if (err) throw err;
        if (rows.length === 0) {
            sql = `
                INSERT INTO roomUsers (
                    roomid, userid, joinTimestamp
                ) VALUES (
                    ?, 
                    (SELECT id FROM users WHERE username = ?), 
                    ?
                );`;
            params = [roomID, username, getTime()];
            mainDB.execute(sql, params, (err, rows) => {
                if (err) throw err;
            });
        }
    })
}

function removeFromRoom(roomID, username) {
    var sql = `
        DELETE FROM roomUsers WHERE roomid = ? AND userid = (
            SELECT id FROM users WHERE username = ?
        );`;
    var params = [roomID, username];
    mainDB.execute(sql, params, (err, rows) => {
        if (err) throw err;
    });
}

function setRoomName(roomID, name) {
    var sql = `UPDATE rooms SET name = ? WHERE id = ?;`;
    var params = [name, roomID];
    mainDB.execute(sql, params, (err, rows) => {
        if (err) throw err;
    });
}

function setRoomImage(roomID, imageURL) {
    var sql = `UPDATE rooms SET imageURL = ? WHERE id = ?;`;
    var params = [imageURL, roomID];
    mainDB.execute(sql, params, (err, rows) => {
        if (err) throw err;
    });
}

function getRooms(username, callback) {
    var sql = `
        SELECT roomid FROM roomUsers WHERE userid = (
            SELECT id FROM users WHERE username = ?
        );`;
    var params = [username];
    mainDB.execute(sql, params, (err, rows) => {
        if (err) throw err;
        if (callback) callback(rows);
    });
}

function getUsersInRoom(roomID, callback) {
    var sql = `
        SELECT username FROM users WHERE id = (
            SELECT userid FROM roomUsers WHERE roomid = ?
        );`;
    var params = [roomID];
    mainDB.execute(sql, params, (err, rows) => {
        if (err) throw err;
        if (callback) callback(rows);
    });
}

function createMessage(text, username, roomID, callback) {
    var sql = `
        INSERT INTO messages (
            text, userid, roomid, createTimestamp
        ) VALUES (
            ?, 
            (SELECT id FROM users WHERE username = ?), 
            ?, 
            ?
        );`;
    var params = [text, username, roomID, getTime()];
    var sqlAfter = `SELECT id FROM messages ORDER BY id DESC LIMIT 1;`;
    mainDB.executeAfter(sql, params, (err, rows) => {
        if (err) throw err;
    }, sqlAfter, [], (err, rows) => {
        if (err) throw err;
        if (callback) callback(rows[0].id);
    });
}

function verifyLogin(username, password, callback) {
    var sql = `SELECT password FROM users WHERE username = ?;`;
    var params = [username];
    mainDB.execute(sql, params, (err, rows) => {
        if (err) throw err;
        if (rows.length > 1) throw `ERROR: multiple instances of user ${username}`;
        if (rows.length === 0) {
            if (callback) callback(false);
        } else {
            bcrypt.compare(password, rows[0].password, (err, res) => {
                if (err) throw err;
                if (res) {
                    sql = `UPDATE users SET lastLogin = ? WHERE username = ?;`;
                    params = [getTime(), username];
                    mainDB.execute(sql, params, (err, rows) => {
                        if (err) throw err;
                    });
                }
                if (callback) callback(res);
            });
        }
    });
}

module.exports = {
    'createUser': createUser,
    'setUserPassword': setUserPassword,
    'getUserDisplayname': getUserDisplayname,
    'setUserDisplayname': setUserDisplayname,
    'getUserImage': getUserImage,
    'setUserImage': setUserImage,
    'addFriend': addFriend,
    'removeFriend': removeFriend,
    'getFriends': getFriends,
    'getIncomingFriendRequests': getIncomingFriendRequests,
    'acceptIncomingFriendRequest': acceptIncomingFriendRequest,
    'removeIncomingFriendRequest': removeIncomingFriendRequest,
    'getOutgoingFriendRequests': getOutgoingFriendRequests,
    'newOutgoingFriendRequest': newOutgoingFriendRequest,
    'removeOutgoingFriendRequest': removeOutgoingFriendRequest,
    'getDMRoomID': getDMRoomID,
    'createRoom': createRoom,
    'deleteRoom': deleteRoom,
    'addToRoom': addToRoom,
    'removeFromRoom': removeFromRoom,
    'setRoomName': setRoomName,
    'setRoomImage': setRoomImage,
    'getRooms': getRooms,
    'getUsersInRoom': getUsersInRoom,
    'createMessage': createMessage,
    'verifyLogin': verifyLogin,
    'dmRoomType': dmRoomType
}

init();
