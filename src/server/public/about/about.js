window.addEventListener('load', () => {
    if (isElectron) {
        const open = require('open');
        var repoLink = document.getElementById('repo-link');
        var repoURL = repoLink.getAttribute('href');
        repoLink.onclick = async function() {
            await open(repoURL);
        }
        repoLink.removeAttribute('href');
        repoLink.removeAttribute('target');
        repoLink.style.cursor = 'pointer';
    }
});
