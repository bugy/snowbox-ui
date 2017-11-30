Phaser.Sprite.prototype.alignInParent = function (position, offsetX, offsetY) {
    if ((!this.parent) || (this.parent.name === "__world")) {
        return;
    }

    var s = this.parent.scale;
    this.parent.scale.setTo(1);
    this.alignIn(this.parent, position, offsetX, offsetY);

    var anchorX;
    var anchorY;
    if (this.parent.anchor) {
        anchorX = this.parent.anchor.x;
        anchorY = this.parent.anchor.y;
    } else {
        anchorX = 0;
        anchorY = 0;
    }

    this.left -= this.parent.left + (this.parent.width * anchorX);
    this.top -= this.parent.top + (this.parent.height * anchorY);

    this.parent.scale = s;
};

Phaser.Button.prototype.alignInParent = Phaser.Sprite.prototype.alignInParent;

var game = new Phaser.Game(window.innerWidth, window.innerHeight, Phaser.WEBGL, 'Snowbox', {
    preload: preload,
    create: create,
    update: update,
    render: render
});

function preload() {
    loadFonts(['Snowbox-normalFont']);

    game.stage.disableVisibilityChange = true;

    game.load.image('background', 'assets/snow_tile.jpg');
    game.load.spritesheet('boy', 'assets/boy.png', 48, 48);
    game.load.spritesheet('girl', 'assets/girl.png', 48, 48);

    preloadSprites();
    preloadSounds();
    preloadHelper();

    game.add.plugin(PhaserInput.Plugin);
    var plugin = game.plugins.add(Phaser.Plugin.AdvancedTiming);
    plugin.mode = 'domText';

    game.scale.scaleMode = Phaser.ScaleManager.RESIZE;
    game.scale.parentIsWindow = true;
    game.scale.refresh();
}

function loadFonts(fonts) {
    var loaderElement = document.getElementById('fontloader');
    loaderElement.style.fontFamily = fonts[0];

    setTimeout(function () {
        if (fonts.length <= 1) {
            loaderElement.parentElement.removeChild(loaderElement);
        } else {
            loadFonts(fonts.splice(1));
        }
    }, 0);
}

var player;
var snowballs;
var snowballSplashes;
var playerId;
var settingsButton;
var hudPanel;
var scoreEllipsis;

var snowballMap = new Map();
var enemiesMap = new Map();
var scoresMap = new Map();
var trees = [];
var movableObjects = [];

function create() {
    load9PatchImage('dialog', 'rpg_ui', 360, 336, 10, 10, 90, 90, 'panel_blue.png');
    load9PatchImage('textField', 'rpg_ui', 160, 40, 5, 5, 40, 40, 'buttonSquare_grey_pressed.png');
    load9PatchImage('squareButton', 'rpg_ui', 48, 48, 5, 5, 40, 40, 'buttonSquare_grey_pressed.png');
    load9PatchImage('hudPanel', 'rpg_ui', 160, 256, 5, 5, 40, 40, 'panel_beigeLight.png');

    game.renderer.renderSession.roundPixels = true;

    game.add.tileSprite(-1000, -1000, 4000, 4000, 'background');

    createSounds();

    connectToServer();

    if (window.location.hostname === 'localhost') {
        sendStartGame('buggy', Math.random() < 0.5 ? 'boy' : 'girl');
    } else {
        createStartDialog(sendStartGame);
    }

    initSettings();
}

function createScoreLabel(text, labelColor) {
    return game.add.text(24, 0, text, {
        font: "12px Snowbox-normalFont",
        fill: labelColor
    });
}

function initPlayer(id, x, y, name, skin, labelColor) {
    var sprite = createPlayerSprite(id, x, y, name, skin, labelColor);
    sprite.customVelocity = new Phaser.Point(0, 0);
    movableObjects.push(sprite);

    sprite.model = {
        id: id,
        name: name,
        score: ko.observable(0)
    };

    var scoreLabel = createScoreLabel(name + ': ' + sprite.model.score(), labelColor);
    hudPanel.add(scoreLabel);
    scoresMap.set(id, scoreLabel);
    refreshScoreList(sprite);

    sprite.model.score.subscribe(function () {
        scoreLabel.text = name + ': ' + sprite.model.score();

        refreshScoreList();
    });

    return sprite;
}

