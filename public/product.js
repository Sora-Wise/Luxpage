async function getProducts(){
  const r = await fetch("products.json");
  return await r.json();
}

const id = new URLSearchParams(location.search).get("id");
if(!id){
  location.href="catalogue.html";
}

let index = 0;
let product = null;

function showImage(){
  document.getElementById("mainImage").src = product.images[index];
}

document.getElementById("prevImg").onclick = ()=>{
  index = (index - 1 + product.images.length) % product.images.length;
  showImage();
};

document.getElementById("nextImg").onclick = ()=>{
  index = (index + 1) % product.images.length;
  showImage();
};

document.getElementById("charToggle").onclick = ()=>{
  document.getElementById("charBody").classList.toggle("open");
};

(async()=>{
  const products = await getProducts();
  product = products.find(p=>p.id===id);
  if(!product) return location.href="catalogue.html";

  productName.textContent = product.name;
  productPrice.textContent = fmt(product.price);
  productDesc.textContent = product.description;

  // images
  showImage();

  // sizes
  product.sizes.forEach((s,i)=>{
    const el = document.createElement("div");
    el.className = "size-item"+(i===0?" active":"");
    el.textContent = s;
    el.onclick = ()=>{
      document.querySelectorAll(".size-item").forEach(x=>x.classList.remove("active"));
      el.classList.add("active");
    };
    sizes.appendChild(el);
  });

  // characteristics
  product.characteristics.forEach(c=>{
    const row = document.createElement("div");
    row.className = "char-row";
    row.innerHTML = `<span>${c.name}</span><strong>${c.value}</strong>`;
    charBody.appendChild(row);
  });

  addToCartBtn.onclick = ()=>{
    addToCart(product,1);
    alert("Added to cart");
  };

})();
