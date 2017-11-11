Phaser.Sprite.prototype.alignInParent = function (position, offsetX, offsetY) {
    if (this.parent.name === "__world") {
        return;
    }

    var s = this.parent.scale;
    this.parent.scale.setTo(1);
    this.alignIn(this.parent, position, offsetX, offsetY);

    this.left -= this.parent.left + (this.parent.width * this.parent.anchor.x);
    this.top -= this.parent.top + (this.parent.height * this.parent.anchor.y);

    this.parent.scale = s;
};

var game = new Phaser.Game(window.innerWidth, window.innerHeight, Phaser.WEBGL, 'Snowbox', {
    preload: preload,
    create: create,
    update: update,
    render: render
});

function preload() {

    game.load.image('background', 'assets/snow_tile.jpg');
    game.load.image('fence_tile_horizontal', 'assets/fence_tile_horizontal.png');
    game.load.image('fence_tile_vertical_upper', 'assets/fence_tile_vertical_upper.png');
    game.load.image('fence_tile_vertical_middle', 'assets/fence_tile_vertical_middle.png');
    game.load.image('fence_tile_vertical_bottom', 'assets/fence_tile_vertical_bottom.png');
    game.load.image('ice_hud', 'assets/ice_hud.png');
    game.load.spritesheet('boy', 'assets/boy.png', 48, 48);
    game.load.spritesheet('girl', 'assets/girl.png', 48, 48);

    game.load.image('dialog_9patch', 'assets/controls/panel_blue.png');
    game.load.image('textField_9patch', 'assets/controls/buttonSquare_grey_pressed.png');
    game.load.atlasXML('rpg_ui', 'assets/controls/uipack_rpg_sheet.png', 'assets/controls/uipack_rpg_sheet.xml');

    var snowballBitmap = game.make.bitmapData(16, 16);
    drawGradientCircle(8, 8, 8, 'rgb(230, 230, 255)', 'rgb(100, 100, 130)', snowballBitmap);
    game.cache.addImage('snowball', null, snowballBitmap.canvas);

    game.load.script('gray', 'https://cdn.rawgit.com/photonstorm/phaser/master/v2/filters/Gray.js');

    game.add.plugin(PhaserInput.Plugin);
}

var player;
var cursors;
var snowballs;

var snowballMap = new Map();

socket = new WebSocket('ws://selim.co:8080/api/movement');

function drawBorder(fieldWidth, fieldHeight) {
    var horizontalWidth = 64;
    var horizontalHeight = 32;
    var verticalWidth = 16;
    var verticalHeight = 32;

    game.add.tileSprite(
        verticalWidth / 2 - verticalWidth,
        -verticalHeight,
        fieldWidth + verticalWidth,
        horizontalHeight,
        'fence_tile_horizontal');
    game.add.tileSprite(
        verticalWidth / 2 - verticalWidth,
        fieldHeight,
        fieldWidth + verticalWidth,
        horizontalHeight,
        'fence_tile_horizontal');

    game.add.tileSprite(
        -verticalWidth,
        -verticalHeight,
        verticalWidth,
        verticalHeight,
        'fence_tile_vertical_upper');
    game.add.tileSprite(
        -verticalWidth,
        0,
        verticalWidth,
        fieldHeight,
        'fence_tile_vertical_middle');
    game.add.tileSprite(
        -verticalWidth,
        fieldHeight,
        verticalWidth,
        verticalHeight,
        'fence_tile_vertical_bottom');

    game.add.tileSprite(
        fieldWidth,
        -verticalHeight,
        verticalWidth,
        verticalHeight,
        'fence_tile_vertical_upper');
    game.add.tileSprite(
        fieldWidth,
        0,
        verticalWidth,
        fieldHeight,
        'fence_tile_vertical_middle');
    game.add.tileSprite(
        fieldWidth,
        fieldHeight,
        verticalWidth,
        verticalHeight,
        'fence_tile_vertical_bottom');
}

function createImageButton(image, callback) {
    var background = game.make.sprite(0, 0, 'squareButton');
    var sprite = game.make.sprite(0, 0, image);

    var result = game.make.group();

    result.add(background);
    result.add(sprite);

    background.centerX = result.width / 2;
    background.centerY = result.height / 2;
    sprite.centerX = background.centerX;
    sprite.centerY = background.centerY;

    background.inputEnabled = true;
    background.events.onInputDown.add(function (source, event) {
        callback(result, event);
    }, this);

    return result;
}

