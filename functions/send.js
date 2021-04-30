const fetch = require("node-fetch");

const config = require("../config.json");

function send(embed) {
    return fetch(config.webhook, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            content: config.mention_role_id && `<@&${config.mention_role_id}>`,
            embeds: [embed],
        }),
    });
}

module.exports = { send };
