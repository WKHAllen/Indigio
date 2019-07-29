const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const bcrypt = require('bcrypt');

const dbDir = 'db';
const dbFile = path.join(dbDir, 'main.db');
const saltRounds = 14;

function getTime() {
    return Math.floor(new Date().getTime() / 1000);
}

function openDB() {
    return new sqlite3.Database(path.join(__dirname, dbFile));
}

function closeDB(db) {
    db.close();
}

function execute(db, stmt, params, callback) {
    db.all(stmt, params, (err, rows) => {
        if (callback)
            callback(err, rows);
    });
}

function executeOne(stmt, callback) {
    var db = openDB();
    execute(db, stmt, [], callback);
    closeDB(db);
}

function executeMany(stmts, callback) {
    var db = openDB();
    db.serialize(() => {
        for (let stmt of stmts)
            execute(db, stmt, [], callback);
    });
    closeDB(db);
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
    executeMany([usersTable, roomsTable, roomUsersTable, messagesTable, friendsTable]);
}

function createUser(username, displayname, email, password, callback) {
    var db = openDB();
    var sql = `SELECT username, email FROM users WHERE username = ? OR email = ?;`;
    var params = [username, email];
    execute(db, sql, params, (err, rows) => {
        if (err) throw err;
        if (rows.length > 0) {
            callback(false);
        } else {
            bcrypt.hash(password, saltRounds, (err, hash) => {
                if (err) throw err;
                sql = `INSERT INTO users (username, displayname, email, password, joinTimestamp) VALUES (?, ?, ?, ?, ?);`;
                params = [username, displayname, email, hash, getTime()];
                execute(db, sql, params, (err, rows) => {
                    if (err) throw err;
                });
                callback(true);
            });
        }
    });
    closeDB(db);
}

function changePassword(username, newPassword) {
    var db = openDB();
    bcrypt.hash(newPassword, saltRounds, (err, hash) => {
        var sql = `UPDATE users SET password = ? WHERE username = ?;`;
        var params = [hash, username];
        execute(db, sql, params, (err, rows) => {
            if (err) throw err;
        });
    });
    closeDB(db);
}

function setUserDisplayname(username, newDisplayname) {
    var db = openDB();
    var sql = `UPDATE users SET displayname = ? WHERE username = ?;`;
    var params = [newDisplayname, username];
    execute(db, sql, params);
    closeDB(db);
}

function setUserImage(username, imageURL) {
    var db = openDB();
    var sql = `UPDATE users SET imageURL = ? WHERE username = ?;`;
    var params = [imageURL, username];
    execute(db, sql, params, (err, rows) => {
        if (err) throw err;
    });
    closeDB(db);
}

function addFriend(username1, username2) {
    var db = openDB();
    var sql = `SELECT id1 FROM friends WHERE id1 = (SELECT id FROM users WHERE username = ?) AND id2 = (SELECT id FROM users WHERE username = ?);`;
    var params = [username1, username2];
    execute(db, sql, params, (err, rows) => {
        if (err) throw err;
        if (rows.length === 0) {
            params = [username2, username1];
            execute(db, sql, params, (err, rows) => {
                if (err) throw err;
                if (rows.length === 0) {
                    var now = getTime();
                    sql = `INSERT INTO friends (id1, id2, addTimestamp) VALUES ((SELECT id FROM users WHERE username = ?), (SELECT id FROM users WHERE username = ?), ?);`;
                    params = [username1, username2, now];
                    execute(db, sql, params, (err, rows) => {
                        if (err) throw err;
                    });
                    params = [username2, username1, now];
                    execute(db, sql, params, (err, rows) => {
                        if (err) throw err;
                    });
                }
            });
        }
    });
    closeDB(db);
}

function removeFriend(username1, username2) {
    var db = openDB();
    var sql = `DELETE FROM friends WHERE id1 = (SELECT id FROM users WHERE username = ?) AND id2 = (SELECT id FROM users WHERE username = ?);`;
    var params = [username1, username2];
    execute(db, sql, params, (err, rows) => {
        if (err) throw err;
    });
    params = [username2, username1];
    execute(db, sql, params, (err, rows) => {
        if (err) throw err;
    });
    closeDB(db);
}

function getFriends(username, callback) {
    var db = openDB();
    var sql = `SELECT username FROM users JOIN (SELECT id2 FROM friends WHERE id1 = (SELECT id FROM users WHERE username = ?)) userfriends ON users.id = userfriends.id2;`;
    var params = [username];
    execute(db, sql, params, callback);
    closeDB(db);
}

