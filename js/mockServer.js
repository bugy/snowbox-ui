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
        'height': 768,
        'skin': message.skin,
        'playerName': message.playerName,
        'maxSnowballs': 5,
        'trees': mockTrees()
    });

    mockEnemies();
    mockSnowballsReload();

    snowballs.callAll('events.onOutOfBounds.add', 'events.onOutOfBounds', mockSnowballOutOfBounds);
    snowballs.setAll('outOfBoundsKill', false);
}

function mockTrees() {
    return [
        {
            'x': game.world.width * 0.25 - 50,
            'y': game.world.height * 0.28 - 50,
            'width': 90,
            'height': 40,
            'type': 'pinale'
        },
        {
            'x': game.world.width * 0.5 - 30,
            'y': game.world.height * 0.7 - 50,
            'width': 90,
            'height': 40,
            'type': 'pinale'
        },
        {
            'x': game.world.width * 0.85 - 10,
            'y': game.world.height * 0.5 - 50,
            'width': 30,
            'height': 40,
            'type': 'broadleaf'
        }
    ]
}

function mockThrowBall(message) {
    var snowballsCount = player.model.snowballsCount();
    if (snowballsCount <= 0) {
        return;
    }

    dispatchMessage({
        'type': 'snowballCountChanged',
        'newCount': snowballsCount - 1
    });

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
        'velocity': 90,
        'angle': angle
    });
}

function mockSnowballOutOfBounds(snowball) {
    var snowballId = mockGetSnowballId(snowball);
    if (!snowballId) {
        return;
    }

    dispatchMessage({
        'type': 'snowballChanged',
        'id': snowballId,
        'x': snowball.x,
        'y': snowball.y,
        'deleted': true
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
            'x': player.centerX,
            'y': player.centerY
        });
        return;
    }

    var angle = directionsToAngle(xDirection, yDirection);
    var deltaX = Math.cos(angle) * 2;
    var deltaY = Math.sin(angle) * 2;

    dispatchMessage({
        'type': 'playerMoved',
        'id': playerId,
        'x': player.centerX,
        'y': player.centerY,
        'angle': angle,
        'velocity': 15
    });

    var newDirectionX = xDirection;
    var newDirectionY = yDirection;

    movementTimer = setInterval(function () {
        var boundedX = null;

        if ((newDirectionX < 0) && (player.body.x <= 0)) {
            boundedX = player.body.width / 2;
            newDirectionX = 0;
        } else if ((newDirectionX > 0) && (player.body.right >= game.world.width)) {
            boundedX = game.world.width - player.body.width / 2;
            newDirectionX = 0;
        }

        var boundedY = null;
        if ((newDirectionY < 0) && (player.body.y <= 0)) {
            boundedY = player.body.height / 2;
            newDirectionY = 0;
        } else if ((newDirectionY > 0) && (player.body.bottom >= game.world.height)) {
            boundedY = game.world.height - player.body.height / 2;
            newDirectionY = 0;
        }

        if ((boundedX !== null) || (boundedY !== null)) {
            if ((newDirectionX === 0) && (newDirectionY === 0)) {
                dispatchMessage({
                    'type': 'playerStopped',
                    'id': playerId,
                    'x': boundedX || player.centerX,
                    'y': boundedY || player.centerY
                });
                clearInterval(movementTimer);
                movementTimer = null;

            } else {
                var angle = directionsToAngle(newDirectionX, newDirectionY);

                dispatchMessage({
                    'type': 'playerMoved',
                    'id': playerId,
                    'x': boundedX || player.centerX,
                    'y': boundedY || player.centerY,
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

function mockSnowballsReload() {
    setInterval(function () {
        var count = Math.max(0, player.model.snowballsCount()) + 1;
        if (count <= player.model.maxSnowballs) {
            dispatchMessage({
                'type': 'snowballCountChanged',
                'newCount': count
            });
        }

    }, 1000);
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
                    'x': enemiesMap.get(id).centerX,
                    'y': enemiesMap.get(id).centerY
                });
            } else {
                var angle = directionsToAngle(xDirection, yDirection);

                dispatchMessage({
                    'type': 'playerMoved',
                    'id': id,
                    'x': enemiesMap.get(id).centerX,
                    'y': enemiesMap.get(id).centerY,
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
            game.physics.arcade.overlap(player, snowballSprite, mockSnowballHitPlayer, null, this);
        }
    });

    enemiesMap.forEach(function (enemy, enemyId) {
        snowballMap.forEach(function (snowballSprite, snowballId) {
            var snowballOwner = mockedSnowballs.get(snowballId).owner;
            if (snowballOwner !== enemyId) {
                game.physics.arcade.overlap(enemy, snowballSprite, mockSnowballHitPlayer, null, this);
            }
        });
    });

    trees.forEach(function (tree) {
        game.physics.arcade.overlap(tree.trunk, snowballs, mockSnowballHitObstacle, null, this);
    });
}

function mockGetSnowballId(snowball) {
    var snowballId = null;
    snowballMap.forEach(function (value, id) {
        if (snowball === value) {
            snowballId = id;
        }
    });
    return snowballId;
}

function mockSnowballHitPlayer(targetPlayer, snowball) {
    var snowballId = mockGetSnowballId(snowball);

    if (!snowballId) {
        return;
    }

    var ownerId = mockedSnowballs.get(snowballId).owner;
    var targetId = targetPlayer.model.id;
    var scoreDelta = 10;

    dispatchMessage({
        'type': 'snowballChanged',
        'id': snowballId,
        'x': targetPlayer.centerX,
        'y': targetPlayer.centerY,
        'deleted': true
    });

    dispatchMessage({
        'type': 'playerScoreChanged',
        'playerId': ownerId,
        'newScore': getPlayer(ownerId).model.score() + scoreDelta
    });

    dispatchMessage({
        'type': 'playerScoreChanged',
        'playerId': targetId,
        'newScore': targetPlayer.model.score() - scoreDelta
    });

    if ((ownerId !== playerId) && (targetId !== playerId)) {
        return;
    }

    dispatchMessage({
        'type': 'playerScored',
        'playerId': ownerId,
        'scoreDelta': scoreDelta
    });

    dispatchMessage({
        'type': 'playerScored',
        'playerId': targetId,
        'scoreDelta': -scoreDelta
    });
}

function mockSnowballHitObstacle(target, snowball) {
    var snowballId = mockGetSnowballId(snowball);

    if (!snowballId) {
        return;
    }

    dispatchMessage({
        'type': 'snowballChanged',
        'id': snowballId,
        'x': snowball.x,
        'y': snowball.y,
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
