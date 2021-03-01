const express = require("express");
require("dotenv").config();
require("newrelic");

if (!process.env.CHANNEL) {
  console.log(
    "Set the channel do you want to connect in your .env with CHANNEL variable"
  );
  process.exit();
}

const app = express();
const http = require("http").createServer(app);
const io = require("socket.io")(http);
const path = require("path");
const tmi = require("tmi.js");

app.use(express.static(path.join(__dirname, "pages")));

app.get("/", (req, res) => {
  res.sendFile(__dirname + "/pages/index.html");
});

io.on("connection", (socket) => {
  const client = new tmi.client({
    options: { debug: true },
    connection: { reconnect: true },
    identity: {
      username: process.env.BOT_NAME,
      password: process.env.TOKEN,
    },
    channels: [process.env.CHANNEL],
  });
  const battle = require("./commands/battle");
  const showData = require("./commands/showData");

  url = process.env.CHANNEL;

  client.connect();

  client.on("connected", (address, port) => {});

  client.on("chat", (channel, user, message, self) => {
    battle(message, user["display-name"], client, socket, channel);
    console.log(message);
    showData(message, user["display-name"], client, socket);
  });
});

http.listen(3000, () => {
  console.log("listening on *:3000");
});
