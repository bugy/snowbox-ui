function preloadSprites() {
    game.load.image('fence_tile_horizontal', 'assets/fence_tile_horizontal.png');
    game.load.image('fence_tile_vertical_upper', 'assets/fence_tile_vertical_upper.png');
    game.load.image('fence_tile_vertical_middle', 'assets/fence_tile_vertical_middle.png');
    game.load.image('fence_tile_vertical_bottom', 'assets/fence_tile_vertical_bottom.png');

    game.load.atlasXML('rpg_ui',
        'assets/controls/uipack_rpg_sheet.png',
        'assets/controls/uipack_rpg_sheet.xml');

    game.load.atlasXML('LPC_Trees',
        'assets/trees/LPC_Trees.png',
        'assets/trees/LPC_Trees.xml');

    game.load.atlasJSONArray('snowball_splash',
        'assets/bluespark/bluespark_gray.png',
        'assets/bluespark/bluespark.json');

    var snowballBitmap = game.make.bitmapData(16, 16);
    drawGradientCircle(8, 8, 8, 'rgb(230, 230, 255)', 'rgb(100, 100, 130)', snowballBitmap);
    game.cache.addImage('snowball', null, snowballBitmap.canvas);

    var largeSnowballBitmap = game.make.bitmapData(24, 24);
    drawGradientCircle(12, 12, 12, 'rgb(230, 230, 255)', 'rgb(100, 100, 130)', largeSnowballBitmap);
    game.cache.addImage('large_snowball', null, largeSnowballBitmap.canvas);

    var smallSnowballBitmap = game.make.bitmapData(8, 8);
    drawGradientCircle(4, 4, 4, 'rgb(230, 230, 255)', 'rgb(100, 100, 130)', smallSnowballBitmap);
    game.cache.addImage('small_snowball', null, smallSnowballBitmap.canvas);

    game.load.image('musicOn', 'assets/controls/musicOn.png');
    game.load.image('musicOff', 'assets/controls/musicOff.png');
    game.load.image('audioOn', 'assets/controls/audioOn.png');
    game.load.image('audioOff', 'assets/controls/audioOff.png');
    game.load.image('settings', 'assets/controls/gear.png');
    game.load.image('cross', 'assets/controls/cross.png');

    game.load.image('slider_line', 'assets/controls/slider_line.png');
}

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

    result.text = ko.observable("");

    var timer = setInterval(function () {
        if (!result.exists) {
            clearInterval(timer);
            return;
        }

        result.text(input.text.text);
    }, 250);

    result.textField = input;

    return result;
}

function createImageRadioButton(image, callback) {
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

    result.key = image;

    return result;
}

