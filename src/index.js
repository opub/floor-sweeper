const config = require('config');
const api = require('./api/magiceden');
const { getBalance } = require('./wallet');
const { log, printCollections, elapsed } = require('./utils/report');

function analyze(collections, balance) {
    log('analyzing...');
    const f = config.listings;
    const count = collections.length;

    for (let i = 0; i < collections.length; i++) {
        try {
            let listings = collections[i].listings;
            let fp = listings[0].price;
            let cost = fp;
            let end = Math.min(f.maxFloorSize, listings.length - 1);
            let j = 1;
            while (j < end) {
                let floor = (listings[j].price - fp) / fp * 100.0;
                if (floor <= f.floorThreshold) {
                    cost += listings[j].price;
                    j++;
                } else {
                    break;
                }
            }
            if (cost < balance && j <= listings.length - 1) {
                let wall = (listings[j].price - fp) / fp * 100.0
                collections[i].wall = wall;
                collections[i].profit = listings[j].price - fp - f.newFloorOffset;
            }
        }
        catch(e) {
            log('ERROR analyze failed', collections[i].symbol, e);
        }
    }
    collections = collections.filter(c => c.wall && c.wall >= f.minWallSize && c.profit && c.profit >= f.minProfit);
    collections.sort(function (a, b) { return b.profit - a.profit });
    log('filtered', collections.length, 'collections of', count);
    return collections;
}

(async function () {
    log('starting');
    const start = Date.now();

    const balance = await getBalance();
    let collections = await api.getCollections();
    collections = await api.getStats(collections, balance);
    collections = await api.getActivities(collections);
    collections = await api.getListings(collections);
    collections = analyze(collections, balance);

    printCollections(collections);

    log('completed in', elapsed(Date.now() - start));
})();
