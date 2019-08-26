# Indigio

Indigio is an open source chatting app, and it is available on the web and as a desktop application.

## Details

### Security

HTTPS is enforced throughout the site, so all traffic is secure.

### Password Security

Passwords are stored as bcrypt hashes. For more information on why I used bcrypt, [see this article](https://codahale.com/how-to-safely-store-a-password/).

### Password Reset Security

For security purposes, password reset IDs expire after an hour.

## Deployment

Indigio is currently deployed at [indigio.co](https://www.indigio.co/). The app is functional, although there are still many things I would like to add to it.

## Browser Compatibility

The app has been tested in multiple browsers. It works best in Chrome and Electron. The only problem in Firefox and Edge is that the scrollbars seem not to be styled. It does not work at all in Internet Explorer, but no one should be using IE anyway.

In the future, it will be tested in Safari as well.

It is highly recommended that users use Chrome if the desktop app is not preferable.

## Contributing

If you would like to request a feature or report a problem, please [create an issue here](https://github.com/WKHAllen/Indigio/issues).
