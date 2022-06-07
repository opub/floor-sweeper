const config = require('config');

exports.filterCollection = function (c) {
    const f = config.collections;
    return (!f.excludeFlagged || !c.isFlagged) &&
        (!f.requireDiscord || c.discord && c.discord.length > 0) &&
        (!f.requireTwitter || c.twitter && c.twitter.length > 0) &&
        (!f.requireWebsite || c.website && c.website.length > 0);
}

exports.filterStats = function (s) {
    const f = config.stats;
    return (s.floorPrice >= f.minFloor && s.floorPrice <= f.maxFloor &&
        s.listedCount >= f.minItems && s.listedCount <= f.maxItems) &&
        (!f.require24hrAvg || s.avgPrice24hr) &&
        (!f.requireLowFP || s.floorPrice <= s.avgPrice24hr);
}