function createRoom(roomType, name, callback) {
    // If two rooms are created at the same time, they will both try to use the same ID.
    // So when this happens, an error is thrown, and they will try again.
    // This is not the most perfect solution, but it seems to work without problems.
    var db = openDB();
    var sql = `SELECT id FROM rooms ORDER BY id DESC LIMIT 1;`;
    execute(db, sql, [], (err, rows) => {
        if (err) throw err;
        var roomID = 1;
        if (rows.length > 0) {
            roomID = rows[0].id + 1;
        }
        sql = `INSERT INTO rooms (id, roomType, name, createTimestamp) VALUES (?, ?, ?, ?);`;
        var params = [roomID, roomType, name, getTime()];
        execute(db, sql, params, (err, rows) => {
            if (err) {
                createRoom(roomType, name, callback);
            } else {
                callback(roomID);
            }
        });
    });
    closeDB(db);
}

function deleteRoom(roomID) {
    // delete all associated users from `roomUsers` and all associated messages from `messages`
}

function addToRoom(roomID, username) {
    var db = openDB();
    var sql = `SELECT roomid FROM roomUsers WHERE roomid = ? AND userid = (SELECT id FROM users WHERE username = ?);`;
    var params = [roomID, username2];
    execute(db, sql, params, (err, rows) => {
        if (err) throw err;
        if (rows.length === 0) {
            sql = `INSERT INTO roomUsers (roomid, userid, joinTimestamp) VALUES (?, (SELECT id FROM users WHERE username = ?), ?);`;
            params = [roomID, username, getTime()];
            execute(db, sql, params, (err, rows) => {
                if (err) throw err;
            });
        }
    })
    closeDB(db);
}

function removeFromRoom(roomID, username) {
    var db = openDB();
    var sql = `DELETE FROM roomUsers WHERE roomid = ? AND userid = (SELECT id FROM users WHERE username = ?);`;
    var params = [roomID, username];
    execute(db, sql, params, (err, rows) => {
        if (err) throw err;
    });
    closeDB(db);
}

function setRoomName(roomID, name) {
    var db = openDB();
    var sql = `UPDATE rooms SET name = ? WHERE id = ?;`;
    var params = [name, roomID];
    execute(db, sql, params, (err, rows) => {
        if (err) throw err;
    });
    closeDB(db);
}

function setRoomImage(roomID, imageURL) {
    var db = openDB();
    var sql = `UPDATE rooms SET imageURL = ? WHERE id = ?;`;
    var params = [imageURL, roomID];
    execute(db, sql, params, (err, rows) => {
        if (err) throw err;
    });
    closeDB(db);
}

function getRooms(username, callback) {
    var db = openDB();
    var sql = `SELECT roomid FROM roomUsers WHERE userid = (SELECT id FROM users WHERE username = ?);`;
    var params = [username];
    execute(db, sql, params, (err, rows) => {
        if (err) throw err;
        callback(rows);
    });
    closeDB(db);
}

function getUsersInRoom(roomID, callback) {
    var db = openDB();
    var sql = `SELECT username FROM users WHERE id = (SELECT userid FROM roomUsers WHERE roomid = ?);`;
    var params = [username];
    execute(db, sql, params, (err, rows) => {
        if (err) throw err;
        callback(rows);
    });
    closeDB(db);
}

function verifyLogin(username, password, callback) {
    var db = openDB();
    var sql = `SELECT password FROM users WHERE username = ?;`;
    var params = [username];
    execute(db, sql, params, (err, rows) => {
        if (err) throw err;
        if (rows.length > 1) throw `ERROR: multiple instances of user ${username}`;
        if (rows.length === 0) {
            closeDB(db);
            callback(false);
        } else {
            bcrypt.compare(password, rows[0].password, (err, res) => {
                if (err) throw err;
                if (res) {
                    sql = `UPDATE users SET lastLogin = ? WHERE username = ?;`;
                    params = [getTime(), username];
                    execute(db, sql, params, (err, rows) => {
                        if (err) throw err;
                    });
                }
                closeDB(db);
                callback(res);
            });
        }
    });
}

module.exports = {
    'execute': execute,
    'executeOne': executeOne,
    'executeMany': executeMany,
    'createUser': createUser,
    'changePassword': changePassword,
    'setUserDisplayname': setUserDisplayname,
    'setUserImage': setUserImage,
    'addFriend': addFriend,
    'removeFriend': removeFriend,
    'getFriends': getFriends,
    'createRoom': createRoom,
    'addToRoom': addToRoom,
    'removeFromRoom': removeFromRoom,
    'setRoomName': setRoomName,
    'setRoomImage': setRoomImage,
    'getRooms': getRooms,
    'verifyLogin': verifyLogin
}

init();
