var loginMusic;
var battleMusic;
var stepsSound;

function preloadSounds() {
    game.load.audio('login_music', 'assets/music/Snowland.mp3');
    game.load.audio('battle_music', 'assets/music/wintery loop.wav');
    game.load.audio('snow_run', 'assets/music/snow_run.mp3');
}

function createSounds() {
    loginMusic = game.add.audio('login_music', 0.3, true);
    battleMusic = game.add.audio('battle_music', 0, true);
    loginMusic.play();

    stepsSound = game.add.audio('snow_run', 1, true);
}

function muteMusic(muted) {
    battleMusic.mute = muted;
    loginMusic.mute = muted;
}

function soundSteps(enabled) {
    if (enabled) {
        stepsSound.play();
    } else {
        stepsSound.stop();
    }
}

function switchMusic() {
    var musicSwitchDelay = 3000;
    loginMusic.fadeTo(musicSwitchDelay, 0);
    setTimeout(function () {
        loginMusic.destroy();

        battleMusic.play();
        this.game.add.tween(battleMusic).to({
            volume: 0.3
        }, musicSwitchDelay, Phaser.Easing.Linear.None, true);
    }, musicSwitchDelay);
}