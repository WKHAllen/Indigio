const { app, BrowserWindow, globalShortcut } = require('electron');
const path = require('path');

var win;

var assetsDir = 'assets';

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
        icon: path.join(__dirname, assetsDir, 'icon.ico'),
        backgroundColor: '#001f4f',
        darkTheme: true,
        webPreferences: {
            nodeIntegration: true,
            devTools: false
        }
    });
    win.removeMenu();
    win.loadURL('http://localhost:3000');
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

