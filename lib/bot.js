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

function findPersonOnDuty(delta) {
    var dt = new Date();
    dt.setDate(dt.getDate() + delta);
    for (var i = 0; i < DUTY.length; i++) {
        var entries = DUTY[i].split(",");
        var date = entries[0].split("/");
        var m = date[0] - 1; // Not sure why subtracting 1 is necessary
        var d = date[1];
        var y = "20" + date[2];
        var dutyDate = new Date(y, m, d);
        if (sameDay(dutyDate, dt)) {
            console.log("checking dates...");
            console.log("dt", dt);
            console.log("duty date", dutyDate);
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
        let dutyRegex = /^\/duty/;
        let taylorRegex = /Taylor/;

        // Check if the GroupMe message has content and if the regex pattern is true
        if (!messageText) {
            return null;
        } else if (dutyRegex.test(messageText)) {
            let splitMsg = messageText.trim().split(" ");
            console.log(splitMsg);
            let del = 0;
            let message = " is on duty today.";
            if (splitMsg.length > 1) {
                if (splitMsg[1] == "today") {
                    message = " is on duty today.";
                    del = 0;
                } else if (splitMsg[1] == "tomorrow") {
                    message = " is on duty tomorrow.";
                    del = 1;
                } else if (splitMsg[1] == "yesterday") {
                    message = " was on duty yesterday.";
                    del = -1;
                } else if (parseInt(splitMsg[1]) != NaN) {
                    del = parseInt(splitMsg[1]);
                    if (del === 0) {
                        message = " is on duty today.";
                    } else if (del < 0) {
                        message = " was on duty " + del + " days ago.";
                    } else if (del > 0) {
                        message = " is on duty " + del + " days from now.";
                    } else {
                        return "Unrecognized argument.";
                    }
                } else {
                    return "Unrecognized argument.";
                }
            }
            console.log("del:", del);

            try {
                var personOnDuty = findPersonOnDuty(del);
                return personOnDuty + message;
            } catch {
                return "Sorry, I couldn't find out who's on duty today.";
            }
        } else if (taylorRegex.test(messageText)) {
            return "Actually, it's\n✨🍹Tequila Holiday🍹✨";
        } else {
            return null;
        }
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
