var mockedSnowballs = new Map();

function mockSend(message) {
    var type = message.type;

    if (type === 'connectToGame') {
        mockConnectToGame(message);
        return;
    } else if (type === 'throwBall') {
        mockThrowBall(message);
        return;
    } else if (type === 'movePlayer') {
        mockMovePlayer(message);
        return;
    }
}

function mockConnectToGame(message) {
    dispatchMessage({
        'type': 'gameStarted',
        'id': randomId(),
        'width': 1024,
        'height': 1024,
        'skin': message.skin,
        'playerName': message.playerName
    });

    mockEnemies();
}

function mockThrowBall(message) {
    var angle = Phaser.Math.angleBetween(
        player.centerX,
        player.centerY,
        message.pointerX,
        message.pointerY);

    var id = randomId();

    mockedSnowballs.set(id, {'id': id, 'owner': playerId});

    dispatchMessage({
        'type': 'snowballChanged',
        'id': id,
        'x': player.centerX,
        'y': player.centerY,
        'velocity': 45,
        'angle': angle
    });
}

function mockMovePlayer(message) {
    var xDirection = message.xDirection;
    var yDirection = message.yDirection;

    if (movementTimer) {
        clearInterval(movementTimer);
        movementTimer = null;
    }

    if ((xDirection === 0) && (yDirection === 0)) {
        dispatchMessage({
            'type': 'playerStopped',
            'id': playerId,
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
        'id': playerId,
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
                    'id': playerId,
                    'x': boundedX || player.x,
                    'y': boundedY || player.y
                });
                clearInterval(movementTimer);
                movementTimer = null;

            } else {
                var angle = directionsToAngle(newDirectionX, newDirectionY);

                dispatchMessage({
                    'type': 'playerMoved',
                    'id': playerId,
                    'x': boundedX || player.x,
                    'y': boundedY || player.y,
                    'angle': angle,
                    'velocity': 15
                });
            }
        }
    }, 20);
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
    var id = randomId();
    var name = randomElement(enemyNames);

    dispatchMessage({
        'type': 'playerConnected',
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
                id = randomId();
                name = randomElement(enemyNames);

                dispatchMessage({
                    'type': 'playerConnected',
                    'id': id,
                    'x': randomInt(game.world.width - player.width),
                    'y': randomInt(game.world.height - player.height),
                    'skin': skin,
                    'name': name
                });
            } else {
                dispatchMessage({
                    'type': 'playerDisconnected',
                    'id': id
                });
            }
        } else if ((rnd < 0.1) && (connected)) {
            var xDirection = randomInt(3) - 1;
            var yDirection = randomInt(3) - 1;

            if ((xDirection === 0) && (yDirection === 0)) {
                dispatchMessage({
                    'type': 'playerStopped',
                    'id': id,
                    'x': enemiesMap.get(id).x,
                    'y': enemiesMap.get(id).y
                });
            } else {
                var angle = directionsToAngle(xDirection, yDirection);

                dispatchMessage({
                    'type': 'playerMoved',
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

function updateMock() {
    snowballMap.forEach(function (snowballSprite, snowballId) {
        var snowballOwner = mockedSnowballs.get(snowballId).owner;
        if (snowballOwner !== playerId) {
            game.physics.arcade.overlap(player, snowballSprite, mockSnowballHit, null, this);
        }
    });

    enemiesMap.forEach(function (enemy, enemyId) {
        snowballMap.forEach(function (snowballSprite, snowballId) {
            var snowballOwner = mockedSnowballs.get(snowballId).owner;
            if (snowballOwner !== enemyId) {
                game.physics.arcade.overlap(enemy, snowballSprite, mockSnowballHit, null, this);
            }
        });
    });
}

function mockSnowballHit(playerSprite, snowball) {
    var snowballId = null;
    snowballMap.forEach(function (value, id) {
        if (snowball === value) {
            snowballId = id;
        }
    });

    if (!snowballId) {
        return;
    }

    dispatchMessage({
        'type': 'snowballChanged',
        'id': snowballId,
        'x': playerSprite.centerX,
        'y': playerSprite.centerY,
        'deleted': true
    });
}

function randomInt(max) {
    return Math.floor(Math.random() * max);
}

function randomElement(arr) {
    var index = randomInt(arr.length);
    return arr[index];
}

var idCounter = 0;

function randomId() {
    var id = idCounter++;
    return '' + id;
}
