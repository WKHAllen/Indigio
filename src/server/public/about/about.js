window.addEventListener('load', () => {
    if (isElectron) {
        var repoLink = document.getElementById('repo-link');
        electronifyLink(repoLink);
    }
});