function createTextField() {
    var inputImage = game.make.sprite(0, 0, 'textField');

    var input = game.make.inputField(0, 0, {
        font: '18px Arial',
        fill: '#212140',
        fillAlpha: 0,
        fontWeight: 'bold',
        width: inputImage.width - 24
    });

    var result = game.make.group();
    result.add(inputImage);
    result.add(input);

    inputImage.centerX = result.width / 2;
    inputImage.centerY = result.height / 2;
    input.centerX = result.width / 2;
    input.centerY = result.height / 2;

    return result;
}

function createButton(textStyle, callback) {
    var button = game.make.button(0, 0, 'rpg_ui', callback, this,
        'buttonLong_brown.png', 'buttonLong_brown.png', 'buttonLong_brown_pressed.png');
    button.anchor.setTo(0, 1);

    var buttonLabel = game.make.text(0, 0, "Start", textStyle);
    button.addChild(buttonLabel);
    var repositionLabel = function (mouseUp) {
        if (mouseUp === true) {
            buttonLabel.alignInParent(Phaser.TOP_CENTER, 0, -10);
        } else {
            buttonLabel.alignInParent(Phaser.TOP_CENTER, 0, -14);
        }
    };
    button.onInputDown.add(repositionLabel);
    button.onInputUp.add(function () {
        repositionLabel(true);
    });
    repositionLabel();

    return button;
}

function create() {
    load9PatchImage('dialog', 'dialog_9patch', 480, 320, 10, 10, 90, 90);
    load9PatchImage('textField', 'textField_9patch', 160, 40, 5, 5, 40, 40);
    load9PatchImage('squareButton', 'textField_9patch', 48, 48, 5, 5, 40, 40);

    game.add.tileSprite(-1000, -1000, 4000, 4000, 'background');

    game.world.setBounds(0, 0, 1024, 1024);

    drawBorder(1024, 1024);

    game.physics.startSystem(Phaser.Physics.P2JS);

    player = game.add.sprite(game.world.centerX, game.world.centerY, 'girl');
    player.animations.add('moveLeft', [1, 5, 9, 13], 12, true);
    player.animations.add('moveRight', [3, 7, 11, 15], 12, true);
    player.animations.add('moveTop', [2, 6, 10, 14], 12, true);
    player.animations.add('moveBottom', [0, 4, 8, 12], 12, true);

    var playerHud = game.add.sprite(0, 0, 'ice_hud');
    playerHud.scale.setTo(0.5, 0.5);
    playerHud.centerX = playerHud.width / 2;
    player.addChild(playerHud);

    cursors = game.input.keyboard.createCursorKeys();
    game.input.keyboard.onDownCallback = keyDown;
    game.input.keyboard.onUpCallback = keyUp;

    game.camera.follow(player);
    game.camera.bounds = null;

    game.input.mouse.capture = true;
    game.input.onDown.add(sendThrowBall, this);

    this.game.renderer.renderSession.roundPixels = true;

    snowballs = game.add.group();
    snowballs.enableBody = true;
    snowballs.physicsBodyType = Phaser.Physics.ARCADE;

    snowballs.createMultiple(50, 'snowball');
    snowballs.setAll('checkWorldBounds', true);
    snowballs.setAll('outOfBoundsKill', true);

    socket.addEventListener("message", function (rawMessage) {
        var message = JSON.parse(rawMessage.data);

        if (message.type === 'playerMoved') {
            handlePlayerMove(message);
            return;
        } else if (message.type === 'snowballChanged') {
            handleSnowballChanged(message);
            return;
        }
    });

    // createStartDialog();
}

