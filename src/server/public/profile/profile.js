var profileUsername = new URLSearchParams(window.location.search).get('username') || username || null;
if (profileUsername === null) {
    goHome();
}

function addFriend() {
    var socket = io.connect(url, { secure: true });
    socket.emit('login', { 'username': username, 'password': password });
    socket.on('validLogin', (data) => {
        if (data.res) {
            socket.emit('addFriend', { 'username': profileUsername });
            socket.disconnect();
            window.location.reload();
        } else {
            socket.disconnect();
        }
    });
}

function removeFriend() {
    var socket = io.connect(url, { secure: true });
    socket.emit('login', { 'username': username, 'password': password });
    socket.on('validLogin', (data) => {
        if (data.res) {
            socket.emit('removeFriend', { 'username': profileUsername });
            socket.disconnect();
            window.location.reload();
        } else {
            socket.disconnect();
        }
    });
}

function blockUser() {
    var socket = io.connect(url, { secure: true });
    socket.emit('login', { 'username': username, 'password': password });
    socket.on('validLogin', (data) => {
        if (data.res) {
            socket.emit('blockUser', { 'username': profileUsername });
            socket.disconnect();
            window.location.reload();
        } else {
            socket.disconnect();
        }
    });
}

function unblockUser() {
    var socket = io.connect(url, { secure: true });
    socket.emit('login', { 'username': username, 'password': password });
    socket.on('validLogin', (data) => {
        if (data.res) {
            socket.emit('unblockUser', { 'username': profileUsername });
            socket.disconnect();
            window.location.reload();
        } else {
            socket.disconnect();
        }
    });
}

function main() {
    document.getElementById('title-username').innerText = `${profileUsername}'s `;
    var socket = io.connect(url, { secure: true });
    socket.emit('getUserInfo', { 'username': profileUsername });
    socket.on('returnUserInfo', (data) => {
        if (data !== null) {
            document.getElementById('username-label').innerText = data.username;
            document.getElementById('displayname-label').innerText = data.displayname;
            document.getElementById('image-label').innerHTML = `<img src="${data.imageurl}" width="32" height="32">`;
            document.getElementById('image-url-label').innerText = data.imageurl;
            if (profileUsername !== username) {
                socket.emit('login', { 'username': username, 'password': password });
                socket.on('validLogin', (data) => {
                    if (data.res) {
                        socket.emit('checkIsFriend', { 'username': profileUsername });
                        socket.on('isFriend', (data) => {
                            if (data.res) {
                                var addFriendButton = document.getElementById('add-friend-button');
                                addFriendButton.innerText = 'Remove friend';
                                addFriendButton.setAttribute('onclick', 'removeFriend();');
                            }
                            document.getElementById('add-friend').classList.remove('invisible');
                            socket.emit('checkIsBlocked', { 'username': profileUsername });
                            socket.on('isBlocked', (data) => {
                                if (data.res) {
                                    var blockUserButton = document.getElementById('block-user-button');
                                    blockUserButton.innerText = 'Unblock';
                                    blockUserButton.setAttribute('onclick', 'unblockUser();');
                                }
                                document.getElementById('block-user').classList.remove('invisible');
                                socket.disconnect();
                            });
                        });
                    } else {
                        socket.disconnect();
                    }
                });
            }
        } else {
            document.getElementsByClassName('middle-content')[0].innerText = 'This user does not exist.';
            socket.disconnect();
        }
    });
}

window.addEventListener('load', main);
