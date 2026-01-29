document.addEventListener('DOMContentLoaded', async () => {
    const list = document.getElementById('cart-list');
    const totalEl = document.getElementById('cart-total');
    const checkoutBtn = document.getElementById('checkout-btn');




    function render() {

        const cart = loadCart();
        list.innerHTML = '';
        if (cart.length === 0) {
            list.innerHTML = '<div style="color:var(--muted)">Cart is empty</div>';
            totalEl.textContent = fmt(0);
            return;
        }
        cart.forEach(i => {
            const el = document.createElement('div');
            el.className = 'cart-item';
            el.innerHTML = `<img class="thumb" src="/images/placeholder-chair.png"><div style="flex:1"><div style="font-weight:700">${i.name}</div><div style="color:var(--muted)">${fmt(i.price)} × <input type="number" min="1" value="${i.qty}" data-id="${i.id}" style="width:72px"/></div></div><div style="text-align:right">${fmt(i.price * i.qty)}<div><button class="remove" data-id="${i.id}">Remove</button></div></div>`;
            list.appendChild(el);
        }
        );
        list.querySelectorAll('input[type=number]').forEach(inp => inp.addEventListener('change', () => {
            updateQty(inp.dataset.id, Math.max(1, Number(inp.value)));
            render();
        }
        ));
        list.querySelectorAll('.remove').forEach(btn => btn.addEventListener('click', () => {
            removeFromCart(btn.dataset.id);
            render();
        }
        ));
        totalEl.textContent = fmt(cartTotal());


    }
    checkoutBtn.addEventListener('click', () => window.location.href = 'checkout.html');
    render();
}
);


    
    async function getCryptoPrices() {
    const res = await fetch(
        "https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum,solana&vs_currencies=usd"
    );
    return await res.json();


}
