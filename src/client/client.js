const { app, BrowserWindow, globalShortcut } = require('electron');

var win;

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
        // icon
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

