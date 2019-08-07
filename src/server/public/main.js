var loaded = false;

var socket;

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
    socket.emit('newMessage', { 'text': mainInput.value, 'username': username, 'password': password });
    mainInput.value = '';
}

function openRoom(roomid) {
    var newURL = new URL(window.location.href);
    newURL.searchParams.set('roomid', roomid);
    window.location.replace(newURL.href);
}

function addNewRoom(parentElement, roomData, socket) {
    var newRoom = document.createElement('li');
    newRoom.setAttribute('onclick', `openRoom(${roomData.id});`);
    var roomImage = document.createElement('img');
    if (roomData.roomType === dmRoomType) { // if room is a DM, show friend's image
        socket.emit('getDMImage', { 'roomid': roomData.id });
        socket.on('returnDMImage', (data) => {
            roomImage.setAttribute('src', data.imageURL);
        });
    } else {
        roomImage.setAttribute('src', roomData.imageURL);
    }
    newRoom.appendChild(roomImage);
    var roomName = document.createElement('span');
    roomName.innerHTML = roomData.name;
    newRoom.appendChild(roomName);
    parentElement.appendChild(newRoom);
}

function main() {
    document.getElementById('main-input').setAttribute('onkeydown', 'onEnter();');
    // TODO: emit events for getting rooms, messages, etc.
    // TODO: set socket.on events for receiving new messages, adding/removing rooms, etc.
    socket.emit('getRooms');
    socket.on('returnRooms', (data) => {
        var roomList = document.getElementById('room-list');
        if (data.length === 0)
            roomList.getElementsByClassName('loading')[0].innerHTML = 'Nothing here';
        else
            roomList.innerHTML = '';
        for (var room of data) {
            addNewRoom(roomList, room, socket);
        }
        // TODO: get messages
        // if localStorage variable `localOpenRoom` is null, then get most recently updated room
        // if no rooms exist, then show nothing
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
