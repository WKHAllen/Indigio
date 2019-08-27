const packager = require('electron-packager');
const electronInstaller = require('electron-winstaller');
const fs = require('fs');

var optionsFile = '../package.json';
var appName = 'Indigio';

async function build(platform, arch, options) {
    var iconFile = '../assets/favicon.ico';
    if (platform === 'darwin') {
        iconFile = '../assets/favicon.icns';
    }
    var bundleOptions = {
        'dir': '..',
        'platform': platform,
        'arch': arch,
        'appVersion': options.version,
        'asar': false,
        'executableName': appName,
        'icon': iconFile,
        'ignore': ['build', 'README.md'],
        'name': appName,
        'out': 'build',
        'overwrite': true
    };
    await packager(bundleOptions);
    if (platform === 'win32') {
        var winstallerOptions = {
            'appDirectory': `build/${appName}-${platform}-${arch}`,
            'outputDirectory': `dist/${appName}-${platform}-${arch}`,
            'authors': 'Will Allen',
            'exe': `${appName}.exe`,
            'description': options.description,
            'version': options.version,
            'title': appName,
            'name': appName,
            'iconUrl': 'https://www.indigio.co/favicon.ico',
            'setupIcon': iconFile,
            'setupExe': `${appName}-${options.version}-setup.exe`,
            'noMsi': true
        };
        await electronInstaller.createWindowsInstaller(winstallerOptions);
    } else if (platform === 'darwin') {
        // TODO: create macOS installer
    } else if (platform === 'linux') {
        // TODO: create linux installer
    }
}

async function main() {
    fs.readFile(optionsFile, 'utf8', async (err, data) => {
        if (err) throw err;
        var options = JSON.parse(data);
        var builds = [
            ['win32', 'ia32'],
            // ['win32', 'x64'],
            // ['darwin', 'x64'], // (node:14820) UnhandledPromiseRejectionWarning: TypeError [ERR_INVALID_ARG_TYPE]: The "path" argument must be one of type string, Buffer, or URL. Received type undefined
            ['linux', 'ia32'],
            // ['linux', 'x64']
        ];
        for (var b of builds) {
            await build(b[0], b[1], options);
        }
    });
}

main();
