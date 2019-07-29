const url = window.location.host;

function showError(msg) {
    var errorText = document.getElementById('error-text');
    errorText.innerHTML = msg;
    errorText.classList.remove('invisible');
}

function stripWhitespace(str) {
    return str.replace(/^\s+|\s+$/g, '');
}

function getUsername() {
    var username = stripWhitespace(document.getElementById('username').value);
    var res = username.match(/^\w{3,32}$/g);
    if (res !== null) {
        return username;
    } else {
        showError('Error: username must be between 3 and 32 characters, and can only contain letters, numbers, and underscores.');
        return null;
    }
}

function getPassword() {
    var password = document.getElementById('password').value;
    return password;
}

function login() {
    document.getElementById('login-button').disabled = true;
    var username = getUsername();
    if (username === null) return;
    var password = getPassword();
    var socket = io.connect(url);
    // do key exchange
    socket.emit('login', { 'username': username, 'password': password });
    socket.on('validLogin', (data) => {
        if (data.res) {
            localStorage.setItem(localUsername, username);
            localStorage.setItem(localPassword, password);
            window.location.replace('..');
        } else {
            showError('Error: login is invalid.');
            document.getElementById('login-button').disabled = false;
        }
    });
}

function onEnter() {
    if (event.keyCode === 13) {
        login();
    }
}
