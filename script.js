import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL="https://mmhynvdbyvymdxgxzoth.supabase.co";
const SUPABASE_KEY="sb_publishable_0lgVE9YUrhB77M0TLnLpww__g-Vrp6Z";
const supabase=createClient(SUPABASE_URL,SUPABASE_KEY);

let products=[];
let cart=JSON.parse(localStorage.getItem("shreekart-cart")||"[]");

function money(value){return "₹"+Number(value).toLocaleString("en-IN");}
function saveCart(){localStorage.setItem("shreekart-cart",JSON.stringify(cart));renderCart();updateCartCount();}
function updateCartCount(){document.querySelectorAll("[data-cart-count]").forEach(el=>el.textContent=cart.reduce((n,i)=>n+i.qty,0));}

async function loadProducts(){
 const grid=document.getElementById("product-grid");
 if(grid) grid.innerHTML='<p class="shop-loading">Products load हो रहे हैं…</p>';
 const {data,error}=await supabase.from("products").select("id,name,price,image_url,stock,is_active,category:categories(name)").eq("is_active",true).order("created_at",{ascending:false});
 if(error){console.error(error);if(grid)grid.innerHTML='<p class="shop-loading">Products अभी load नहीं हो सके।</p>';return;}
 products=(data||[]).map((p,index)=>({id:p.id,name:p.name,price:Number(p.price),image:p.image_url,stock:Number(p.stock||0),category:p.category?.name||"Products",icon:["📱","🎧","🏠","🛍️","🍳","📦"][index%6]}));
 renderProducts();
}

function addToCart(id){
 const p=products.find(x=>x.id===id);if(!p)return;
 const item=cart.find(i=>i.id===id);
 if(item){if(item.qty>=p.stock){alert("इतना stock उपलब्ध नहीं है।");return;}item.qty++;}
 else{if(p.stock<1){alert("यह product अभी out of stock है।");return;}cart.push({...p,qty:1});}
 saveCart();openCart();
}
function changeQty(id,delta){
 const item=cart.find(i=>i.id===id);if(!item)return;
 const p=products.find(x=>x.id===id);
 item.qty+=delta;
 if(p&&item.qty>p.stock)item.qty=p.stock;
 if(item.qty<=0)cart=cart.filter(i=>i.id!==id);
 saveCart();
}
function renderProducts(){
 const grid=document.getElementById("product-grid");if(!grid)return;
 grid.innerHTML=products.length?products.map(p=>`<article class="shop-card"><div class="shop-img">${p.image?'<img src="'+p.image+'" alt="'+p.name+'" loading="lazy">':p.icon}</div><div class="shop-meta"><span>${p.category}</span><b>${money(p.price)}</b></div><h3>${p.name}</h3><small>${p.stock>0?p.stock+" in stock":"Out of stock"}</small><button class="shop-add" ${p.stock<1?"disabled":""} onclick="addToCart('${p.id}')">${p.stock>0?"Add to cart":"Out of stock"}</button></article>`).join(""):'<p class="shop-loading">अभी कोई active product नहीं है।</p>';
}
function renderCart(){
 const list=document.getElementById("cart-items"),totalEl=document.getElementById("cart-total");if(!list)return;
 if(!cart.length){list.innerHTML='<div class="empty-cart">🛒<h3>Cart अभी खाली है</h3><p>Product चुनिए, shopping अपने आप नहीं होगी।</p></div>';totalEl.textContent=money(0);return;}
 list.innerHTML=cart.map(i=>`<div class="cart-row"><div class="cart-icon">${i.icon}</div><div class="cart-info"><b>${i.name}</b><span>${money(i.price)} × ${i.qty}</span><div class="qty"><button onclick="changeQty('${i.id}',-1)">−</button><b>${i.qty}</b><button onclick="changeQty('${i.id}',1)">+</button></div></div></div>`).join("");
 totalEl.textContent=money(cart.reduce((s,i)=>s+i.price*i.qty,0));
}
function openCart(){document.getElementById("cart-drawer")?.classList.add("open");document.getElementById("cart-overlay")?.classList.add("open");}
function closeCart(){document.getElementById("cart-drawer")?.classList.remove("open");document.getElementById("cart-overlay")?.classList.remove("open");}

document.addEventListener("DOMContentLoaded",async()=>{
 renderCart();updateCartCount();
 document.getElementById("cart-open")?.addEventListener("click",openCart);
 document.getElementById("cart-close")?.addEventListener("click",closeCart);
 document.getElementById("cart-overlay")?.addEventListener("click",closeCart);
 document.getElementById("checkout-btn")?.addEventListener("click",()=>alert(cart.length?"अगला चरण login और order creation है।":"पहले cart में product जोड़िए।"));
 await loadProducts();
});