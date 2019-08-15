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

function doSearch(searchedFriend) {
    var searchResults = [];
    for (var friend of friends)
        if (friend.username.toLowerCase().includes(searchedFriend.toLowerCase()) || friend.displayname.toLowerCase().includes(searchedFriend.toLowerCase()))
            searchResults.push(friend);
    return searchResults;
}

function searchFriends() {
    while (friends === undefined) {} // wait for friends list to populate
    var friendUsername = stripWhitespace(document.getElementById('search-friends').value);
    var searchResultsList = document.getElementById('search-results-list');
    searchResultsList.innerHTML = '<div class="centered-div"><span class="loading">Loading...</span></div>';
    var statusLabel = searchResultsList.getElementsByClassName('loading')[0];
    var results = doSearch(friendUsername);
    if (results.length === 0) {
        statusLabel.innerHTML = 'Nothing here';
        statusLabel.classList.remove('invisible');
    } else {
        searchResultsList.getElementsByClassName('loading')[0].classList.add('invisible');
    }
    for (var result of results)
        addNewSearchResult(searchResultsList, result);
    document.getElementById('search-results-div').classList.remove('invisible');
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

function addNewSearchResult(parentElement, friendData) {
    var newFriend = document.createElement('li');
    var friendImage = document.createElement('img');
    friendImage.setAttribute('src', friendData.imageURL);
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
                if (data.length === 0)
                    friendsList.getElementsByClassName('loading')[0].innerHTML = 'Nothing here';
                else
                    friendsList.innerHTML = '';
                for (var friend of data) {
                    addNewFriend(friendsList, friend);
                }
                // get incoming friend requests
                socket.emit('getIncomingFriendRequests');
                socket.on('returnIncomingFriendRequests', (data) => {
                    var friendsIncoming = document.getElementById('friends-incoming');
                    if (data.length === 0)
                        friendsIncoming.getElementsByClassName('loading')[0].innerHTML = 'Nothing here';
                    else
                        friendsIncoming.innerHTML = '';
                    for (var friend of data) {
                        addNewIncomingFriend(friendsIncoming, friend);
                    }
                    // get outgoing friend requests
                    socket.emit('getOutgoingFriendRequests');
                    socket.on('returnOutgoingFriendRequests', (data) => {
                        var friendsOutgoing = document.getElementById('friends-outgoing');
                        if (data.length === 0)
                            friendsOutgoing.getElementsByClassName('loading')[0].innerHTML = 'Nothing here';
                        else
                            friendsOutgoing.innerHTML = '';
                        for (var friend of data) {
                            addNewOutgoingFriend(friendsOutgoing, friend);
                        }
                        socket.disconnect();
                    });
                });
            });
        } else {
            socket.disconnect();
            window.location.replace('../login/');
        }
    });
}

window.addEventListener('load', populateFriends);

if (username === null || password === null)
    window.location.replace('../login/');
