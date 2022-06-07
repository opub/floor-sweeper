const config = require('config');
const api = require('./api/magiceden');
const {print} = require('./utils/report');

function analyze(collections) {
    const f = config.listings;
    const count = collections.length;

    for (let i = 0; i < collections.length; i++) {
        let listings = collections[i].listings;
        let fp = listings[0].price;
        let end = Math.min(f.maxFloorSize, listings.length - 1);
        let j = 1;
        while (j <= end) {
            let floor = (listings[j].price - fp) / fp * 100.0;
            if (floor <= f.floorThreshold) {
                j++;
            } else {
                break;
            }
        }
        let wall = (listings[j].price - fp) / fp * 100.0
        collections[i].stats.wall = wall;
    }
    collections = collections.filter(c => c.stats.wall >= f.wallSize);
    collections.sort(function (a, b) { return b.stats.wall - a.stats.wall });
    console.log('analyze filtered', collections.length, 'of', count);
    return collections;
}

(async function () {
    console.log('starting', new Date());

    let collections = await api.getCollections();
    collections = await api.getStats(collections);
    collections = await api.getListings(collections);
    collections = analyze(collections);

    print(collections);

    console.log('stopping', new Date());
})();
