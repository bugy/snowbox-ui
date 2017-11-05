var game = new Phaser.Game(window.innerWidth, window.innerHeight, Phaser.CANVAS, 'Snowbox', {
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
    game.load.spritesheet('player', 'assets/boy.png', 48, 48);


    var snowballBitmap = game.make.bitmapData(16, 16);
    drawGradientCircle(8, 8, 8, 'rgb(230, 230, 255)', 'rgb(100, 100, 130)', snowballBitmap);
    game.cache.addImage('snowball', null, snowballBitmap.canvas);
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

function create() {

    game.add.tileSprite(-1000, -1000, 4000, 4000, 'background');

    game.world.setBounds(0, 0, 1024, 1024);

    drawBorder(1024, 1024);

    game.physics.startSystem(Phaser.Physics.P2JS);

    player = game.add.sprite(game.world.centerX, game.world.centerY, 'player');
    player.animations.add('moveLeft', [1, 5, 9, 13], 12, true);
    player.animations.add('moveRight', [3, 7, 11, 15], 12, true);
    player.animations.add('moveTop', [2, 6, 10, 14], 12, true);
    player.animations.add('moveBottom', [0, 4, 8, 12], 12, true);

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

}

function sendThrowBall() {
    socket.send(JSON.stringify({
        "type": 'throwBall',
        "pointerX": game.input.mousePointer.x,
        "pointerY": game.input.mousePointer.y
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

var movementTween;

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

    var newTween = game.add.tween(player).to({x: newX, y: newY}, 20, null, true);
    if (movementTween) {
        movementTween.chain(newTween);
    }
    movementTween = newTween;
}

function handleSnowballChanged(data) {
    var snowball = snowballMap.get(data.id);

    if (!snowball) {
        snowball = snowballs.getFirstDead();
        snowballMap.set(data.id, snowball);
    }

    if (data.deleted) {
        snowball.kill();
        snowballMap.remove(data.id);
        return;
    }

    snowball.reset(data.x, data.y);
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

}

function drawGradientCircle(x, y, radius, colorIn, colorOut, bitmap) {
    var gradient = bitmap.context.createRadialGradient(x, y, radius / 2, x, y, radius);
    gradient.addColorStop(0, colorIn);
    gradient.addColorStop(1, colorOut);
    bitmap.circle(x, y, radius, gradient);
}