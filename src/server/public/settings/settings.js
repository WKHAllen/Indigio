var settings = JSON.parse(localStorage.getItem(localSettings));
if (settings === null) {
    settings = defaultSettings;
}

function updateTextSize() {
    var value = parseInt(document.getElementById('text-size').value);
    if (value !== NaN) {
        settings.textSize = value;
        localStorage.setItem(localSettings, JSON.stringify(settings));
    }
}

function updateImageSize() {
    var value = parseInt(document.getElementById('image-size').value);
    if (value !== NaN) {
        settings.imageSize = value;
        localStorage.setItem(localSettings, JSON.stringify(settings));
    }
}

function updateLightTheme() {
    window.open('https://kotaku.com/nobody-understands-the-people-who-use-discords-light-th-1825305763', '_blank');
    document.getElementById('light-theme-option').innerText = 'No';
}

function reset() {
    settings = defaultSettings;
    localStorage.setItem(localSettings, JSON.stringify(settings));
    populateSettings();
}

function populateSettings() {
    document.getElementById('text-size').value = settings.textSize;
    document.getElementById('image-size').value = settings.imageSize;
}

window.addEventListener('load', populateSettings);
