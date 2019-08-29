# Indigio

Indigio is an open source chatting app, and it is available on the web and as a desktop application. The app is deployed at [indigio.co](https://www.indigio.co/). You can download the desktop version of the app at [indigio.co/downloads](https://www.indigio.co/downloads/).

## Details

### Security

HTTPS is enforced throughout the site, so all traffic is secure.

### Password Security

Passwords are stored as bcrypt hashes. For more information on why I used bcrypt, [see this article](https://codahale.com/how-to-safely-store-a-password/).

### Password Reset Security

For security purposes, password reset IDs expire after an hour.

## Browser Compatibility

The app has been tested in multiple browsers. It works best in Chrome and Electron. The only problem in Firefox and Edge is that the scrollbars seem not to be styled. It does not work at all in Internet Explorer, but no one should be using IE anyway.

In the future, it will be tested in Safari as well.

It is highly recommended that users use Chrome if the desktop app is not preferable.

## Future Changes

There are still many things I would like to add to the app.

At the moment, all DOM manipulation is done with pure JavaScript. One of the things I hope to do in the future is replace much of the front-end JS code with React code.

All communication between the web page and the web server is currently being done with [Socket.io](https://socket.io/). In the future, I may replace Socket.io with AJAX. This is unlikely to happen, however, as Socket.io has client implementations in a variety of languages, and APIs could easily be designed for many of these languages.

## Contributing

If you would like to request a feature or report a problem, please [create an issue here](https://github.com/WKHAllen/Indigio/issues).
