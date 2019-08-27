const packager = require('electron-packager');
const path = require('path');
const fs = require('fs');

var optionsFile = '../package.json';
var appName = 'Indigio';

async function packageApp(platform, options) {
    var iconFile = '../assets/favicon.ico';
    if (platform === 'darwin')
        iconFile = '../assets/favicon.icns';
    if (platform === 'linux')
        iconFile = 'resources/app/assets/favicon.png';
    var bundleOptions = {
        'dir': '..',
        'platform': platform,
        'arch': 'all',
        'appVersion': options.version,
        'asar': false,
        'executableName': appName,
        'icon': iconFile,
        'ignore': ['build', 'README.md'],
        'name': appName,
        'out': 'build',
        'overwrite': true
    };
    return await packager(bundleOptions);
}

async function packageAll(options) {
    await packageApp('all', options);
}

async function buildWindows(options) {
    const windowsInstaller = require('electron-winstaller');
    var packagePaths = await packageApp('win32', options);
    var iconFile = '../assets/favicon.ico';
    for (var packagePath of packagePaths) {
        var packageDir = path.basename(packagePath);
        var windowsOptions = {
            'appDirectory': `build/${packageDir}`,
            'outputDirectory': `dist/${packageDir}`,
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
        await windowsInstaller.createWindowsInstaller(windowsOptions);
    }
}

async function buildDarwin(options) {
    const darwinInstaller = require('electron-installer-dmg');
    var packagePaths = await packageApp('darwin', options);
    var iconFile = '../assets/favicon.icns';
    for (var packagePath of packagePaths) {
        var packageDir = path.basename(packagePath);
        var darwinOptions = {
            'appPath': `build/${packageDir}/${appName}.app`,
            'name': appName,
            'title': appName,
            'icon': iconFile,
            'overwrite': true,
            'debug': true,
            'out': `dist/${packageDir}`
        };
        darwinInstaller(darwinOptions, (err) => {
            if (err) throw err;
        });
    }
}

async function buildLinux(options) {
    const linuxInstaller = require('electron-installer-debian');
    var packagePaths = await packageApp('linux', options);
    var iconFile = 'resources/app/assets/favicon.png';
    for (var packagePath of packagePaths) {
        var packageDir = path.basename(packagePath);
        var linuxOptions = {
            'src': `build/${packageDir}`,
            'dest': `dist/${packageDir}`,
            'name': appName.toLowerCase(),
            'productName': appName,
            'genericName': appName,
            'description': options.description,
            'productDescription': options.description,
            'version': options.version,
            'maintainer': options.author,
            'homepage': 'https://github.com/WKHAllen/Indigio',
            'bin': appName,
            'icon': iconFile
        };
        await linuxInstaller(linuxOptions);
    }
}

async function buildPrimary(options) {
    await buildWindows(options);
    await buildDarwin(options);
    await buildLinux(options);
}

async function buildCurrent(options) {
    if (process.platform === 'win32')
        await buildWindows(options);
    else if (process.platform === 'darwin')
        await buildDarwin(options);
    else if (process.platform === 'linux')
        await buildLinux(options);
    else
        throw 'platform not supported';
}

async function main() {
    fs.readFile(optionsFile, 'utf8', async (err, data) => {
        if (err) throw err;
        var options = JSON.parse(data);
        await buildCurrent(options);
    });
}

main();
