var mockServer = false;
var movementTimer = null;
var socket;

function connectToServer() {
    socket = new WebSocket('ws://selim.co:8080/api/movement');

    socket.addEventListener("message", function (rawMessage) {
        var message = JSON.parse(rawMessage.data);

        dispatchMessage(message);
    });

    socket.onerror = function (evt) {
        mockServer = true;
        socket = null;
    };
}

function dispatchMessage(message) {
    if (message.type === 'playerMoved') {
        handlePlayerMove(message);
        return;
    } else if (message.type === 'snowballChanged') {
        handleSnowballChanged(message);
        return;
    } else if (message.type === 'gameStarted') {
        handleGameStarted(message);
        return
    }
}

function sendStartGame(playerName, skin) {
    var timer;

    var send = function () {
        if (true) { // TODO change to mockServer check
            dispatchMessage({
                'type': 'gameStarted',
                'width': 1024,
                'height': 1024,
                'skin': skin,
                'playerName': playerName
            });
            clearInterval(timer);
        } else {
            if ((socket) && (socket.readyState === WebSocket.OPEN)) {
                socket.send(JSON.stringify({
                    'type': 'connectToGame',
                    'playerName': playerName,
                    'skin': skin
                }));
                clearInterval(timer);
            }
        }
    };

    timer = setInterval(send, 1000);
    send();
}

function sendThrowBall(pointerX, pointerY) {
    if (!mockServer) {
        socket.send(JSON.stringify({
            "type": 'throwBall',
            "pointerX": pointerX,
            "pointerY": pointerY
        }));

    } else {
        var angle = Phaser.Math.angleBetween(player.centerX, player.centerY, pointerX, pointerY);

        dispatchMessage({
            'type': 'snowballChanged',
            'id': Math.random(),
            'x': player.centerX,
            'y': player.centerY,
            'velocity': 45,
            'angle': angle
        });
    }
}

function sendPlayerMove(xDirection, yDirection) {
    if (!mockServer) {
        socket.send(JSON.stringify({
            "type": 'movePlayer',
            "xDirection": xDirection,
            "yDirection": yDirection
        }));
    } else {
        if (movementTimer) {
            clearInterval(movementTimer);
        }

        if ((xDirection === 0) && (yDirection === 0)) {
            return;
        }

        var angle = Phaser.Math.angleBetween(0, 0, xDirection, yDirection);
        var deltaX = Math.cos(angle) * 2;
        var deltaY = Math.sin(angle) * 2;

        movementTimer = setInterval(function () {
            dispatchMessage({
                'type': 'playerMoved',
                'x': player.x + deltaX,
                'y': player.y + deltaY
            });
        }, 20);
    }
}