function createStartDialog(callback) {
    var startGameScreen = game.add.group();
    startGameScreen.fixedToCamera = true;
    startGameScreen.inputEnabled = true;

    var graphicOverlay = new Phaser.Graphics(this.game, 0, 0);
    graphicOverlay.beginFill(0x000000, 0.7);
    graphicOverlay.drawRect(0, 0, 64, 64);
    graphicOverlay.endFill();
    var overlay = this.game.add.tileSprite(
        0, 0,
        window.screen.width,
        window.screen.height,
        graphicOverlay.generateTexture());

    var choosePlayerDialog = game.make.sprite(0, 0, 'dialog');
    choosePlayerDialog.centerX = graphicOverlay.width / 2;
    choosePlayerDialog.centerY = graphicOverlay.height / 2;

    var textStyle = {
        font: "20px Snowbox-normalFont", fill: '#D0F0F0',
        strokeThickness: 2, stroke: '#3080A0'
    };
    var playerLabel = game.make.text(0, 0, "Nickname", textStyle);
    choosePlayerDialog.addChild(playerLabel);
    playerLabel.alignInParent(Phaser.TOP_CENTER, 0, -28);

    var nameField = createTextField(playerLabel);
    nameField.textField.domElement.setMax(12);
    nameField.alignTo(playerLabel, Phaser.BOTTOM_CENTER, 0, 4);

    var skinLabel = game.make.text(0, 0, "Skin", textStyle);
    skinLabel.alignTo(nameField, Phaser.BOTTOM_CENTER, 0, 24);

    var buttons = [];
    var selectedSkin = ko.observable(null);
    var skinSelector = function (source) {
        buttons.forEach(function (value) {
            value.filters = [skinButtonsGray];
        });

        source.filters = null;
        selectedSkin(source.key);
    };

    var boyButton = createImageRadioButton('boy', skinSelector);
    boyButton.alignTo(skinLabel, Phaser.BOTTOM_CENTER, -boyButton.width, 4);

    var girlButton = createImageRadioButton('girl', skinSelector);
    girlButton.alignTo(skinLabel, Phaser.BOTTOM_CENTER, +boyButton.width, 4);

    var skinButtonsGray = game.add.filter('Gray');
    girlButton.filters = [skinButtonsGray];
    boyButton.filters = [skinButtonsGray];

    buttons.push(boyButton);
    buttons.push(girlButton);

    var startButton = createButton(textStyle, function () {
        setButtonEnabled(startButton, false);

        var name = nameField.textField.text.text.trim();

        if (!selectedSkin() || (name.length <= 0)) {
            return;
        }

        startGameScreen.destroy();
        callback(name, selectedSkin());
    });
    choosePlayerDialog.addChild(startButton);
    startButton.alignInParent(Phaser.BOTTOM_CENTER, 0, -24);

    var startButtonEnabler = function () {
        var name = nameField.text().trim();
        var enabled = selectedSkin() && (name.length > 0);

        setButtonEnabled(startButton, enabled);
    };
    selectedSkin.subscribe(startButtonEnabler);
    nameField.text.subscribe(startButtonEnabler);

    choosePlayerDialog.addChild(skinLabel);
    choosePlayerDialog.addChild(nameField);
    choosePlayerDialog.addChild(boyButton);
    choosePlayerDialog.addChild(girlButton);

    startGameScreen.add(overlay);
    startGameScreen.add(choosePlayerDialog);
    choosePlayerDialog.alignIn(game.scale.bounds, Phaser.CENTER, 0, 0);

    var repositionLogin = function (scaleManager, width, height) {
        overlay.width = width;
        overlay.height = height;

        choosePlayerDialog.alignIn(game.scale.bounds, Phaser.CENTER, 0, 0);
    };
    game.scale.onSizeChange.add(repositionLogin);

    setButtonEnabled(startButton, false);
}

function createButton(textStyle, callback) {
    var button = game.make.button(0, 0, 'rpg_ui', callback, this,
        'buttonLong_brown.png', 'buttonLong_brown.png', 'buttonLong_brown_pressed.png');
    button.anchor.setTo(0, 1);

    var buttonLabel = game.make.text(0, 0, "Start", textStyle);
    _addButtonChild(button, buttonLabel, 0, 2);

    return button;
}

function createImageButton(imageName, callback) {
    var button = game.make.button(0, 0, 'rpg_ui', callback, this,
        'buttonSquare_brown.png', 'buttonSquare_brown.png', 'buttonSquare_brown_pressed.png');
    button.anchor.setTo(0, 1);
    button.scale.setTo(0.75, 0.75);

    var imageSprite = game.make.sprite(0, 0, imageName);
    _addButtonChild(button, imageSprite);

    return button;
}

function _addButtonChild(button, child, offsetX, offsetY) {
    offsetX = offsetX || 0;
    offsetY = offsetY || 0;

    var buttonWidth;
    var originalHeight;
    var heightScale = 1;
    if (button.scale) {
        buttonWidth = button.width / button.scale.x;
        originalHeight = button.height / button.scale.y;
        heightScale = button.scale.y;
    } else {
        buttonWidth = button.width;
        originalHeight = button.height;
    }
    var elevation = 4;
    var pressedHeight = originalHeight - elevation;

    button.addChild(child);
    child.centerX = buttonWidth / 2 + offsetX;

    var fullOffsetY = -child.height - (pressedHeight - child.height) / 2 + offsetY;
    var repositionChild = function () {
        var currentHeight = button.height / heightScale;
        if (this.event
            && (this.event.type === 'pointerup')
            && (currentHeight === pressedHeight)) {
            currentHeight = originalHeight;
        }

        if (currentHeight === originalHeight) {
            child.y = fullOffsetY - elevation;
        } else {
            child.y = fullOffsetY;
        }

    };
    button.onInputDown.add(repositionChild);
    button.onInputOut.add(repositionChild);
    button.onInputUp.add(repositionChild);
    repositionChild();
}

