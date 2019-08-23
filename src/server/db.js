const { Pool } = require('pg');

class DB {
    constructor(dbURL) {
        this.pool = new Pool({
            connectionString: dbURL,
            // ssl: true,
            max: 1
        });
    }

    execute(stmt, params, callback) {
        var paramCount = 0;
        while (stmt.includes('?')) {
            stmt = stmt.replace('?', `$${++paramCount}`);
        }
        this.pool.connect((err, client, release) => {
            if (err) throw err;
            client.query(stmt, params, (err, res) => {
                release();
                if (err) {
                    console.log('\n\n######### ERROR #########\n\n');
                    console.log('\nStatement:');
                    console.log(stmt);
                    console.log('\nResponse: ');
                    console.log(res);
                    console.log('\nError:');
                    throw err;
                }
                if (callback) callback(err, res.rows);
            });
        });
    }

    executeAfter(stmt, params, callback, afterStmt, afterParams, afterCallback) {
        var paramCount = 0;
        while (stmt.includes('?')) {
            stmt = stmt.replace('?', `$${++paramCount}`);
        }
        paramCount = 0;
        while (afterStmt.includes('?')) {
            afterStmt = afterStmt.replace('?', `$${++paramCount}`);
        }
        this.pool.connect((err, client, release) => {
            if (err) throw err;
            client.query(stmt, params, (err, res) => {
                if (callback) callback(err, res.rows);
            });
            client.query(afterStmt, afterParams, (err, res) => {
                release();
                if (callback) callback(err, res.rows);
            });
        });
    }

    executeMany(stmts, callback) {
        this.pool.connect((err, client, release) => {
            if (err) throw err;
            for (let stmt of stmts) {
                client.query(stmt, (err, res) => {
                    if (callback) callback(err, res.rows);
                });
            }
            release();
        });
    }
}

module.exports = {
    'DB': DB
}

/*
const sqlite3 = require('sqlite3').verbose();

const busyTimeout = 1000;

class DB {
    constructor(filename) {
        this.filename = filename;
        this.queueSize = 0;
        this.served = 0;
    }

    execute(stmt, params, callback) {
        var currentQueueSize = this.queueSize++;
        var currentServed = this.served;
        while (currentServed + currentQueueSize < this.served) {} // wait until at the front of the queue
        var db = new sqlite3.Database(this.filename);
        db.configure('busyTimeout', busyTimeout);
        db.all(stmt, params, (err, rows) => {
            if (callback)
                callback(err, rows);
        });
        db.close();
        this.queueSize--;
        this.served++;
    }

    executeAfter(stmt, params, callback, afterStmt, afterParams, afterCallback) {
        var currentQueueSize = this.queueSize++;
        var currentServed = this.served;
        while (currentServed + currentQueueSize < this.served) {} // wait until at the front of the queue
        var db = new sqlite3.Database(this.filename);
        db.configure('busyTimeout', busyTimeout);
        db.serialize(() => {
            db.all(stmt, params, (err, rows) => {
                if (callback)
                    callback(err, rows);
            });
            db.all(afterStmt, afterParams, (err, rows) => {
                if (afterCallback)
                    afterCallback(err, rows);
            });
        });
        db.close();
        this.queueSize--;
        this.served++;
    }

    executeMany(stmts, callback) {
        var currentQueueSize = this.queueSize++;
        var currentServed = this.served;
        while (currentServed + currentQueueSize < this.served) {} // wait until at the front of the queue
        var db = new sqlite3.Database(this.filename);
        db.configure('busyTimeout', busyTimeout);
        db.serialize(() => {
            for (let stmt of stmts) {
                db.all(stmt, [], (err, rows) => {
                    if (callback)
                        callback(err, rows);
                });
            }
        });
        db.close();
        this.queueSize--;
        this.served++;
    }
}

module.exports = {
    'DB': DB
}
*/
