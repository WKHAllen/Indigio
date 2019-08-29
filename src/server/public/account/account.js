function setDisplayname() {
    document.getElementById('displayname-button').disabled = true;
    var displayname = stripWhitespace(document.getElementById('displayname').value);
    var status = document.getElementById('displayname-status');
    status.style.color = 'var(--primary-text-color)';
    status.innerText = 'Changing name...';
    if (displayname.match(/^.{3,32}$/g) !== null) {
        var socket = io.connect(url, { secure: true });
        socket.emit('login', { 'username': username, 'password': password });
        socket.on('validLogin', (data) => {
            if (data.res) {
                socket.emit('setDisplayname', { 'displayname': displayname });
                status.style.color = 'var(--success-text-color)';
                status.innerText = 'Name change successful';
                document.getElementById('displayname-label').innerText = displayname;
            } else {
                status.style.color = 'var(--error-text-color)';
                status.innerText = 'Failed to change name';
            }
            document.getElementById('displayname-button').disabled = false;
            socket.disconnect();
        });
    } else {
        status.style.color = 'var(--error-text-color)';
        status.innerText = 'Display name must be between 3 and 32 characters';
    }
}

function setImage() {
    document.getElementById('image-button').disabled = true;
    var image = stripWhitespace(document.getElementById('image').value);
    var status = document.getElementById('image-status');
    status.style.color = 'var(--primary-text-color)';
    status.innerText = 'Changing image URL...';
    validImageURL(image, (res) => {
        if (res) {
            var socket = io.connect(url, { secure: true });
            socket.emit('login', { 'username': username, 'password': password });
            socket.on('validLogin', (data) => {
                if (data.res) {
                    socket.emit('setImage', { 'image': image });
                    status.style.color = 'var(--success-text-color)';
                    status.innerText = 'Image URL change successful';
                    document.getElementById('image-label').innerHTML = `<img src="${image}" width="32" height="32">`;
                } else {
                    status.style.color = 'var(--error-text-color)';
                    status.innerText = 'Failed to change image URL';
                }
                document.getElementById('image-button').disabled = false;
                socket.disconnect();
            });
        } else {
            status.style.color = 'var(--error-text-color)';
            status.innerText = 'Invalid URL';
            document.getElementById('image-button').disabled = false;
        }
    });
}

function setPassword() {
    var pass = document.getElementById('password').value;
    var passConfirm = document.getElementById('password-confirm').value;
    if (pass !== passConfirm) {
        status.style.color = 'var(--error-text-color)';
        status.innerText = 'Passwords do not match';
        return;
    } else {
        var res = pass.match(/^.{8,64}$/g);
        if (res === null || pass.length < 8 || pass.length > 64) {
            status.style.color = 'var(--error-text-color)';
            status.innerText = 'Password must be between 8 and 64 characters';
            return;
        }
    }
    document.getElementById('password-button').disabled = true;
    var status = document.getElementById('password-status');
    status.style.color = 'var(--primary-text-color)';
    status.innerText = 'Changing password...';
    var socket = io.connect(url, { secure: true });
    socket.emit('login', { 'username': username, 'password': password });
    socket.on('validLogin', (data) => {
        if (data.res) {
            socket.emit('setPassword', { 'password': pass });
            status.style.color = 'var(--success-text-color)';
            status.innerText = 'Password change successful';
            localStorage.setItem(localPassword, pass);
        } else {
            status.style.color = 'var(--error-text-color)';
            status.innerText = 'Failed to change password';
        }
        document.getElementById('password-button').disabled = false;
        socket.disconnect();
    });
}

function populateOptions() {
    document.getElementById('username-label').innerText = username;
    var socket = io.connect(url, { secure: true });
    socket.emit('login', { 'username': username, 'password': password });
    socket.on('validLogin', (data) => {
        if (data.res) {
            // get display name
            socket.emit('getDisplayname');
            socket.on('returnDisplayname', (data) => {
                document.getElementById('displayname-label').innerText = data.displayname;
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
            window.location.replace('/login/');
        }
    });
}

window.addEventListener('load', populateOptions);

if (username === null || password === null)
    window.location.replace('/login/');
