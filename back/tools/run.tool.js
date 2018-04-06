const args = process.argv.slice(2);
const tool = require(`./${args[0]}`);

if (tool) {
    tool.run(...args.slice(1));
}
