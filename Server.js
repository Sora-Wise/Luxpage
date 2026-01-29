require("dotenv").config();
const express = require("express");
const fs = require("fs-extra");
const fetch = (...a)=>import("node-fetch").then(({default:f})=>f(...a));
const { v4: uuidv4 } = require("uuid");

const app = express();
app.use(express.json());
app.use(express.static("public"));

/* ---------------- email ---------------- */
const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
 service: "gmail",
 auth: {
   user: "luxpage.noreply@gmail.com",
   pass: process.env.MAIL_PASS
 }
});

async function sendMerchantEmail(order){

 const items = order.cart.map(i =>
  `• ${i.name} x${i.qty} — $${i.price}`
 ).join("\n");

 const text = `
NEW PAID ORDER — LUX STORE

Order ID: ${order.id}

Customer:
${order.shipping.firstName} ${order.shipping.lastName}
Email: ${order.shipping.email}
Phone: ${order.shipping.phone}

Address:
${order.shipping.street}
${order.shipping.apartment || ""}
${order.shipping.city}
${order.shipping.postalCode}

Payment:
${order.cryptoAmount} ${order.coin.toUpperCase()}
TX: ${order.txHash}

----------------------
ITEMS:
${items}

TOTAL: $${order.usdTotal}
`;

 await transporter.sendMail({
  from: `"Lux Store" <luxpage.noreply@gmail.com>`,
  to: "luxpage.noreply@gmail.com",
  subject: "New Paid Order — Lux Store",
  text
 });
}

async function sendCustomerEmail(order){

 const items = order.cart.map(i =>
  `<div style="margin-bottom:6px">• ${i.name} x${i.qty}</div>`
 ).join("");

 const address = `
${order.shipping.firstName} ${order.shipping.lastName}<br>
${order.shipping.street}<br>
${order.shipping.apartment || ""}<br>
${order.shipping.city}<br>
${order.shipping.postalCode}
`;

 const html = `
<div style="background:#0b0b0d;padding:40px;font-family:Segoe UI,Arial;color:#eaeaea">
 <div style="max-width:640px;margin:auto;background:#111;border-radius:18px;overflow:hidden">
  <div style="padding:28px;text-align:center;background:#0d0d10">
   <h1 style="margin:0;color:#c9a84b">Lux Store</h1>
   <div style="color:#888;font-size:13px">Curated luxury goods</div>
  </div>
  <div style="padding:34px">
   <h2 style="color:#c9a84b">Payment confirmed</h2>
   <p>Dear ${order.shipping.firstName},<br><br>
   We have successfully received your payment. Your order is now being prepared.</p>

   <div style="background:#0b0b0d;padding:18px;border-radius:14px;margin:20px 0">
    <strong>Order ID:</strong> ${order.id}<br>
    <strong>Total:</strong> $${order.usdTotal}<br>
    <strong>Paid:</strong> ${order.cryptoAmount} ${order.coin.toUpperCase()}
   </div>

   <h3 style="color:#c9a84b">Items</h3>
   ${items}

   <h3 style="color:#c9a84b;margin-top:24px">Shipping address</h3>
   ${address}

   <p style="margin-top:28px;color:#aaa">
   You will receive another email once your order is dispatched.
   </p>
  </div>
 </div>
</div>
`;

 await transporter.sendMail({
  from: `"Lux Store" <luxpage.noreply@gmail.com>`,
  to: order.shipping.email,
  subject: "Your Lux Store Order Confirmation",
  html
 });
}

/* ---------------- WALLETS ---------------- */

const wallets = {
 bitcoin:{ address:"YOUR_BTC_ADDRESS" },
 ethereum:{ address:"YOUR_ETH_ADDRESS" },
 solana:{ address:"YOUR_SOL_ADDRESS" },
 tether:{ address:"YOUR_USDT_ERC20_ADDRESS" } // same ETH wallet
};

/* ---------------- PRICES ---------------- */

async function getPrices(){
 const r = await fetch(
  "https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum,solana,tether&vs_currencies=usd"
 );
 const j = await r.json();
 return {
  bitcoin:j.bitcoin,
  ethereum:j.ethereum,
  solana:j.solana,
  tether:j.tether
 };
}

/* ---------------- CREATE ORDER ---------------- */

app.post("/api/order/create", async (req,res)=>{
 try{
  const { cart, shipping, coin, usdTotal } = req.body;
  if(!cart || !shipping || !coin || !usdTotal) 
   return res.status(400).json({error:"Missing data"});

  const prices = await getPrices();
  if(!prices[coin]) return res.status(400).json({error:"Invalid coin"});

  const rate = prices[coin].usd;
  const cryptoAmount = coin === "tether" 
     ? +usdTotal.toFixed(2)
     : +(usdTotal / rate).toFixed(8);

  const order = {
   id: uuidv4().slice(0,8),
   cart,
   shipping,
   coin,
   usdTotal,
   cryptoAmount,
   address: wallets[coin].address,
   status:"pending",
   created:Date.now(),
   txHash:null,
   emailSent: false
  };

  await fs.ensureDir("orders");
  await fs.writeJson(`orders/${order.id}.json`,order);

  res.json(order);

 }catch(e){
  console.error(e);
  res.status(500).json({error:"Order creation failed"});
 }
});

