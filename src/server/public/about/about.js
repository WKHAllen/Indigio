window.addEventListener('load', () => {
    if (isElectron) {
        var repoLink = document.getElementById('repo-link');
        electronifyLink(repoLink);
    }
    if (!inGoodBrowser) {
        document.getElementById('browser-warning').classList.remove('invisible');
    }
});
