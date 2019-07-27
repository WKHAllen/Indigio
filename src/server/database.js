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
        if (err) throw err;
        if (callback)
            callback(rows);
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
    execute(db, sql, params, (rows) => {
        if (rows.length > 0) {
            closeDB(db);
            callback(false);
        } else {
            bcrypt.hash(password, saltRounds, (err, hash) => {
                if (err) throw err;
                sql = `INSERT INTO users (username, displayname, email, password, joinTimestamp) VALUES (?, ?, ?, ?, ?);`;
                params = [username, displayname, email, hash, getTime()];
                execute(db, sql, params);
                closeDB(db);
                callback(true);
            });
        }
    });
}

function verifyLogin(username, password, callback) {
    var db = openDB();
    var sql = `SELECT password FROM users WHERE username = ?`;
    var params = [username];
    execute(db, sql, params, (rows) => {
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
                    execute(db, sql, params);
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
    'verifyLogin': verifyLogin,
}

init();
