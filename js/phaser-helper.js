var disabledButtonGray;

function preloadHelper() {
    game.load.script('disabledButtonGray',
        'https://cdn.rawgit.com/photonstorm/phaser-ce/master/filters/Gray.js');
}

function setButtonEnabled(button, enabled) {
    if (!disabledButtonGray) {
        disabledButtonGray = game.add.filter('Gray');
    }

    button.input.enabled = enabled;

    if (enabled === true) {
        if (button.filters) {
            removeFromArray(button.filters, disabledButtonGray);

            if (button.filters.length === 0) {
                button.filters = null;
            }
        } else {
            button.filters = null;
        }

    } else {
        if (button.filters) {
            if (button.filters.indexOf(disabledButtonGray) < 0) {
                button.filters.push(disabledButtonGray);
            }
        } else {
            button.filters = [disabledButtonGray];
        }
    }
}

function drawGradientCircle(x, y, radius, colorIn, colorOut, bitmap) {
    var gradient = bitmap.context.createRadialGradient(x, y, radius / 2, x, y, radius);
    gradient.addColorStop(0, colorIn);
    gradient.addColorStop(1, colorOut);
    bitmap.circle(x, y, radius, gradient);
}

function load9PatchImage(destImage, srcImage, width, height, srcX1, srcY1, srcX2, srcY2, frame) {
    var bitmap = game.make.bitmapData(width, height);

    var patchImage = game.make.sprite(0, 0, srcImage);
    if (frame) {
        patchImage.frameName = frame;
    }

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

function directionsToAngle(directionX, directionY) {
    return Phaser.Math.angleBetween(0, 0, directionX, directionY);
}

function alignToCamera(object, position, offsetX, offsetY) {
    if (object.cameraReposition) {
        game.scale.onSizeChange.add(object.cameraReposition);
        object.cameraReposition = null;
    }

    var reposition = function () {
        if (!object.exists) {
            game.scale.onSizeChange.remove(reposition);
            return;
        }

        var y;
        if ((position === Phaser.TOP_LEFT)
            || (position === Phaser.TOP_RIGHT)
            || (position === Phaser.TOP_CENTER)) {
            y = 0;
        } else if ((position === Phaser.LEFT_CENTER)
            || (position === Phaser.RIGHT_CENTER)
            || (position === Phaser.CENTER)) {
            y = (game.camera.height - object.height) / 2;
        } else {
            y = (game.camera.height - object.height);
        }

        var x;
        if ((position === Phaser.TOP_LEFT)
            || (position === Phaser.LEFT_CENTER)
            || (position === Phaser.BOTTOM_LEFT)) {
            x = 0;
        } else if ((position === Phaser.TOP_CENTER)
            || (position === Phaser.BOTTOM_CENTER)
            || (position === Phaser.CENTER)) {
            x = (game.camera.width - object.width) / 2;
        } else {
            x = (game.camera.width - object.width);
        }

        if (object.anchor) {
            y += object.height * object.anchor.y;
            x += object.width * object.anchor.x;
        }

        object.cameraOffset.x = x + offsetX;
        object.cameraOffset.y = y + offsetY;
    };

    game.scale.onSizeChange.add(reposition);
    reposition();

    object.cameraReposition = reposition;
}
