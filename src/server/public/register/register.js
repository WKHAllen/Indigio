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

function getDisplayname() {
    var displayname = stripWhitespace(document.getElementById('displayname').value);
    var res = displayname.match(/^\w{3,32}$/g);
    if (res !== null) {
        return displayname;
    } else {
        showError('Error: display name must be between 3 and 32 characters, and can only contain letters, numbers, and underscores.');
        return null;
    }
}

function getEmail() {
    var email = stripWhitespace(document.getElementById('email').value);
    var res = email.match(/^([A-Za-z0-9.]+)@([a-z0-9]+)\.([a-z]+)$/g);
    if (res !== null) {
        return email;
    } else {
        showError('Error: email address is invalid.');
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
            showError('Error: password must be between 8 and 64 characters.');
            return null;
        }
    } else {
        showError('Error: passwords do not match');
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
    var socket = io.connect('localhost');
    // do key exchange
    socket.emit('register', { 'username': username, 'displayname': displayname, 'email': email, 'password': password });
    socket.on('validRegistration', (data) => {
        if (data.res) {
            localStorage.setItem(localUsername, username);
            localStorage.setItem(localPassword, password);
            window.location.replace('..');
        } else {
            showError('Error: username or email address is already in use.');
            document.getElementById('register-button').disabled = false;
        }
    });
}

function onEnter() {
    if (event.keyCode === 13) {
        register();
    }
}
