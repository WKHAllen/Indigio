const packager = require('electron-packager');
const electronInstaller = require('electron-winstaller');

const version = '0.1.0';

async function build(platform, arch) {
    var bundleOptions = {
        'dir': '..',
        'platform': platform,
        'arch': arch,
        'appVersion': version,
        'asar': false,
        'executableName': 'Indigio',
        'icon': '../assets/favicon.ico',
        'ignore': ['build', 'README.md'],
        'name': 'Indigio',
        'out': 'build',
        'overwrite': true
    };
    await packager(bundleOptions);
    if (platform === 'win32') {
        var winstallerOptions = {
            'appDirectory': `build/Indigio-${platform}-${arch}`,
            'outputDirectory': `dist/Indigio-${platform}-${arch}`,
            'authors': 'Will Allen',
            'exe': 'Indigio.exe',
            'description': 'Indigio is a chatting app available on the web and as a desktop application',
            'version': version,
            'title': 'Indigio',
            'name': 'Indigio',
            'iconUrl': 'https://www.indigio.co/favicon.ico',
            'setupIcon': '../assets/favicon.ico',
            'setupExe': `Indigio-${version}-setup.exe`,
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
    var builds = [
        ['win32', 'ia32'],
        ['win32', 'x64'],
        // ['darwin', 'x64'], // (node:14820) UnhandledPromiseRejectionWarning: TypeError [ERR_INVALID_ARG_TYPE]: The "path" argument must be one of type string, Buffer, or URL. Received type undefined
        ['linux', 'ia32'],
        ['linux', 'x64']
    ];
    for (var b of builds) {
        await build(b[0], b[1]);
    }
}

main();
