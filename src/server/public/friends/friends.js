if (username === null || password === null)
    window.location.replace('/login/');

function addFriend() {
    var socket = io.connect(url, { secure: true });
    socket.emit('login', { 'username': username, 'password': password });
    socket.on('validLogin', (data) => {
        if (data.res) {
            var friendUsername = stripWhitespace(document.getElementById('add-friend').value);
            socket.emit('addFriend', { 'username': friendUsername });
            socket.disconnect();
            window.location.reload();
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
        statusLabel.innerText = 'Nothing here';
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
                window.location.replace(`/?roomid=${data.roomid}`);
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
            window.location.reload();
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
            window.location.reload();
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
            window.location.reload();
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
            window.location.reload();
        } else {
            socket.disconnect();
        }
    });
}

function unblockUser(blockedUsername) {
    var socket = io.connect(url, { secure: true });
    socket.emit('login', { 'username': username, 'password': password });
    socket.on('validLogin', (data) => {
        if (data.res) {
            socket.emit('unblockUser', { 'username': blockedUsername });
            socket.disconnect();
            window.location.reload();
        } else {
            socket.disconnect();
        }
    });
}

function addNewSearchResult(parentElement, friendData) {
    var newFriend = document.createElement('li');
    var friendImage = document.createElement('img');
    friendImage.setAttribute('src', friendData.imageurl);
    newFriend.appendChild(friendImage);
    var friendName = document.createElement('span');
    friendName.innerText = friendData.displayname;
    newFriend.appendChild(friendName);
    var friendMessage = document.createElement('button');
    friendMessage.innerText = 'Message';
    friendMessage.setAttribute('onclick', `openFriendDM('${friendData.username}');`);
    newFriend.appendChild(friendMessage);
    var friendRemove = document.createElement('button');
    friendRemove.innerText = 'Remove';
    friendRemove.setAttribute('onclick', `removeFriend('${friendData.username}');`);
    newFriend.appendChild(friendRemove);
    parentElement.appendChild(newFriend);
}

function addNewFriend(parentElement, friendData) {
    var newFriend = document.createElement('li');
    var friendImage = document.createElement('img');
    friendImage.setAttribute('src', friendData.imageurl);
    newFriend.appendChild(friendImage);
    var friendName = document.createElement('span');
    friendName.innerText = friendData.displayname;
    newFriend.appendChild(friendName);
    var friendRemove = document.createElement('button');
    friendRemove.innerText = 'Remove';
    friendRemove.setAttribute('onclick', `removeFriend('${friendData.username}');`);
    newFriend.appendChild(friendRemove);
    var friendMessage = document.createElement('button');
    friendMessage.innerText = 'Message';
    friendMessage.setAttribute('onclick', `openFriendDM('${friendData.username}');`);
    newFriend.appendChild(friendMessage);
    var friendProfile = document.createElement('button');
    friendProfile.innerText = 'Profile';
    friendProfile.setAttribute('onclick', `viewProfile('${friendData.username}');`);
    newFriend.appendChild(friendProfile);
    parentElement.appendChild(newFriend);
}

function addNewIncomingFriend(parentElement, friendData) {
    var newFriend = document.createElement('li');
    var friendImage = document.createElement('img');
    friendImage.setAttribute('src', friendData.imageurl);
    newFriend.appendChild(friendImage);
    var friendName = document.createElement('span');
    friendName.innerText = friendData.displayname;
    newFriend.appendChild(friendName);
    var friendDeny = document.createElement('button');
    friendDeny.innerText = 'Deny';
    friendDeny.setAttribute('onclick', `denyFriendRequest('${friendData.username}');`);
    newFriend.appendChild(friendDeny);
    var friendAccept = document.createElement('button');
    friendAccept.innerText = 'Accept';
    friendAccept.setAttribute('onclick', `acceptFriendRequest('${friendData.username}');`);
    newFriend.appendChild(friendAccept);
    parentElement.appendChild(newFriend);
}

function addNewOutgoingFriend(parentElement, friendData) {
    var newFriend = document.createElement('li');
    var friendImage = document.createElement('img');
    friendImage.setAttribute('src', friendData.imageurl);
    newFriend.appendChild(friendImage);
    var friendName = document.createElement('span');
    friendName.innerText = friendData.displayname;
    newFriend.appendChild(friendName);
    var friendCancel = document.createElement('button');
    friendCancel.innerText = 'Cancel';
    friendCancel.setAttribute('onclick', `cancelFriendRequest('${friendData.username}');`);
    newFriend.appendChild(friendCancel);
    parentElement.appendChild(newFriend);
}

function addNewBlockedUser(parentElement, userData) {
    var newBlockedUser = document.createElement('li');
    var blockedUserImage = document.createElement('img');
    blockedUserImage.setAttribute('src', userData.imageurl);
    newBlockedUser.appendChild(blockedUserImage);
    var blockedUserName = document.createElement('span');
    blockedUserName.innerText = userData.displayname;
    newBlockedUser.appendChild(blockedUserName);
    var blockedUserUnblock = document.createElement('button');
    blockedUserUnblock.innerText = 'Unblock';
    blockedUserUnblock.setAttribute('onclick', `unblockUser('${userData.username}');`);
    newBlockedUser.appendChild(blockedUserUnblock);
    parentElement.appendChild(newBlockedUser);
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
                    friendsList.getElementsByClassName('loading')[0].innerText = 'Nothing here';
                else
                    friendsList.innerText = '';
                for (var friend of data) {
                    addNewFriend(friendsList, friend);
                }
                // get incoming friend requests
                socket.emit('getIncomingFriendRequests');
                socket.on('returnIncomingFriendRequests', (data) => {
                    var friendsIncoming = document.getElementById('friends-incoming');
                    if (data.length === 0)
                        friendsIncoming.getElementsByClassName('loading')[0].innerText = 'Nothing here';
                    else
                        friendsIncoming.innerText = '';
                    for (var friend of data) {
                        addNewIncomingFriend(friendsIncoming, friend);
                    }
                    // get outgoing friend requests
                    socket.emit('getOutgoingFriendRequests');
                    socket.on('returnOutgoingFriendRequests', (data) => {
                        var friendsOutgoing = document.getElementById('friends-outgoing');
                        if (data.length === 0)
                            friendsOutgoing.getElementsByClassName('loading')[0].innerText = 'Nothing here';
                        else
                            friendsOutgoing.innerText = '';
                        for (var friend of data) {
                            addNewOutgoingFriend(friendsOutgoing, friend);
                        }
                        // get blocked users
                        socket.emit('getBlockedUsers');
                        socket.on('returnBlockedUsers', (data) => {
                            var blockedUsers = document.getElementById('blocked-users');
                            if (data.length === 0)
                                blockedUsers.getElementsByClassName('loading')[0].innerText = 'Nothing here';
                            else
                                blockedUsers.getElementsByClassName('loading')[0].innerText = '';
                            for (var user of data) {
                                addNewBlockedUser(blockedUsers, user);
                            }
                            socket.disconnect();
                        });
                    });
                });
            });
        } else {
            socket.disconnect();
            window.location.replace('/login/');
        }
    });
}

window.addEventListener('load', populateFriends);
