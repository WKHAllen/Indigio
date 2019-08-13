var loaded = false;

var socket;

var roomID = parseInt(new URLSearchParams(window.location.search).get('roomid')) || null;
if (roomID === null) {
    roomID = localStorage.getItem(localOpenRoom);
    if (roomID !== null) {
        openRoom(roomID);
    }
}

function loadSettings() {
    var settings = JSON.parse(localStorage.getItem(localSettings));
    if (settings === null) {
        settings = defaultSettings;
    }
    document.documentElement.style.setProperty('--message-text-size', `${settings.textSize}pt`);
    document.documentElement.style.setProperty('--message-img-height', `${settings.imageSize}px`);
}

function onEnter() {
    if (event.keyCode === 13) {
        sendMessage();
    }
}

function sendMessage() {
    var mainInput = document.getElementById('main-input');
    socket.emit('newMessage', { 'text': mainInput.value, 'roomid': roomID });
    mainInput.value = '';
}

function validRoom(rooms) {
    for (var room of rooms)
        if (room.id === roomID)
            return true;
    return false;
}

function openRoom(roomid) {
    var newURL = new URL(window.location.href);
    newURL.searchParams.set('roomid', roomid);
    window.location.replace(newURL.href);
}

function addNewRoom(parentElement, roomData, socket) {
    var newRoom = document.createElement('li');
    newRoom.setAttribute('onclick', `openRoom(${roomData.id});`);
    // Image
    var roomImage = document.createElement('img');
    roomImage.setAttribute('src', roomData.imageURL);
    newRoom.appendChild(roomImage);
    // Name
    var roomName = document.createElement('span');
    roomName.innerHTML = roomData.name;
    newRoom.appendChild(roomName);
    parentElement.appendChild(newRoom);
}

function addNewMessage(parentElement, messageData) {
    var newMessage = document.createElement('div');
    newMessage.classList.add('message');
    // Image
    messageImg = document.createElement('img');
    messageImg.setAttribute('src', messageData.imageURL);
    newMessage.appendChild(messageImg);
    // Username
    messageUsername = document.createElement('span');
    messageUsername.classList.add('username');
    messageUsername.innerHTML = messageData.username;
    newMessage.appendChild(messageUsername);
    // Timestamp
    messageTimestamp = document.createElement('span');
    messageTimestamp.classList.add('timestamp');
    messageTimestamp.innerHTML = new Date(messageData.timestamp * 1000).toLocaleString();
    newMessage.appendChild(messageTimestamp);
    // Content
    messageContent = document.createElement('span');
    messageContent.classList.add('message-content');
    messageContent.innerHTML = messageData.text;
    newMessage.appendChild(messageContent);
    parentElement.appendChild(newMessage);
}

function main() {
    document.getElementById('main-input').setAttribute('onkeydown', 'onEnter();');
    // TODO: set socket.on events for adding/removing rooms, etc.
    socket.emit('getRooms');
    socket.on('returnRooms', (data) => {
        var roomList = document.getElementById('room-list');
        var messageDiv = document.getElementById('messages');
        if (data.length === 0) {
            roomList.getElementsByClassName('loading')[0].innerHTML = 'Nothing here';
            messageDiv.getElementsByClassName('loading')[0].innerHTML = 'Nothing here';
        } else {
            roomList.innerHTML = '';
            if (roomID === null) {
                openRoom(data[0].id);
                return;
            }
            if (validRoom(data)) {
                localStorage.setItem(localOpenRoom, roomID);
            } else {
                localStorage.removeItem(localOpenRoom);
                window.location.replace('/');
                return;
            }
        }
        for (var room of data) {
            addNewRoom(roomList, room, socket);
        }
        var messagesDiv = document.getElementById('messages');
        messagesDiv.getElementsByClassName('loading')[0].classList.add('invisible');
        socket.emit('getMessages', { 'roomid': roomID, 'size': messageGroupSize });
        socket.on('returnMessages', (data) => {
            for (var message of data) {
                addNewMessage(messagesDiv, message, socket);
            }
            messagesDiv.scrollTop = messagesDiv.scrollHeight;
        });
        socket.on('incomingMessage', (data) => {
            if (data.roomid === roomID) {
                if (username === data.username || messagesDiv.scrollTop >= messagesDiv.scrollHeight - messagesDiv.clientHeight) {
                    addNewMessage(messagesDiv, data, socket);
                    messagesDiv.scrollTop = messagesDiv.scrollHeight;
                } else {
                    addNewMessage(messagesDiv, data, socket);
                }
            } else {
                // TODO: move room on left panel to top and indicate that there is a new message
            }
        });
    });
}

function start() {
    socket = io.connect(url, { secure: true });
    socket.emit('login', { 'username': username, 'password': password });
    socket.on('validLogin', (data) => {
        if (!data.res) {
            window.location.replace('/login/');
        } else {
            if (loaded) {
                main(socket);
            } else {
                window.addEventListener('load', () => { main(socket); });
            }
        }
    });
}

window.addEventListener('load', () => {
    loaded = true;
    loadSettings();
})

if (username === null || password === null)
    window.location.replace('/login/');

start();
