function stripWhitespace(str) {
    return str.replace(/^\s+|\s+$/g, '');
}

function runLast() {
    var command = document.getElementById('command').innerHTML;
    console.log(command);
    command = stripWhitespace(command);
    console.log(command);
    document.getElementById('stmt').value = command;
    document.getElementById('command-form').submit();
}
