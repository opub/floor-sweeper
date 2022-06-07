const config = require('config');
const {print, progress, clear} = require('../utils/report');
const {filterCollection, filterStats} = require('../filter');

const axios = require('axios');
const axiosThrottle = require('axios-request-throttle');
axiosThrottle.use(axios, { requestsPerSecond: 2 });

const NETWORK = config.debug ? "devnet" : "mainnet";
const API = `https://api-${NETWORK}.magiceden.dev/v2`;
const DIVIDER = 1000000000;

exports.getCollections = async function () {
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
            loading = false;
            console.error('getCollections failed', e);
        }
    }
    while (loading && collections.length < max)

    collections = collections.length > max ? collections.slice(0, max) : collections;
    console.log('getCollections filtered', collections.length, 'of', count);
    return collections;
};

exports.getStats = async function (collections) {
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
            console.error('getStats failed', e);
        }

        progress(i/collections.length);
    }
    clear();
    collections = collections.filter(c => c.stats);
    console.log('getStats filtered', collections.length, 'of', count);
    return collections;
};

exports.getListings = async function (collections) {
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
                loading = false;
                console.error('getListings failed', e);
            }
        }
        while (loading)

        listings.sort(function (a, b) { return a.price - b.price });
        collections[i].listings = listings;
        collections[i].prices = listings.map(x => x.price);
        progress(i/collections.length);
    }
    clear();
    console.log('getListings loaded', count, 'items');
    return collections;
};