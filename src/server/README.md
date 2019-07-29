# Indigio Server

This directory contains the server side of the project. The front-end code is here as well, in the `public` directory. It is kept here and not in `../client` so that if a change to the front-end is made, clients won't have to reinstall anything. Instead the front-end code is served by the server, using Node's `express` module.

## Usage

First, install the requirements using npm:

```console
$ npm install
```

Then run it:

```console
$ npm start
```
