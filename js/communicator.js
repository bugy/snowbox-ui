var mockServer = false;
var movementTimer = null;
var socket;

function connectToServer() {
    var hash = window.location.hash;
    if (hash && (hash.toLowerCase().indexOf('mock') >= 0)) {
        setTimeout(startMock, 10);
        return;
    }

    var protocol = location.protocol === 'https:' ? 'wss' : 'ws'; 
    socket = new WebSocket(protocol + '://' + window.location.hostname + ':' + window.location.port + window.location.pathname + '/api/movement');

    socket.addEventListener("message", function (rawMessage) {
        var message = JSON.parse(rawMessage.data);

        dispatchMessage(message);
    });

    socket.onerror = function (evt) {
        startMock();
    };
}

function startMock() {
    mockServer = true;
    socket = null;
}

function dispatchMessage(message) {
	if (window.location.hostname === 'localhost') {
		console.log('message=', message);
	}

    if (message.type === 'playerMoved') {
        handlePlayerMoved(message);
        return;
    } else if (message.type === 'playerStopped') {
        handlePlayerStopped(message);
        return;
    } else if (message.type === 'snowballChanged') {
        handleSnowballChanged(message);
        return;
    } else if (message.type === 'gameStarted') {
        handleGameStarted(message);
        return;
    } else if (message.type === 'playerConnected') {
        handleEnemyConnected(message);
        return;
    } else if (message.type === 'playerDisconnected') {
        handleEnemyDisconnected(message);
        return;
    } else if (message.type === 'playerScoreChanged') {
        handlePlayerScoreChanged(message);
        return;
    } else if (message.type === 'playerScored') {
        handlePlayerScored(message);
        return;
    } else if (message.type === 'snowballCountChanged') {
        handleSnowballCountChanged(message);
        return;
    }
}

function sendStartGame(playerName, skin) {
    var timer;

    var trySend = function () {
        var message = {
            'type': 'connectToGame',
            'playerName': playerName,
            'skin': skin
        };

        if (mockServer) {
            sendToServer(message);
            clearInterval(timer);
        } else {
            if ((socket) && (socket.readyState === WebSocket.OPEN)) {
                sendToServer(message);
                clearInterval(timer);
            }
        }
    };

    timer = setInterval(trySend, 1000);
    trySend();
}

function sendToServer(message) {
    if (mockServer) {
        mockSend(message);
    } else {
        socket.send(JSON.stringify(message));
    }
}

function sendThrowBall(pointerX, pointerY) {
    sendToServer({
        "type": 'throwBall',
        "pointerX": pointerX,
        "pointerY": pointerY
    });
}

function sendPlayerMove(xDirection, yDirection) {
    sendToServer({
        "type": 'movePlayer',
        "xDirection": xDirection,
        "yDirection": yDirection
    });
}