/* ---------------- GET ORDER ---------------- */

app.get("/api/order/:id", async (req,res)=>{
 try{
  const order = await fs.readJson(`orders/${req.params.id}.json`);
  res.json(order);
 }catch{
  res.status(404).json({error:"Order not found"});
 }
});

/* ---------------- BLOCKCHAIN CHECKERS ---------------- */

// BITCOIN
async function checkBTC(order){
 const r = await fetch(`https://mempool.space/api/address/${order.address}/txs`);
 const txs = await r.json();

 for(const tx of txs){
  for(const v of tx.vout){
   if(v.scriptpubkey_address === order.address){
    const btc = v.value / 1e8;
    if(!tx.status.confirmed) continue;
    if(btc >= order.cryptoAmount * 0.995 && tx.status.block_time*1000 > order.created){
     return tx.txid;
    }
   }
  }
 }
 return null;
}

// ETH + USDT ERC20
async function checkETH(order){
 const ETHERSCAN = `https://api.etherscan.io/api?apikey=${process.env.ETHERSCAN}`;

 if(order.coin === "ethereum"){
  const r = await fetch(
   `${ETHERSCAN}&module=account&action=txlist&address=${order.address}&sort=desc`
  );
  const j = await r.json();

  for(const tx of j.result){
   if(tx.to && tx.to.toLowerCase() === order.address.toLowerCase()){

    const eth = tx.value / 1e18;
    if(tx.confirmations < 5) continue;
    if(eth >= order.cryptoAmount && tx.timeStamp*1000 > order.created){
     return tx.hash;
    }
   }
  }
 }

 if(order.coin === "tether"){
  const USDT = "0xdAC17F958D2ee523a2206206994597C13D831ec7";

  const r = await fetch(
   `${ETHERSCAN}&module=account&action=tokentx&contractaddress=${USDT}&address=${order.address}&sort=desc`
  );
  const j = await r.json();

  for(const tx of j.result){
   if(tx.to && tx.to.toLowerCase() === order.address.toLowerCase()){

    const usdt = tx.value / 1e6;
    if(usdt >= order.cryptoAmount * 0.995 && tx.timeStamp*1000 > order.created){
     return tx.hash;
    }
   }
  }
 }

 return null;
}

// SOLANA
async function checkSOL(order){
 const r = await fetch(
  `https://public-api.solscan.io/account/transactions?account=${order.address}&limit=20`
 );
 const txs = await r.json();

 for(const tx of txs){

  if(!tx.blockTime) continue;
  if(tx.blockTime*1000 < order.created) continue;
  if(tx.status !== "Success") continue;

  // fetch full transaction
  const tr = await fetch(`https://public-api.solscan.io/transaction/${tx.txHash}`);
  const data = await tr.json();

  if(!data.parsedInstruction) continue;

  for(const ix of data.parsedInstruction){

   if(ix.type === "transfer"){

    const dest = ix.params?.destination;
    const lamports = Number(ix.params?.lamports || 0);
    const sol = lamports / 1e9;

    if(
      dest === order.address &&
      sol >= order.cryptoAmount * 0.995
    ){
      return tx.txHash;
    }
   }
  }
 }

 return null;
}

/* ---------------- WATCHER LOOP ---------------- */

async function watchPayments(){
 try{
  await fs.ensureDir("orders");
  const files = await fs.readdir("orders");

  for(const file of files){

   let order;

try {

  const raw = await fs.readFile("orders/"+file, "utf8");
  if(!raw.trim()) continue; // skip empty files
  order = JSON.parse(raw);
} catch(e){
  console.log("Skipping broken file:", file);
  continue;
}

   if(order.status !== "pending") continue;

   let tx = null;

   if(order.coin === "bitcoin") tx = await checkBTC(order);
   if(order.coin === "ethereum" || order.coin === "tether") tx = await checkETH(order);
   if(order.coin === "solana") tx = await checkSOL(order);

   if(tx){
 order.status = "paid";
 order.txHash = tx;

 if(!order.emailSent){
  await sendMerchantEmail(order);
  await sendCustomerEmail(order);
  order.emailSent = true;
 }

 await fs.writeJson("orders/"+file,order);
 console.log("PAID:",order.id,tx);
}

  }
 }catch(e){
  console.error("Watcher error:",e.message);
 }
}

setInterval(watchPayments,20000);

app.listen(3000,()=>console.log("Backend running → http://localhost:3000"));
