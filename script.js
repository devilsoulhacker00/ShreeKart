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

let currentRole=null;

async function loadCurrentRole(){
  currentRole=null;
  if(!currentUser) return;
  const {data,error}=await supabase.from("profiles").select("role").eq("id",currentUser.id).maybeSingle();
  if(error){console.error(error);return}
  currentRole=data?.role||null;
}

function isStaff(){return currentRole==="admin"||currentRole==="seller"}
function isAdmin(){return currentRole==="admin"}

function updateAdminVisibility(){
  const nav=document.getElementById("admin-nav"),section=document.getElementById("admin");
  const visible=isStaff();
  nav.hidden=!visible; section.hidden=!visible;
  if(visible){
    document.getElementById("admin-role-note").textContent=isAdmin()?"Admin: products + orders manage कर सकते हैं.":"Seller: products manage कर सकते हैं; orders केवल admin manage कर सकता है.";
    document.getElementById("admin-order-note").textContent=isAdmin()?"Order status update करें.":"Orders read-only हैं.";
    loadAdminProducts(); loadAdminOrders();
  }
}

async function loadAdminProducts(){
  if(!isStaff()) return;
  const list=document.getElementById("admin-products-list");
  list.innerHTML="<p>Products load हो रहे हैं…</p>";
  const {data,error}=await supabase.from("products").select("id,name,description,price,image_url,stock,is_active,category_id,category:categories(name)").order("created_at",{ascending:false});
  if(error){list.innerHTML="<p>Products load नहीं हुए: "+esc(error.message)+"</p>";return}
  list.innerHTML=(data||[]).map(p=>'<div class="admin-row"><div><b>'+esc(p.name)+'</b><small>'+money(p.price)+' · Stock '+Number(p.stock||0)+' · '+esc(p.category?.name||"No category")+' · '+(p.is_active?"Active":"Inactive")+'</small></div><div class="admin-row-actions"><button class="mini-btn" data-edit-product="'+p.id+'">Edit</button><button class="mini-btn danger" data-toggle-product="'+p.id+'" data-active="'+p.is_active+'">'+(p.is_active?"Deactivate":"Activate")+'</button></div></div>').join("")||"<p>No products yet.</p>";
  list.querySelectorAll("[data-edit-product]").forEach(b=>b.onclick=()=>editProduct(b.dataset.editProduct,data||[]));
  list.querySelectorAll("[data-toggle-product]").forEach(b=>b.onclick=()=>toggleProduct(b.dataset.toggleProduct,b.dataset.active==="true"));
}

async function loadAdminCategories(){
  const {data}=await supabase.from("categories").select("id,name").order("name");
  const s=document.getElementById("product-category");
  if(!s)return;
  s.innerHTML='<option value="">No category</option>'+(data||[]).map(c=>'<option value="'+esc(c.id)+'">'+esc(c.name)+'</option>').join("");
}

function editProduct(id,list){
  const p=list.find(x=>x.id===id); if(!p)return;
  document.getElementById("product-id").value=p.id;
  document.getElementById("product-name").value=p.name||"";
  document.getElementById("product-description").value=p.description||"";
  document.getElementById("product-price").value=p.price||0;
  document.getElementById("product-stock").value=p.stock||0;
  document.getElementById("product-image").value=p.image_url||"";
  document.getElementById("product-category").value=p.category_id||"";
  document.getElementById("product-form-status").textContent="Editing: "+p.name;
  location.hash="admin";
}

async function saveProduct(e){
  e.preventDefault();
  if(!isStaff())return;
  const id=document.getElementById("product-id").value.trim();
  const payload={name:document.getElementById("product-name").value.trim(),description:document.getElementById("product-description").value.trim()||null,price:Number(document.getElementById("product-price").value),stock:Number(document.getElementById("product-stock").value),image_url:document.getElementById("product-image").value.trim()||null,category_id:document.getElementById("product-category").value||null,is_active:true};
  if(!payload.name||payload.price<0||payload.stock<0)return show("Product name, valid price और stock भरिए.");
  const q=id?supabase.from("products").update(payload).eq("id",id):supabase.from("products").insert(payload);
  const {error}=await q;
  if(error){document.getElementById("product-form-status").textContent=error.message;return}
  document.getElementById("product-form-status").textContent=id?"Product updated ✓":"Product added ✓";
  clearProductForm(); await loadAdminProducts(); await loadCatalog();
}

