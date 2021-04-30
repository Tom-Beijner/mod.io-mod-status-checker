const fetch = require("node-fetch");
const { compareObjectVals } = require("crud-object-diff");

const { send } = require("./functions/send");
const config = require("./config.json");

const mordhauID = 169;

let firstRun = true;
let lastRunMods = [];

async function main() {
    console.log(
        `Finding ${firstRun ? "current" : "newly"} hidden${
            !firstRun && config.show_unhidden ? "/unhidden" : ""
        } mods`
    );

    const modsCount = (
        await (
            await fetch(
                `https://api.mod.io/v1/games/${mordhauID}/mods?_limit=1&visible-in=0&api_key=${config.modio.api_key}`,
                {
                    headers: { "Content-Type": "application/json" },
                }
            )
        ).json()
    ).result_total;

    console.log(`Found ${modsCount} mods`);

    let hiddenMods = [];
    const totalPages = Math.ceil(modsCount / 100);

    for (let i = 0; i < totalPages; i++) {
        await new Promise((resolve, reject) => {
            setTimeout(async () => {
                try {
                    const page = i;

                    console.debug(`Fetching page ${page + 1} of ${totalPages}`);

                    const res = await fetch(
                        `https://api.mod.io/v1/games/${mordhauID}/mods?&visible-in=0&_offset=${page}&api_key=${config.modio.api_key}`,
                        {
                            headers: { "Content-Type": "application/json" },
                        }
                    );
                    const json = await res.json();

                    json.data
                        .filter((mod) => mod.visible === 0)
                        .forEach((mod) =>
                            hiddenMods.push({
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

    hiddenMods = hiddenMods.filter(
        (obj, index, self) =>
            index === self.findIndex((mod) => mod.id === obj.id)
    );

    if (!firstRun) {
        const { createdVals, deletedVals } = compareObjectVals([
            lastRunMods,
            hiddenMods,
        ]);

        console.log(
            `Finished processing mods\n`,
            `- Found ${createdVals?.length || 0} newly hidden mods`,
            config.show_unhidden
                ? `\n - Found ${deletedVals?.length || 0} newly unhidden mods`
                : ""
        );

        if (createdVals || (config.show_unhidden && deletedVals)) {
            const changed = [...(createdVals || []), ...(deletedVals || [])];
            const fields = [];

            if (createdVals) {
                fields.push({
                    name: `Hidden mods (${createdVals.length})`,
                    value: createdVals
                        .map((mod) => `[${mod.name}](${mod.url}) (${mod.id})`)
                        .join("\n"),
                });
            }

            if (config.show_unhidden && deletedVals) {
                fields.push({
                    name: `Unhidden mods (${deletedVals.length})`,
                    value: deletedVals
                        .map((mod) => `[${mod.name}](${mod.url}) (${mod.id})`)
                        .join("\n"),
                });
            }

            send({
                title: `Newly hidden${
                    config.show_unhidden ? "/unhidden" : ""
                } mods (${changed.length})`,
                fields,
            });
        }
    }

    lastRunMods = hiddenMods;

    if (firstRun) firstRun = false;

    setTimeout(() => {
        main();
    }, 300000);
}

main();
