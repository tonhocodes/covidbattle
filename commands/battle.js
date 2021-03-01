const fs = require("fs");

deads = [];
var canIngress = true;
var gameStarted = false;
var startDate = undefined;
var battleStarted = false;
var intervalStarted = false;
var gamePreStarted = false;
var roundPlayers = false;
var gameInterval;
var roundNumber = 0;
var username;
var roundAttackers = [];
const ingressTime = 40000;
const roundTime = 40000;

participants = [];

const covid = {
  id: 1,
  health: 0,
};

function getRndInteger(min, max) {
  return Math.floor(Math.random() * (max - min)) + min;
}

function roundPlayersExec(socket, client) {
  roundNumber++;
  if (!roundPlayers) {
    roundPlayers = true;
    socket.emit("round", "players");
    client.action(url, "Players Round!");

    participants.forEach((element) => {
      element.lastCommand = 1;
    });

  } else {
    roundAttackers = []
    roundPlayers = false;
    socket.emit("round", "covid");
    client.action(url, "Monster Round!");

    for (i = 0; i < participants.length; i++) {
      element = participants[i];
      damage = getRndInteger(20, 40);

      if (element.defenseChance != -1) {
        damage = Math.floor(damage * (1 - element.defenseChance / 100));
        element.defenseChance = -1;
      }
      element.health -= damage;

      if (!element.dead) {
        client.action(
          url,
          `The Covid took ${damage} damage points from ${element.player} and ${element.health} health left`
        );
        if (element.health <= 0 && !element.dead) {
          element.health = 0;
          element.dead = true;

          client.action(url, `${element.player} got infected!`);
          socket.emit("playerDeath", element.player);
          deads.push(element);

          if (participants.length == deads.length && gameStarted) {
            gameStarted = false;
            gamePreStarted = false;
            intervalStarted = false;
            participants = [];
            clearInterval(gameInterval);

            client.action(url, "All heroes has been infected");
            socket.emit("gameover", { gameover: true });
          }
        }
      }
    }

  }
}

