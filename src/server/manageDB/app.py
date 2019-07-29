from flask import Flask, render_template, request
import sqlite3
import time

app = Flask(__name__)

sqlFilename = "../db/main.db"
cmdLogfile = "history.log"

def logCommand(command):
    if cmdLogfile is not None:
        with open(cmdLogfile, "a") as f:
            timestamp = time.ctime()
            f.write("[{}] {}\n".format(timestamp, command))

@app.route("/", methods=["GET", "POST"])
def index():
    if request.method == "GET":
        return render_template("index.html")
    else:
        stmt = request.form.get("stmt")
        logCommand(stmt)
        conn = sqlite3.connect(sqlFilename)
        c = conn.cursor()
        try:
            if stmt.strip().lower().startswith("select"):
                c.execute("SELECT * FROM (" + stmt.replace(";", "") + ") WHERE 1=0;")
                columns = [col[0] for col in c.description]
                c.execute(stmt)
                rows = c.fetchall()
                conn.close()
                return render_template("index.html", columns=columns, rows=rows, status="Command executed successfully", command=stmt)
            else:
                c.execute(stmt)
                conn.commit()
                conn.close()
                return render_template("index.html", status="Command executed successfully", command=stmt)
        except Exception as e:
            return render_template("index.html", status=e.args[0])
