var loaded = false;

var socket;

var loadedMessages;

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
    var newURL = new URL(window.location.origin);
    newURL.searchParams.set('roomid', roomid);
    window.location.replace(newURL.href);
}

function viewProfileByRoomID(roomid) {
    socket.emit('getOtherDMMemberUsername', { 'roomid': roomid });
    socket.on('returnOtherDMMemberUsername', (data) => {
        var newURL = new URL(window.location.origin + '/profile');
        newURL.searchParams.set('username', data.username);
        window.location.replace(newURL.href);
    });
}

function buildRoom(roomData) {
    var newRoom = document.createElement('li');
    newRoom.setAttribute('onclick', `openRoom(${roomData.id});`);
    newRoom.setAttribute('id', `room-${roomData.id}`);
    // Image
    var roomImage = document.createElement('img');
    roomImage.setAttribute('src', roomData.imageURL);
    newRoom.appendChild(roomImage);
    // Name
    var roomName = document.createElement('span');
    roomName.innerText = roomData.name;
    newRoom.appendChild(roomName);
    if (roomData.roomType === dmRoomType) {
        newRoom.addEventListener('contextmenu', (e) => {
            e.preventDefault();
            viewProfileByRoomID(roomData.id);
        });
    } else {
        newRoom.addEventListener('contextmenu', (e) => {
            e.preventDefault();
            var newURL = new URL(window.location.origin + '/manage-room');
            newURL.searchParams.set('roomid', roomData.id);
            window.location.replace(newURL.href);
        });
    }
    return newRoom;
}

function addNewRoom(parentElement, roomData) {
    var newRoom = buildRoom(roomData);
    parentElement.insertBefore(newRoom, parentElement.lastElementChild);
}

function addNewRoomAbove(parentElement, roomData) {
    parentElement.getElementsByClassName('loading')[0].classList.add('invisible');
    parentElement.getElementsByClassName('loading')[0].parentElement.classList.remove('space-above');
    var newRoom = buildRoom(roomData);
    parentElement.insertBefore(newRoom, parentElement.children[1]);
}

function buildMessage(messageData) {
    var newMessage = document.createElement('div');
    newMessage.classList.add('message');
    newMessage.setAttribute('id', `message-${messageData.id}`);
    // Image
    messageImg = document.createElement('img');
    messageImg.setAttribute('src', messageData.imageURL);
    newMessage.appendChild(messageImg);
    // Displayname
    messageDisplayname = document.createElement('span');
    messageDisplayname.classList.add('displayname');
    messageDisplayname.innerText = messageData.displayname;
    newMessage.appendChild(messageDisplayname);
    // Timestamp
    messageTimestamp = document.createElement('span');
    messageTimestamp.classList.add('timestamp');
    messageTimestamp.innerText = new Date(messageData.timestamp * 1000).toLocaleString();
    newMessage.appendChild(messageTimestamp);
    // Content
    messageContent = document.createElement('span');
    messageContent.classList.add('message-content');
    messageContent.innerText = messageData.text;
    newMessage.appendChild(messageContent);
    if (messageData.username === username) {
        newMessage.addEventListener('contextmenu', (e) => {
            e.preventDefault();
            var newURL = new URL(window.location.origin + '/manage-message');
            newURL.searchParams.set('messageid', messageData.id);
            window.location.replace(newURL.href);
        });
    }
    return newMessage;
}

function addNewMessage(parentElement, messageData) {
    var newMessage = buildMessage(messageData);
    parentElement.appendChild(newMessage);
}

function addNewMessageAbove(parentElement, messageData) {
    var newMessage = buildMessage(messageData);
    parentElement.insertBefore(newMessage, parentElement.children[1]);
}

