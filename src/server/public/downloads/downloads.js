function getOS() {
    if (navigator.appVersion.indexOf('Win') !== -1) return 'Windows';
    else if (navigator.appVersion.indexOf('Mac') !== -1) return 'MacOS';
    else if (navigator.appVersion.indexOf('Linux') !== -1) return 'Linux';
    else return null;
}

function getArch(os) {
    if (os === 'Windows') {
        if (navigator.userAgent.indexOf("WOW64") !== -1 || navigator.userAgent.indexOf("Win64") !== -1)
            return '64';
        else
            return '32';
    } else if (os === 'MacOS') {
        return '64';
    }
}

function setOS(os) {
    var arch = getArch(os);
    var downloadLink = document.getElementById('download-link');
    if (arch !== undefined) {
        downloadLink.getElementsByTagName('button')[0].innerText = `Download for ${os} (${arch} bit)`;
    } else {
        downloadLink.getElementsByTagName('button')[0].innerText = `Download for ${os}`;
    }
    if (os === 'Windows') {
        if (arch === '64')
            downloadLink.href = 'https://github.com/WKHAllen/Indigio/releases/latest/download/Indigio-win32-x64-setup.exe';
        else
            downloadLink.href = 'https://github.com/WKHAllen/Indigio/releases/latest/download/Indigio-win32-ia32-setup.exe';
    }
    if (isElectron && downloadLink.href)
        electronifyLink(downloadLink);
    downloadLink.parentNode.classList.remove('invisible');
}

function main() {
    if (isElectron) {
        document.getElementById('no-downloads').classList.remove('invisible');
        var downloadLinks = document.getElementById('downloads').getElementsByTagName('a');
        for (var link of downloadLinks)
            electronifyLink(link);
    }
    var os = getOS();
    if (os !== null)
        setOS(os);
    else
        document.getElementById('platform-not-supported').classList.remove('invisible');
}

window.addEventListener('load', main);
