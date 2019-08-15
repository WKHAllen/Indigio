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

if (localStorage.getItem(localSettings) === null)
    localStorage.setItem(localSettings, JSON.stringify(defaultSettings));

var isElectron = (window && window.process && window.process.type) !== undefined;
if (isElectron) {
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
