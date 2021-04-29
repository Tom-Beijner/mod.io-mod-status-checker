const fetch = require("node-fetch");
const { compareObjectVals } = require("crud-object-diff");

const { sendEmbed } = require("./functions/sendEmbed");
const config = require("./config.json");

const mordhauID = 169;

// {
//   id: int,
//   name: string
// }
let lastRunMods = [];

async function main() {
    console.log(
        `Finding ${
            lastRunMods.length ? "newly" : "current"
        } hidden/deleted mods`
    );

    const modsCount = (
        await (
            await fetch(
                `https://api.mod.io/v1/games/${mordhauID}?api_key=${config.modio.api_key}`,
                {
                    headers: { "Content-Type": "application/json" },
                }
            )
        ).json()
    ).stats.mods_count_total;

    console.log(`Found ${modsCount} mods`);

    const result = [];
    const totalPages = Math.ceil(modsCount / 100);

    for (let i = 0; i < totalPages; i++) {
        await new Promise((resolve, reject) => {
            setTimeout(async () => {
                try {
                    const page = i;

                    console.debug(`Fetching page ${page + 1} of ${totalPages}`);

                    const res = await fetch(
                        `https://api.mod.io/v1/games/${mordhauID}/mods/events?_offset=${page}&api_key=${config.modio.api_key}`,
                        {
                            headers: { "Content-Type": "application/json" },
                        }
                    );
                    const json = await res.json();
                    json.data
                        .filter((mod) =>
                            ["MOD_UNAVAILABLE", "MOD_DELETED"].includes(
                                mod.event_type
                            )
                        )
                        .forEach((mod) =>
                            result.push({
                                id: mod.id,
                                name: mod.name,
                                url: `https://mordhau.mod.io/${mod.name_id}`,
                            })
                        );

                    resolve();
                } catch (error) {
                    reject(error);
                }
            }, 2500);
        });
    }

    if (lastRunMods.length) {
        const { createdVals, deletedVals } = compareObjectVals([
            lastRunMods,
            result,
        ]);

        console.log(
            `Finished processing mods\n`,
            `- Found ${createdVals?.length || 0} newly hidden/deleted mods\n`,
            `- Found ${deletedVals?.length || 0} newly unhidden mods`
        );

        if (createdVals || deletedVals) {
            sendEmbed(config.webhook, {
                title: `Newly hidden/deleted mods (${createdVals.length})`,
                fields: [
                    createdVals && {
                        name: `Newly hidden/deleted mods (${createdVals.length})`,
                        value: createdVals
                            .map(
                                (mod) => `[${mod.name}](${mod.url}) (${mod.id})`
                            )
                            .join("\n"),
                    },
                    deletedVals && {
                        name: `Unhidden mods ${deletedVals.length}`,
                        value: deletedVals
                            .map(
                                (mod) => `[${mod.name}](${mod.url}) (${mod.id})`
                            )
                            .join("\n"),
                    },
                ],
            });
        }
    }

    lastRunMods = result;

    setTimeout(() => {
        main();
    }, 300000);
}

main();
