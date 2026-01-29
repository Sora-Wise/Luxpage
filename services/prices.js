const fetch = (...a)=>import('node-fetch').then(({default:f})=>f(...a));

async function getPrices(){
 const r = await fetch("https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum,solana,tether&vs_currencies=usd");
 const j = await r.json();
 return {
   btc: j.bitcoin,
   eth: j.ethereum,
   sol: j.solana,
   usdt: j.tether
 };
}

module.exports = { getPrices };