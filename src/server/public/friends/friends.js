const url = window.location.host;

var username = localStorage.getItem(localUsername);
var password = localStorage.getItem(localPassword);

var friends;

function stripWhitespace(str) {
    return str.replace(/^\s+|\s+$/g, '');
}

function onEnterClick(buttonID) {
    if (event.keyCode === 13) {
        document.getElementById(buttonID).click();
    }
}

function addFriend() {
    var socket = io.connect(url, { secure: true });
    socket.emit('login', { 'username': username, 'password': password });
    socket.on('validLogin', (data) => {
        if (data.res) {
            var friendUsername = stripWhitespace(document.getElementById('add-friend').value);
            socket.emit('addFriend', { 'username': friendUsername });
            socket.disconnect();
            location.reload();
        } else {
            socket.disconnect();
        }
    });
}

function searchFriends() {
    while (friends === undefined) {} // wait for friends list to populate
    var friendUsername = stripWhitespace(document.getElementById('search-friends').value);
    var searchResultsList = document.getElementById('search-results-list');
    searchResultsList.innerHTML = '';
    document.getElementById('search-results-div').classList.remove('invisible');
    for (var friend of friends)
        if (friend.username.toLowerCase().includes(friendUsername.toLowerCase()) || friend.displayname.toLowerCase().includes(friendUsername.toLowerCase()))
            addNewSearchResult(searchResultsList, friend);
}

function openFriendDM(friendUsername) {
    var socket = io.connect(url, { secure: true });
    socket.emit('login', { 'username': username, 'password': password });
    socket.on('validLogin', (data) => {
        if (data.res) {
            socket.emit('getDMRoomID', { 'username': friendUsername });
            socket.on('returnDMRoomID', (data) => {
                socket.disconnect();
                window.location.replace(`../?roomid=${data.roomid}`);
            });
        } else {
            socket.disconnect();
        }
    });
}

function acceptFriendRequest(friendUsername) {
    var socket = io.connect(url, { secure: true });
    socket.emit('login', { 'username': username, 'password': password });
    socket.on('validLogin', (data) => {
        if (data.res) {
            socket.emit('acceptIncomingFriendRequest', { 'username': friendUsername });
            socket.disconnect();
            location.reload();
        } else {
            socket.disconnect();
        }
    });
}

function denyFriendRequest(friendUsername) {
    var socket = io.connect(url, { secure: true });
    socket.emit('login', { 'username': username, 'password': password });
    socket.on('validLogin', (data) => {
        if (data.res) {
            socket.emit('removeIncomingFriendRequest', { 'username': friendUsername });
            socket.disconnect();
            location.reload();
        } else {
            socket.disconnect();
        }
    });
}

function cancelFriendRequest(friendUsername) {
    var socket = io.connect(url, { secure: true });
    socket.emit('login', { 'username': username, 'password': password });
    socket.on('validLogin', (data) => {
        if (data.res) {
            socket.emit('removeOutgoingFriendRequest', { 'username': friendUsername });
            socket.disconnect();
            location.reload();
        } else {
            socket.disconnect();
        }
    });
}

function removeFriend(friendUsername) {
    var socket = io.connect(url, { secure: true });
    socket.emit('login', { 'username': username, 'password': password });
    socket.on('validLogin', (data) => {
        if (data.res) {
            socket.emit('removeFriend', { 'username': friendUsername });
            socket.disconnect();
            location.reload();
        } else {
            socket.disconnect();
        }
    });
}

function done() {
    window.location.replace('..');
}

function addNewSearchResult(parentElement, friendData) {
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
    var friendRemove = document.createElement('button');
    friendRemove.innerHTML = 'Remove';
    friendRemove.setAttribute('onclick', `removeFriend('${friendData.username}');`);
    newFriend.appendChild(friendRemove);
    parentElement.appendChild(newFriend);
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
    var friendRemove = document.createElement('button');
    friendRemove.innerHTML = 'Remove';
    friendRemove.setAttribute('onclick', `removeFriend('${friendData.username}');`);
    newFriend.appendChild(friendRemove);
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
                friends = data;
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
