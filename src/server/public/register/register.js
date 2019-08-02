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
        showError('Dsername must be between 3 and 32 characters, and can only contain letters, numbers, and underscores');
        return null;
    }
}

function getDisplayname() {
    var displayname = stripWhitespace(document.getElementById('displayname').value);
    var res = displayname.match(/^\w{3,32}$/g);
    if (res !== null) {
        return displayname;
    } else {
        showError('Display name must be between 3 and 32 characters, and can only contain letters, numbers, and underscores');
        return null;
    }
}

function getEmail() {
    var email = stripWhitespace(document.getElementById('email').value);
    var res = email.match(/^([A-Za-z0-9.]+)@([a-z0-9]+)\.([a-z]+)$/g);
    if (res !== null) {
        return email;
    } else {
        showError('Email address is invalid');
        return null;
    }
}

function getPassword() {
    var password = document.getElementById('password').value;
    var passwordConfirm = document.getElementById('password-confirm').value;
    if (password === passwordConfirm) {
        var res = password.match(/^.{8,64}$/g);
        if (res !== null) {
            return password;
        } else {
            showError('Password must be between 8 and 64 characters');
            return null;
        }
    } else {
        showError('Passwords do not match');
        return null;
    }
}

function register() {
    document.getElementById('register-button').disabled = true;
    var username = getUsername();
    if (username === null) return;
    var displayname = getDisplayname();
    if (displayname === null) return;
    var email = getEmail();
    if (email === null) return;
    var password = getPassword();
    if (password === null) return;
    var socket = io.connect(url, { secure: true });
    socket.emit('register', { 'username': username, 'displayname': displayname, 'email': email, 'password': password });
    socket.on('validRegistration', (data) => {
        if (data.res) {
            localStorage.setItem(localUsername, username);
            localStorage.setItem(localPassword, password);
            window.location.replace('..');
        } else {
            showError('Username or email address is already in use');
            document.getElementById('register-button').disabled = false;
        }
        socket.disconnect();
    });
}

function onEnter() {
    if (event.keyCode === 13) {
        register();
    }
}