function handleGameStarted(data) {
    playerId = data.id;

    hudPanel = createHudPanel();

    game.world.setBounds(0, 0, data.width, data.height);
    game.scale.onSizeChange.add(function () {
        game.world.setBounds(0, 0, data.width, data.height);
    });

    drawBorder(data.width, data.height);

    game.physics.startSystem(Phaser.Physics.ARCADE);

    player = initPlayer(
        data.id,
        game.world.centerX,
        game.world.centerY,
        data.playerName,
        data.skin,
        '#0000d0');

    subscribeMoveButtons();

    game.camera.follow(player);
    game.camera.bounds = null;

    snowballs = game.add.group();
    snowballs.enableBody = true;
    snowballs.physicsBodyType = Phaser.Physics.ARCADE;

    snowballs.createMultiple(200, 'snowball');
    snowballs.setAll('checkWorldBounds', true);
    snowballs.setAll('outOfBoundsKill', true);
    snowballs.setAll('anchor.x', 0.5);
    snowballs.setAll('anchor.y', 0.5);
    var snowballWidth = snowballs.children[0].width;
    snowballs.callAll('body.setCircle', 'body', snowballWidth / 2, 0, 0);

    snowballSplashes = game.add.group();
    snowballSplashes.createMultiple(200, 'snowball_splash');
    snowballSplashes.setAll('scale.x', 0.5);
    snowballSplashes.setAll('scale.y', 0.5);
    snowballSplashes.setAll('anchor.x', 0.5);
    snowballSplashes.setAll('anchor.y', 0.5);
    snowballSplashes.callAll('animations.add', 'animations', 'explosion');

    snowballs.forEach(function (value) {
        value.customVelocity = new Phaser.Point(0, 0);
        movableObjects.push(value);
    });

    if (data.trees) {
        data.trees.sort(function (a, b) {
            return a.y - b.y;
        });

        data.trees.forEach(function (value) {
            var tree;
            if (value.type && (value.type === 'pinale')) {
                tree = createPineTree(value.width, value.height);
            } else {
                tree = createTree(value.width, value.height);
            }

            tree.x = value.x - value.width / 2 - tree.trunk.body.offset.x - tree.trunk.x * tree.scale.x;
            tree.y = value.y - value.height / 2 - tree.trunk.body.offset.y - tree.trunk.y * tree.scale.y;

            trees.push(tree);
        });
    }

    if (data.playersInfo) {
        data.playersInfo.forEach(function (value) {
            handleEnemyConnected(value);
        });
    }

    if (data.maxSnowballs) {
        player.model.maxSnowballs = data.maxSnowballs;
        player.model.snowballsCount = ko.observable(player.model.maxSnowballs);
        createPlayerAmmo(player);
    }

    switchMusic();

    var worldChildren = game.world.children.slice();
    worldChildren.forEach(function (child) {
        if (child.fixedToCamera) {
            game.world.bringToTop(child);
        }
    });

    var clickArea = game.add.sprite(0, 0);
    clickArea.fixedToCamera = true;
    clickArea.scale.setTo(game.width, game.height);
    clickArea.inputEnabled = true;
    clickArea.events.onInputDown.add(function () {
        sendThrowBall(
            game.input.mousePointer.x + game.camera.x,
            game.input.mousePointer.y + game.camera.y);
    });
    game.scale.onSizeChange.add(function (scaleManager, width, height) {
        clickArea.scale.setTo(width, height);
    });
    clickArea.sendToBack();
}

function createHudPanel() {
    var result = game.add.group();
    result.fixedToCamera = true;

    var hudPanel = game.add.sprite(0, 0, 'hudPanel');
    hudPanel.alpha = 0.7;

    scoreEllipsis = createScoreLabel('.....', '#906000');
    scoreEllipsis.parent.remove(scoreEllipsis);
    result.add(scoreEllipsis);

    result.add(hudPanel);
    alignToCamera(result, Phaser.TOP_RIGHT, 8, -8);

    game.world.bringToTop(settingsButton);
    game.world.bringToTop(settingsButton.panel);
    alignToCamera(
        settingsButton, Phaser.TOP_RIGHT,
        -8 - hudPanel.width,
        8);

    return result;
}

var subscribeMoveButtons = function () {
    var keys = [
        Phaser.Keyboard.UP, Phaser.Keyboard.DOWN,
        Phaser.Keyboard.LEFT, Phaser.Keyboard.RIGHT,
        Phaser.Keyboard.W, Phaser.Keyboard.A,
        Phaser.Keyboard.D, Phaser.Keyboard.S];

    for (var i = 0; i < keys.length; i++) {
        var keyHandler = game.input.keyboard.addKey(keys[i]);
        keyHandler.onDown.add(moveKeyPressed, this);
        keyHandler.onUp.add(moveKeyPressed, this);
    }
};

