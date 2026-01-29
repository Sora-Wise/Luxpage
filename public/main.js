const CART_KEY = 'lux_pro_cart_v1';
function loadCart(){ try{ return JSON.parse(localStorage.getItem(CART_KEY)||'[]'); } catch(e){ return []; } }
function saveCart(c){ localStorage.setItem(CART_KEY, JSON.stringify(c)); }
function addToCart(p, qty=1){ const cart = loadCart(); const f = cart.find(x=>x.id===p.id); if(f){ f.qty = (f.qty||1)+qty; } else cart.push({ id:p.id, name:p.name, price:p.price, qty }); saveCart(cart); }
function updateQty(id, qty){ const cart = loadCart(); const it = cart.find(x=>x.id===id); if(it){ it.qty = qty; saveCart(cart); } }
function removeFromCart(id){ let cart = loadCart(); cart = cart.filter(x=>x.id!==id); saveCart(cart); }
function cartTotal(){ const cart = loadCart(); return cart.reduce((s,i)=> s + (Number(i.price)||0) * (Number(i.qty)||1), 0); }
function fmt(n){ return '$' + Number(n).toFixed(2); }
document.addEventListener('click', (e)=>{ if(e.target.matches('.cat-header')){ const parent = e.target.closest('.category'); const sub = parent.querySelector('.subcats'); sub.classList.toggle('open'); } });
let CRYPTO_PRICES = null;



document.addEventListener('DOMContentLoaded', async () => {
	const prices =  await loadCryptoPrices();
const BTC = document.getElementById('BTC');
const ETH = document.getElementById('ETH');
const SOL = document.getElementById('SOL');
setInterval(loadCryptoPrices,30000)


async function getCryptoPrices() {
    const res = await fetch(
        "https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum,solana&vs_currencies=usd"
    );

    if (!res.ok) throw new Error("Crypto API failed");

    return await res.json();
}

async function loadCryptoPrices() {
    try {
        CRYPTO_PRICES = await getCryptoPrices();
        console.log("Crypto loaded:", CRYPTO_PRICES);
        document.dispatchEvent(new Event("crypto-ready"));

    } catch (e) {
        console.error("Crypto pricing error:", e);
    }
}


})
function usdToCrypto(usd, symbol = "bitcoin") {
    if (!CRYPTO_PRICES || !CRYPTO_PRICES[symbol]) return null;
    return usd / CRYPTO_PRICES[symbol].usd;
            BTC.textContent = CRYPTO_PRICES.bitcoin.usd
            ETH.textContent = CRYPTO_PRICES.ethereum.usd
            SOL.textContent = CRYPTO_PRICES.solana.usd
}