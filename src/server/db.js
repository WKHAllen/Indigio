const sqlite3 = require('sqlite3').verbose();

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
        db.configure('busyTimeout', 1);
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
}

module.exports = {
    'DB': DB
}