function clearProductForm(){
  document.getElementById("product-form").reset();
  document.getElementById("product-id").value="";
  document.getElementById("product-form-status").textContent="";
}

async function toggleProduct(id,active){
  if(!isStaff())return;
  const {error}=await supabase.from("products").update({is_active:!active}).eq("id",id);
  if(error)return show(error.message);
  await loadAdminProducts(); await loadCatalog();
}

async function loadAdminOrders(){
  const list=document.getElementById("admin-orders-list");
  if(!isAdmin()){list.innerHTML="<p>Seller account को order management की permission नहीं है.</p>";return}
  list.innerHTML="<p>Orders load हो रहे हैं…</p>";
  const {data,error}=await supabase.from("orders").select("id,user_id,status,total,payment_method,payment_status,delivery_address,created_at").order("created_at",{ascending:false}).limit(50);
  if(error){list.innerHTML="<p>Orders load नहीं हुए: "+esc(error.message)+"</p>";return}
  list.innerHTML=(data||[]).map(o=>'<div class="admin-order"><div class="admin-order-top"><b>#'+esc(o.id.slice(0,8))+'</b><strong>'+money(o.total)+'</strong></div><small>'+new Date(o.created_at).toLocaleString("en-IN")+' · '+esc(o.payment_method||"cod").toUpperCase()+' · '+esc(o.payment_status||"pending")+'</small><p>'+esc(o.delivery_address?.full_name||"")+' · '+esc(o.delivery_address?.phone||"")+'<br>'+esc(o.delivery_address?.full_address||"")+'</p><div class="admin-order-actions"><select class="filter-select order-status" data-order-id="'+o.id+'">'+["placed","confirmed","packed","shipped","delivered","cancelled"].map(s=>'<option value="'+s+'" '+(o.status===s?"selected":"")+'>'+s+'</option>').join("")+'</select><button class="mini-btn" data-save-order="'+o.id+'">Update status</button></div></div>').join("")||"<p>No orders yet.</p>";
  list.querySelectorAll("[data-save-order]").forEach(b=>b.onclick=()=>updateOrderStatus(b.dataset.saveOrder));
}

async function updateOrderStatus(id){
  if(!isAdmin())return;
  const select=document.querySelector('.order-status[data-order-id="'+id+'"]');
  if(!select)return;
  const {error}=await supabase.from("orders").update({status:select.value}).eq("id",id);
  if(error)return show(error.message);
  await loadAdminOrders(); await loadOrders(); show("Order status updated ✓");
}

async function refreshAdmin(){
  await loadCurrentRole();
  updateAdminVisibility();
  if(isStaff()) await loadAdminCategories();
}

