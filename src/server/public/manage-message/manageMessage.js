var messageID = parseInt(new URLSearchParams(window.location.search).get('messageid')) || null;

function editMessage() {
    document.getElementById('edit-message-button').disabled = true;
    var messageContent = stripWhitespace(document.getElementById('edit-message').value);
    var status = document.getElementById('edit-message-status');
    status.style.color = 'var(--primary-text-color)';
    status.innerText = 'Editing message...';
    var socket = io.connect(url, { secure: true });
    socket.emit('login', { 'username': username, 'password': password });
    socket.on('validLogin', (data) => {
        if (data.res) {
            socket.emit('editMessage', { 'messageid': messageID, 'messageContent': messageContent });
            status.style.color = 'var(--success-text-color)';
            status.innerText = 'Message content changed successfully';
        } else {
            status.style.color = 'var(--error-text-color)';
            status.innerText = 'Failed to edit message';
        }
        document.getElementById('edit-message-button').disabled = false;
        socket.disconnect();
    });
}

function deleteMessage() {
    document.getElementById('delete-message-button').disabled = true;
    var socket = io.connect(url, { secure: true });
    socket.emit('login', { 'username': username, 'password': password });
    socket.on('validLogin', (data) => {
        if (data.res) {
            socket.emit('deleteMessage', { 'messageid': messageID });
            socket.disconnect();
            goHome();
        }
    });
}

function populateOptions() {
    var socket = io.connect(url, { secure: true });
    socket.emit('login', { 'username': username, 'password': password });
    socket.on('validLogin', (data) => {
        if (data.res) {
            socket.emit('checkValidMessage', { 'messageid': messageID });
            socket.on('validMessage', (data) => {
                if (data.res) {
                    // get message info
                    socket.emit('getMessageInfo', { 'messageid': messageID });
                    socket.on('returnMessageInfo', (data) => {
                        var fromLabel = document.getElementById('message-from-label')
                        fromLabel.style.lineHeight = '32px';
                        fromLabel.innerHTML = `<img src="${data.imageURL}" width="32" height="32" style="float: left;"><span style="padding-left: var(--std-padding);">${data.displayname}</span>`;
                        document.getElementById('message-at-label').innerText = new Date(data.createTimestamp * 1000).toLocaleString();
                        document.getElementById('edit-message').value = data.text;
                    });
                } else {
                    socket.disconnect();
                    window.location.replace('/');
                }
            });
        } else {
            socket.disconnect();
            window.location.replace('/login/');
        }
    });
}

window.addEventListener('load', populateOptions);

if (username === null || password === null)
    window.location.replace('/login/');
