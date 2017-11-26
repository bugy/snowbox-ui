var loginMusic;
var battleMusic;
var stepsSound;
var throwSound;

function preloadSounds() {
    game.load.audio('login_music', 'assets/music/Snowland.mp3');
    game.load.audio('battle_music', 'assets/music/wintery loop.wav');
    game.load.audio('snow_run', 'assets/music/snow_run.mp3');
    game.load.audio('hit_ball', 'assets/music/hit_ball.mp3');
    game.load.audio('throw_ball', 'assets/music/throw_ball.mp3');
}

function createSounds() {
    loginMusic = game.add.audio('login_music', 0.3, true);
    battleMusic = game.add.audio('battle_music', 0, true);
    loginMusic.play();

    stepsSound = game.add.audio('snow_run', 1, true);
    throwSound = game.add.audio('throw_ball', 0.7, false);
    hitSound = game.add.audio('hit_ball', 1, false);
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

function playThrow(volume) {
    throwSound.play();
    throwSound.volume = volume * 0.5;
}

function playSnowballSplash(volume) {
    hitSound.play();
    hitSound.volume = volume;
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