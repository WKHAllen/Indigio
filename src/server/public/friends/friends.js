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

function addFriend() {
    // TODO: disable button
}

function searchFriends() {
    // TODO: disable button
}

function openFriendDM(friendUsername) {

}

function acceptFriendRequest(username) {
    
}

function denyFriendRequest(username) {

}

function cancelFriendRequest(username) {

}

function done() {
    window.location.replace('..');
}

function addNewFriend(parentElement, friendData) {
    var newFriend = document.createElement('li');
    var friendImage = document.createElement('img');
    friendImage.setAttribute('src', friendData.imageURL);
    friendImage.setAttribute('width', 32);
    friendImage.setAttribute('height', 32);
    newFriend.appendChild(friendImage);
    var friendName = document.createElement('span');
    friendName.innerHTML = friendData.displayname;
    newFriend.appendChild(friendName);
    var friendMessage = document.createElement('button');
    friendMessage.innerHTML = 'Message';
    friendMessage.setAttribute('onclick', `openFriendDM('${friendData.username}');`);
    newFriend.appendChild(friendMessage);
    parentElement.appendChild(newFriend);
}

function addNewIncomingFriend(parentElement, friendData) {
    var newFriend = document.createElement('li');
    var friendImage = document.createElement('img');
    friendImage.setAttribute('src', friendData.imageURL);
    friendImage.setAttribute('width', 32);
    friendImage.setAttribute('height', 32);
    newFriend.appendChild(friendImage);
    var friendName = document.createElement('span');
    friendName.innerHTML = friendData.displayname;
    newFriend.appendChild(friendName);
    var friendDeny = document.createElement('button');
    friendDeny.innerHTML = 'Deny';
    friendDeny.setAttribute('onclick', `denyFriendRequest('${friendData.username}');`);
    newFriend.appendChild(friendDeny);
    var friendAccept = document.createElement('button');
    friendAccept.innerHTML = 'Accept';
    friendAccept.setAttribute('onclick', `acceptFriendRequest('${friendData.username}');`);
    newFriend.appendChild(friendAccept);
    parentElement.appendChild(newFriend);
}

function addNewOutgoingFriend(parentElement, friendData) {
    var newFriend = document.createElement('li');
    var friendImage = document.createElement('img');
    friendImage.setAttribute('src', friendData.imageURL);
    friendImage.setAttribute('width', 32);
    friendImage.setAttribute('height', 32);
    newFriend.appendChild(friendImage);
    var friendName = document.createElement('span');
    friendName.innerHTML = friendData.displayname;
    newFriend.appendChild(friendName);
    var friendCancel = document.createElement('button');
    friendCancel.innerHTML = 'Cancel';
    friendCancel.setAttribute('onclick', `cancelFriendRequest('${friendData.username}');`);
    newFriend.appendChild(friendCancel);
    parentElement.appendChild(newFriend);
}

function populateFriends() {
    var socket = io.connect(url, { secure: true });
    socket.emit('login', { 'username': username, 'password': password });
    socket.on('validLogin', (data) => {
        if (data.res) {
            // get friends
            socket.emit('getFriends');
            socket.on('returnFriends', (data) => {
                var friendsList = document.getElementById('friends-list');
                for (let friend of data) {
                    addNewFriend(friendsList, friend);
                }
                // get incoming friend requests
                socket.emit('getIncomingFriendRequests');
                socket.on('returnIncomingFriendRequests', (data) => {
                    var friendsIncoming = document.getElementById('friends-incoming');
                    for (let friend of data) {
                        addNewIncomingFriend(friendsIncoming, friend);
                    }
                    // get outgoing friend requests
                    socket.emit('getOutgoingFriendRequests');
                    socket.on('returnOutgoingFriendRequests', (data) => {
                        var friendsOutgoing = document.getElementById('friends-outgoing');
                        for (let friend of data) {
                            addNewOutgoingFriend(friendsOutgoing, friend);
                        }
                        socket.disconnect();
                    });
                });
            });
        } else {
            socket.disconnect();
        }
    });
}

window.addEventListener('load', populateFriends);
