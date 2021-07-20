const args = process.argv.slice(2);
const tool = require(`./${args[0]}`);

if (tool) {
    (async function () {
        await tool.run(...args.slice(1));
        process.exit(1);
    })()
}