function animatePlayerMove(sprite, animationName) {
    if (!animationName) {
        if (sprite.animations.currentAnim) {
            sprite.animations.currentAnim.stop(true);
        }
    } else if (sprite.animations.currentAnim.name !== animationName) {
        sprite.animations.play(animationName);
    } else if (!sprite.animations.currentAnim.isPlaying) {
        sprite.animations.currentAnim.play();
    }
}

function moveKeyPressed() {
    var xDirection = 0;
    var yDirection = 0;

    var upPressed = game.input.keyboard.isDown(Phaser.Keyboard.UP)
        || game.input.keyboard.isDown(Phaser.Keyboard.W);
    var downPressed = game.input.keyboard.isDown(Phaser.Keyboard.DOWN)
        || game.input.keyboard.isDown(Phaser.Keyboard.S);

    var rightPressed = game.input.keyboard.isDown(Phaser.Keyboard.RIGHT)
        || game.input.keyboard.isDown(Phaser.Keyboard.D);
    var leftPressed = game.input.keyboard.isDown(Phaser.Keyboard.LEFT)
        || game.input.keyboard.isDown(Phaser.Keyboard.A);


    if (upPressed) {
        yDirection = -1;
    } else if (downPressed) {
        yDirection = 1;
    }

    if (leftPressed) {
        xDirection = -1;
    } else if (rightPressed) {
        xDirection = 1;
    }

    sendPlayerMove(xDirection, yDirection);

    var animationName = null;

    if (upPressed) {
        animationName = "moveTop";
    } else if (downPressed) {
        animationName = "moveBottom";
    } else if (leftPressed) {
        animationName = "moveLeft";
    } else if (rightPressed) {
        animationName = "moveRight";
    }

    animatePlayerMove(player, animationName);
}

function startSpriteMovement(sprite, x, y, velocity, angle) {
    sprite.position.set(
        x - sprite.width / 2,
        y - sprite.height / 2);

    game.physics.arcade.velocityFromRotation(
        angle, velocity, sprite.customVelocity);
}

function handlePlayerMoved(data) {
    var sprite = getPlayer(data.id);

    if (!sprite) {
        return;
    }

    startSpriteMovement(sprite, data.x, data.y, data.velocity, data.angle);

    if (sprite === player) {
        soundSteps(true);
    } else {
        var animationName = null;

        if (data.velocity !== 0) {
            var angle = -((data.angle + Math.PI) % (2 * Math.PI) - Math.PI);
            var degrees45 = Math.PI / 4;
            var degrees135 = degrees45 * 3;

            if ((angle >= degrees45) && (angle <= degrees135)) {
                animationName = "moveTop";
            } else if ((angle <= -degrees45) && (angle >= -degrees135)) {
                animationName = "moveBottom";
            } else if ((angle > degrees135) || (angle <= -degrees45)) {
                animationName = "moveLeft";
            } else {
                animationName = "moveRight";
            }
        }

        animatePlayerMove(sprite, animationName);
    }
}

function stopPlayerSprite(sprite, x, y) {
    sprite.customVelocity.setTo(0, 0);
    sprite.position.set(
        x - sprite.width / 2,
        y - sprite.height / 2);
}

function getPlayer(id) {
    if (id === playerId) {
        return player;
    } else {
        return enemiesMap.get(id);
    }
}

function handlePlayerStopped(data) {
    var sprite = getPlayer(data.id);

    if (!sprite) {
        return
    }

    stopPlayerSprite(sprite, data.x, data.y);

    if (sprite === player) {
        soundSteps(false);
    } else {
        animatePlayerMove(sprite, null);
    }
}

function handleEnemyConnected(data) {
    var enemySprite = initPlayer(data.id, data.x, data.y, data.name, data.skin, '#d00000');
    enemiesMap.set(data.id, enemySprite);
}

function handleEnemyDisconnected(data) {
    var enemySprite = enemiesMap.get(data.id);
    if (enemySprite) {
        enemySprite.destroy();
    }

    enemiesMap.delete(data.id);
    removeFromArray(movableObjects, enemySprite);

    scoresMap.get(data.id).destroy();
    scoresMap.delete(data.id);

    refreshScoreList();
}

function distanceToVolume(x1, y1, x2, y2, maxDistance) {
    var distance = Phaser.Math.distance(x1, y1, x2, y2);
    return mathRound(1 - Math.min(distance / maxDistance, 1), 2);
}

