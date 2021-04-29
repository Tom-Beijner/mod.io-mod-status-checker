const Eris = require("eris");
const fetch = require("node-fetch");

const config = require("./config.json");

function createModEmbed(mod) {
    return {
        embed: {
            title: mod.name,
            image: {
                url: mod.logo.thumb_640x360,
            },
            url: `https://mordhau.mod.io/${mod.name_id}`,
            description: mod.description_plaintext,
            fields: [
                mod.modfile && {
                    name: "Info",
                    value: [
                        `Link: [Download](${mod.modfile.download.binary_url})`,
                        `Version: ${mod.modfile.version}`,
                        `Size: ${mod.modfile.filesize}`,
                    ].join("\n"),
                    inline: true,
                },
                {
                    name: "Tags",
                    value:
                        mod?.tags.map((tag) => tag.name).join(", ") || "None",
                    inline: true,
                },
            ],
        },
    };
}

const bot = new Eris.CommandClient(
    config.bot_token,
    {},
    {
        description: "Mod.io Dogwater edition",
        owner: "DevShot#9738 aka Schweppes",
        prefix: config.prefix,
    }
);

// Ready event
bot.on("ready", () => {
    console.log(
        `Client ready! Logged in as ${bot.user.username} (${bot.user.id})`
    );
});

bot.registerCommand(
    "mod",
    async (msg, args) => {
        if (args.length === 0) {
            return `Usage: ${config.prefix}mod <name | id>`;
        }
        const search = args.join(" ");
        const result = await fetch(
            `https://api.mod.io/v1/games/169/mods?_q=${search}&api_key=${config.modio.api_key}`,
            {
                headers: { "Content-Type": "application/json" },
            }
        );
        const json = await result.json();
        const mod = json.data[0];
        if (!mod) return `A mod with the name \`${search}\` was not found`;
        return createModEmbed(mod);
    },
    {
        description: "Get mod info",
        fullDescription: "Get mod info",
        usage: "<name | id>",
    }
);

bot.connect();

// $.ajax({
//     url: "https://api.mod.io/v1/games/169/mods/events",
//     method: "get",
//     data: { api_key: "" },
//     headers: headers,
//     success: function (data) {
//         console.log(data.result_total);
//         console.log(
//             data.data.filter((mod) =>
//                 ["MOD_UNAVAILABLE", "MOD_DELETED"].includes(mod.event_type)
//             )
//         );
//         totalRecords = data.result_total;
//         totalPages = Math.ceil(totalRecords / 100);

//         for (let i = 0; i < totalPages; i++) {
//             $.ajax({
//                 url: `https://api.mod.io/v1/games/169/mods/events?_offset=${
//                     (i + 1) * 100
//                 }`,
//                 method: "get",
//                 data: { api_key: "" },
//                 headers: headers,
//                 success: function (data) {
//                     unavailableMods = data.data.filter((mod) =>
//                         ["MOD_UNAVAILABLE", "MOD_DELETED"].includes(
//                             mod.event_type
//                         )
//                     );
//                     if (!unavailableMods.length) return;
//                     console.log(
//                         unavailableMods.find((mod) => mod.mod_id === 76424)
//                     );
//                 },
//             });
//         }
//     },
// });
