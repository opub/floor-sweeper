const config = require('config');
const { log, progress, printCollectionSummary } = require('../utils/report');
const { filterCollection, filterStats } = require('../filter');
const { LAMPORTS_PER_SOL } = require('@solana/web3.js');

const axios = require('axios');
const axiosThrottle = require('axios-request-throttle');
axiosThrottle.use(axios, { requestsPerSecond: 2 });

const NETWORK = config.debug ? "devnet" : "mainnet";
const API = `https://api-${NETWORK}.magiceden.dev/v2`;
const DAY_MS = 24 * 60 * 60 * 1000;

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
    printCollectionSummary(collections);
    return collections;
};

exports.getStats = async function (collections, balance) {
    log('getting stats...');
    const count = collections.length;

    for (let i = 0; i < collections.length; i++) {
        try {
            let url = `${API}/collections/${collections[i].symbol}/stats`;
            let { data } = await axios.get(url);
            data.floorPrice = data.floorPrice / LAMPORTS_PER_SOL;
            if (data.avgPrice24hr) {
                data.avgPrice24hr = data.avgPrice24hr / LAMPORTS_PER_SOL;
            }
            if (filterStats(data, balance)) {
                delete data.symbol;
                collections[i].stats = data;
            }
        }
        catch (e) {
            let repeat = await requestError('getStats', e);
            if (repeat) i--;
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

exports.getActivities = async function (collections) {
    log('getting activities...');
    const yesterday = Date.now() - DAY_MS;
    const actives = config.listings.min24hrActivity
    const count = collections.length;

    let i = collections.length
    while (i > 0) {
        i--;
        try {
            let url = `${API}/collections/${collections[i].symbol}/activities?offset=0&limit=100`;
            let { data } = await axios.get(url);
            if (data.length > actives && data[actives].blockTime * 1000 >= yesterday) {
                collections[i].activity = {
                    dateOfCheck: new Date(data[actives].blockTime * 1000),
                    dateOf100th: new Date(data[data.length - 1].blockTime * 1000)
                };
            }
            else {
                collections.splice(i, 1);
            }
        }
        catch (e) {
            await requestError('getActivities', e);
        }
        progress((count - i) / count);
    }
    log('filtered', collections.length, 'collections of', count);
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
        log('ERROR', source, 'failed', err);
        return false;
    }
}