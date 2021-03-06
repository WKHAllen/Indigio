function showError(msg) {
    var errorText = document.getElementById('error-text');
    errorText.innerText = msg;
    errorText.classList.remove('invisible');
}

function getUsername() {
    var username = stripWhitespace(document.getElementById('username').value);
    return username;
}

function getPassword() {
    var password = document.getElementById('password').value;
    return password;
}

function login() {
    document.getElementById('login-button').disabled = true;
    var username = getUsername();
    var password = getPassword();
    var socket = io.connect(url, { secure: true });
    socket.emit('login', { 'username': username, 'password': password });
    socket.on('validLogin', (data) => {
        if (data.res) {
            localStorage.setItem(localUsername, data.username);
            localStorage.setItem(localPassword, password);
            window.location.replace('/');
        } else {
            showError('Error: login is invalid.');
            document.getElementById('login-button').disabled = false;
        }
        socket.disconnect();
    });
}

function onEnter() {
    if (event.keyCode === 13) {
        login();
    }
}
