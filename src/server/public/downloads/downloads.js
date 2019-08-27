function setOS(os) {
    var downloadLink = document.getElementById('download-link');
    downloadLink.getElementsByTagName('button')[0].innerText = `Download for ${os}`;
    if (os === 'Windows')
        downloadLink.href = 'https://github.com/WKHAllen/Indigio/releases/latest/download/Indigio-setup.exe';
    if (isElectron && downloadLink.href)
        electronifyLink(downloadLink);
    downloadLink.parentNode.classList.remove('invisible');
}

function main() {
    if (isElectron)
        document.getElementById('no-downloads').classList.remove('invisible');
    if (navigator.appVersion.indexOf('Win') != -1) setOS('Windows');
    else if (navigator.appVersion.indexOf('Mac') != -1) setOS('MacOS');
    else if (navigator.appVersion.indexOf('Linux') != -1) setOS('Linux');
    else document.getElementById('platform-not-supported').classList.remove('invisible');
}

window.addEventListener('load', main);
