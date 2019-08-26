# Database Manager

This is a small Python script that exposes the database to developers. It is designed to make debugging and testing easier.

This script is now obsolete, as the database has been moved to Heroku, and runs on PostgreSQL rather than SQLite.

## Usage

To use it, simply run the following command:

```console
$ python manageDB.py
```

A local webserver will run on port 5000, and the database management page will be opened in the default browser.

## Requirements

The database manager requires [Flask](https://palletsprojects.com/p/flask/) to create and host the webpage.