async function refreshAuth(){
 const {data}=await supabase.auth.getUser();currentUser=data.user||null;
 await loadCurrentRole();
 const status=document.getElementById("auth-status"),form=document.getElementById("auth-form"),logout=document.getElementById("logout-btn");
 status.textContent=currentUser?"Logged in: "+(currentUser.email||"User"):"Login या signup करें.";
 form.hidden=!!currentUser;logout.hidden=!currentUser;
 if(currentUser){await loadAddress();await loadOrders()} updateAdminVisibility();
}
async function login(){const email=document.getElementById("auth-email").value.trim(),password=document.getElementById("auth-password").value;if(!email||!password)return show("Email और password डालिए.");const {error}=await supabase.auth.signInWithPassword({email,password});if(error)return show(error.message);await refreshAuth()}
async function signup(){const email=document.getElementById("auth-email").value.trim(),password=document.getElementById("auth-password").value;if(!email||password.length<6)return show("Valid email और कम से कम 6 character password डालिए.");const {error}=await supabase.auth.signUp({email,password});if(error)return show(error.message);show("Account create हो गया. अगर email confirmation enabled है तो email verify करें.");await refreshAuth()}
async function loadOrders(){const box=document.getElementById("orders-list-main");if(!currentUser)return;const {data,error}=await supabase.from("orders").select("id,status,total,payment_method,created_at").eq("user_id",currentUser.id).order("created_at",{ascending:false}).limit(20);if(error){box.innerHTML="<p>Orders load नहीं हो सके.</p>";return}box.innerHTML=data?.length?data.map(o=>'<div class="order-row"><div><b>Order #'+o.id.slice(0,8)+'</b><span class="status-pill">'+esc(o.status)+'</span></div><small>'+money(o.total)+' · '+esc(o.payment_method||"cod").toUpperCase()+' · '+new Date(o.created_at).toLocaleString("en-IN")+'</small></div>').join(""):"<p>अभी कोई order नहीं है.</p>"}
async function loadAddress(){const box=document.getElementById("address-status");const {data,error}=await supabase.from("addresses").select("full_name,phone,full_address").eq("user_id",currentUser.id).eq("is_default",true).maybeSingle();if(error)return;if(data){document.getElementById("address-name").value=data.full_name||"";document.getElementById("address-phone").value=data.phone||"";document.getElementById("address-line").value=data.full_address||"";box.textContent="Saved address loaded."}}
async function saveAddress(){if(!currentUser)return show("पहले login करें.");const full_name=document.getElementById("address-name").value.trim(),phone=document.getElementById("address-phone").value.trim(),full_address=document.getElementById("address-line").value.trim();if(!full_name||!phone||!full_address)return show("Address की सभी details भरिए.");await supabase.from("addresses").update({is_default:false}).eq("user_id",currentUser.id);const {error}=await supabase.from("addresses").insert({user_id:currentUser.id,full_name,phone,full_address,is_default:true});document.getElementById("address-status").textContent=error?error.message:"Address saved ✓"}
async function placeOrder(){if(!cart.length)return show("Cart खाली है.");if(!currentUser){closeCart();location.hash="account";return show("पहले login करें.");}const {data:ad}=await supabase.from("addresses").select("full_name,phone,full_address").eq("user_id",currentUser.id).eq("is_default",true).maybeSingle();if(!ad?.full_address){closeCart();location.hash="account";return show("पहले delivery address save करें.");}const items=cart.map(i=>({product_id:i.id,quantity:i.qty}));const {data,error}=await supabase.rpc("place_order",{p_items:items,p_delivery_address:{full_name:ad.full_name,phone:ad.phone,full_address:ad.full_address},p_payment_method:"cod"});if(error)return show(error.message);cart=[];saveCart();closeCart();await loadOrders();location.hash="orders";show("Order successfully placed: "+data)}
async function logout(){await supabase.auth.signOut();currentUser=null;currentRole=null;updateAdminVisibility();await refreshAuth()}
document.addEventListener("DOMContentLoaded",async()=>{
 renderCart();updateCartCount();
 document.getElementById("cart-open").onclick=openCart;document.getElementById("cart-close").onclick=closeCart;document.getElementById("cart-overlay").onclick=closeCart;
 document.getElementById("checkout-btn").onclick=placeOrder;document.getElementById("login-btn").onclick=login;document.getElementById("signup-btn").onclick=signup;document.getElementById("logout-btn").onclick=logout;document.getElementById("save-address").onclick=saveAddress;
 document.getElementById("product-form").onsubmit=saveProduct; document.getElementById("product-cancel").onclick=clearProductForm; document.getElementById("admin-refresh-products").onclick=loadAdminProducts; document.getElementById("admin-refresh-orders").onclick=loadAdminOrders;
 document.getElementById("product-search").oninput=renderProducts;document.getElementById("category-filter").onchange=renderProducts;document.getElementById("account-jump").onclick=()=>location.hash="account";
 document.getElementById("product-grid").addEventListener("click",e=>{const b=e.target.closest("[data-add]");if(b)addToCart(b.dataset.add)});
 document.getElementById("cart-items").addEventListener("click",e=>{const b=e.target.closest("[data-qty]");if(b)changeQty(b.dataset.qty,Number(b.dataset.d))});
 document.getElementById("category-grid").addEventListener("click",e=>{const b=e.target.closest("[data-category]");if(b){document.getElementById("category-filter").value=b.dataset.category;location.hash="shop";renderProducts()}});
 supabase.auth.onAuthStateChange(()=>setTimeout(refreshAuth,0));await refreshAuth();await loadCatalog();
});