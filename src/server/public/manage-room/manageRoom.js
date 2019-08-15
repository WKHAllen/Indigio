var roomID = parseInt(new URLSearchParams(window.location.search).get('roomid')) || null;

function setRoomName() {
    document.getElementById('room-name-button').disabled = true;
    var roomName = stripWhitespace(document.getElementById('room-name').value);
    var status = document.getElementById('room-name-status');
    status.style.color = 'var(--primary-text-color)';
    status.innerHTML = 'Changing room name...';
    var socket = io.connect(url, { secure: true });
    socket.emit('login', { 'username': username, 'password': password });
    socket.on('validLogin', (data) => {
        if (data.res) {
            socket.emit('setRoomName', { 'roomid': roomID, 'roomName': roomName });
            status.style.color = 'var(--success-text-color)';
            status.innerHTML = 'Room name change successful';
            document.getElementById('room-name-label').innerHTML = roomName;
        } else {
            status.style.color = 'var(--error-text-color)';
            status.innerHTML = 'Failed to change room name';
        }
        document.getElementById('room-name-button').disabled = false;
        socket.disconnect();
    });
}

function setRoomImage() {
    document.getElementById('room-image-button').disabled = true;
    var roomImage = stripWhitespace(document.getElementById('room-image').value);
    var status = document.getElementById('room-image-status');
    status.style.color = 'var(--primary-text-color)';
    status.innerHTML = 'Changing room image URL...';
    var socket = io.connect(url, { secure: true });
    socket.emit('login', { 'username': username, 'password': password });
    socket.on('validLogin', (data) => {
        if (data.res) {
            socket.emit('setRoomImage', { 'roomid': roomID, 'roomImage': roomImage });
            status.style.color = 'var(--success-text-color)';
            status.innerHTML = 'Room image URL change successful';
            document.getElementById('room-image-label').innerHTML = `<img src="${roomImage}" width="32" height="32">`;
        } else {
            status.style.color = 'var(--error-text-color)';
            status.innerHTML = 'Failed to change room image URL';
        }
        document.getElementById('room-image-button').disabled = false;
        socket.disconnect();
    });
}

function addRoomMember() {
    var memberUsername = stripWhitespace(document.getElementById('add-member').value);
    var socket = io.connect(url, { secure: true });
    socket.emit('login', { 'username': username, 'password': password });
    socket.on('validLogin', (data) => {
        if (data.res) {
            socket.emit('addRoomMember', { 'memberUsername': memberUsername, 'roomid': roomID });
            socket.disconnect();
            window.location.reload();
        } else {
            socket.disconnect();
        }
    });
}

function leaveRoom() {
    document.getElementById('leave-room-button').disabled = true;
    var socket = io.connect(url, { secure: true });
    socket.emit('login', { 'username': username, 'password': password });
    socket.on('validLogin', (data) => {
        if (data.res) {
            socket.emit('leaveRoom', { 'roomid': roomID });
            socket.disconnect();
            window.location.replace('..');
        } else {
            socket.disconnect();
        }
    });
}

function deleteRoom() {
    document.getElementById('delete-room-button').disabled = true;
    var socket = io.connect(url, { secure: true });
    socket.emit('login', { 'username': username, 'password': password });
    socket.on('validLogin', (data) => {
        if (data.res) {
            socket.emit('deleteRoom', { 'roomid': roomID });
            socket.disconnect();
            window.location.replace('..');
        } else {
            socket.disconnect();
        }
    });
}

function removeMember(memberUsername) {
    var socket = io.connect(url, { secure: true });
    socket.emit('login', { 'username': username, 'password': password });
    socket.on('validLogin', (data) => {
        if (data.res) {
            socket.emit('removeRoomMember', { 'memberUsername': memberUsername, 'roomid': roomID });
            socket.disconnect();
            window.location.reload();
        } else {
            socket.disconnect();
        }
    });
}

function addNewMember(parentElement, memberData, creator) {
    var newMember = document.createElement('li');
    var memberImage = document.createElement('img');
    memberImage.setAttribute('src', memberData.imageURL);
    newMember.appendChild(memberImage);
    var memberName = document.createElement('span');
    if (creator)
        memberName.classList.add('creator');
    memberName.innerHTML = memberData.displayname;
    newMember.appendChild(memberName);
    var memberProfile = document.createElement('button');
    memberProfile.innerHTML = 'Profile';
    memberProfile.setAttribute('onclick', `viewProfile('${memberData.username}');`);
    newMember.appendChild(memberProfile);
    if (creator) {
        var memberRemove = document.createElement('button');
        memberRemove.innerHTML = 'Remove';
        memberRemove.setAttribute('onclick', `removeMember('${memberData.username}');`);
        newMember.appendChild(memberRemove);
    }
    parentElement.appendChild(newMember);
}

function populateOptions() {
    var socket = io.connect(url, { secure: true });
    socket.emit('login', { 'username': username, 'password': password });
    socket.on('validLogin', (data) => {
        if (data.res) {
            socket.emit('checkValidRoom', { 'roomid': roomID });
            socket.on('validRoom', (data) => {
                if (data.res) {
                    var creator = data.creator;
                    if (creator) {
                        document.getElementById('delete-room-button').classList.remove('invisible');
                    }
                    // get room name
                    socket.emit('getRoomName', { 'roomid': roomID });
                    socket.on('returnRoomName', (data) => {
                        document.getElementById('room-name-label').innerHTML = data.roomName;
                        document.getElementById('room-name').value = data.roomName;
                        // get image URL
                        socket.emit('getRoomImage', { 'roomid': roomID });
                        socket.on('returnRoomImage', (data) => {
                            document.getElementById('room-image-label').innerHTML = `<img src="${data.roomImage}" width="32" height="32">`;
                            document.getElementById('room-image').value = data.roomImage;
                            // get room members
                            socket.emit('getRoomMembers', { 'roomid': roomID });
                            socket.on('returnRoomMembers', (data) => {
                                var memberList = document.getElementById('room-members-list');
                                if (data.length === 0)
                                    memberList.getElementsByClassName('loading')[0].innerHTML = 'Nothing here';
                                else
                                    memberList.innerHTML = '';
                                for (var member of data) {
                                    addNewMember(memberList, member, creator);
                                }
                                socket.disconnect();
                            });
                        });
                    });
                } else {
                    socket.disconnect();
                    window.location.replace('..');
                }
            });
        } else {
            socket.disconnect();
            window.location.replace('../login/');
        }
    });
}

window.addEventListener('load', populateOptions);

if (username === null || password === null)
    window.location.replace('../login/');
