const url = window.location.host;

var username = localStorage.getItem(localUsername);
var password = localStorage.getItem(localPassword);

var loaded = false;

function main(socket) {
    document.getElementById('username').innerHTML = username;
    // main application (get friends, DMs, messages, etc.)
}

function start() {
    if (username === null || password === null) {
        window.location.replace('/login/');
    } else {
        var socket = io.connect(url);
        // do key exchange
        socket.emit('login', { 'username': username, 'password': password });
        socket.on('validLogin', (data) => {
            if (!data.res) {
                window.location.replace('/login/');
            } else {
                if (loaded) {
                    main(socket);
                } else {
                    window.addEventListener('load', (socket) => { main(socket); });
                }
            }
        });
    }
}

window.addEventListener('load', () => {
    loaded = true;
})

start();
