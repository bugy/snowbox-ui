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
        startMock();
    };
}

function startMock() {
    mockServer = true;
    socket = null;

    mockEnemies();
}

function dispatchMessage(message) {
    console.log('message=', message);

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
    } else if (message.type === 'enemyConnected') {
        handleEnemyConnected(message);
        return;
    } else if (message.type === 'enemyDisconnected') {
        handleEnemyDisconnected(message);
        return;
    } else if (message.type === 'enemyMoved') {
        handleEnemyMoved(message);
        return;
    } else if (message.type === 'enemyStopped') {
        handleEnemyStopped(message);
        return;
    }
}

function sendStartGame(playerName, skin) {
    var timer;

    var send = function () {
        if (mockServer) {
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
            movementTimer = null;
        }

        if ((xDirection === 0) && (yDirection === 0)) {
            dispatchMessage({
                'type': 'playerStopped',
                'x': player.x,
                'y': player.y
            });
            return;
        }

        var angle = directionsToAngle(xDirection, yDirection);
        var deltaX = Math.cos(angle) * 2;
        var deltaY = Math.sin(angle) * 2;

        dispatchMessage({
            'type': 'playerMoved',
            'x': player.x + deltaX,
            'y': player.y + deltaY,
            'angle': angle,
            'velocity': 15
        });

        var newDirectionX = xDirection;
        var newDirectionY = yDirection;

        movementTimer = setInterval(function () {
            var boundedX = null;

            if ((newDirectionX < 0) && (player.x <= 0)) {
                boundedX = 0;
                newDirectionX = 0;
            } else if ((newDirectionX > 0) && (player.right >= game.world.width)) {
                boundedX = game.world.width - player.width;
                newDirectionX = 0;
            }

            var boundedY = null;
            if ((newDirectionY < 0) && (player.y <= 0)) {
                boundedY = 0;
                newDirectionY = 0;
            } else if ((newDirectionY > 0) && (player.bottom >= game.world.height)) {
                boundedY = game.world.height - player.height;
                newDirectionY = 0;
            }

            if ((boundedX !== null) || (boundedY !== null)) {
                if ((newDirectionX === 0) && (newDirectionY === 0)) {
                    dispatchMessage({
                        'type': 'playerStopped',
                        'x': boundedX || player.x,
                        'y': boundedY || player.y
                    });
                    clearInterval(movementTimer);
                    movementTimer = null;

                } else {
                    var angle = directionsToAngle(newDirectionX, newDirectionY);

                    dispatchMessage({
                        'type': 'playerMoved',
                        'x': boundedX || player.x,
                        'y': boundedY || player.y,
                        'angle': angle,
                        'velocity': 15
                    });
                }
            }
        }, 20);
    }
}

function mockEnemies() {
    setTimeout(function () {
        for (i = 0; i < 3; i++) {
            startEnemyLoop();
        }
    }, 2000);
}

function startEnemyLoop() {
    var enemyNames = ['Garry', 'Boogeyman', 'Ki113R', 'snowman', 'Destroyer', '111111'];
    var skins = ['boy', 'girl'];

    var skin = randomElement(skins);
    var id = Math.random();
    var name = randomElement(enemyNames);

    dispatchMessage({
        'type': 'enemyConnected',
        'id': id,
        'x': randomInt(game.world.width - player.width),
        'y': randomInt(game.world.height - player.height),
        'skin': skin,
        'name': name
    });

    var connected = true;

    setInterval(function () {
        var rnd = Math.random();

        if (rnd < 0.0005) {
            connected = !connected;

            if (connected) {
                skin = randomElement(skins);
                id = Math.random();
                name = randomElement(enemyNames);

                dispatchMessage({
                    'type': 'enemyConnected',
                    'id': id,
                    'x': randomInt(game.world.width - player.width),
                    'y': randomInt(game.world.height - player.height),
                    'skin': skin,
                    'name': name
                });
            } else {
                dispatchMessage({
                    'type': 'enemyDisconnected',
                    'id': id
                });
            }
        } else if ((rnd < 0.1) && (connected)) {
            var xDirection = randomInt(3) - 1;
            var yDirection = randomInt(3) - 1;

            if ((xDirection === 0) && (yDirection === 0)) {
                dispatchMessage({
                    'type': 'enemyStopped',
                    'id': id,
                    'x': enemiesMap.get(id).x,
                    'y': enemiesMap.get(id).y
                });
            } else {
                var angle = directionsToAngle(xDirection, yDirection);

                dispatchMessage({
                    'type': 'enemyMoved',
                    'id': id,
                    'x': enemiesMap.get(id).x,
                    'y': enemiesMap.get(id).y,
                    'angle': angle,
                    'velocity': 15
                });
            }
        }
    }, 100);
}

function randomInt(max) {
    return Math.floor(Math.random() * max);
}

function randomElement(arr) {
    var index = randomInt(arr.length);
    return arr[index];
}

function directionsToAngle(directionX, directionY) {
    return Phaser.Math.angleBetween(0, 0, directionX, directionY);
}
