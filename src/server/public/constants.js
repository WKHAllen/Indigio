// there must be a more secure way of doing this than storing username and password to localStorage or cookies
const localUsername = 'IndigioUsername';
const localPassword = 'IndigioPassword';
const localSettings = 'IndigioSettings';

const defaultSettings = { 'textSize': 12, 'imageSize': 24 };

if (localStorage.getItem(localSettings) === null)
    localStorage.setItem(localSettings, JSON.stringify(defaultSettings));
