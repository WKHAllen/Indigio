import os
import webbrowser

def main():
    webbrowser.open("http://127.0.0.1:5000")
    os.environ["FLASK_APP"] = "app.py"
    os.environ["FLASK_ENV"] = "development"
    try:
        os.system("python -m flask run")
    except KeyboardInterrupt:
        pass

if __name__ == "__main__":
    main()
