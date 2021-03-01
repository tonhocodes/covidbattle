const fetch = require("node-fetch");

function showData(message, user, client, socket) {
  messageSplited = message.split(" ");
  if (messageSplited.length >= 2 && messageSplited[0] == "!covid") {
    fetch("https://covid19-api.org/api/status/" + messageSplited[1])
      .then((res) => res.json())
      .then((json) => {
        console.log(json);
        console.log("https://covid19-api.org/api/status/" + messageSplited[1]);
        if (!json.error) {
          const cases = new Intl.NumberFormat("en-US").format(json.cases);
          const recovered = new Intl.NumberFormat("en-US").format(
            json.recovered
          );
          const country = json.country;

          client.action(
            url,
            "country " +
              country +
              " have " +
              cases +
              " Covid cases with " +
              recovered +
              " recovered cases"
          );

          socket.emit("covidData", { cases, recovered, country });
        } else {
          client.action(
            url,
            "Repeat the command with the correct name of Country, using two letters, like US, BR, ES,etc"
          );
        }
      });
  }
}

module.exports = showData;