function handleSnowballChanged(data) {
    var snowball = snowballMap.get(data.id);

    if (!snowball) {
        snowball = snowballs.getFirstDead();
        snowballMap.set(data.id, snowball);
        snowball.reset(data.x, data.y);
    }

    if (data.deleted) {
        snowballMap.delete(data.id);
        snowball.kill();

        var splash = snowballSplashes.getFirstDead();
        if (splash) {
            splash.reset(data.x, data.y);
            splash.animations.play('explosion', 70, false, true);
        }

        var volume = distanceToVolume(player.centerX, player.centerY, data.x, data.y, 600);
        playSnowballSplash(volume)

    } else {
        game.physics.arcade.velocityFromRotation(
            data.angle, data.velocity, snowball.customVelocity
        );

        var volume = distanceToVolume(player.centerX, player.centerY, data.x, data.y, 150);
        playThrow(volume);
    }

    snowball.position.set(data.x, data.y);
}

function handlePlayerScoreChanged(data) {
    var player = getPlayer(data.playerId);
    if (!player) {
        return;
    }

    player.model.score(data.newScore);
}

function handlePlayerScored(data) {
    var player = getPlayer(data.playerId);
    if (!player) {
        return;
    }

    if ((data.playerId === playerId) && (data.scoreDelta === 0)) {
        return;
    }

    var deltaText = data.scoreDelta > 0 ? '+' + data.scoreDelta : data.scoreDelta;
    if (data.scoreDelta === 0) {
        deltaText = 'too close';
    }

    var deltaLabel = game.add.text(0, 0, deltaText, {
        font: '14px Snowbox-normalFont',
        fill: (data.scoreDelta > 0) ? '#00A000' : '#C00000'
    });

    deltaLabel.centerX = player.centerX;
    deltaLabel.centerY = player.centerY + 16;

    var labelTween = this.game.add.tween(deltaLabel).to({
        y: deltaLabel.y + 48
    }, 1500, Phaser.Easing.Quadratic.Out, true);
    labelTween.onComplete.add(function () {
        this.destroy();
    }, deltaLabel);
}

function handleSnowballCountChanged(data) {
    player.model.snowballsCount(data.newCount);
}

function refreshScoreList(newPlayer) {
    var sortedPlayers = Array.from(enemiesMap.values());
    if (player) {
        sortedPlayers.push(player);
    }
    if (newPlayer) {
        sortedPlayers.push(newPlayer);
    }

    sortedPlayers.sort(function (a, b) {
        return b.model.score() - a.model.score();
    });

    if (sortedPlayers.length <= 0) {
        return;
    }

    var padding = 16;

    var randomLabel = scoresMap.values().next().value;
    var singleLabelHeight = randomLabel.height + 8;
    var maxRows = Math.min(Math.floor((hudPanel.height - padding) / singleLabelHeight));
    if (maxRows > sortedPlayers.length) {
        maxRows = sortedPlayers.length;
    }

    scoresMap.forEach(function (label) {
        label.visible = false;
    });
    if (scoreEllipsis) {
        scoreEllipsis.visible = false;
    }

    var yOffset = hudPanel.height - padding;

    var labels = [];
    sortedPlayers.slice(0, maxRows).forEach(function (value) {
        var label = scoresMap.get(value.model.id);
        labels.push(label);
    });

    if (sortedPlayers.indexOf(player) > (maxRows - 1)) {
        labels[maxRows - 2] = scoreEllipsis;
        labels[maxRows - 1] = scoresMap.get(playerId);
    }

    labels.reverse().forEach(function (label) {
        label.bottom = yOffset;

        yOffset -= singleLabelHeight;

        label.visible = true;
    });

    var labelHeights = Math.min(maxRows * singleLabelHeight + padding * 2, hudPanel.height);

    alignToCamera(hudPanel, Phaser.TOP_RIGHT, 8, -8 + (labelHeights - hudPanel.height));
}

function updatePlayerZIndex(value) {
    var minSprite = value;
    var maxSprite = value;

    for (i = 0; i < trees.length; i++) {
        var tree = trees[i];
        var treeBottom = tree.bottom - 40;

        if (value.bottom < treeBottom) {
            maxSprite = tree;
            break;
        } else {
            minSprite = tree;
        }
    }

    if (value.z < minSprite.z) {
        while (value.z < minSprite.z) {
            value.moveUp();
        }
    } else if (value.z > maxSprite.z) {
        while (value.z > maxSprite.z) {
            value.moveDown();
        }
    }
}