function createTree(bodyWidth, bodyHeight) {
    var tree = game.add.group();

    var head = game.make.sprite(0, 0, 'LPC_Trees', 'full_snow_tree_head.png');
    game.physics.enable(head, Phaser.Physics.ARCADE);
    head.body.immovable = true;


    var trunk = game.make.sprite(0, 0, 'LPC_Trees', 'tree_trunk.png');

    tree.add(trunk);
    tree.add(head);

    trunk.centerX = tree.width / 2;
    trunk.y += 44;

    var spriteBodyWidth = 20;
    var spriteBodyHeight = 26;
    tree.scale.setTo(
        mathRound(bodyWidth / spriteBodyWidth, 2),
        mathRound(bodyHeight / spriteBodyHeight, 2));

    game.physics.enable(trunk, Phaser.Physics.ARCADE);
    trunk.enableBody = true;
    trunk.body.immovable = true;

    tree.key = 'tree';
    tree.trunk = trunk;
    tree.head = head;

    var headRadius = (head.width / 2 - 4) * tree.scale.x;
    head.body.setCircle(
        headRadius,
        (head.width / 2 * tree.scale.x - headRadius),
        (head.height / 2 * tree.scale.y - headRadius));

    trunk.body.setSize(
        bodyWidth,
        bodyHeight,
        Math.round((trunk.width * tree.scale.x - bodyWidth) / 2),
        mathRound(28 * tree.scale.y, 2));

    return tree;
}

function createPineTree(bodyWidth, bodyHeight) {
    var tree = game.add.group();

    var head = game.make.sprite(0, 0, 'LPC_Trees', 'snowed_pinetree_head.png');
    game.physics.enable(head, Phaser.Physics.ARCADE);
    head.body.immovable = true;


    var trunk = game.make.sprite(0, 0, 'LPC_Trees', 'pinetree_trunk.png');

    tree.add(trunk);
    tree.add(head);

    trunk.centerX = tree.width / 2;
    trunk.y += 36;

    var spriteBodyWidth = 60;
    var spriteBodyHeight = 26;
    tree.scale.setTo(
        mathRound(bodyWidth / spriteBodyWidth, 2),
        mathRound(bodyHeight / spriteBodyHeight, 2));

    game.physics.enable(trunk, Phaser.Physics.ARCADE);
    trunk.enableBody = true;
    trunk.body.immovable = true;

    tree.key = 'tree';
    tree.trunk = trunk;
    tree.head = head;

    var headRadius = (head.width / 2 - 8) * tree.scale.x;
    head.body.setCircle(
        headRadius,
        (head.width / 2 * tree.scale.x - headRadius),
        (head.height / 2 * tree.scale.y - headRadius - 12));

    trunk.body.setSize(
        bodyWidth,
        bodyHeight,
        Math.round((trunk.width * tree.scale.x - bodyWidth) / 2),
        mathRound(30 * tree.scale.y, 2));

    return tree;
}

