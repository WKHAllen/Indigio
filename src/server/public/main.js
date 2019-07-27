var username = localStorage.getItem(localUsername);
var password = localStorage.getItem(localPassword);

var loaded = false;

function main() {
    document.getElementById('username').innerHTML = username;
}

function start() {
    if (username === null || password === null) {
        window.location.replace('/login/');
    } else {
        var socket = io.connect('localhost');
        // do key exchange
        socket.emit('login', { 'username': username, 'password': password });
        socket.on('validLogin', (data) => {
            if (!data.res) {
                window.location.replace('/login/');
            } else {
                if (loaded) {
                    main();
                } else {
                    window.addEventListener('load', main);
                }
            }
        });
    }
}

window.addEventListener('load', () => {
    loaded = true;
})

start();
