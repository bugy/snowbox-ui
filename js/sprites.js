function sprites_preload() {
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

    return result;
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

    var textStyle = {font: "18px Arial", fill: "#212140"};
    var playerLabel = game.make.text(0, 0, "Nickname", textStyle);
    choosePlayerDialog.addChild(playerLabel);
    playerLabel.alignInParent(Phaser.CENTER, 0, -120);

    var nameField = createTextField(playerLabel);
    nameField.alignTo(playerLabel, Phaser.BOTTOM_CENTER, 0, 0);

    var skinLabel = game.make.text(0, 0, "Select skin", textStyle);
    skinLabel.alignTo(nameField, Phaser.BOTTOM_CENTER, 0, 28);

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
    boyButton.alignTo(skinLabel, Phaser.BOTTOM_CENTER, -boyButton.width, 4);

    var girlButton = createImageButton('girl', skinSelector);
    girlButton.alignTo(skinLabel, Phaser.BOTTOM_CENTER, +boyButton.width, 4);

    var skinButtonsGray = game.add.filter('Gray');
    girlButton.filters = [skinButtonsGray];
    boyButton.filters = [skinButtonsGray];

    buttons.push(boyButton);
    buttons.push(girlButton);

    var startButton = createButton(textStyle, function () {
        setButtonEnabled(startButton, false);

        var name = nameField.text().trim();

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

function createTree(bodyWidth, bodyHeight) {
    var tree = game.add.group();

    var head = game.make.sprite(0, 0, 'LPC_Trees', 'full_snow_tree_head.png');
    game.physics.enable(head, Phaser.Physics.ARCADE);
    head.body.immovable = true;


    var trunk = game.make.sprite(0, 0, 'LPC_Trees', 'tree_trunk.png');

    tree.add(trunk);
    tree.add(head);

    trunk.centerX = tree.width / 2;
    head.y -= 44;

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
    head.y -= 36;

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

    /*var headWidth = 42 * tree.scale.x;
    var headHeight = 70 * tree.scale.y;
    head.body.setSize(
        headWidth,
        headHeight,
        Math.round((head.width * tree.scale.x - headWidth) / 2),
        Math.round((head.height * tree.scale.y - headHeight) / 2));*/

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