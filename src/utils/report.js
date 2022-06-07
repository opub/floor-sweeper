exports.print = function (collections) {
    for(let c of collections) {
        console.log({
            symbol: c.symbol,
            name: c.name,
            stats: c.stats,
            listings: c.listings.length,
            prices: c.prices.slice(0, 5)
        });
    }
};

exports.progress = function (step) {
    const width = 50;
    const left = Math.ceil(width * step);
    const fill = "■".repeat(left);
    const empty = "□".repeat(width - left);
    const pct = Math.ceil(step * 100);
    clear();
    process.stdout.write(`${fill}${empty} ${pct}%`)
};

function clear() {
    process.stdout.clearLine();
    process.stdout.cursorTo(0);
};
exports.clear = clear;