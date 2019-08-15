function main() {
    if (isElectron) {
        document.getElementById('downloads').classList.add('invisible');
        document.getElementById('no-downloads').classList.remove('invisible');
    }
}

window.addEventListener('load', main);
