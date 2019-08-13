const path = require('path');
const bcrypt = require('bcrypt');
const crypto = require('crypto');
const db = require('./db.js');

const dbDir = 'db';
const dbFile = path.join(dbDir, 'main.db');
const saltRounds = 14;
const dmRoomType = 0;
const hexLength = 64;

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
            creatorid INTEGER NULL,
            roomType INT NOT NULL,
            name TEXT,
            imageURL TEXT,
            createTimestamp INT NOT NULL,
            updateTimestamp INT NOT NULL
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
    var passwordResetTable = `
        CREATE TABLE IF NOT EXISTS passwordReset (
            id INTEGER PRIMARY KEY,
            email TEXT NOT NULL,
            resetid TEXT NOT NULL,
            createTimestamp INT NOT NULL
        );
    `;
    mainDB.executeMany([usersTable, roomsTable, roomUsersTable, messagesTable, friendsTable, friendRequestsTable, passwordResetTable], (err, rows) => {
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
                    SELECT id2 FROM friendRequests WHERE id1 = (
                        SELECT id FROM users WHERE username = ?
                    ) AND id2 = (
                        SELECT id FROM users WHERE username = ?
                    )
                    UNION
                    SELECT id2 FROM friends WHERE id1 = (
                        SELECT id FROM users WHERE username = ?
                    ) AND id2 = (
                        SELECT id FROM users WHERE username = ?
                    );`;
                params = [username1, username2, username1, username2];
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
            roomType, name, createTimestamp, updateTimestamp
        ) VALUES (
            ?, 
            ?, 
            ?,
            ?
        );`;
    var now = getTime();
    var params = [roomType, name, now, now];
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
        SELECT * FROM (
            SELECT rooms1.id, roomType, updateTimestamp, name, imageURL FROM (
                SELECT id, roomType, updateTimestamp, name, imageURL FROM rooms WHERE roomType != ?
            ) rooms1 JOIN (
                SELECT roomid FROM roomUsers WHERE userid = (
                    SELECT id FROM users WHERE username = ?
                )
            ) roomUsers1 ON rooms1.id = roomUsers1.roomid
            UNION
            SELECT rooms2.id, roomType, updateTimestamp, name, imageURL FROM (
                SELECT id, roomType, updateTimestamp FROM rooms WHERE roomType = ?
            ) rooms2 JOIN (
                SELECT roomid, userid FROM roomUsers WHERE userid = (
                    SELECT id FROM users WHERE username = ?
                )
            ) roomUsers2 ON rooms2.id = roomUsers2.roomid JOIN (
                SELECT displayname name, imageURL, roomid FROM (
                    SELECT * FROM users WHERE username != ?
                ) users1 JOIN roomUsers ON users1.id = userid
            ) users2 ON users2.roomid = rooms2.id
        ) ORDER BY updateTimestamp DESC;`;
    var params = [dmRoomType, username, dmRoomType, username, username];
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

function userInRoom(username, roomID, callback) {
    var sql = `
        SELECT userid, roomid FROM roomUsers WHERE userid = (
            SELECT id FROM users WHERE username = ?
        ) AND roomid = ?;`;
    var params = [username, roomID];
    mainDB.execute(sql, params, (err, rows) => {
        if (err) throw err;
        if (callback) callback(rows.length > 0);
    });
}

function getDMImage(username, roomID, callback) {
    var sql = `
        SELECT imageURL FROM users WHERE id = (
            SELECT userid FROM roomUsers WHERE userid != (
                SELECT id FROM users WHERE username = ?
            ) AND roomid = ?
        );`;
    var params = [username, roomID];
    mainDB.execute(sql, params, (err, rows) => {
        if (err) throw err;
        if (callback) callback(rows[0]);
    });
}

function getMessages(roomID, size, callback) {
    var sql = `
        SELECT text, username, imageURL, roomid, createTimestamp timestamp FROM users JOIN (
            SELECT text, userid, roomid, createTimestamp FROM messages WHERE roomid = ? ORDER BY createTimestamp DESC LIMIT ?
        ) roomMessages ON users.id = roomMessages.userid ORDER BY createTimestamp ASC;`;
    var params = [roomID, size];
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
    sql = `UPDATE rooms SET updateTimestamp = ? WHERE id = ?`;
    params = [getTime(), roomID];
    mainDB.execute(sql, params, (err, rows) => {
        if (err) throw err;
    });
}

function emailExists(email, callback) {
    var sql = `SELECT email FROM users WHERE email = ?`;
    var params = [email];
    mainDB.execute(sql, params, (err, rows) => {
        if (err) throw err;
        if (callback) callback(rows.length > 0);
    });
}

function newPasswordResetID(email, callback) {
    crypto.randomBytes(hexLength / 2, (err, buffer) => {
        if (err) throw err;
        var resetID = buffer.toString('hex');
        var sql = `SELECT resetid FROM passwordReset WHERE resetid = ?`;
        var params = [resetID];
        mainDB.execute(sql, params, (err, rows) => {
            if (err) throw err;
            if (rows.length > 0) {
                newPasswordResetID(email, callback);
            } else {
                sql = `INSERT INTO passwordReset (email, resetid, createTimestamp) VALUES (?, ?, ?)`;
                params = [email, resetID, getTime()];
                var sqlAfter = `SELECT resetid FROM passwordReset ORDER BY id DESC LIMIT 1`;
                mainDB.executeAfter(sql, params, (err, rows) => {
                    if (err) throw err;
                }, sqlAfter, [], (err, rows) => {
                    if (err) throw err;
                    if (callback) callback(rows[0].resetid);
                });
            }
        });
    });
}

function checkPasswordResetID(passwordResetID, callback) {
    var sql = `SELECT resetid FROM passwordReset WHERE resetid = ?`;
    var params = [passwordResetID];
    mainDB.execute(sql, params, (err, rows) => {
        if (err) throw err;
        if (callback) callback(rows.length > 0);
    });
}

function resetPassword(passwordResetID, newPassword) {
    var sql = `SELECT username FROM users JOIN (
        SELECT email FROM passwordReset WHERE resetid = ?
    ) passwordReset1 ON users.email = passwordReset1.email`;
    var params = [passwordResetID];
    mainDB.execute(sql, params, (err, rows) => {
        if (err) throw err;
        setUserPassword(rows[0].username, newPassword);
        sql = `DELETE FROM passwordReset WHERE resetid = ?`;
        mainDB.execute(sql, params, (err, rows) => {
            if (err) throw err;
        });
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
    'userInRoom': userInRoom,
    'getDMImage': getDMImage,
    'getMessages': getMessages,
    'createMessage': createMessage,
    'emailExists': emailExists,
    'newPasswordResetID': newPasswordResetID,
    'checkPasswordResetID': checkPasswordResetID,
    'resetPassword': resetPassword,
    'verifyLogin': verifyLogin,
    'dmRoomType': dmRoomType
};

init();
