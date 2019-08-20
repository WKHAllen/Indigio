const path = require('path');
const bcrypt = require('bcrypt');
const crypto = require('crypto');
const db = require('./db.js');

const dbFile = path.join(__dirname, 'db', 'main.db');
const saltRounds = 12;
const dmRoomType = 0;
const normalRoomType = 1;
const defaultRoomName = 'New room';
const defaultUserImageURL = '/assets/userDefault.ico';
const defaultRoomImageURL = '/assets/roomDefault.ico';
const hexLength = 64;

var mainDB = new db.DB(dbFile);

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
            joinTimestamp INT NOT NULL,
            lastRead INT
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
    var blockedUsersTable = `
        CREATE TABLE IF NOT EXISTS blockedUsers (
            id1 INT NOT NULL,
            id2 INT NOT NULL,
            blockTimestamp INT NOT NULL
        );
    `;
    mainDB.executeMany([usersTable, roomsTable, roomUsersTable, messagesTable, friendsTable, friendRequestsTable, passwordResetTable, blockedUsersTable], (err, rows) => {
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
                sql = `INSERT INTO users (username, displayname, email, password, imageURL, joinTimestamp) VALUES (?, ?, ?, ?, ?, ?);`;
                params = [username, displayname, email, hash, defaultUserImageURL, getTime()];
                mainDB.execute(sql, params, (err, rows) => {
                    if (err) throw err;
                    if (callback) callback(true);
                });
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
        if (callback && rows.length === 1) callback(rows[0].displayname);
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
        if (callback && rows.length === 1) callback(rows[0].imageURL);
    });
}

function setUserImage(username, imageURL) {
    var sql = `UPDATE users SET imageURL = ? WHERE username = ?;`;
    var params = [imageURL, username];
    mainDB.execute(sql, params, (err, rows) => {
        if (err) throw err;
    });
}

function userExists(username, callback) {
    var sql = `SELECT username FROM users WHERE username = ?;`;
    var params = [username];
    mainDB.execute(sql, params, (err, rows) => {
        if (err) throw err;
        if (callback) callback(rows.length > 0);
    });
}

function getUserInfo(username, callback) {
    var sql = `SELECT username, displayname, imageURL FROM users WHERE username = ?;`;
    var params = [username];
    mainDB.execute(sql, params, (err, rows) => {
        if (err) throw err;
        if (callback) {
            if (rows.length === 1)
                callback(rows[0]);
            else
                callback(null);
        }
    });
}

function isBlocked(username1, username2, callback) {
    var sql = `
        SELECT id1, id2 FROM blockedUsers WHERE id1 = (
            SELECT id FROM users WHERE username = ?
        ) AND id2 = (
            SELECT id FROM users WHERE username = ?
        );`;
    var params = [username1, username2];
    mainDB.execute(sql, params, (err, rows) => {
        if (err) throw err;
        if (callback) callback(rows.length > 0);
    });
}

function blockUser(username1, username2) {
    isBlocked(username1, username2, (res) => {
        if (!res) {
            var sql = `
                INSERT INTO blockedUsers (id1, id2, blockTimestamp) VALUES (
                    (SELECT id FROM users WHERE username = ?),
                    (SELECT id FROM users WHERE username = ?),
                    ?
                );`;
            var params = [username1, username2, getTime()];
            mainDB.execute(sql, params, (err, rows) => {
                if (err) throw err;
            });
        }
    });
}

function unblockUser(username1, username2) {
    var sql = `
        DELETE FROM blockedUsers WHERE id1 = (
            SELECT id FROM users WHERE username = ?
        ) AND id2 = (
            SELECT id FROM users WHERE username = ?
        );`;
    var params = [username1, username2];
    mainDB.execute(sql, params, (err, rows) => {
        if (err) throw err;
    });
}

