const url = window.location.host;

var username = localStorage.getItem(localUsername);
var password = localStorage.getItem(localPassword);

var loaded = false;

var socket;

function onEnter() {
    if (event.keyCode === 13) {
        sendMessage();
    }
}

function sendMessage() {
    var mainInput = document.getElementById('main-input');
    socket.emit('newMessage', { 'text': mainInput.value, 'username': username, 'password': password });
    mainInput.value = '';
}

function main() {
    document.getElementById('main-input').setAttribute('onkeydown', 'onEnter();');
    // emit events for getting friends, rooms, messages, etc.
    // set socket.on events for receiving new messages, adding/removing rooms, etc.
}

function start() {
    if (username === null || password === null) {
        window.location.replace('/login/');
    } else {
        socket = io.connect(url, { secure: true });
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
