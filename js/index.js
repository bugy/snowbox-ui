var game = new Phaser.Game(window.innerWidth, window.innerHeight, Phaser.CANVAS, 'Snowbox', {
    preload: preload,
    create: create,
    update: update,
    render: render
});

function preload() {

    game.load.image('background', 'assets/snow7_d.jpg');
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

function create() {

    game.add.tileSprite(-1000, -1000, 4000, 4000, 'background');

    game.world.setBounds(0, 0, 2000, 2000);

    game.physics.startSystem(Phaser.Physics.P2JS);

    player = game.add.sprite(game.world.centerX, game.world.centerY, 'player');
    player.animations.add('moveLeft', [1, 5, 9, 13], 12, true);
    player.animations.add('moveRight', [3, 7, 11, 15], 12, true);
    player.animations.add('moveTop', [2, 6, 10, 14], 12, true);
    player.animations.add('moveBottom', [0, 4, 8, 12], 12, true);

    game.physics.p2.enable(player);

    cursors = game.input.keyboard.createCursorKeys();
    game.input.keyboard.onDownCallback = keyDown;
    game.input.keyboard.onUpCallback = keyUp;

    game.camera.follow(player);
    game.camera.bounds = null;

    game.input.mouse.capture = true;
    game.input.onDown.add(sendThrowBall, this);

    snowballs = game.add.group();
    snowballs.enableBody = true;
    snowballs.physicsBodyType = Phaser.Physics.ARCADE;

    snowballs.createMultiple(2, 'snowball');
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

function handlePlayerMove(data) {
    var animationName = null;

    var newY = Math.round(data.y * 1) / 1;
    var newX = Math.round(data.x * 1) / 1;

    var playerX = Math.round(player.centerX * 1) / 1;
    var playerY = Math.round(player.centerY * 1) / 1;


    if (newY < playerY) {
        animationName = "moveTop";
    } else if (newY > playerY) {
        animationName = "moveBottom";
    } else if (newX < playerX) {
        animationName = "moveLeft";
    } else if (newX > playerX) {
        animationName = "moveRight";
    }

    console.log(animationName + ", player: x=" + playerX + "  y=" + playerY + "  Data: x=" + newX + "  y=" + newY);

    player.reset(newX, newY);

    // player.reset(Math.round(data.x), Math.round(data.y));

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

    console.log('movePlayer: x=' + xDirection + ', y=' + yDirection)
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