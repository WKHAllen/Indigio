var passwordResetID = new URLSearchParams(window.location.search).get('resetID') || null;

function showError(msg) {
    var errorText = document.getElementById('error-text');
    errorText.innerText = msg;
    errorText.classList.remove('invisible');
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
    var passwordConfirm = document.getElementById('confirm-password').value;
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

function reset() {
    document.getElementById('reset-button').disabled = true;
    var email = getEmail();
    if (email === null) return;
    var socket = io.connect(url, { secure: true });
    socket.emit('passwordReset', { 'email': email });
    socket.on('validPasswordReset', (data) => {
        if (data.res) {
            socket.disconnect();
            window.location.replace('/');
        } else {
            showError('Email address is not registered');
            document.getElementById('reset-button').disabled = false;
            socket.disconnect();
        }
    });
}

function onEnter() {
    if (event.keyCode === 13) {
        reset();
    }
}

function passwordReset() {
    var password = getPassword();
    if (password === null) return;
    var socket = io.connect(url, { secure: true });
    socket.emit('checkPasswordResetID', { 'passwordResetID': passwordResetID });
    socket.on('validPasswordResetID', (data) => {
        if (data.res) {
            socket.emit('resetPassword', { 'newPassword': password });
            socket.disconnect();
            window.location.replace('/');
        } else {
            socket.disconnect();
        }
    });
}

function onResetEnter() {
    if (event.keyCode === 13) {
        passwordReset();
    }
}

function setInvisible(elementID) {
    document.getElementById(elementID).classList.add('invisible');
}

function setVisible(elementID) {
    document.getElementById(elementID).classList.remove('invisible');
}

function main() {
    if (passwordResetID !== null) {
        var socket = io.connect(url, { secure: true });
        socket.emit('checkPasswordResetID', { 'passwordResetID': passwordResetID });
        socket.on('validPasswordResetID', (data) => {
            if (data.res) {
                setInvisible('reset-info-1');
                setInvisible('email-label');
                setInvisible('email');
                setVisible('reset-info-2');
                setVisible('password-label');
                setVisible('password');
                setVisible('confirm-password-label');
                setVisible('confirm-password');
                document.getElementById('reset-button').setAttribute('onclick', 'passwordReset();');
            }
            socket.disconnect();
        });
    }
}

window.addEventListener('load', main);
