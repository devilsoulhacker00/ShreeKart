import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL="https://mmhynvdbyvymdxgxzoth.supabase.co";
const SUPABASE_KEY="sb_publishable_0lgVE9YUrhB77M0TLnLpww__g-Vrp6Z";
const supabase=createClient(SUPABASE_URL,SUPABASE_KEY);

let products=[];\nlet currentUser=null;
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
async function refreshAuth(){const {data}=await supabase.auth.getUser();currentUser=data.user||null;const status=document.getElementById("auth-status");const form=document.getElementById("auth-form");const logout=document.getElementById("logout-btn");if(status)status.textContent=currentUser?"Logged in: "+(currentUser.phone||currentUser.email||"User"):"Login करने पर आपका account यहाँ दिखेगा।";if(form)form.hidden=!!currentUser;if(logout)logout.hidden=!currentUser;if(currentUser)loadOrders();}
async function sendOtp(){const phone=document.getElementById("auth-phone")?.value.trim();if(!phone)return alert("Mobile number डालिए।");const {error}=await supabase.auth.signInWithOtp({phone});if(error)return alert(error.message);document.getElementById("otp-area").hidden=false;alert("OTP भेज दिया गया है।");}
async function verifyOtp(){const phone=document.getElementById("auth-phone")?.value.trim();const token=document.getElementById("auth-otp")?.value.trim();if(!phone||!token)return alert("Mobile और OTP दोनों डालिए।");const {error}=await supabase.auth.verifyOtp({phone,token,type:"sms"});if(error)return alert(error.message);await refreshAuth();}
async function loadOrders(){const box=document.getElementById("orders-list");if(!box||!currentUser)return;const {data,error}=await supabase.from("orders").select("id,status,total,payment_method,created_at").eq("user_id",currentUser.id).order("created_at",{ascending:false}).limit(10);if(error){box.innerHTML="<p>Orders load नहीं हो सके।</p>";return;}box.innerHTML=data?.length?data.map(o=>`<div class="order-row"><b>Order #${o.id.slice(0,8)}</b><span> • ${o.status}</span><small>${money(o.total)} · ${o.payment_method.toUpperCase()} · ${new Date(o.created_at).toLocaleString("en-IN")}</small></div>`).join(""):"<p>अभी कोई order नहीं है।</p>";}
async function placeOrder(){if(!cart.length)return alert("Cart खाली है।");if(!currentUser){closeCart();location.hash="account";return alert("पहले login करें।");}const address=prompt("Delivery address लिखें:");if(!address)return;const items=cart.map(i=>({product_id:i.id,quantity:i.qty}));const {data,error}=await supabase.rpc("place_order",{p_items:items,p_delivery_address:{full_address:address},p_payment_method:"cod"});if(error)return alert(error.message);cart=[];saveCart();closeCart();await loadOrders();alert("Order successfully placed: "+data);}
async function logout(){await supabase.auth.signOut();await refreshAuth();}
function openCart(){document.getElementById("cart-drawer")?.classList.add("open");document.getElementById("cart-overlay")?.classList.add("open");}
function closeCart(){document.getElementById("cart-drawer")?.classList.remove("open");document.getElementById("cart-overlay")?.classList.remove("open");}

document.addEventListener("DOMContentLoaded",async()=>{
 renderCart();updateCartCount();
 document.getElementById("cart-open")?.addEventListener("click",openCart);
 document.getElementById("cart-close")?.addEventListener("click",closeCart);
 document.getElementById("cart-overlay")?.addEventListener("click",closeCart);
 document.getElementById("checkout-btn")?.addEventListener("click",()=>alert(cart.length?"अगला चरण login और order creation है।":"पहले cart में product जोड़िए।"));
 document.getElementById("send-otp")?.addEventListener("click",sendOtp);document.getElementById("verify-otp")?.addEventListener("click",verifyOtp);document.getElementById("logout-btn")?.addEventListener("click",logout);supabase.auth.onAuthStateChange(()=>refreshAuth());await refreshAuth();await loadProducts();
});