function getBlockedUsers(username, callback) {
    var sql = `
        SELECT username, displayname, imageURL FROM users JOIN (
            SELECT id2 FROM blockedUsers WHERE id1 = (
                SELECT id FROM users WHERE username = ?
            )
        ) blockedUsers1 ON users.id = blockedUsers1.id2;`;
    var params = [username];
    mainDB.execute(sql, params, (err, rows) => {
        if (err) throw err;
        if (callback) callback(rows);
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
        SELECT users.id, username, displayname, imageURL FROM users JOIN (
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

function checkIsFriend(username, friendUsername, callback) {
    var sql = `
        SELECT id1, id2 FROM friends WHERE id1 = (
            SELECT id FROM users WHERE username = ?
        ) AND id2 = (
            SELECT id FROM users WHERE username = ?
        );`;
    var params = [username, friendUsername];
    mainDB.execute(sql, params, (err, rows) => {
        if (err) throw err;
        if (callback) callback(rows.length > 0);
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
    removeIncomingFriendRequest(username2, username1);
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
        if (callback) {
            if (rows.length > 0)
                callback(rows[0].roomid);
            else
                callback(null);
        }
    });
}

function getOtherDMMemberUsername(roomID, username, callback) {
    var sql = `
        SELECT username FROM users JOIN (
            SELECT userid, roomid FROM roomUsers WHERE roomid = ? AND userid != (
                SELECT id FROM users WHERE username = ?
            )
        ) roomUsers1 ON users.id = roomUsers1.userid JOIN (
            SELECT id FROM rooms WHERE id = ? AND roomType = ?
        ) rooms1 ON roomUsers1.roomid = rooms1.id;`;
    var params = [roomID, username, roomID, dmRoomType];
    mainDB.execute(sql, params, (err, rows) => {
        if (err) throw err;
        if (callback) {
            if (rows.length > 0)
                callback(rows[0].username);
            else
                callback(null);
        }
    });
}

function createRoom(creatorUsername, roomType, name, callback) {
    var sql = `
        INSERT INTO rooms (
            creatorid, roomType, name, imageURL, createTimestamp, updateTimestamp
        ) VALUES (
            (SELECT id FROM users WHERE username = ?),
            ?,
            ?,
            ?,
            ?,
            ?
        );`;
    var now = getTime();
    var params = [creatorUsername, roomType, name, defaultRoomImageURL, now, now];
    var sqlAfter = `SELECT id FROM rooms ORDER BY id DESC LIMIT 1;`;
    mainDB.executeAfter(sql, params, (err, rows) => {
        if (err) throw err;
    }, sqlAfter, [], (err, rows) => {
        if (err) throw err;
        if (callback && rows.length === 1) callback(rows[0].id);
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

function addToRoom(roomID, username, callback) {
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
                if (callback) callback();
            });
        }
    })
}

function removeFromRoom(roomID, username, callback) {
    var sql = `
        DELETE FROM roomUsers WHERE roomid = ? AND userid = (
            SELECT id FROM users WHERE username = ?
        );`;
    var params = [roomID, username];
    mainDB.execute(sql, params, (err, rows) => {
        if (err) throw err;
        if (callback) callback();
    });
}

function getRoomName(roomID, callback) {
    var sql = `SELECT name FROM rooms WHERE id = ?;`;
    var params = [roomID];
    mainDB.execute(sql, params, (err, rows) => {
        if (err) throw err;
        if (callback && rows.length === 1) callback(rows[0].name);
    });
}

function setRoomName(roomID, name) {
    var sql = `UPDATE rooms SET name = ? WHERE id = ?;`;
    var params = [name, roomID];
    mainDB.execute(sql, params, (err, rows) => {
        if (err) throw err;
    });
}

function getRoomImage(roomID, callback) {
    var sql = `SELECT imageURL FROM rooms WHERE id = ?;`;
    var params = [roomID];
    mainDB.execute(sql, params, (err, rows) => {
        if (err) throw err;
        if (callback && rows.length === 1) callback(rows[0].imageURL);
    });
}

function setRoomImage(roomID, imageURL) {
    var sql = `UPDATE rooms SET imageURL = ? WHERE id = ?;`;
    var params = [imageURL, roomID];
    mainDB.execute(sql, params, (err, rows) => {
        if (err) throw err;
    });
}

function getRoomInfo(roomID, callback) {
    var sql = `SELECT * FROM rooms WHERE id = ?;`;
    var params = [roomID];
    mainDB.execute(sql, params, (err, rows) => {
        if (err) throw err;
        if (callback && rows.length === 1) callback(rows[0]);
    });
}

function getRooms(username, callback) {
    var sql = `
        SELECT * FROM (
            SELECT rooms1.id, roomType, updateTimestamp, name, imageURL, lastRead FROM (
                SELECT id, roomType, updateTimestamp, name, imageURL FROM rooms WHERE roomType != ?
            ) rooms1 JOIN (
                SELECT roomid, lastRead FROM roomUsers WHERE userid = (
                    SELECT id FROM users WHERE username = ?
                )
            ) roomUsers1 ON rooms1.id = roomUsers1.roomid
            UNION
            SELECT rooms2.id, roomType, updateTimestamp, name, imageURL, lastRead FROM (
                SELECT id, roomType, updateTimestamp FROM rooms WHERE roomType = ?
            ) rooms2 JOIN (
                SELECT roomid, userid, lastRead FROM roomUsers WHERE userid = (
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
        SELECT users.id, username, displayname, imageURL FROM users JOIN (
            SELECT userid, roomid, joinTimestamp FROM roomUsers WHERE roomid = ?
        ) roomUsers1 ON users.id = roomUsers1.userid ORDER BY roomUsers1.joinTimestamp ASC;`;
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

function getRoomType(roomID, callback) {
    var sql = `SELECT roomType FROM rooms WHERE id = ?;`;
    var params = [roomID];
    mainDB.execute(sql, params, (err, rows) => {
        if (err) throw err;
        if (callback) {
            if (rows.length === 0) {
                callback(null);
            } else {
                callback(rows[0].roomType);
            }
        }
    });
}

function getRoomCreator(roomID, callback) {
    var sql = `
        SELECT username FROM users JOIN (
            SELECT roomid, userid FROM roomUsers WHERE roomid = ?
        ) roomUsers1 ON users.id = roomUsers1.userid JOIN (
            SELECT id, creatorid FROM rooms WHERE id = ?
        ) rooms1 ON roomUsers1.roomid = rooms1.id AND users.id = rooms1.creatorid;`;
    var params = [roomID, roomID];
    mainDB.execute(sql, params, (err, rows) => {
        if (err) throw err;
        if (callback) {
            if (rows.length === 1)
                callback(rows[0].username);
            else
                callback(null);
        }
    });
}

function isRoomCreator(username, roomID, callback) {
    getRoomCreator(roomID, (creatorUsername) => {
        callback(username === creatorUsername);
    });
}

function reassignCreator(roomID) {
    var sql = `UPDATE rooms SET creatorid = (
        SELECT userid FROM roomUsers WHERE roomid = ? ORDER BY joinTimestamp ASC LIMIT 1
    ) WHERE id = ?;`;
    var params = [roomID, roomID];
    mainDB.execute(sql, params, (err, rows) => {
        if (err) throw err;
    });
}

function deleteRoomIfEmpty(roomID, callback) {
    var sql = `SELECT userid FROM roomUsers WHERE roomid = ?`;
    var params = [roomID];
    mainDB.execute(sql, params, (err, rows) => {
        if (err) throw err;
        if (rows.length === 0) {
            sql = `DELETE FROM rooms WHERE id = ?`;
            params = [roomID];
            mainDB.execute(sql, params, (err, rows) => {
                if (err) throw err;
                callback(true);
            });
        } else {
            callback(false);
        }
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
        if (callback && rows.length === 1) callback(rows[0]);
    });
}

function getMessages(roomID, size, callback) {
    var sql = `
        SELECT roomMessages.id, text, username, displayname, imageURL, roomid, createTimestamp timestamp FROM users JOIN (
            SELECT id, text, userid, roomid, createTimestamp FROM messages WHERE roomid = ? ORDER BY createTimestamp DESC LIMIT ?
        ) roomMessages ON users.id = roomMessages.userid ORDER BY createTimestamp ASC;`;
    var params = [roomID, size];
    mainDB.execute(sql, params, (err, rows) => {
        if (err) throw err;
        if (callback) callback(rows);
    });
}

function getMoreMessages(roomID, size, loadedMessages, callback) {
    var sql = `
        SELECT roomMessages.id, text, username, displayname, imageURL, roomid, createTimestamp timestamp FROM users JOIN (
            SELECT id, text, userid, roomid, createTimestamp FROM messages WHERE id NOT IN (
                SELECT id FROM messages WHERE roomid = ? ORDER BY createTimestamp DESC LIMIT ?
            ) AND roomid = ? LIMIT ?
        ) roomMessages ON users.id = roomMessages.userid ORDER BY createTimestamp DESC;`;
    var params = [roomID, loadedMessages, roomID, size];
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

function canManageMessage(username, messageID, callback) {
    var sql = `
        SELECT id FROM messages WHERE userid = (
            SELECT id FROM users WHERE username = ?
        ) AND id = ?;`;
    var params = [username, messageID];
    mainDB.execute(sql, params, (err, rows) => {
        if (err) throw err;
        if (callback) callback(rows.length === 1);
    });
}

function getMessageInfo(messageID, callback) {
    var sql = `
        SELECT text, createTimestamp, username, displayname, imageURL FROM (
            SELECT text, userid, createTimestamp FROM messages WHERE id = ?
        ) messages1 JOIN users ON messages1.userid = users.id;`;
    var params = [messageID];
    mainDB.execute(sql, params, (err, rows) => {
        if (err) throw err;
        if (callback) callback(rows[0]);
    });
}

function editMessage(messageID, messageContent, callback) {
    var sql = `UPDATE messages SET text = ? WHERE id = ?;`;
    var params = [messageContent, messageID];
    mainDB.execute(sql, params, (err, rows) => {
        if (err) throw err;
        if (callback) callback();
    });
}

function deleteMessage(messageID, callback) {
    var sql = `DELETE FROM messages WHERE id = ?;`;
    var params = [messageID];
    mainDB.execute(sql, params, (err, rows) => {
        if (err) throw err;
        if (callback) callback();
    });
}

function roomOfMessage(messageID, callback) {
    var sql = `SELECT roomid FROM messages WHERE id = ?;`;
    var params = [messageID];
    mainDB.execute(sql, params, (err, rows) => {
        if (err) throw err;
        if (callback) callback(rows[0].roomid);
    });
}

function readMessage(username, roomID) {
    var sql = `
        UPDATE roomUsers SET lastRead = ? WHERE userid = (
            SELECT id FROM users WHERE username = ?
        ) AND roomid = ?;`;
    var params = [getTime(), username, roomID];
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
    var sql = `
        SELECT username FROM users JOIN (
            SELECT email FROM passwordReset WHERE resetid = ?
        ) passwordReset1 ON users.email = passwordReset1.email`;
    var params = [passwordResetID];
    mainDB.execute(sql, params, (err, rows) => {
        if (err) throw err;
        if (rows.length === 1) {
            setUserPassword(rows[0].username, newPassword);
            sql = `DELETE FROM passwordReset WHERE resetid = ?`;
            mainDB.execute(sql, params, (err, rows) => {
                if (err) throw err;
            });
        }
    });
}

function verifyLogin(username, password, callback) {
    var sql = `SELECT username, password FROM users WHERE username = ? OR email = ?;`;
    var params = [username, username];
    mainDB.execute(sql, params, (err, rows) => {
        if (err) throw err;
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
                    if (callback) callback(true, rows[0].username);
                } else if (callback) {
                    callback(false);
                }
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
    'userExists': userExists,
    'getUserInfo': getUserInfo,
    'isBlocked': isBlocked,
    'blockUser': blockUser,
    'unblockUser': unblockUser,
    'getBlockedUsers': getBlockedUsers,
    'addFriend': addFriend,
    'removeFriend': removeFriend,
    'getFriends': getFriends,
    'checkIsFriend': checkIsFriend,
    'getIncomingFriendRequests': getIncomingFriendRequests,
    'acceptIncomingFriendRequest': acceptIncomingFriendRequest,
    'removeIncomingFriendRequest': removeIncomingFriendRequest,
    'getOutgoingFriendRequests': getOutgoingFriendRequests,
    'newOutgoingFriendRequest': newOutgoingFriendRequest,
    'removeOutgoingFriendRequest': removeOutgoingFriendRequest,
    'getDMRoomID': getDMRoomID,
    'getOtherDMMemberUsername': getOtherDMMemberUsername,
    'createRoom': createRoom,
    'deleteRoom': deleteRoom,
    'addToRoom': addToRoom,
    'removeFromRoom': removeFromRoom,
    'getRoomName': getRoomName,
    'setRoomName': setRoomName,
    'getRoomImage': getRoomImage,
    'setRoomImage': setRoomImage,
    'getRoomInfo': getRoomInfo,
    'getRooms': getRooms,
    'getUsersInRoom': getUsersInRoom,
    'userInRoom': userInRoom,
    'getRoomType': getRoomType,
    'getRoomCreator': getRoomCreator,
    'isRoomCreator': isRoomCreator,
    'reassignCreator': reassignCreator,
    'deleteRoomIfEmpty': deleteRoomIfEmpty,
    'getDMImage': getDMImage,
    'getMessages': getMessages,
    'getMoreMessages': getMoreMessages,
    'createMessage': createMessage,
    'canManageMessage': canManageMessage,
    'getMessageInfo': getMessageInfo,
    'editMessage': editMessage,
    'deleteMessage': deleteMessage,
    'roomOfMessage': roomOfMessage,
    'readMessage': readMessage,
    'emailExists': emailExists,
    'newPasswordResetID': newPasswordResetID,
    'checkPasswordResetID': checkPasswordResetID,
    'resetPassword': resetPassword,
    'verifyLogin': verifyLogin,
    'dmRoomType': dmRoomType,
    'normalRoomType': normalRoomType,
    'defaultRoomName': defaultRoomName,
    'defaultUserImageURL': defaultUserImageURL,
    'defaultRoomImageURL': defaultRoomImageURL
};

init();