function loadMessages() {
    var messagesDiv = document.getElementById('messages');
    if (messagesDiv.scrollTop === 0) {
        var distanceFromBottom = messagesDiv.scrollHeight - messagesDiv.scrollTop
        socket.emit('getMoreMessages', { 'roomid': roomID, 'size': messageGroupSize, 'loadedMessages': loadedMessages });
        socket.on('returnMoreMessages', (data) => {
            loadedMessages += messageGroupSize;
            for (var message of data) {
                addNewMessageAbove(messagesDiv, message);
            }
            if (data.length === 0)
                messagesDiv.removeAttribute('onscroll');
            messagesDiv.scrollTop = messagesDiv.scrollHeight - distanceFromBottom;
        });
    }
}

function createRoom() {
    socket.emit('createRoom');
}

function removeRoom(roomid) {
    if (roomid === roomID) {
        window.location.reload();
    } else {
        var roomListItem = document.getElementById(`room-${roomid}`);
        roomListItem.parentNode.removeChild(roomListItem);
    }
}

function main() {
    var mainInput = document.getElementById('main-input');
    mainInput.removeAttribute('disabled');
    mainInput.setAttribute('onkeydown', 'onEnter();');
    socket.emit('getRooms');
    socket.on('returnRooms', (data) => {
        if (data.length > 0) {
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
        var createRoomButton = document.getElementById('create-room-button');
        createRoomButton.classList.remove('invisible');
        var roomList = document.getElementById('room-list');
        roomList.getElementsByClassName('loading')[0].classList.add('invisible');
        roomList.getElementsByClassName('loading')[0].parentElement.classList.remove('space-above');
        for (var room of data) {
            addNewRoom(roomList, room, socket);
        }
        var messagesDiv = document.getElementById('messages');
        messagesDiv.getElementsByClassName('loading')[0].classList.add('invisible');
        socket.emit('getMessages', { 'roomid': roomID, 'size': messageGroupSize });
        socket.on('returnMessages', (data) => {
            if (data.blocked) {
                mainInput.setAttribute('disabled', '');
                mainInput.setAttribute('placeholder', 'Blocked');
            }
            loadedMessages = messageGroupSize;
            for (var message of data.messages) {
                addNewMessage(messagesDiv, message);
            }
            messagesDiv.scrollTop = messagesDiv.scrollHeight;
        });
        socket.on('incomingMessage', (data) => {
            if (data.roomid === roomID) {
                if (username === data.username || messagesDiv.scrollTop >= messagesDiv.scrollHeight - messagesDiv.clientHeight) {
                    addNewMessage(messagesDiv, data);
                    messagesDiv.scrollTop = messagesDiv.scrollHeight;
                } else {
                    addNewMessage(messagesDiv, data);
                }
            }
            if (roomList.children.length > 1) {
                var room = document.getElementById(`room-${data.roomid}`);
                roomList.removeChild(room);
                roomList.insertBefore(room, roomList.children[1]);
            }
        });
        socket.on('newRoom', (roomData) => {
            addNewRoomAbove(roomList, roomData);
        });
        socket.on('roomJoin', (roomData) => {
            addNewRoomAbove(roomList, roomData);
        });
        socket.on('roomKick', (roomData) => {
            removeRoom(roomData.roomid);
        });
        socket.on('blocked', (data) => {
            if (data.roomid === roomID) {
                mainInput.setAttribute('disabled', '');
                mainInput.setAttribute('placeholder', 'Blocked');
            }
        });
        socket.on('unblocked', (data) => {
            if (data.roomid === roomID) {
                mainInput.removeAttribute('disabled');
                mainInput.removeAttribute('placeholder');
            }
        });
        socket.on('editedMessage', (data) => {
            if (data.roomid === roomID) {
                document.getElementById(`message-${data.messageid}`).getElementsByClassName('message-content')[0].innerText = data.messageContent;
            }
        });
        socket.on('deletedMessage', (data) => {
            if (data.roomid === roomID) {
                var deletedMessage = document.getElementById(`message-${data.messageid}`);
                deletedMessage.parentNode.removeChild(deletedMessage);
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
