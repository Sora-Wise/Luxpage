const STORE_BTC_ADDRESS = "17GbCAeCWViawLC22BpxBcjAkAgDHGc9C4";
const STORE_USDT_ADDRESS = "12323232";
function getParam(name) {
    return new URLSearchParams(window.location.search).get(name);
}

function renderPayment() {

    const usd = Number(getParam("usd"));
    const orderId = getParam("order");

    if (!usd || !CRYPTO_PRICES) return;

    const btc = usdToCrypto(usd, "bitcoin");
    const usdt = fmt(cartTotal());
    if (!btc) return;

    const btcAmount = btc.toFixed(6);
1
    document.getElementById("btc-amount").textContent = btcAmount + " BTC";
    document.getElementById("btc-address").textContent = STORE_BTC_ADDRESS;

    const uri = `bitcoin:${STORE_BTC_ADDRESS}?amount=${btcAmount}`;

    QRCode.toCanvas(document.getElementById("qr"), uri, {
        width: 220,
        margin: 2,
        color: {
            dark: "#c9a84b",
            light: "#050505"
        }
    });
}

document.addEventListener("crypto-ready", renderPayment);
document.addEventListener("DOMContentLoaded", renderPayment);