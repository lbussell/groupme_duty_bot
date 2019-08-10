"use strict";

require("dotenv").config();
const fs = require("fs");
const https = require("https");

const DUTY_FILE = "duty.csv";

const DUTY = readCSV(DUTY_FILE)
    .replace(/\r/g, "")
    .split("\n");

function readCSV(path) {
    return fs.readFileSync(path, { encoding: "utf8" });
}

function sameDay(d1, d2) {
    return (
        d1.getFullYear() === d2.getFullYear() &&
        d1.getMonth() === d2.getMonth() &&
        d1.getDate() === d2.getDate()
    );
}

function findPersonOnDuty() {
    var currentDate = new Date();
    for (var i = 0; i < DUTY.length; i++) {
        var entries = DUTY[i].split(",");
        var date = entries[0].split("/");
        var m = date[0] - 1; // Not sure why subtracting 1 is necessary
        var d = date[1];
        var y = "20" + date[2];
        var dutyDate = new Date(y, m, d);
        if (sameDay(dutyDate, currentDate)) {
            return entries[2];
        }
    }
}

class Bot {
    /**
     * Called when the bot receives a message.
     *
     * @static
     * @param {Object} message The message data incoming from GroupMe
     * @return {string}
     */
    static checkMessage(message) {
        const messageText = message.text;

        // Learn about regular expressions in JavaScript: https://developer.mozilla.org/docs/Web/JavaScript/Guide/Regular_Expressions
        const botRegex = /^\/duty/;

        // Check if the GroupMe message has content and if the regex pattern is true
        if (messageText && botRegex.test(messageText)) {
            // Check is successful, return a message!
            try {
                var personOnDuty = findPersonOnDuty();
                return personOnDuty + " is on duty today.";
            } catch {
                return "Sorry, I couldn't find out who's on duty today.";
            }
        }

        return null;
    }

    /**
     * Sends a message to GroupMe with a POST request.
     *
     * @static
     * @param {string} messageText A message to send to chat
     * @return {undefined}
     */
    static sendMessage(messageText) {
        // Get the GroupMe bot id saved in `.env`
        const botId = process.env.BOT_ID;

        const options = {
            hostname: "api.groupme.com",
            path: "/v3/bots/post",
            method: "POST"
        };

        const body = {
            bot_id: botId,
            text: messageText
        };

        // Make the POST request to GroupMe with the http module
        const botRequest = https.request(options, function(response) {
            if (response.statusCode !== 202) {
                console.log("Rejecting bad status code " + response.statusCode);
            }
        });

        // On error
        botRequest.on("error", function(error) {
            console.log("Error posting message " + JSON.stringify(error));
        });

        // On timeout
        botRequest.on("timeout", function(error) {
            console.log("Timeout posting message " + JSON.stringify(error));
        });

        // Finally, send the body to GroupMe as a string
        botRequest.end(JSON.stringify(body));
    }
}

module.exports = Bot;
