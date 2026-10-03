const products=[
 {id:1,name:"Daily Essentials",price:199,icon:"🧺",category:"Essentials"},
 {id:2,name:"Fresh Grocery Pack",price:299,icon:"🥦",category:"Grocery"},
 {id:3,name:"Home Care Kit",price:249,icon:"🧹",category:"Home"},
 {id:4,name:"Personal Care",price:179,icon:"🧴",category:"Care"},
 {id:5,name:"Kitchen Basics",price:349,icon:"🍳",category:"Kitchen"},
 {id:6,name:"Daily Needs Combo",price:499,icon:"📦",category:"Combo"}
];

let cart=JSON.parse(localStorage.getItem("shreekart-cart")||"[]");

function money(value){return "₹"+value.toLocaleString("en-IN");}
function saveCart(){localStorage.setItem("shreekart-cart",JSON.stringify(cart));renderCart();updateCartCount();}
function updateCartCount(){document.querySelectorAll("[data-cart-count]").forEach(el=>el.textContent=cart.reduce((n,i)=>n+i.qty,0));}
function addToCart(id){const item=cart.find(i=>i.id===id);if(item)item.qty++;else{const p=products.find(p=>p.id===id);cart.push({...p,qty:1});}saveCart();openCart();}
function changeQty(id,delta){const item=cart.find(i=>i.id===id);if(!item)return;item.qty+=delta;if(item.qty<=0)cart=cart.filter(i=>i.id!==id);saveCart();}
function renderProducts(){
 const grid=document.getElementById("product-grid"); if(!grid)return;
 grid.innerHTML=products.map(p=>`<article class="shop-card"><div class="shop-img">${p.icon}</div><div class="shop-meta"><span>${p.category}</span><b>${money(p.price)}</b></div><h3>${p.name}</h3><button class="shop-add" onclick="addToCart(${p.id})">Add to cart</button></article>`).join("");
}
function renderCart(){
 const list=document.getElementById("cart-items"),totalEl=document.getElementById("cart-total"); if(!list)return;
 if(!cart.length){list.innerHTML='<div class="empty-cart">🛒<h3>Cart अभी खाली है</h3><p>Product चुनिए, इंसानों को shopping करना भी कभी-कभी पड़ता है।</p></div>';totalEl.textContent=money(0);return;}
 list.innerHTML=cart.map(i=>`<div class="cart-row"><div class="cart-icon">${i.icon}</div><div class="cart-info"><b>${i.name}</b><span>${money(i.price)} × ${i.qty}</span><div class="qty"><button onclick="changeQty(${i.id},-1)">−</button><b>${i.qty}</b><button onclick="changeQty(${i.id},1)">+</button></div></div></div>`).join("");
 totalEl.textContent=money(cart.reduce((s,i)=>s+i.price*i.qty,0));
}
function openCart(){document.getElementById("cart-drawer").classList.add("open");document.getElementById("cart-overlay").classList.add("open");}
function closeCart(){document.getElementById("cart-drawer").classList.remove("open");document.getElementById("cart-overlay").classList.remove("open");}
document.addEventListener("DOMContentLoaded",()=>{renderProducts();renderCart();updateCartCount();document.getElementById("cart-open")?.addEventListener("click",openCart);document.getElementById("cart-close")?.addEventListener("click",closeCart);document.getElementById("cart-overlay")?.addEventListener("click",closeCart);document.getElementById("checkout-btn")?.addEventListener("click",()=>alert(cart.length?"Checkout अगले चरण में login/order backend से connect होगा।":"पहले cart में product जोड़िए।"));});