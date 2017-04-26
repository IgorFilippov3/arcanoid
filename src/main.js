var Arcade = Phaser.Physics.ARCADE;
var stateFunctions = {
  preload: preload,
  create: create,
  update: update
};
var game = new Phaser.Game(512, 512, Phaser.AUTO, 'root', stateFunctions);
var background,
    ball,
    paddle,
    bricks,
    newBrick,
    brickInfo,
    brickNames,
    isGameStarted,
    isGameEnd,
    scoreText,
    score,
    startGameText,
    pauseText,
    endGameText,
    state,
    mouse,
    isAllDead,
    lives,
    livesText,
    lifeLostText,
    playing,
    startButton,
    state
;

function preload() {
  // Растягивает на всю ширину вьюпорта
  // game.scale.scaleMode = Phaser.ScaleManager.SHOW_ALL;
  game.scale.pageAlignHorizontally = true;
  // game.scale.pageAlignVertically = true;

  game.stage.backgroundColor = "#eee";

  game.load.image("background", "img/background.jpg");
  game.load.image("ball", "img/ball.png");
  game.load.image("paddle", "img/paddle.png");
  game.load.image("brick", "img/blue_brick.png");
  game.load.spritesheet("wobble", "img/wobble.png", 20, 20);
  game.load.spritesheet("button", "img/button.png", 120, 40);


  game.load.atlas("bricks", "img/brickAtlas.png","img/brickAtlas.json", Phaser.Loader.TEXTURE_ATLAS_JSON_HASH);
}
function create() {
  isAllDead = false;
  playing = false;
  score = 0;
  lives = 3;
  background = game.add.sprite(0, 0, "background");
  background.width = game.world.width;
  background.height = game.world.height;


  initBricks();
  game.physics.startSystem(Arcade);
  ball = game.add.sprite(game.world.width * 0.5, game.world.height-25, "ball");
  ball.animations.add("wobble", [0,1,0,2,0,1,0,2,0], 24);
  ball.anchor.set(0.5);
  ball.scale.setTo(0.8, 0.8);
  game.physics.enable(ball, Arcade);

  ball.body.collideWorldBounds = true;
  ball.body.bounce.set(1);
  // ball.body.gravity.y = 50;
  ball.checkWorldBounds = true;
  ball.events.onOutOfBounds.add(function(){
    ballLeaveScreen();
  }, this);

  paddle = game.add.sprite(game.world.width * 0.5, game.world.height - 5, "paddle");
  paddle.anchor.set(0.5,1); // по умолчанию позиция спрайта идет от верхнего левого края. Сбрасываем это до центра.
  paddle.scale.setTo(2, 1);
  game.physics.enable(paddle, Arcade);
  paddle.body.immovable = true;

  game.physics.arcade.checkCollision.down = false;

  // game.input.onDown.addOnce(function(){
  //   ball.body.velocity.set(250, -250);
  // }, this);

  scoreText = game.add.text(5,5, "Points: 0", {font: "18px Arial", fill: "#0095DD" });

  livesText = game.add.text(game.world.width - 5, 5, 'Lives: ' + lives, { font: '18px Arial', fill: '#0095DD' });
  livesText.anchor.set(1,0);

  lifeLostText = game.add.text(game.world.width / 2, game.world.height / 2, "Life lost, click to continue", { font: '18px Arial', fill: '#0095DD' });
  lifeLostText.anchor.set(0.5);
  lifeLostText.visible = false;

  startButton = game.add.button(game.world.width / 2, game.world.height / 2, "button", startGame, this, 1, 0, 2);
  startButton.anchor.set(0.5);
}

function update() {
  game.physics.arcade.collide(ball, paddle, ballHitPaddle);
  game.physics.arcade.collide(ball, bricks, ballHitBrick); // последний аргумент это колбек при столкновении
  if(playing) {
      paddle.x = game.input.x || game.world.width * 0.5;
  }
  isAllDead = bricks.children.every(function(b){
      return b.alive === false;
  });
  if(isAllDead) endGame();
}

function initBricks() {
  brickInfo = {
    width: 50,
    height: 20,
    count: {
      row: 7,
      col: 4
    },
    offset: {
      top: 50,
      left: 60
    },
    padding: 10
  };

  brickNames = [
    "purple_brick.png",
    "grey_brick.png",
    "blue_brick.png",
    "green_brick.png",
    "orange_brick.png",
    "red_brick.png",
    "yellow_brick.png"
  ];

  bricks = game.add.group();
  for(var c = 0; c < brickInfo.count.col; c++) {
    for(var r = 0; r < brickInfo.count.row; r++) {
      var brickX = (r * (brickInfo.width+brickInfo.padding)) + brickInfo.offset.left;
      var brickY = (c * (brickInfo.height+brickInfo.padding)) + brickInfo.offset.top;
      newBrick = game.add.tileSprite(brickX, brickY, 50, 20, 'bricks', brickNames[r]);
      game.physics.enable(newBrick, Arcade);
      newBrick.body.immovable = true;
      newBrick.anchor.set(0.5);
      newBrick.col = c;
      newBrick.row = r;
      newBrick.alive = true;
      if(brickNames[r] === "red_brick.png") newBrick.bomb = true;
      bricks.add(newBrick);
      if(r === 6) brickNames = brickNames.reverse();

    }
  }
}

function ballHitBrick(ball, brick) {
    var isAllParentsDead = bricks.children.some(function(b){
      return b.alive === true && b.col > brick.col;
    });

    if(!isAllParentsDead) {
      if(brick.bomb) {
        // bricks.children.filter(function(b){
        //     return b.row === brick.row;
        // }).forEach(function(b){
        //     killTween(b);
        // })
        bricks.children.filter(function(b){
            return b.row === brick.row;
        }).forEach(function(b){
          killTween(b);
        })
      }
      killTween(brick);
    }
    // game.add.tween(brick.scale).to({x:2,y:2}, 500, Phaser.Easing.Elastic.Out, true, 100) сокращенная запись, увеличивает в два раза размер

    isAllDead = bricks.children.every(function(brick){
        return brick.alive === false;
    });
    if(isAllDead) alert('You won');
}

function killTween(elem) {
  var killTween = game.add.tween(elem.scale);
  killTween.to({ x:0, y: 0}, 200, Phaser.Easing.Linear.None);
  killTween.onComplete.addOnce(function(){
    elem.kill();
    score += 10;
    scoreText.setText("Points: " + score);

  }, this);
  killTween.start();
}

function ballHitPaddle() {
    ball.animations.play("wobble");
    ball.body.velocity.x = -1*5*(paddle.x-ball.x);
}

function ballLeaveScreen() {
  lives--;
    if(lives) {
        livesText.setText('Lives: '+lives);
        lifeLostText.visible = true;
        ball.reset(game.world.width*0.5, game.world.height-25);
        paddle.reset(game.world.width*0.5, game.world.height-5);
        game.input.onDown.addOnce(function(){
            lifeLostText.visible = false;
            ball.body.velocity.set(250, -250);
        }, this);
    }
    else {
        alert('You lost, game over!');
        location.reload();
    }
}

function startGame() {
  startButton.destroy();
  ball.body.velocity.set(250, -250);
  playing = true;
}

function endGame() {
  location.reload();
}
