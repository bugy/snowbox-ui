var loginMusic;
var battleMusic;
var stepsSound;
var throwSound;
var hitSound;

var MAX_MUSIC_VOLUME = 0.4;
var musicVolume = MAX_MUSIC_VOLUME;

var MAX_STEPS_VOLUME = 0.2;
var stepsVolume = MAX_STEPS_VOLUME;

var MAX_THROW_VOLUME = 0.7;
var throwVolume = MAX_THROW_VOLUME;

var MAX_HIT_VOLUME = 1;
var hitVolume = MAX_HIT_VOLUME;

function preloadSounds() {
    game.load.audio('login_music', 'assets/music/snowland_cut_looped.mp3');
    game.load.audio('battle_music', 'assets/music/wintery loop_cut.mp3');
    game.load.audio('snow_run', 'assets/music/snow_run.mp3');
    game.load.audio('hit_ball', 'assets/music/hit_ball.mp3');
    game.load.audio('throw_ball', 'assets/music/throw_ball.mp3');
}

function createSounds() {
    loginMusic = game.add.audio('login_music', musicVolume, true);
    battleMusic = game.add.audio('battle_music', 0, true);
    loginMusic.play();

    stepsSound = game.add.audio('snow_run', 0.2, true);
    throwSound = game.add.audio('throw_ball', 0.7, false);
    hitSound = game.add.audio('hit_ball', 1, false);

    changeMusicVolume(getMusicVolume());
    muteMusic(isMusicMuted());

    changeSoundsVolume(getSoundsVolume());
    muteSounds(isSoundMuted());
}

function muteMusic(muted) {
    battleMusic.mute = muted;
    loginMusic.mute = muted;
}

function changeMusicVolume(volume) {
    musicVolume = volume * MAX_MUSIC_VOLUME;

    if (battleMusic.isPlaying) {
        battleMusic.volume = musicVolume;
    }

    loginMusic.volume = musicVolume;
}

function changeSoundsVolume(volume) {
    hitVolume = volume * MAX_HIT_VOLUME;
    throwVolume = volume * MAX_THROW_VOLUME;
    stepsVolume = volume * MAX_STEPS_VOLUME;

    stepsSound.volume = stepsVolume;
}

function muteSounds(muted) {
    stepsSound.mute = muted;
    throwSound.mute = muted;
    hitSound.mute = muted;
}

function soundSteps(enabled) {
    if (enabled) {
        if (!stepsSound.isPlaying) {
            stepsSound.play();
        }
    } else {
        stepsSound.stop();
    }
}

function playThrow(volume) {
    throwSound.play();
    throwSound.volume = volume * throwVolume;
}

function playSnowballSplash(volume) {
    hitSound.play();
    hitSound.volume = volume * hitVolume;
}

function switchMusic() {
    var musicSwitchDelay = 3000;
    loginMusic.fadeTo(musicSwitchDelay, 0);
    setTimeout(function () {
        loginMusic.destroy();

        battleMusic.play();
        this.game.add.tween(battleMusic).to({
            volume: musicVolume
        }, musicSwitchDelay, Phaser.Easing.Linear.None, true);
    }, musicSwitchDelay);
}

function getMusicVolume() {

}