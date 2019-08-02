const url = window.location.host;

var username = localStorage.getItem(localUsername);
var password = localStorage.getItem(localPassword);

function stripWhitespace(str) {
    return str.replace(/^\s+|\s+$/g, '');
}

function onEnterClick(buttonID) {
    if (event.keyCode === 13) {
        document.getElementById(buttonID).click();
    }
}

function setDisplayname() {
    document.getElementById('displayname-button').disabled = true;
    var displayname = stripWhitespace(document.getElementById('displayname').value);
    var status = document.getElementById('displayname-status');
    status.style.color = 'var(--primary-text-color)';
    status.innerHTML = 'Changing name...';
    var socket = io.connect(url, { secure: true });
    socket.emit('login', { 'username': username, 'password': password });
    socket.on('validLogin', (data) => {
        if (data.res) {
            socket.emit('setDisplayname', { 'displayname': displayname });
            status.style.color = 'var(--success-text-color)';
            status.innerHTML = 'Name change successful';
            document.getElementById('displayname-label').innerHTML = displayname;
        } else {
            status.style.color = 'var(--error-text-color)';
            status.innerHTML = 'Failed to change name';
        }
        document.getElementById('displayname-button').disabled = false;
        socket.disconnect();
    });
}

function setImage() {
    document.getElementById('image-button').disabled = true;
    var image = stripWhitespace(document.getElementById('image').value);
    var status = document.getElementById('image-status');
    status.style.color = 'var(--primary-text-color)';
    status.innerHTML = 'Changing image URL...';
    var socket = io.connect(url, { secure: true });
    socket.emit('login', { 'username': username, 'password': password });
    socket.on('validLogin', (data) => {
        if (data.res) {
            socket.emit('setImage', { 'image': image });
            status.style.color = 'var(--success-text-color)';
            status.innerHTML = 'Image URL change successful';
            document.getElementById('image-label').innerHTML = `<img src="${image}" width="32" height="32">`;
        } else {
            status.style.color = 'var(--error-text-color)';
            status.innerHTML = 'Failed to change image URL';
        }
        document.getElementById('image-button').disabled = false;
        socket.disconnect();
    });
}

function setPassword() {
    var pass = document.getElementById('password').value;
    var passConfirm = document.getElementById('password-confirm').value;
    if (pass !== passConfirm) {
        status.style.color = 'var(--error-text-color)';
        status.innerHTML = 'Passwords do not match';
        return;
    } else {
        var res = pass.match(/^.{8,64}$/g);
        if (res === null) {
            status.style.color = 'var(--error-text-color)';
            status.innerHTML = 'Password must be between 8 and 64 characters';
            return;
        }
    }
    document.getElementById('password-button').disabled = true;
    var status = document.getElementById('password-status');
    status.style.color = 'var(--primary-text-color)';
    status.innerHTML = 'Changing password...';
    var socket = io.connect(url, { secure: true });
    socket.emit('login', { 'username': username, 'password': password });
    socket.on('validLogin', (data) => {
        if (data.res) {
            socket.emit('setPassword', { 'password': pass });
            status.style.color = 'var(--success-text-color)';
            status.innerHTML = 'Password change successful';
            localStorage.setItem(localPassword, pass);
        } else {
            status.style.color = 'var(--error-text-color)';
            status.innerHTML = 'Failed to change password';
        }
        document.getElementById('password-button').disabled = false;
        socket.disconnect();
    });
}

function done() {
    window.location.replace('..');
}

function populateOptions() {
    document.getElementById('username-label').innerHTML = username;
    var socket = io.connect(url, { secure: true });
    socket.emit('login', { 'username': username, 'password': password });
    socket.on('validLogin', (data) => {
        if (data.res) {
            // get display name
            socket.emit('getDisplayname');
            socket.on('returnDisplayname', (data) => {
                document.getElementById('displayname-label').innerHTML = data.displayname;
                document.getElementById('displayname').value = data.displayname;
                // get image URL
                socket.emit('getImage');
                socket.on('returnImage', (data) => {
                    document.getElementById('image-label').innerHTML = `<img src="${data.image}" width="32" height="32">`;
                    document.getElementById('image').value = data.image;
                    socket.disconnect();
                });
            });
        } else {
            socket.disconnect();
        }
    });
}

window.addEventListener('load', populateOptions);
