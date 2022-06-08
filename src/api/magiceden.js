const config = require('config');
const { log, progress } = require('../utils/report');
const { filterCollection, filterStats } = require('../filter');

const axios = require('axios');
const axiosThrottle = require('axios-request-throttle');
axiosThrottle.use(axios, { requestsPerSecond: 2 });

const NETWORK = config.debug ? "devnet" : "mainnet";
const API = `https://api-${NETWORK}.magiceden.dev/v2`;
const DIVIDER = 1000000000;

exports.getCollections = async function () {
    log('getting collections...');
    const max = config.collections.limit;
    const limit = 500;
    let collections = [];
    let loading = true;
    let offset = 0;
    let count = 0;
    do {
        try {
            let url = `${API}/collections?offset=${offset}&limit=${limit}`;
            let { data } = await axios.get(url);
            loading = (data && data.length == limit);
            offset += limit;
            count += data.length;
            const filtered = data.filter(c => filterCollection(c));
            collections.push(...filtered);
        }
        catch (e) {
            loading = await requestError('getCollections', e);
        }
    }
    while (loading && collections.length < max)

    collections = collections.length > max ? collections.slice(0, max) : collections;
    log('filtered', collections.length, 'collections of', count);
    return collections;
};

exports.getStats = async function (collections) {
    log('getting stats...');
    const count = collections.length;

    for (let i = 0; i < collections.length; i++) {
        try {
            let url = `${API}/collections/${collections[i].symbol}/stats`;
            let { data } = await axios.get(url);
            data.floorPrice = data.floorPrice / DIVIDER;
            if (data.avgPrice24hr) {
                data.avgPrice24hr = data.avgPrice24hr / DIVIDER;
            }
            if (filterStats(data)) {
                delete data.symbol;
                collections[i].stats = data;
            }
        }
        catch (e) {
            let repeat = await requestError('getStats', e);
            if(repeat) i--;
        }
        progress(i / collections.length);
    }
    collections = collections.filter(c => c.stats);
    log('filtered', collections.length, 'collections of', count);
    return collections;
};

exports.getListings = async function (collections) {
    log('getting listings...');
    const limit = 20;
    let count = 0;

    for (let i = 0; i < collections.length; i++) {
        let listings = [];
        let loading = true;
        let offset = 0;
        do {
            try {
                let url = `${API}/collections/${collections[i].symbol}/listings?offset=${offset}&limit=${limit}`;
                let { data } = await axios.get(url);
                loading = (data && data.length == limit);
                offset += limit;
                count += data.length;
                listings.push(...data);
            }
            catch (e) {
                loading = await requestError('getListings', e);
            }
        }
        while (loading)

        listings.sort(function (a, b) { return a.price - b.price });
        collections[i].listings = listings;
        collections[i].prices = listings.map(x => x.price);
        progress(i / collections.length);
    }
    log('fetched', count, 'total listings');
    return collections;
};

async function requestError(source, err) {
    const resp = err.response;
    if (resp && resp.status === 429 && resp.config) {
        // hitting the QPM limit so snooze a bit
        await new Promise(res => setTimeout(res, 5000));
        log('WARN', source, resp.statusText, resp.config.url);
        return true;
    } else {
        log('ERROR', source, 'failed', e);
        return false;
    }
}