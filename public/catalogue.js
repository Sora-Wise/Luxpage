async function fetchProducts() {
    const r = await fetch('products.json');
    return await r.json();
}

function getSyllables(word) {
    if (!word)
        return [];
    word = word.toLowerCase().replace(/[^a-z0-9]/g, '');
    const vowels = 'aeiouy';
    const sylls = [];
    let cur = '';
    for (let i = 0; i < word.length; i++) {
        cur += word[i];
        const next = word[i + 1] || '';
        if (vowels.includes(word[i]) && (!next || !vowels.includes(next))) {
            sylls.push(cur);
            cur = '';
        } else if (!vowels.includes(word[i]) && vowels.includes(next)) {} else if (i === word.length - 1) {
            if (cur)
                sylls.push(cur);
        }
    }
    if (sylls.length === 0) {
        const g = [];
        for (let i = 0; i < word.length - 1; i++)
            g.push(word.substr(i, 2));
        return g;
    }
    return sylls;
}

function syllableMatch(query, target) {
    if (!query)
        return true;
    const qs = getSyllables(query);
    const ts = getSyllables(target);
    let matches = 0;
    for (const q of qs)
        for (const t of ts)
            if (t.includes(q) || q.includes(t))
                matches++;
    return matches > 0;
}

document.addEventListener('DOMContentLoaded', async () => {
    const products = await fetchProducts();
    const left = document.getElementById('left-menu');
    const list = document.getElementById('products-list');
    const searchInput = document.getElementById('search-input');
    const sortSelect = document.getElementById('sort-select');
    const cats = {};
    products.forEach(p => {
        cats[p.category] = cats[p.category] || {};
        cats[p.category][p.subcategory] = true;
    }
    );
    Object.keys(cats).forEach(cat => {
        const el = document.createElement('div');
        el.className = 'category';
        el.innerHTML = `
  <div class="cat-header" data-cat="${cat}">
    ${cat} <span style="opacity:.8">▾</span>
  </div>
  <div class="subcats">
    ${Object.keys(cats[cat]).map(s =>
      `<div class="subcat-item" data-cat="${cat}" data-sub="${s}">${s}</div>`
    ).join('')}
  </div>
`;

        left.appendChild(el);
    }
    );
    let filtered = products.slice();
    function apply() {
        const q = searchInput.value.trim().toLowerCase();
        const sortBy = sortSelect.value;
        const activeSub = left.querySelector('.subcat-item.active');
        const activeCat = left.querySelector('.cat-header.active');
        filtered = products.filter(p => {
            const matchSearch = syllableMatch(q, p.name);
            let catOk = true;
            if (activeSub)
                catOk = p.subcategory === activeSub.dataset.sub;
            else if (activeCat)
                catOk = p.category === activeCat.dataset.cat;
            return matchSearch && catOk;
        }
        );
        if (sortBy === 'name')
            filtered.sort( (a, b) => a.name.localeCompare(b.name));
        if (sortBy === 'price_asc')
            filtered.sort( (a, b) => a.price - b.price);
        if (sortBy === 'price_desc')
            filtered.sort( (a, b) => b.price - a.price);
        render(filtered);
    }
    function render(items) {
        list.innerHTML = '';
        items.forEach(p => {
            const el = document.createElement('div');
            el.className = 'card';
            el.innerHTML = `<img src="${p.image}"><div class="title">${p.name}</div><div class="price">${fmt(p.price)}</div><div style="margin-top:auto;display:flex;gap:8px"><button class="btn add" data-id="${p.id}">Add to cart</button><button class="secondary view" data-id="${p.id}">View</button></div>`;
            list.appendChild(el);
        }
        );
        list.querySelectorAll('.add').forEach(btn => btn.addEventListener('click', () => {
            const id = btn.dataset.id;
            const prod = products.find(x => x.id === id);
            addToCart(prod, 1);
            alert('Added: ' + prod.name);
        }
        ));
        list.querySelectorAll('.view').forEach(btn => {
    btn.addEventListener('click', () => {
        const id = btn.dataset.id;
        location.href = `product.html?id=${id}`;
    });
});
    }
    left.addEventListener('click', (e) => {
        const sub = e.target.closest('.subcat-item');
        const header = e.target.closest('.cat-header');
        if (sub) {
            left.querySelectorAll('.subcat-item').forEach(x => x.classList.remove('active'));
            sub.classList.add('active');
            left.querySelectorAll('.cat-header').forEach(h => h.classList.remove('active'));
            apply();
        } else if (header) {
    left.querySelectorAll('.cat-header').forEach(h => h.classList.remove('active'));
    left.querySelectorAll('.subcat-item').forEach(s => s.classList.remove('active'));

    header.classList.add('active');

    // open / close dropdown
    const subcats = header.nextElementSibling;
    document.querySelectorAll('.subcats').forEach(sc => {
        if (sc !== subcats) sc.classList.remove('open');
    });
    subcats.classList.toggle('open');

    apply();
}

    }
    );
    searchInput.addEventListener('input', () => apply());
    sortSelect.addEventListener('change', () => apply());
    render(products);
}
);