function createStartDialog() {
    var startGameScreen = game.add.group();
    startGameScreen.fixedToCamera = true;
    startGameScreen.inputEnabled = true;
    startGameScreen.centerX = game.camera.centerX;
    startGameScreen.centerY = game.camera.centerY;

    var graphicOverlay = new Phaser.Graphics(this.game, 0, 0);
    graphicOverlay.beginFill(0x000000, 0.7);
    graphicOverlay.drawRect(0, 0, window.innerWidth + 50, window.innerHeight + 50);
    graphicOverlay.endFill();
    var overlay = this.game.add.image(-50, -50, graphicOverlay.generateTexture());

    var choosePlayerDialog = game.make.sprite(0, 0, 'dialog');
    choosePlayerDialog.centerX = graphicOverlay.width / 2;
    choosePlayerDialog.centerY = graphicOverlay.height / 2;

    var textStyle = {font: "18px Arial", fill: "#212140"};
    var playerLabel = game.make.text(0, 0, "Nickname", textStyle);
    playerLabel.centerX = choosePlayerDialog.centerX;
    playerLabel.centerY = choosePlayerDialog.centerY - 120;

    var nameField = createTextField(playerLabel);
    nameField.centerX = choosePlayerDialog.centerX;
    nameField.centerY = playerLabel.centerY + 36;

    var skinLabel = game.make.text(0, 0, "Select skin", textStyle);
    skinLabel.centerX = choosePlayerDialog.centerX;
    skinLabel.centerY = nameField.centerY + 60;

    var buttons = [];
    var selectedSkin = ko.observable(null);
    var skinSelector = function (source) {
        buttons.forEach(function (value) {
            value.filters = [skinButtonsGray];
        });

        source.filters = null;
        selectedSkin(source.key);
    };

    var boyButton = createImageButton('boy', skinSelector);
    boyButton.centerX = choosePlayerDialog.centerX - boyButton.width;
    boyButton.centerY = skinLabel.centerY + 40;

    var girlButton = createImageButton('girl', skinSelector);
    girlButton.centerX = choosePlayerDialog.centerX + girlButton.width;
    girlButton.centerY = skinLabel.centerY + 40;

    var skinButtonsGray = game.add.filter('Gray');
    girlButton.filters = [skinButtonsGray];
    boyButton.filters = [skinButtonsGray];

    buttons = [boyButton, girlButton];

    var startButton = createButton(textStyle, function (button) {
        console.log(startButton.input.enabled);
        button.input.enabled = false;
        sendStartGame();
    });
    startButton.centerX = choosePlayerDialog.centerX;
    startButton.bottom = choosePlayerDialog.bottom - 24;

    selectedSkin.subscribe(function (newValue) {
        console.log(newValue);
        if (selectedSkin()) {
            startButton.filters = null;
        }
    });

    startGameScreen.add(overlay);
    startGameScreen.add(choosePlayerDialog);
    startGameScreen.add(playerLabel);
    startGameScreen.add(nameField);
    startGameScreen.add(skinLabel);
    startGameScreen.add(boyButton);
    startGameScreen.add(girlButton);
    startGameScreen.add(startButton);

    startButton.input.enabled = false;
    var gray = game.add.filter('Gray');
    startButton.filters = [gray];
}

function sendStartGame() {
    socket.send(JSON.stringify({
        'type': 'connectToGame',
        'playerName': 'testPlayer',
        'skin': 'boy'
    }));
}

function sendThrowBall() {
    socket.send(JSON.stringify({
        "type": 'throwBall',
        "pointerX": game.input.mousePointer.x + game.camera.x,
        "pointerY": game.input.mousePointer.y + game.camera.y
    }));
}

function keyDown(e) {
    if (e.repeat) {
        return;
    }

    if ((e.keyCode === Phaser.Keyboard.UP)
        || (e.keyCode === Phaser.Keyboard.DOWN)
        || (e.keyCode === Phaser.Keyboard.LEFT)
        || (e.keyCode === Phaser.Keyboard.RIGHT)) {
        sendPlayerMove();
        return;
    }
}

function keyUp(e) {
    if (e.repeat) {
        return;
    }

    if ((e.keyCode === Phaser.Keyboard.UP)
        || (e.keyCode === Phaser.Keyboard.DOWN)
        || (e.keyCode === Phaser.Keyboard.LEFT)
        || (e.keyCode === Phaser.Keyboard.RIGHT)) {
        sendPlayerMove();
        return;
    }
}

function handlePlayerMove(data) {
    var newX = data.x;
    var newY = data.y;

    if (newX < 0) {
        newX = 0;
    } else if (newX > (game.world.width - player.width)) {
        newX = game.world.width - player.width;
    }

    if (newY < 0) {
        newY = 0;
    } else if (newY > (game.world.height - player.height)) {
        newY = game.world.height - player.height;
    }

    player.position.set(newX, newY);
}

