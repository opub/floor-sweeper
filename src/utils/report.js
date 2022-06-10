const readline = require('readline');

function log() {
    clear();
    console.log(new Date(), ...arguments);
}
exports.log = log;

exports.printCollectionSummary = function (collections) {
    const summary = {
        discord: 0,
        twitter: 0,
        website: 0
    };
    for (let c of collections) {
        if(c.discord) summary.discord++;
        if(c.twitter) summary.twitter++;
        if(c.website) summary.website++;
    }
    log('includes', summary);
};

exports.printCollections = function (collections) {
    for (let c of collections) {
        log({
            symbol: c.symbol,
            name: c.name,
            profit: c.profit,
            wall: c.wall,
            stats: c.stats,
            listings: c.listings.length,
            prices: c.prices.slice(0, 6)
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
    readline.clearLine(process.stdout, 0);
    readline.cursorTo(process.stdout, 0);
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