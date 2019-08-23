function setOS(os) {
    var downloadButton = document.getElementById('download-button');
    downloadButton.innerText = `Download for ${os}`;
    // TODO: set downloadButton.onclick to download the correct file
}

function main() {
    if (isElectron) {
        document.getElementById('no-downloads').classList.remove('invisible');
    }
    if (navigator.appVersion.indexOf("Win") != -1) setOS("Windows");
    else if (navigator.appVersion.indexOf("Mac") != -1) setOS("MacOS");
    else if (navigator.appVersion.indexOf("Linux") != -1) setOS("Linux");
}

window.addEventListener('load', main);
