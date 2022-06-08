const config = require('config');
const api = require('./api/magiceden');
const { log, print, elapsed } = require('./utils/report');

function analyze(collections) {
    log('analyzing...');
    const f = config.listings;
    const count = collections.length;

    for (let i = 0; i < collections.length; i++) {
        let listings = collections[i].listings;
        let fp = listings[0].price;
        let end = Math.min(f.maxFloorSize, listings.length - 1);
        let j = 1;
        while (j < end) {
            let floor = (listings[j].price - fp) / fp * 100.0;
            if (floor <= f.floorThreshold) {
                j++;
            } else {
                break;
            }
        }
        let wall = (listings[j].price - fp) / fp * 100.0
        collections[i].wall = wall;
        collections[i].profit = listings[j].price - fp - f.newFloorOffset;
    }
    collections = collections.filter(c => c.wall >= f.minWallSize && c.profit >= f.minProfit);
    collections.sort(function (a, b) { return b.profit - a.profit });
    log('filtered', collections.length, 'collections of', count);
    return collections;
}

(async function () {
    log('starting');
    const start = Date.now();

    let collections = await api.getCollections();
    collections = await api.getStats(collections);
    collections = await api.getListings(collections);
    collections = analyze(collections);

    print(collections);

    log('completed in', elapsed(Date.now() - start));
})();