function battle(message, user, client, socket, channel) {
  username = channel.replace("#", "");
  user = user.toLowerCase();
  console.log(user, username)
  console.log(message == "!covidbattle", user == username)
  try {
    if (message == "!covidbattle" && user == username) {
      battleStarted = true;
      startDate = new Date();
      client.action(
        url,
        "Wear your masks! Send !join with your class (Doctor, Nurse or Scientist)!"
      );

      gamePreStarted = true;
      socket.emit("start", true);
    }
  } catch (e) {
    console.log(e);
  }

  try {
    const aux = message.toLowerCase().split(" ");
    if (participants.length >= 6) {
      canIngress = false;
      client.action(url, "The 6 players has joined to the game! Starting!");
    }
    if (aux[0] == "!join" && canIngress) {
      if (battleStarted) {
        let passedAlist = true;
        if (participants.findIndex((i) => i.player === user) === -1) {
          switch (aux[1]) {
            case "doctor":
              participants.push({
                player: user,
                health: 100,
                dead: false,
                baseAttack: 15,
                baseDefense: 15,
                defenseChance: -1,
                lastCommand: 1,
                savedCommand: true,
                ultimate: false,
                class: "doctor",
              });
              break;
            case "scientist":
              participants.push({
                player: user,
                health: 50,
                dead: false,
                baseAttack: 20,
                baseDefense: 5,
                defenseChance: -1,
                lastCommand: 1,
                savedCommand: false,
                ultimate: false,
                class: "scientist",
              });
              break;
            case "nurse":
              participants.push({
                player: user,
                health: 75,
                dead: false,
                baseAttack: 10,
                baseDefense: 10,
                defenseChance: -1,
                lastCommand: 1,
                savedCommand: false,
                class: "nurse",
              });
              break;
            default:
              passedAlist = false;
              client.action(
                url,
                `${user} Send !join with Doctor, Nurse ou Scientist!`
              );
          }
          if (passedAlist) {
            client.action(
              url,
              `${user} is a ${aux[1]}! Use !attack (or 1) to attack !alcohol (or 2) to defend yourself, !cure (or 3) and !vaccine (or 4) to use the special attack (scientist, doctor), to try to save a infected player!`
            );
          }
        }
      }
    }
  } catch (e) {
    console.log(err);
  }

  try {
    console.log(roundPlayers)
    if (message == "!infected" && !canIngress) {
      if (deads.length > 0) {
        let deadPlayers = "";
        deads.forEach((dead, index) => {
          if (index == deads.length - 1) {
            deadPlayers += dead.player + ".";
          } else {
            deadPlayers += dead.player + ", ";
          }
        });
        client.action(url, `Sick heroes: ${deadPlayers}`);
      } else {
        client.action(url, `Any hero is infected!`);
      }
    }
  } catch (err) {
    console.log(err);
  }

  try {
    index = participants.findIndex((i) => i.player === user);
    participant = participants[index];
    if (
      message == "!attack" ||
      message == "1" &&
        !canIngress &&
        gameStarted &&
        roundPlayers &&
        roundAttackers.indexOf(participant.player) === -1 &&
        !participant.dead &&
        participant.lastCommand === 1
    ) {
      console.log(roundAttackers.indexOf(participant.player))
      console.log(roundAttackers)
      switch (participant.class) {
        case "doctor":
          damage = getRndInteger(5, 10) + participant.baseAttack;
          break;
        case "scientist":
          damage = getRndInteger(10, 15) + participant.baseAttack;
          break;
        case "nurse":
          damage = getRndInteger(3, 8) + participant.baseAttack;
          break;
      }
      covid.health -= damage;
      data = { player: user, health: covid.health };
      roundAttackers.push(participant.player)
      client.action(
        url,
        `${user} attacked the Covid, taking ${damage} health points! The Covid now has ${covid.health} health points.`
      );
      socket.emit("attackPlayer", JSON.stringify(data));

      index = participants.findIndex((i) => i.player === user);
      participant = participants[index];

      participant.lastCommand = 0;

      if (covid.health <= 0) {
        client.action(url, `The Covid died!`);
        socket.emit("covidDeath", true);
        gameStarted = false;
        gamePreStarted = false;
        participants = [];
        clearInterval(gameInterval);
      }
    }
  } catch (err) {
    console.log(err);
  }

  try {
    index = participants.findIndex((i) => i.player === user);
    participant = participants[index];
    if (
      message == "!vaccine" ||
      message == "4" &&
        !canIngress &&
        gameStarted &&
        roundPlayers &&
        !participant.dead &&
        roundAttackers.indexOf(participant.player) === -1 &&
        participant.ultimate === false
    ) {
      switch (participant.class) {
        case "doctor":
          damage = getRndInteger(10, 20) + participant.baseAttack;
          break;
        case "scientist":
          damage = getRndInteger(15, 30) + participant.baseAttack;
          break;
      }

      covid.health -= damage;
      data = { player: participant.player, health: covid.health };
      roundAttackers.push(participant.player)
      client.action(
        url,
        `${user} Used the vaccine! taking ${damage} health points! The Covid now has ${covid.health} health points.`
      );
      socket.emit("attackPlayer", JSON.stringify(data));

      if (covid.health <= 0) {
        client.action(url, `The covid died!`);
        socket.emit("covidDeath", true);
        gameStarted = false;
        gamePreStarted = false;
        participants = [];
        clearInterval(gameInterval);
      }

      participant.ultimate = true;
    }
  } catch (err) {
    console.log(err);
  }
  try {
    index = participants.findIndex((i) => i.player === user);
    participant = participants[index];
    if (
      message == "!alcohol" ||
      message == "2" &&
        !canIngress &&
        gameStarted &&
        roundPlayers &&
        !participant.dead &&
        roundAttackers.indexOf(participant.player) === -1 &&
        participant.lastCommand === 1
    ) {
      switch (participant.class) {
        case "doctor":
          defenseChance = getRndInteger(30, 60);
          break;
        case "scientist":
          defenseChance = getRndInteger(15, 40);
          break;
        case "nurse":
          defenseChance = getRndInteger(10, 25);
          break;
      }
      participant.defenseChance = defenseChance;
      participant.lastCommand = 0;
      roundAttackers.push(participant.player)
      client.action(url, `${participant.player} You used alcohol in gel`);
    }
  } catch (err) {
    console.log(err);
  }

  try {
    index = participants.findIndex((i) => i.player === user);
    participant = participants[index];
    if (
      message == "!cure" ||
      message == "3" &&
        !canIngress &&
        gameStarted &&
        roundPlayers &&
        !participant.dead &&
        participant.lastCommand === 1 &&
        roundAttackers.indexOf(participant.player) === -1 &&
        !participant.savedCommand &&
        deads.length > 0
    ) {
      if (participant.class === "nurse") {
        saveProbability = Math.random() < 0.6;
      } else {
        saveProbability = Math.random() < 0.1;
      }

      if (saveProbability) {
        let indexSaved = Math.floor(Math.random() * deads.length);
        let participantSaved = deads[indexSaved];
        deads.splice(indexSaved, 1);

        participantSaved.dead = false;

        if (participant.class != "nurse") {
          participantSaved.savedCommand = true;
        }
        participantSaved.health = 50;
        participant.savedCommand = true;

      roundAttackers.push(participant.player)
        client.action(
          url,
          `${participant.player} cured ${participantSaved.player}`
        );
      } else {
        client.action(url, `${participant.player} don't cured anyone`);
      }
      participant.lastCommand = 0;
    }
  } catch (err) {
    console.log(err);
  }

  if (String(message).split(" ")[0] == "!help") {
    if (String(message).split(" ")[1] == "") {
      client.action(
        url,
        "Available commands: !attack (1),  !alcohol (2), !cure (3), !vaccine (4)"
      );
    }
    switch (String(message).split(" ")[1]) {
      case "attack":
        client.action(
          url,
          "!attack | The Covid will be attack, taking a variable damage."
        );
        break;
      case "vaccine":
        client.action(
          url,
          "!vaccine | The covid will be attack, taking a variable damage and a bônus damages. Can be used for Doctors and Scientists one time in the match."
        );
        break;
      case "alcohol":
        client.action(
          url,
          "!alcohol | You enter in a defense position, taking less damage from Covid."
        );
        break;
      case "cure":
        client.action(
          url,
          "!cure | You try to cure another infected person, who is no longer in the game. People with Doctor and Scientist classes can use this command one time in the match. But people with Nurse class can use this command several times during the match."
        );
        break;
      default:
        client.action(
          url,
          "Available commands: !attack (1),  !alcohol (2), !cure (3), !vaccine (4)"
        );
        break;
    }
  }
  // test if the ingressTime has passed
  if (!gameStarted && canIngress) {
    setTimeout(() => {
      gameStarted = true;
      canIngress = false;
      covid.health = participants.length * getRndInteger(60, 90);
      socket.emit("players", JSON.stringify({ covid, participants }));

      if (gameStarted && battleStarted && intervalStarted == false) {
        client.action(url, "The time has ended, starting the battle!");
        intervalStarted = true;
        roundPlayersExec(socket, client);
        gameInterval = setInterval(() => {
          roundPlayersExec(socket, client);
        }, roundTime);
      }
    }, ingressTime);
  }
}

module.exports = battle;