function createCheckButton(image, imageChecked, callback) {
    var button = game.make.sprite(0, 0, 'rpg_ui', 'buttonSquare_brown.png');
    button.anchor.setTo(0, 1);

    var imageSprite = game.make.sprite(0, 0, image);
    imageSprite.anchor.setTo(0.5, 0.5);
    button.addChild(imageSprite);

    button._checked = false;
    Object.defineProperty(button, 'checked', {
        get: function () {
            return this._checked;
        },
        set: function (value) {
            this._checked = value;
            changeCheckedImage();
        }
    });

    button.inputEnabled = true;

    function changeCheckedImage() {
        var oldScale;
        if (button.scale) {
            oldScale = new Phaser.Point(button.scale.x, button.scale.y);
        }

        if (button.checked) {
            button.frameName = 'buttonSquare_brown_pressed.png';
            imageSprite.loadTexture(imageChecked);
            imageSprite.alignInParent(Phaser.CENTER, 0, 0);
        } else {
            button.frameName = 'buttonSquare_brown.png';
            imageSprite.loadTexture(image);
            imageSprite.alignInParent(Phaser.CENTER, 0, -2);
        }

        button.scale = oldScale;
    }

    changeCheckedImage();

    button.events.onInputDown.add(function (source, event) {
        button.checked = !button.checked;

        callback(button, event, button._checked);
    }, this);

    return button;
}

function createPlayerSprite(id, x, y, name, skin, labelColor) {
    var sprite = game.add.sprite(x, y, skin);
    sprite.animations.add('moveLeft', [1, 5, 9, 13], 12, true);
    sprite.animations.add('moveRight', [3, 7, 11, 15], 12, true);
    sprite.animations.add('moveTop', [2, 6, 10, 14], 12, true);
    sprite.animations.add('moveBottom', [0, 4, 8, 12], 12, true);

    game.physics.enable(sprite, Phaser.Physics.ARCADE);
    sprite.body.collideWorldBounds = true;

    var nameLabel = game.make.text(0, 0, name, {
        font: "12px Snowbox-normalFont",
        fill: labelColor
    });
    sprite.addChild(nameLabel);
    nameLabel.x = Math.round((sprite.width - nameLabel.width) / 2);
    nameLabel.y = -8;

    sprite.physicsBodyType = Phaser.Physics.ARCADE;
    sprite.body.bounce.set(0, 0);
    var bodyRadius = 12;
    sprite.body.setCircle(
        bodyRadius,
        (sprite.width / 2 - bodyRadius),
        (sprite.height / 2 - bodyRadius));

    return sprite;
}


function createPlayerAmmo(player) {
    var ammoGroup = game.add.group();
    ammoGroup.fixedToCamera = true;

    var ammoPanel = game.make.sprite(0, 0, 'rpg_ui', 'buttonLong_beige_pressed.png');
    ammoGroup.add(ammoPanel);

    var ammoArray = [];

    var x = 0;
    for (var i = 0; i < player.model.maxSnowballs; i++) {
        var ammo = game.make.sprite(x, 0, 'large_snowball');
        ammo.centerY = ammoPanel.centerY;
        ammoGroup.add(ammo);
        x += ammo.width * 1.4;

        ammoArray.push(ammo);
    }

    var deltaX = (ammoPanel.width - ammo.right) / 2;
    ammoArray.forEach(function (ammo) {
        ammo.x += deltaX;
    });

    player.model.snowballsCount.subscribe(function () {
        var count = player.model.snowballsCount();
        for (var i = 0; i < ammoArray.length; i++) {
            var ammo = ammoArray[i];
            if (i >= count) {
                ammo.alpha = 0.2;
            } else {
                ammo.alpha = 1;
            }
        }
    });

    alignToCamera(ammoGroup, Phaser.BOTTOM_RIGHT, 2, -16);
}

function createMuteMusicButton() {
    var muteButton = createCheckButton('musicOn', 'musicOff', function (sprite, event, checked) {
        muteMusic(checked);

        saveMusicMuted(checked);
    });

    muteButton.checked = isMusicMuted();

    muteButton.scale.setTo(0.75, 0.75);

    return muteButton;
}

function createMuteSoundsButton() {
    var muteButton = createCheckButton('audioOn', 'audioOff', function (sprite, event, checked) {
        muteSounds(checked);

        saveSoundMuted(checked);
    });

    muteButton.checked = isSoundMuted();

    muteButton.scale.setTo(0.75, 0.75);

    return muteButton;
}

