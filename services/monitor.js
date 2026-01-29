async function checkBTC(address){
 const r = await fetch(`https://api.blockcypher.com/v1/btc/main/addrs/${address}`);
 return await r.json();
}