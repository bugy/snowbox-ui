Phaser.Sprite.prototype.alignInParent = function (position, offsetX, offsetY) {
    if ((!this.parent) || (this.parent.name === "__world")) {
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
    game.load.image('ice_hud', 'assets/ice_hud.png');
    game.load.spritesheet('boy', 'assets/boy.png', 48, 48);
    game.load.spritesheet('girl', 'assets/girl.png', 48, 48);

    game.load.image('dialog_9patch', 'assets/controls/panel_blue.png');
    game.load.image('textField_9patch', 'assets/controls/buttonSquare_grey_pressed.png');

    sprites_preload();
    helper_preload();

    game.add.plugin(PhaserInput.Plugin);
}

var player;
var cursors;
var snowballs;

var snowballMap = new Map();

function create() {
    load9PatchImage('dialog', 'dialog_9patch', 480, 320, 10, 10, 90, 90);
    load9PatchImage('textField', 'textField_9patch', 160, 40, 5, 5, 40, 40);
    load9PatchImage('squareButton', 'textField_9patch', 48, 48, 5, 5, 40, 40);

    game.renderer.renderSession.roundPixels = true;

    game.add.tileSprite(-1000, -1000, 4000, 4000, 'background');

    connectToServer();

    // createStartDialog(sendStartGame);
    sendStartGame('buggy', Math.random() < 0.5 ? 'boy' : 'girl');
}

function handleGameStarted(data) {
    game.world.setBounds(0, 0, data.width, data.height);

    drawBorder(data.width, data.height);

    game.physics.startSystem(Phaser.Physics.P2JS);

    player = game.add.sprite(game.world.centerX, game.world.centerY, data.skin);
    player.animations.add('moveLeft', [1, 5, 9, 13], 12, true);
    player.animations.add('moveRight', [3, 7, 11, 15], 12, true);
    player.animations.add('moveTop', [2, 6, 10, 14], 12, true);
    player.animations.add('moveBottom', [0, 4, 8, 12], 12, true);

    game.physics.enable(player, Phaser.Physics.ARCADE);
    player.body.collideWorldBounds = true;

    var nameLabel = game.add.text(0, 0, data.playerName, {
        font: "14px Arial",
        fill: "#0000D0"
    });
    player.addChild(nameLabel);
    nameLabel.x = Math.round((player.width - nameLabel.width) / 2);
    nameLabel.y = -12;

    cursors = game.input.keyboard.createCursorKeys();
    game.input.keyboard.onDownCallback = keyDown;
    game.input.keyboard.onUpCallback = keyUp;

    game.camera.follow(player);
    game.camera.bounds = null;

    game.input.mouse.capture = true;
    game.input.onDown.add(function () {
        sendThrowBall(
            game.input.mousePointer.x + game.camera.x,
            game.input.mousePointer.y + game.camera.y);
    }, this);

    snowballs = game.add.group();
    snowballs.enableBody = true;
    snowballs.physicsBodyType = Phaser.Physics.ARCADE;

    snowballs.createMultiple(50, 'snowball');
    snowballs.setAll('checkWorldBounds', true);
    snowballs.setAll('outOfBoundsKill', true);
}

function keyDown(e) {
    if (e.repeat) {
        return;
    }

    if ((e.keyCode === Phaser.Keyboard.UP)
        || (e.keyCode === Phaser.Keyboard.DOWN)
        || (e.keyCode === Phaser.Keyboard.LEFT)
        || (e.keyCode === Phaser.Keyboard.RIGHT)) {
        moveKeyPressed();
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
        moveKeyPressed();
        return;
    }
}

function moveKeyPressed() {
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

    sendPlayerMove(xDirection, yDirection);

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

function handlePlayerMove(data) {
    player.reset(data.x, data.y);
    game.physics.arcade.velocityFromRotation(
        data.angle, data.velocity * 9, player.body.velocity);
}

function handlePlayerStopped(data) {
    player.body.velocity.setTo(0, 0);
    player.reset(data.x, data.y);
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
    game.physics.arcade.velocityFromRotation(data.angle, data.velocity * 9, snowball.body.velocity);
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