if (require('electron-squirrel-startup')) return;
const { app, BrowserWindow, globalShortcut } = require('electron');
const path = require('path');

var win;

var assetsDir = 'assets';
var iconFile = 'favicon.ico';
if (process.platform === 'darwin')
    iconFile = 'favicon.icns';
else if (process.platform === 'linux')
    iconFile = 'favicon.png';

function toggleKiosk() {
    win.setKiosk(!win.isKiosk());
}

function createWindow() {
    win = new BrowserWindow({
        width: 1000,
        height: 600,
        center: true,
        frame: false,
        title: 'Indigio',
        icon: path.join(__dirname, assetsDir, iconFile),
        backgroundColor: '#001f4f',
        darkTheme: true,
        webPreferences: {
            nodeIntegration: true,
            devTools: false
        }
    });
    win.removeMenu();
    win.loadURL('https://indigio.herokuapp.com/');
    win.on('closed', () => {
        win = null
    });
    globalShortcut.register('CommandOrControl+Shift+F', () => {
        toggleKiosk();
    });
}

app.on('ready', createWindow);
app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

app.on('activate', () => {
    if (win === null) {
        createWindow();
    }
});

