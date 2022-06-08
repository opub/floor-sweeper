function log() {
    clear();
    console.log(new Date(), ...arguments);
}
exports.log = log;

exports.print = function (collections) {
    for (let c of collections) {
        log({
            symbol: c.symbol,
            name: c.name,
            profit: c.profit,
            wall: c.wall,
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

exports.elapsed = function (milliseconds) {
    let time = milliseconds / 1000;
    let format = "";
    const hours = Math.floor(time / 3600);
    time %= 3600;
    if (hours > 0) {
        format += `${hours}h `;
    }
    const minutes = Math.floor(time / 60);
    if (hours > 0 || minutes > 0) {
        format += `${minutes}m `;
    }
    const seconds = Math.round(time % 60);
    return format + `${seconds}s`;
}