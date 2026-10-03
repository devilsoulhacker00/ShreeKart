import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
const SUPABASE_URL="https://mmhynvdbyvymdxgxzoth.supabase.co";
const SUPABASE_KEY="sb_publishable_0lgVE9YUrhB77M0TLnLpww__g-Vrp6Z";
const supabase=createClient(SUPABASE_URL,SUPABASE_KEY);
let products=[],categories=[],currentUser=null,cart=JSON.parse(localStorage.getItem("shreekart-cart")||"[]");

const money=v=>"₹"+Number(v||0).toLocaleString("en-IN");
const esc=s=>String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
function saveCart(){localStorage.setItem("shreekart-cart",JSON.stringify(cart));renderCart();updateCartCount()}
function updateCartCount(){document.querySelectorAll("[data-cart-count]").forEach(e=>e.textContent=cart.reduce((n,i)=>n+i.qty,0))}
function show(msg){alert(msg)}
async function loadCatalog(){
 const [pc,cc]=await Promise.all([
  supabase.from("products").select("id,name,description,price,image_url,stock,is_active,category_id,category:categories(name)").eq("is_active",true).order("created_at",{ascending:false}),
  supabase.from("categories").select("id,name").order("name")
 ]);
 const grid=document.getElementById("product-grid");
 if(pc.error){console.error(pc.error);grid.innerHTML='<p class="shop-loading">Catalog load नहीं हो सका.</p>';return}
 products=(pc.data||[]).map((p,i)=>({...p,price:Number(p.price),stock:Number(p.stock||0),categoryName:p.category?.name||"Other",icon:["📱","🎧","🏠","🛍️","🍳","📦"][i%6]}));
 categories=cc.data||[];
 document.getElementById("hero-product-count").textContent=products.length;
 const select=document.getElementById("category-filter"); select.innerHTML='<option value="">All categories</option>'+categories.map(c=>'<option value="'+esc(c.id)+'">'+esc(c.name)+'</option>').join("");
 document.getElementById("category-grid").innerHTML=categories.map(c=>'<button class="category-card" data-category="'+esc(c.id)+'"><span>🛍️</span><b>'+esc(c.name)+'</b><small>View products →</small></button>').join("");
 renderProducts();
}
function renderProducts(){
 const q=document.getElementById("product-search").value.trim().toLowerCase(),cat=document.getElementById("category-filter").value;
 const list=products.filter(p=>(!cat||p.category_id===cat)&&(!q||(p.name+" "+p.description+" "+p.categoryName).toLowerCase().includes(q)));
 const grid=document.getElementById("product-grid");
 grid.innerHTML=list.length?list.map(p=>'<article class="shop-card"><div class="shop-img">'+(p.image_url?'<img src="'+esc(p.image_url)+'" alt="'+esc(p.name)+'" loading="lazy">':p.icon)+'</div><div class="shop-meta"><span>'+esc(p.categoryName)+'</span><b>'+money(p.price)+'</b></div><h3>'+esc(p.name)+'</h3><p>'+esc(p.description||"Available now.")+'</p><small>'+ (p.stock>0?p.stock+" in stock":"Out of stock")+'</small><button class="shop-add" data-add="'+p.id+'" '+(p.stock<1?"disabled":"")+'>'+(p.stock>0?"Add to cart":"Out of stock")+'</button></article>').join(""):'<p class="shop-loading">इस search में कोई product नहीं मिला.</p>';
}
function addToCart(id){const p=products.find(x=>x.id===id);if(!p)return;const i=cart.find(x=>x.id===id);if(i){if(i.qty>=p.stock)return show("इतना stock उपलब्ध नहीं है.");i.qty++}else if(p.stock>0)cart.push({id:p.id,name:p.name,price:p.price,image_url:p.image_url,icon:p.icon,qty:1});else return show("Out of stock.");saveCart();openCart()}
function changeQty(id,d){const i=cart.find(x=>x.id===id),p=products.find(x=>x.id===id);if(!i)return;i.qty+=d;if(p&&i.qty>p.stock)i.qty=p.stock;if(i.qty<=0)cart=cart.filter(x=>x.id!==id);saveCart()}
function renderCart(){const l=document.getElementById("cart-items");if(!l)return;if(!cart.length){l.innerHTML='<div class="empty-cart">🛒<h3>Cart खाली है</h3><p>Product add कीजिए.</p></div>';document.getElementById("cart-total").textContent=money(0);return}l.innerHTML=cart.map(i=>'<div class="cart-row"><div class="cart-icon">'+(i.image_url?'<img src="'+esc(i.image_url)+'" alt="">':i.icon)+'</div><div class="cart-info"><b>'+esc(i.name)+'</b><span>'+money(i.price)+' × '+i.qty+'</span><div class="qty"><button data-qty="'+i.id+'" data-d="-1">−</button><b>'+i.qty+'</b><button data-qty="'+i.id+'" data-d="1">+</button></div></div></div>').join("");document.getElementById("cart-total").textContent=money(cart.reduce((s,i)=>s+i.price*i.qty,0))}
function openCart(){document.getElementById("cart-drawer").classList.add("open");document.getElementById("cart-overlay").classList.add("open")}
function closeCart(){document.getElementById("cart-drawer").classList.remove("open");document.getElementById("cart-overlay").classList.remove("open")}
async function refreshAuth(){
 const {data}=await supabase.auth.getUser();currentUser=data.user||null;
 const status=document.getElementById("auth-status"),form=document.getElementById("auth-form"),logout=document.getElementById("logout-btn");
 status.textContent=currentUser?"Logged in: "+(currentUser.email||"User"):"Login या signup करें.";
 form.hidden=!!currentUser;logout.hidden=!currentUser;
 if(currentUser){await loadAddress();await loadOrders()}
}
async function login(){const email=document.getElementById("auth-email").value.trim(),password=document.getElementById("auth-password").value;if(!email||!password)return show("Email और password डालिए.");const {error}=await supabase.auth.signInWithPassword({email,password});if(error)return show(error.message);await refreshAuth()}
async function signup(){const email=document.getElementById("auth-email").value.trim(),password=document.getElementById("auth-password").value;if(!email||password.length<6)return show("Valid email और कम से कम 6 character password डालिए.");const {error}=await supabase.auth.signUp({email,password});if(error)return show(error.message);show("Account create हो गया. अगर email confirmation enabled है तो email verify करें.");await refreshAuth()}
async function loadOrders(){const box=document.getElementById("orders-list-main");if(!currentUser)return;const {data,error}=await supabase.from("orders").select("id,status,total,payment_method,created_at").eq("user_id",currentUser.id).order("created_at",{ascending:false}).limit(20);if(error){box.innerHTML="<p>Orders load नहीं हो सके.</p>";return}box.innerHTML=data?.length?data.map(o=>'<div class="order-row"><div><b>Order #'+o.id.slice(0,8)+'</b><span class="status-pill">'+esc(o.status)+'</span></div><small>'+money(o.total)+' · '+esc(o.payment_method||"cod").toUpperCase()+' · '+new Date(o.created_at).toLocaleString("en-IN")+'</small></div>').join(""):"<p>अभी कोई order नहीं है.</p>"}
async function loadAddress(){const box=document.getElementById("address-status");const {data,error}=await supabase.from("addresses").select("full_name,phone,full_address").eq("user_id",currentUser.id).eq("is_default",true).maybeSingle();if(error)return;if(data){document.getElementById("address-name").value=data.full_name||"";document.getElementById("address-phone").value=data.phone||"";document.getElementById("address-line").value=data.full_address||"";box.textContent="Saved address loaded."}}
async function saveAddress(){if(!currentUser)return show("पहले login करें.");const full_name=document.getElementById("address-name").value.trim(),phone=document.getElementById("address-phone").value.trim(),full_address=document.getElementById("address-line").value.trim();if(!full_name||!phone||!full_address)return show("Address की सभी details भरिए.");await supabase.from("addresses").update({is_default:false}).eq("user_id",currentUser.id);const {error}=await supabase.from("addresses").insert({user_id:currentUser.id,full_name,phone,full_address,is_default:true});document.getElementById("address-status").textContent=error?error.message:"Address saved ✓"}
async function placeOrder(){if(!cart.length)return show("Cart खाली है.");if(!currentUser){closeCart();location.hash="account";return show("पहले login करें.");}const {data:ad}=await supabase.from("addresses").select("full_name,phone,full_address").eq("user_id",currentUser.id).eq("is_default",true).maybeSingle();if(!ad?.full_address){closeCart();location.hash="account";return show("पहले delivery address save करें.");}const items=cart.map(i=>({product_id:i.id,quantity:i.qty}));const {data,error}=await supabase.rpc("place_order",{p_items:items,p_delivery_address:{full_name:ad.full_name,phone:ad.phone,full_address:ad.full_address},p_payment_method:"cod"});if(error)return show(error.message);cart=[];saveCart();closeCart();await loadOrders();location.hash="orders";show("Order successfully placed: "+data)}
async function logout(){await supabase.auth.signOut();currentUser=null;await refreshAuth()}
document.addEventListener("DOMContentLoaded",async()=>{
 renderCart();updateCartCount();
 document.getElementById("cart-open").onclick=openCart;document.getElementById("cart-close").onclick=closeCart;document.getElementById("cart-overlay").onclick=closeCart;
 document.getElementById("checkout-btn").onclick=placeOrder;document.getElementById("login-btn").onclick=login;document.getElementById("signup-btn").onclick=signup;document.getElementById("logout-btn").onclick=logout;document.getElementById("save-address").onclick=saveAddress;
 document.getElementById("product-search").oninput=renderProducts;document.getElementById("category-filter").onchange=renderProducts;document.getElementById("account-jump").onclick=()=>location.hash="account";
 document.getElementById("product-grid").addEventListener("click",e=>{const b=e.target.closest("[data-add]");if(b)addToCart(b.dataset.add)});
 document.getElementById("cart-items").addEventListener("click",e=>{const b=e.target.closest("[data-qty]");if(b)changeQty(b.dataset.qty,Number(b.dataset.d))});
 document.getElementById("category-grid").addEventListener("click",e=>{const b=e.target.closest("[data-category]");if(b){document.getElementById("category-filter").value=b.dataset.category;location.hash="shop";renderProducts()}});
 supabase.auth.onAuthStateChange(()=>setTimeout(refreshAuth,0));await refreshAuth();await loadCatalog();
});