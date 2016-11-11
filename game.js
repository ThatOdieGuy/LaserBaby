/*global Phaser*/
/*jslint sloppy:true, browser: true, devel: true, eqeq: true, vars: true, white: true*/
var game;
var buttons;
var platforms;
var player;

var playerVelocity = { x: 100, y: 300 };

var platformVelocity = 20;

var mainState = {
    lastAddedPlatformY: Number.MAX_SAFE_INTEGER,
    lastPurgedPlatformY: Number.MAX_SAFE_INTEGER,

    // Here we add all the functions we need for our state
    // For this project we will just have 3 functions
    preload: function () {
        // This function will be executed at the beginning
        // That's where we load the game's assets
        game.load.image('platform', 'platform.png');
        game.load.spritesheet('dude', 'dude.png', 32, 48);
    },
    create: function () {
        // This function is called after the preload function
        // Here we set up the game, display sprites, etc.

        game.world.setBounds(0, 0, game.world.width, game.world.height * 5);

        game.camera.y = game.world.height - game.camera.height;

        game.stage.backgroundColor = '#999999';
        game.physics.startSystem(Phaser.Physics.ARCADE);

        buttons = [];
        buttons.left = game.input.keyboard.addKey(Phaser.Keyboard.LEFT);
        buttons.right = game.input.keyboard.addKey(Phaser.Keyboard.RIGHT);
        buttons.up = game.input.keyboard.addKey(Phaser.Keyboard.UP);
        buttons.down = game.input.keyboard.addKey(Phaser.Keyboard.DOWN);
        buttons.space = game.input.keyboard.addKey(Phaser.Keyboard.SPACEBAR);

        platforms = game.add.physicsGroup();
        platforms.enableBody = true;

        this.createInitialPlatforms();

        player = game.add.sprite(32, game.world.height - 100, 'dude');
        game.physics.arcade.enable(player);

        player.body.gravity.y = 300;
        player.body.collideWorldBounds = true;

        //  Our two animations, walking left and right.
        player.animations.add('left', [0, 1, 2, 3], 10, true);
        player.animations.add('right', [5, 6, 7, 8], 10, true);
        player.animations.add('idle', [4], 10, true);

        game.camera.follow(player, null, 0, 1);

        var deadZoneTop =  game.camera.height / 20;
        var deadZoneHeight = game.camera.height - deadZoneTop - game.camera.height / 5;
        game.camera.deadzone = new Phaser.Rectangle(0, deadZoneTop, game.camera.width, deadZoneHeight);

    },
    update: function () {
        // This function is called 60 times per second
        // It contains the game's logic
        
        this.backfillPlatforms();

        this.physics.arcade.collide(player, platforms, null, null, this);

        if (this.isPlayerStanding() && player.y > this.lastPurgedPlatformY) {
            game.stage.backgroundColor = '#FF0000';
            return;
        }

        this.processInput();
        this.purgePlatforms();
    },

    processInput: function() {
        var standing = this.isPlayerStanding();

        //Check keyboard controls
        if (standing && (buttons.space.isDown || buttons.up.isDown)) {
            player.body.velocity.y = -playerVelocity.y;
        }

        if (buttons.left.isDown) {
            player.body.velocity.x = -playerVelocity.x;
            player.animations.play("left");
        } else if (buttons.right.isDown) {
            player.body.velocity.x = playerVelocity.x;
            player.animations.play("right");
        } else {
            player.body.velocity.x = 0;
            player.animations.stop();
            player.animations.play("idle");
        }
    },

    isPlayerStanding: function() {
        return player.body.blocked.down || player.body.touching.down;
    },

    createInitialPlatforms: function() {
        //If we have ground, this should be set to that value instead.
        this.lastAddedPlatformY = game.world.height;

        this.backfillPlatforms();
    },

    backfillPlatforms: function() {
        while (this.lastAddedPlatformY > game.camera.y - 200) {
            this.addRandomPlatform();
        }
    },

    addRandomPlatform: function() {
        var platformWidth = 200;
        var platformHeight = 200;

        var offScreenWidth = 150;
        var x = game.rnd.integerInRange(-offScreenWidth, game.world.width - platformWidth + offScreenWidth);

        var y = this.lastAddedPlatformY - game.rnd.integerInRange(40, playerVelocity.y / 2);

        var added = false;

        //Try a few times to find a non-collision
        for (var t = 0; t < 5; t++) {
            if (this.addPlatform(x, y)) {
                added = true;
                break;
            }
        }

        if (added) {
            this.lastAddedPlatformY = y;
        } else {
            console.log("Platform not added probably too many on the screen already");
        }
    },

    addPlatform: function(x, y) {
        var platform = platforms.create(x, y, 'platform');
        platform.scale.setTo(0.5, 0.5);
        platform.body.immovable = true;
       // platform.body.velocity.y = -platformVelocity;
        platform.body.checkCollision.down = false;
        platform.body.checkCollision.right = false;
        platform.body.checkCollision.left = false;

        var collision = false;

        game.physics.arcade.overlap(platforms, platform, function(a, b) { if (a != b) collision = true; });

        if (collision) {
            platforms.remove(platform);
            return false;
        }

        return true;
    },

    purgePlatforms: function() {
        platforms.forEach(this.checkPurgePlatform, this, true);
    },

    checkPurgePlatform: function(platform) {
        if (platform.y > game.camera.y + game.camera.height + 100) {
            this.lastPurgedPlatformY = platform.y;
            platforms.remove(platform);
        }
    }
};

// Initialize Phaser
game = new Phaser.Game(320, 480, Phaser.AUTO, 'gameDiv');

// And finally we tell Phaser to add and start our 'main' state
game.state.add('main', mainState);
game.state.start('main');
