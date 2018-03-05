$(document).ready(function () {
    var ws, user;
    // check if browser supports WebSocket
    if (window.WebSocket === undefined) {
        $('#messages').append("Your browser does not support WebSockets");
        return;
    }

    // create new WS connection
    ws = new WebSocket('ws://' + window.location.host + '/ws')
    // callback if we got a message from server
    ws.onmessage = function (e) {
        var m = JSON.parse(e.data);
        $("#messages").append('<p><strong>' + m.username + ':</strong> ' + m.message 
        + '<span style="display:inline; float:right; paddint-left: 5px;">' + m.time+ '</span>' + '</p>');
        $('#messages').animate({scrollTop: $('#messages').prop("scrollHeight")}, 500);
    };

    // join to chat
    $('#joinbtn').click(function () {
        if ($.trim($('#usr').val()).length < 1) {
            $('#mbox').show().delay(4000).fadeOut();
            return
        }

        user = $('#usr').val()
        ws.send(JSON.stringify({ username: user, message: " joined the chat" }));
        $('#enter').hide();
        $('#umsg').show();
    });

    // send message by "send" button
    $('#sendbtn').click(function () {
        send();
    });

    // send message by "Enter" key
    $("#msg").keyup(function (e) {
        if (e.keyCode == 13) {
            e.preventDefault();
            send();
        }
    });

    // send message in JSON
    function send() {
        if ($.trim($('#msg').val()).length < 1) {
            $('#mbox').show().delay(4000).fadeOut();
            return
        }

        var date = new Date();
        var dt = date.getHours();
        dt += date.getMinutes() < 10 ? ":0" + date.getMinutes() : ":" + date.getMinutes();
        ws.send(JSON.stringify({ username: user, message: $('#msg').val(), time: dt }));
        $('#msg').val('');
    }

    // notify server when user close app window
    window.onbeforeunload = function() {
        ws.send(JSON.stringify({ username: user, message: " left the chat" }));
    };
});