var lastTime;

function update() {
    var currentTime = new Date().getTime();
    if (!lastTime) {
        lastTime = currentTime - game.time.elapsed / 1000.;
    }

    var deltaTime = (currentTime - lastTime) / 1000.;
    lastTime = currentTime;

    movableObjects.forEach(function (object) {
        var velocity = object.customVelocity;
        if (velocity && object.body) {
            if (velocity.x !== 0) {
                object.body.x += velocity.x * deltaTime;
            }
            if (velocity.y !== 0) {
                object.body.y += velocity.y * deltaTime;
            }
        }
    });

    if (mockServer) {
        updateMock();
    }

    var players = Array.from(enemiesMap.values());
    if (player) {
        players.push(player);
    }
    players.forEach(function (playerSprite) {
        updatePlayerZIndex(playerSprite);

        trees.forEach(function (tree) {
            game.physics.arcade.collide(playerSprite, tree.trunk);
        });
    });

    trees.forEach(function (tree) {
        tree.mustHide = false;
        for (i = 0; i < players.length; i++) {
            var playerSprite = players[i];
            game.physics.arcade.overlap(tree.head, playerSprite, hideTree, null, this);
            if (tree.mustHide) {
                break;
            }
        }

        if (!tree.mustHide && (tree.alpha !== 1)) {
            tree.alpha = 1;
        }
    });

    if (!mockServer) {
        trees.forEach(function (tree) {
            game.physics.arcade.overlap(tree.trunk, snowballs, destroySnowballOnCollide, null, this);
        });
    }
}

function hideTree(treeHead, unit) {
    var tree = treeHead.parent;
    tree.alpha = 0.4;
    tree.mustHide = true;
}

function destroySnowballOnCollide(target, snowball) {
    snowball.kill();
}

function render() {
    /*    var i = 0;
        enemiesMap.forEach(function (value, key) {
            game.debug.bodyInfo(value, 32, 32 + i * 112);
            i++;
        });
    */

    /*   var i = 0;
        snowballMap.forEach(function (value, key) {
            game.debug.bodyInfo(value, 32, 32 + i * 112);
            i++;
        });*/

    /*        if (player) {
                game.debug.body(player);
                game.debug.bodyInfo(player, 32, 32 + i * 112);
            }*/

    /*
            enemiesMap.forEach(function (value) {
                game.debug.body(value);
            }); */

    /*
        snowballMap.forEach(function (value) {
            game.debug.body(value);
        });
    */

    /*
        trees.forEach(function (value) {
            game.debug.body(value.head);
            game.debug.body(value.trunk);
        });
    */

    // game.debug.spriteBounds(buttonLabel, '#00FF00', false);

    game.debug.gameInfo(16, 16);
    game.debug.gameTimeInfo(16, 160);
}

function isMusicMuted() {
    var mutedStored = localStorage.getItem('snowbox_music_muted');
    return (mutedStored === true) || (mutedStored === 'true');
}

function saveMusicMuted(muted) {
    localStorage.setItem('snowbox_music_muted', muted);
}

function getMusicVolume() {
    var volumeStored = localStorage.getItem('snowbox_music_volume');

    var volume = parseFloat(volumeStored);

    if (isNaN(volume)) {
        return 1;
    }

    return Math.max(0, Math.min(1, volume));
}

function saveMusicVolume(volume) {
    localStorage.setItem('snowbox_music_volume', volume);
}

function isSoundMuted() {
    var mutedStored = localStorage.getItem('snowbox_sounds_muted');
    return (mutedStored === true) || (mutedStored === 'true');
}

function saveSoundMuted(muted) {
    localStorage.setItem('snowbox_audio_muted', muted);
}

function getSoundsVolume() {
    var volumeStored = localStorage.getItem('snowbox_sound_volume');

    var volume = parseFloat(volumeStored);

    if (isNaN(volume)) {
        return 1;
    }

    return Math.max(0, Math.min(1, volume));
}

function saveSoundsVolume(volume) {
    localStorage.setItem('snowbox_sound_volume', volume);
}

function removeFromArray(array, element) {
    var index = array.indexOf(element);
    if (index > -1) {
        array.splice(index, 1);
    }
}

function mathRound(value, decimalPlaces) {
    if (decimalPlaces <= 0) {
        return Math.round(value);
    }

    var divider = Math.pow(10, Math.round(decimalPlaces));

    return Math.round(value * divider) / divider;
}