const fetch = require("node-fetch");

function sendEmbed(webhookEndpoint, embed) {
    return fetch(webhookEndpoint, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            embeds: [embed],
        }),
    });
}

module.exports = { sendEmbed };