function handleSnowballChanged(data) {
    var snowball = snowballMap.get(data.id);

    if (!snowball) {
        snowball = snowballs.getFirstDead();
        snowballMap.set(data.id, snowball);
    }

    if (data.deleted) {
        snowball.kill();
        snowballMap.delete(data.id);
        return;
    }

    snowball.reset(data.x, data.y);
    game.physics.arcade.velocityFromRotation(data.angle, data.velocity * 8.9, snowball.body.velocity);
}

function sendPlayerMove() {
    var xDirection = 0;
    var yDirection = 0;

    if (cursors.up.isDown) {
        yDirection = -1;
    } else if (cursors.down.isDown) {
        yDirection = 1;
    }

    if (cursors.left.isDown) {
        xDirection = -1;
    } else if (cursors.right.isDown) {
        xDirection = 1;
    }

    socket.send(JSON.stringify({
        "type": 'movePlayer',
        "xDirection": xDirection,
        "yDirection": yDirection
    }));

    var animationName = null;

    if (cursors.up.isDown) {
        animationName = "moveTop";
    } else if (cursors.down.isDown) {
        animationName = "moveBottom";
    } else if (cursors.left.isDown) {
        animationName = "moveLeft";
    } else if (cursors.right.isDown) {
        animationName = "moveRight";
    }

    if (!animationName) {
        if (player.animations.currentAnim) {
            player.animations.currentAnim.stop(true);
        }
    } else if (player.animations.currentAnim.name !== animationName) {
        player.animations.play(animationName);
    } else if (!player.animations.currentAnim.isPlaying) {
        player.animations.currentAnim.play();
    }
}

function update() {


}

function render() {
    /*   var i = 0;
        snowballMap.forEach(function (value, key) {
            game.debug.bodyInfo(value, 32, 32 + i * 112);
            i++;
        });*/
}

function drawGradientCircle(x, y, radius, colorIn, colorOut, bitmap) {
    var gradient = bitmap.context.createRadialGradient(x, y, radius / 2, x, y, radius);
    gradient.addColorStop(0, colorIn);
    gradient.addColorStop(1, colorOut);
    bitmap.circle(x, y, radius, gradient);
}

function load9PatchImage(destImage, srcImage, width, height, srcX1, srcY1, srcX2, srcY2) {
    var bitmap = game.make.bitmapData(width, height);

    var patchImage = game.cache.getImage(srcImage);

    var bottomHeight = patchImage.height - srcY2;
    var rightWidth = patchImage.width - srcX2;
    var destX2 = width - rightWidth;
    var destY2 = height - bottomHeight;

    var leftUpper = new Phaser.Rectangle(0, 0, srcX1, srcY1);
    bitmap.copyRect(patchImage, leftUpper, 0, 0);

    var rightBottom = new Phaser.Rectangle(srcX2, srcY2, rightWidth, bottomHeight);
    bitmap.copyRect(patchImage, rightBottom, destX2, destY2);

    var leftBottom = new Phaser.Rectangle(0, srcY2, srcX1, bottomHeight);
    bitmap.copyRect(patchImage, leftBottom, 0, destY2);

    var rightUpper = new Phaser.Rectangle(srcX2, 0, rightWidth, srcY1);
    bitmap.copyRect(patchImage, rightUpper, destX2, 0);

    var tileWidth = srcX2 - srcX1;
    var tileHeight = srcY2 - srcY1;

    for (var x = srcX1; x < destX2; x += tileWidth) {
        var currentWidth = Math.min(tileWidth, destX2 - x);

        var upperBorder = new Phaser.Rectangle(srcX1, 0, currentWidth, srcY1);
        bitmap.copyRect(patchImage, upperBorder, x, 0);

        var bottomBorder = new Phaser.Rectangle(srcX1, srcY2, currentWidth, bottomHeight);
        bitmap.copyRect(patchImage, bottomBorder, x, destY2);

        for (var y = srcY1; y < destY2; y += tileHeight) {
            var currentHeight = Math.min(tileHeight, destY2 - y);

            var centerRect = new Phaser.Rectangle(srcX1, srcY1, currentWidth, currentHeight);
            bitmap.copyRect(patchImage, centerRect, x, y);

            var leftBorder = new Phaser.Rectangle(0, srcY1, srcX1, currentHeight);
            bitmap.copyRect(patchImage, leftBorder, 0, y);

            var rightBorder = new Phaser.Rectangle(srcX2, srcY1, rightWidth, currentHeight);
            bitmap.copyRect(patchImage, rightBorder, destX2, y);
        }
    }

    game.cache.addImage(destImage, null, bitmap.canvas);
}