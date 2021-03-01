let covidLife = 100;
let gameover = false;

let bg;
let platform;
let gameStarted = false;

let npc = {
  name: "Corona Virus",
  health: 100,
  aliveImg: null,
  deadImg: null,
};

var socket = io();

socket.on("start", (msg) => {
  covidLife = 1;
  npc.health = 1;
  gameStarted = true;
});

socket.on("players", (msg) => {
  let game = JSON.parse(msg);
  covidLife = game.covid.health;
});

socket.on("round", (msg) => {
  console.log(msg);
});

socket.on("attackPlayer", (msg) => {
  let attack = JSON.parse(msg);
  npc.health = attack.health;
  console.log(attack.health);
});

socket.on("attackMonster", (msg) => {
  console.log(msg);
});

socket.on("covidDeath", (msg) => {
  gameStarted = false;
});

socket.on("gameover", (msg) => {
  console.log(msg);
  gameStarted = false;
});

socket.on("covidData", (msg) => {
  console.log(msg);
  var elmn = document.createElement("div");
  elmn.innerHTML =
    " Country: " +
    msg.country +
    '<br>Cases: <span style="color: lightgreen">' +
    msg.cases +
    "</span><br>" +
    'Recovered: <span style="color:lightblue">' +
    msg.recovered +
    "</span>";
  elmn.classList.add("covid");
  document.body.appendChild(elmn);

  setTimeout(() => {
    elmn.remove();
  }, 15000);
});

function preload() {
  bg = loadImage("./public/img/bg.png");
  platform = loadImage("./public/img/platform.png");
  npc.aliveImg = loadImage("./public/img/npc-idle.png");
  npc.deadImg = loadImage("./public/img/npc-dead.png");

  music = loadSound("./public/snd/song.mp3");
  music.setVolume(0.25);
  music.loop();
}

function setup() {
  createCanvas(200, 300);
}

function draw() {
  clear();

  if (gameStarted) {
    image(bg, 0, 0, 200, 300, 0, 0, 500, 500);

    fill(0, 153, 0);
    rect(10, 10, (180 * npc.health) / covidLife, 30);

    fill(255, 0, 0);
    rect(
      10 + (180 * npc.health) / covidLife,
      10,
      180 * (1 - npc.health / covidLife),
      30
    );

    fill(255, 255, 255);
    textSize(12);
    text(npc.name, 65, 30);

    if (npc.health <= 0) {
      fill(0, 0, 0);
      rect(25, 50, 150, 30);

      fill(255, 255, 255);
      textSize(20);
      text("Game Over!", 50, 70);
    }

    if (npc.health > 0) {
      image(npc.aliveImg, 45, 90, 144, 190);
    } else {
      image(npc.deadImg, -25, 90, 246, 199);
    }

    image(platform, -20, height - 30, 240, 30, 0, 0, 175, 30);
  }
}
