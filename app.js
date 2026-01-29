const express = require('express');
const bodyParser = require('body-parser');
const nodemailer = require('nodemailer');
const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(bodyParser.json({limit:'1mb'}));
app.use(express.static(path.join(__dirname, 'public')));

const ORDERS_FILE = path.join(__dirname, 'orders.json');

function saveOrder(order){
  let orders = [];
  if (fs.existsSync(ORDERS_FILE)){
    try { orders = JSON.parse(fs.readFileSync(ORDERS_FILE)); } catch(e){ orders = []; }
  }
  orders.push(order);
  fs.writeFileSync(ORDERS_FILE, JSON.stringify(orders, null, 2));
}

app.post("/api/checkout", async (req, res) => {

  const { cart, shipping } = req.body;
  if (!cart || !shipping) {
    return res.status(400).json({ error: "Invalid order data" });
  }

  const orderId = "LS-" + Date.now();

  // 🔒 BLOCK DUPLICATES
  if (processedOrders.has(orderId)) {
    return res.json({ success: true, orderId, duplicate: true });
  }

  processedOrders.add(orderId);

  let total = 0;
  let items = cart.map(p => {
    total += p.price * p.qty;
    return `• ${p.name} x${p.qty} — $${p.price}`;
  }).join("\n");

  const mailText = `
NEW ORDER — LUX STORE

Order ID: ${orderId}

Customer:
${shipping.firstName} ${shipping.lastName}
Email: ${shipping.email}
Address: ${shipping.address}
Postal Code: ${shipping.postalCode}
Crypto Address: ${shipping.cryptoAddress}

----------------------
ITEMS:
${items}

TOTAL: $${total.toFixed(2)}
`;

  try {

    await transporter.sendMail({
      from: `"Lux Store" <YOUR_EMAIL@gmail.com>`,
      to: "YOUR_EMAIL@gmail.com",
      subject: "New Luxury Store Order — " + orderId,
      text: mailText
    });

    res.json({ success: true, orderId });

  } catch (err) {
    processedOrders.delete(orderId); // unlock if failed
    console.error("MAIL ERROR:", err);
    res.status(500).json({ error: "Email failed" });
  }
});


app.get('*', (req,res)=>{
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, ()=> console.log('Server running on port', PORT));
