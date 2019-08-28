window.addEventListener('load', () => {
    if (isElectron) {
        electronifyLink(document.getElementById('repo-link'));
        electronifyLink(document.getElementById('browser-app-link'));
    }
    if (!inGoodBrowser)
        document.getElementById('browser-warning').classList.remove('invisible');
});
