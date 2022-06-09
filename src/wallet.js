const config = require('config');
const { Connection, clusterApiUrl, PublicKey, LAMPORTS_PER_SOL } = require('@solana/web3.js');
const { log } = require('./utils/report');

exports.getBalance = async function () {
    const key = new PublicKey(config.wallet);
    const connection = new Connection(clusterApiUrl('mainnet-beta'), 'confirmed');
    const balance = await connection.getBalance(key);

    log('balance', balance / LAMPORTS_PER_SOL);

    return balance / LAMPORTS_PER_SOL * 0.999;  // padding to account for fees
}