function createSlider() {
    var result = game.add.group();
    result.percent = ko.observable(0);

    var sliderLine = game.make.sprite(0, 0, 'slider_line');
    sliderLine.width = 96;

    var thumb = game.make.sprite(0, 0, 'rpg_ui', 'buttonRound_brown.png');
    thumb.scale.setTo(0.5, 0.5);
    thumb.inputEnabled = true;
    thumb.input.useHandCursor = true;
    thumb.input.enableDrag(true);
    thumb.input.boundsRect = new Phaser.Rectangle(0, 0, sliderLine.width, thumb.height);
    var maxX = thumb.input.boundsRect.width - thumb.width;
    thumb.events.onDragUpdate.add(function () {
        result.percent(mathRound(thumb.x / maxX, 2));
    });

    result.percent.subscribe(function () {
        if (thumb.input.isDragged) {
            return;
        }

        thumb.x = result.percent() * maxX;
    });

    result.add(sliderLine);
    result.add(thumb);

    sliderLine.alignIn(result, Phaser.CENTER, 0, 0);

    return result;
}


function initSettings() {
    settingsButton = createImageButton('settings', function () {
        settingsPanel.visible = true;
        game.world.bringToTop(settingsPanel);

        alignToCamera(settingsPanel, Phaser.TOP_RIGHT, -8, 8);
    });
    game.world.add(settingsButton);
    settingsButton.fixedToCamera = true;
    alignToCamera(settingsButton, Phaser.TOP_RIGHT, -16, 16);

    var settingsPanel = game.add.group();
    settingsPanel.x = 0;
    settingsPanel.y = 0;
    settingsButton.panel = settingsPanel;

    var background = game.add.sprite(0, 0, 'dialog');
    background.width = 256;
    background.height = 192;
    settingsPanel.addChild(background);

    var textStyle = {
        font: "16px Snowbox-normalFont", fill: '#D0F0F0',
        strokeThickness: 2, stroke: '#3080A0'
    };

    var musicLabel = game.make.text(0, 0, "Music", textStyle);
    settingsPanel.addChild(musicLabel);
    musicLabel.alignInParent(Phaser.TOP_CENTER, 0, -24);

    var musicSlider = createSlider();
    settingsPanel.addChild(musicSlider);
    musicSlider.percent.subscribe(function () {
        changeMusicVolume(musicSlider.percent());
        saveMusicVolume(musicSlider.percent());
    });
    musicSlider.alignTo(musicLabel, Phaser.BOTTOM_CENTER, -musicSlider.width / 4, 4);
    musicSlider.percent(getMusicVolume());

    var muteMusicButton = createMuteMusicButton();
    settingsPanel.addChild(muteMusicButton);
    muteMusicButton.centerY = musicSlider.centerY;
    muteMusicButton.x = musicSlider.right + 16;

    var soundsLabel = game.make.text(0, 0, "Sounds", textStyle);
    settingsPanel.addChild(soundsLabel);
    soundsLabel.alignTo(musicLabel, Phaser.BOTTOM_CENTER, 0, muteMusicButton.height + 24);

    var soundsSlider = createSlider();
    settingsPanel.addChild(soundsSlider);
    soundsSlider.percent.subscribe(function () {
        changeSoundsVolume(soundsSlider.percent());
        saveSoundsVolume(soundsSlider.percent());
    });
    soundsSlider.alignTo(soundsLabel, Phaser.BOTTOM_CENTER, -soundsSlider.width / 4, 4);
    soundsSlider.percent(getSoundsVolume());

    var muteSoundsButton = createMuteSoundsButton();
    settingsPanel.addChild(muteSoundsButton);
    muteSoundsButton.centerY = soundsSlider.centerY;
    muteSoundsButton.x = soundsSlider.right + 16;

    var button = game.make.button(0, 0, 'cross', function () {
        settingsPanel.visible = false;
    }, this);
    button.scale.setTo(0.2, 0.2);
    button.tint = 0x505058;
    settingsPanel.addChild(button);
    button.alignInParent(Phaser.TOP_RIGHT, -8, -8);

    settingsPanel.fixedToCamera = true;
    settingsPanel.visible = false;
}
