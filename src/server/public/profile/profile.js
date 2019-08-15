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

function main() {
    document.getElementById('title-username').innerHTML = `${profileUsername}'s `;
    var socket = io.connect(url, { secure: true });
    socket.emit('getUserInfo', { 'username': profileUsername });
    socket.on('returnUserInfo', (data) => {
        if (data !== null) {
            document.getElementById('username-label').innerHTML = data.username;
            document.getElementById('displayname-label').innerHTML = data.displayname;
            document.getElementById('image-label').innerHTML = `<img src="${data.imageURL}" width="32" height="32">`;
            document.getElementById('image-url-label').innerHTML = data.imageURL;
        } else {
            document.getElementsByClassName('middle-content')[0].innerHTML = 'This user does not exist.';
        }
        if (profileUsername !== username) {
            socket.emit('login', { 'username': username, 'password': password });
            socket.on('validLogin', (data) => {
                if (data.res) {
                    socket.emit('checkIsFriend', { 'username': profileUsername });
                    socket.on('isFriend', (data) => {
                        if (data.res) {
                            var addFriendButton = document.getElementById('add-friend-button');
                            addFriendButton.innerHTML = 'Remove friend';
                            addFriendButton.setAttribute('onclick', 'removeFriend();');
                        }
                        document.getElementById('add-friend').classList.remove('invisible');
                        socket.disconnect();
                    });
                } else {
                    socket.disconnect();
                }
            });
        }
    });
}

window.addEventListener('load', main);
