const localUsername = 'IndigioUsername';
const localPassword = 'IndigioPassword';
const localSettings = 'IndigioSettings';
const localOpenRoom = 'IndigioOpenRoom';

const username = localStorage.getItem(localUsername);
const password = localStorage.getItem(localPassword);

const defaultSettings = { 'textSize': 12, 'imageSize': 24 };

const messageGroupSize = 50;

const dmRoomType = 0;

const url = window.location.host;

const inGoodBrowser = (navigator.userAgent.indexOf('Chrome') !== -1 || navigator.userAgent.indexOf('Electron') !== -1) && navigator.userAgent.indexOf('Edge') === -1;

if (localStorage.getItem(localSettings) === null)
    localStorage.setItem(localSettings, JSON.stringify(defaultSettings));

var isElectron = (window && window.process && window.process.type) !== undefined;
if (isElectron) {
    const open = require('open');
    const remote = require('electron').remote;
    var remoteWindow = remote.getCurrentWindow();
    window.addEventListener('load', () => {
        document.getElementById('window-menu').classList.remove('invisible');
    });

    function windowMinimize() {
        if (remoteWindow.isMinimized())
            remoteWindow.restore();
        else
            remoteWindow.minimize();
    }

    function windowMaximize() {
        if (remoteWindow.isKiosk())
            remoteWindow.setKiosk(false);
        else if (remoteWindow.isMaximized())
            remoteWindow.unmaximize();
        else
            remoteWindow.maximize();
    }

    function windowClose() {
        remoteWindow.close();
    }

    function electronifyLink(element) {
        var href = element.href;
        element.onclick = async function() {
            await open(href);
        }
        element.removeAttribute('href');
        element.removeAttribute('target');
        element.style.cursor = 'pointer';
    }
}

function stripWhitespace(str) {
    return str.replace(/^\s+|\s+$/g, '');
}

function onEnterClick(buttonID) {
    if (event.keyCode === 13) {
        document.getElementById(buttonID).click();
    }
}

function goBack() {
    window.history.back();
}

function goHome() {
    window.location.replace('/');
}

function viewProfile(theUsername) {
    var newURL = new URL(window.location.origin + '/profile');
    newURL.searchParams.set('username', theUsername);
    window.location.replace(newURL.href);
}

function isImage(imageURL) {
    return imageURL.match(/\.(jpeg|jpg|gif|png|ico)$/) != null;
}

function validImageURL(imageURL, callback) {
    var xhttp = new XMLHttpRequest();
    xhttp.onreadystatechange = function() {
        if (this.readyState === 4) {
            if (this.status === 200 || this.status === 0) {
                if (isImage(imageURL))
                    callback(true);
                else
                    callback(false);
            } else {
                callback(false);
            }
        }
    };
    xhttp.open('GET', imageURL, true);
    xhttp.send();
}

function checkFriendRequests() {
    var socket = io.connect(url, { secure: true });
    socket.emit('login', { 'username': username, 'password': password });
    socket.on('validLogin', (data) => {
        if (data.res) {
            socket.emit('hasFriendRequest');
            socket.on('returnHasFriendRequest', (data) => {
                if (data.res) {
                    var friendButton = document.getElementById('friends-link');
                    friendButton.childNodes[0].childNodes[0].classList.add('notification');
                }
                socket.disconnect();
            });
        } else {
            socket.disconnect();
        }
    });
}

if (io !== undefined && username !== null && password !== null) {
    window.addEventListener('load', checkFriendRequests);
}
