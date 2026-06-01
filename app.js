const fConfig = { apiKey: "AIzaSyDlnzH1D7D7Q663eWE086ng_1KdP46MZEs", authDomain: "deep-freehold-389006.firebaseapp.com", databaseURL: "https://deep-freehold-389006-default-rtdb.firebaseio.com", projectId: "deep-freehold-389006", storageBucket: "deep-freehold-389006.appspot.com", appId: "1:76562961838:web:4d18b2f79d7eb9fd88243f" };

let allItems = [], cart = [], currentType = 'All';
const imageCache = {};
let overlayTimeout = null;

function initApp() {
    closeAll();
    setTimeout(() => {
        const loader = document.getElementById('loader');
        if(loader) loader.style.opacity = '0';
        setTimeout(() => { if(loader) loader.style.display='none'; }, 500);
    }, 1800);
    
    try {
        firebase.initializeApp(fConfig);
        const auth = firebase.auth();
        const db = firebase.database();

        auth.onAuthStateChanged(user => {
            if(!user) {
                auth.signInAnonymously().catch(console.error);
            }
            startListeners(db);
        });
    } catch (e) {
        console.error("Firebase init failed", e);
        document.getElementById('loader').style.display='none';
    }

    const wSelect = document.getElementById('regWard');
    if(wSelect) {
        wSelect.innerHTML = '<option value="">Select Ward</option>';
        for(let i=1; i<=29; i++) wSelect.innerHTML += `<option value="${i}">Bharatpur Ward ${i}</option>`;
    }

    const qrTarget = document.getElementById('qrTarget');
    if(qrTarget) {
        const qrPlaceholder = new Image(); 
        qrPlaceholder.src = 'qr-payment.jpg';
        qrPlaceholder.onload = () => {
            qrTarget.innerHTML = `<img src="qr-payment.jpg" style="width:200px; display:block; margin:0 auto; border-radius:12px;">`;
        };
    }
}

function toggleDrawer(id) {
    const dr = document.getElementById(id);
    const ov = document.getElementById('overlay');
    
    if(dr.classList.contains('active')) {
        closeAll();
    } else {
        // Clear any pending close timeouts for the overlay
        if(overlayTimeout) clearTimeout(overlayTimeout);
        
        // Close other drawers first but keep overlay
        document.querySelectorAll('.drawer').forEach(d => {
            if(d.id !== id) d.classList.remove('active');
        });

        ov.style.display = 'block';
        // Small delay to trigger transition
        setTimeout(() => {
            ov.style.opacity = '1';
            dr.classList.add('active');
        }, 10);
    }
}

function closeAll() {
    document.querySelectorAll('.drawer').forEach(d => d.classList.remove('active'));
    const ov = document.getElementById('overlay');
    ov.style.opacity = '0';
    
    if(overlayTimeout) clearTimeout(overlayTimeout);
    overlayTimeout = setTimeout(() => {
        ov.style.display = 'none';
    }, 500); // Matches the 0.5s transition in CSS
}

function switchType(type) {
    currentType = type;
    document.querySelectorAll('.tab-btn').forEach(b => {
        b.classList.toggle('active', b.innerText === type);
    });
    renderItems();
}

function startListeners(db) {
    db.ref('menu').on('value', snap => {
        allItems = [];
        snap.forEach(c => {
            const i = c.val();
            allItems.push({id: c.key, ...i});
        });
        renderItems();
    });

    firebase.auth().onAuthStateChanged(user => {
        if(!user) return;
        const uid = user.uid;

        db.ref(`bb_adminMessages/${uid}`).on('child_added', s => renderChat(s.val(), 'staff'));
        db.ref(`bb_userMessages/${uid}`).on('child_added', s => renderChat(s.val(), 'user'));

        db.ref(`bb_orders/${uid}`).on('value', s => {
            const stream = document.getElementById('historyStream');
            if(!stream) return;
            stream.innerHTML = s.exists() ? '' : '<div style="text-align:center; opacity:0.3; padding:2.5rem;"><i class="fas fa-receipt fa-4x" style="margin-bottom:1rem;"></i><br>No orders yet</div>';
            s.forEach(o => {
                const data = o.val();
                stream.innerHTML += `<div style="padding:16px; background:#f8fafc; border:1px solid #e2e8f0; border-radius:18px; margin-bottom:12px;">
                    <div style="display:flex; justify-content:space-between; font-weight:800; margin-bottom:6px;">
                        <span style="color:var(--text-muted)">#${o.key.slice(-5)}</span>
                        <span style="color:var(--accent); background:rgba(79,70,229,0.1); padding:4px 10px; border-radius:8px; font-size:0.7rem;">${data.status || 'Pending'}</span>
                    </div>
                    <div style="font-size:0.85rem; font-weight:600; color:var(--text); margin-bottom:8px;">${data.items.map(i => i.name).join(', ')}</div>
                    <div style="font-weight:900; color:var(--success); font-size:1rem;">Rs ${data.totalPrice.toFixed(2)}</div>
                </div>`;
            });
        });
    });
}

function renderItems() {
    const grid = document.getElementById('menuContent');
    if(!grid) return;
    const search = document.getElementById('searchInput').value.toLowerCase();
    const filtered = allItems.filter(i => (currentType === 'All' || i.type === currentType) && i.name.toLowerCase().includes(search));
    
    grid.innerHTML = '';
    if(!filtered.length) { 
        grid.innerHTML = '<div style="text-align:center; padding:4rem; opacity:0.1;"><i class="fas fa-search fa-3x"></i><br>No matching items</div>'; 
        return; 
    }

    const categories = {};
    filtered.forEach(i => { if(!categories[i.category]) categories[i.category] = []; categories[i.category].push(i); });

    Object.keys(categories).sort().forEach(cName => {
        const section = document.createElement('div');
        section.className = 'category-block';
        section.innerHTML = `<div class="category-title">${cName}</div><div class="product-grid"></div>`;
        grid.appendChild(section);

        categories[cName].forEach(item => {
            const isOut = item.status === 'out_of_stock';
            const hasDisc = item.discountPercent && new Date(item.discountExpiry) > new Date();
            let price = item.price + (item.profit || 0);
            if(hasDisc) price = (item.price * (1 - item.discountPercent / 100)) + (item.profit || 0);

            const cartItem = cart.find(ci => ci.id === item.id);
            const card = document.createElement('div');
            card.className = 'card';
            if(isOut) card.style.opacity = '0.6';

            card.innerHTML = `
                ${hasDisc ? `<div class="discount-badge">${item.discountPercent}% OFF</div>` : ''}
                <div class="img-container">
                    <div class="img-fallback"><i class="fas fa-image fa-2x"></i></div>
                    <img id="img-${item.id}" src="${imageCache[item.id] || ''}" style="${imageCache[item.id] ? 'display:block' : 'display:none'}">
                </div>
                <div class="card-body">
                    <div class="p-name">${item.name}</div>
                    <div class="p-price">Rs ${price.toFixed(2)}</div>
                    <div class="p-unit">per ${item.startingValue || 1} ${item.unit || ''}</div>
                    <div id="ctrl-${item.id}" style="margin-top:auto;">
                        ${cartItem ? `
                            <div class="qty-controls">
                                <button class="qty-btn" onclick="updateQty('${item.id}', -1)">-</button>
                                <span style="font-weight:900; font-size:1rem;">${cartItem.qty}</span>
                                <button class="qty-btn" onclick="updateQty('${item.id}', 1)">+</button>
                            </div>
                        ` : `
                            <button class="btn-add" ${isOut?'disabled':''} onclick="addToCart('${item.id}')">${isOut?'Stock Out':'ADD CART'}</button>
                        `}
                    </div>
                </div>`;
            section.querySelector('.product-grid').appendChild(card);

            if(!imageCache[item.id]) {
                const cleanName = item.name.replace(/\s+/g, '') + '.jpg';
                firebase.storage().ref('images/' + cleanName).getDownloadURL().then(url => {
                    const img = document.getElementById(`img-${item.id}`);
                    if(img) {
                        img.src = url;
                        img.style.display = 'block';
                        img.previousElementSibling.style.display = 'none';
                    }
                    imageCache[item.id] = url;
                }).catch(() => {});
            }
        });
    });
}

function addToCart(id) {
    const item = allItems.find(i => i.id === id);
    const hasDisc = item.discountPercent && new Date(item.discountExpiry) > new Date();
    let p = item.price + (item.profit || 0);
    if(hasDisc) p = (item.price * (1 - item.discountPercent / 100)) + (item.profit || 0);
    
    cart.push({ id, name: item.name, price: p, profit: item.profit || 0, qty: item.startingValue || 1, step: item.startingValue || 1 });
    updateCartUI();
    renderItems();
}

function updateQty(id, dir) {
    const idx = cart.findIndex(c => c.id === id);
    if(idx === -1) return;
    cart[idx].qty += (cart[idx].step * dir);
    if(cart[idx].qty <= 0) cart.splice(idx, 1);
    updateCartUI();
    renderItems();
}

function updateCartUI() {
    let sub = 0, prof = 0;
    const list = document.getElementById('cartList');
    if(!list) return;
    list.innerHTML = cart.length ? '' : '<div style="text-align:center; padding:4rem; opacity:0.2;"><i class="fas fa-shopping-basket fa-4x" style="margin-bottom:1rem;"></i><br>Basket is empty</div>';
    
    cart.forEach(i => {
        const itemTotal = (i.price / i.step) * i.qty;
        sub += itemTotal;
        prof += (i.profit / i.step) * i.qty;
        
        const imgSrc = imageCache[i.id] || '';
        const imgTag = imgSrc ? `<img src="${imgSrc}" class="cart-item-img">` : `<div class="cart-item-img" style="display:flex; align-items:center; justify-content:center;"><i class="fas fa-leaf" style="opacity:0.2;"></i></div>`;

        list.innerHTML += `
        <div class="cart-item-row">
            ${imgTag}
            <div class="cart-item-details">
                <div class="cart-item-name">${i.name}</div>
                <div class="cart-item-price">Rs ${itemTotal.toFixed(2)}</div>
            </div>
            <div class="qty-controls" style="min-width:100px; margin:0;">
                <button class="qty-btn" onclick="updateQty('${i.id}',-1)">-</button>
                <span style="font-weight:900;">${i.qty}</span>
                <button class="qty-btn" onclick="updateQty('${i.id}',1)">+</button>
            </div>
        </div>`;
    });

    const delFee = cart.length ? Math.max(100 - prof, 0) : 0;
    const finalTotal = sub + delFee;
    document.getElementById('cartSubtotal').innerText = "Rs " + sub.toFixed(2);
    document.getElementById('cartDelivery').innerText = "Rs " + delFee.toFixed(2);
    document.getElementById('mainTotal').innerText = finalTotal.toFixed(2);
    document.getElementById('cartBadge').innerText = cart.length;
    document.getElementById('qrAmount').innerText = finalTotal.toFixed(2);
}

function checkRegistration() {
    if(!cart.length) return;
    if(!localStorage.getItem('address')) toggleDrawer('regDrawer');
    else toggleDrawer('payDrawer');
}

function saveReg() {
    const n = document.getElementById('regName').value, 
          p = document.getElementById('regPhone').value, 
          w = document.getElementById('regWard').value, 
          c = document.getElementById('regChowk').value;
    
    if(!n || !/^9\d{9}$/.test(p) || !w || !c) return alert("Fill all details. Phone must start with 9.");
    
    localStorage.setItem('username', n); 
    localStorage.setItem('phone', p); 
    localStorage.setItem('address', `${w}, ${c}`);
    
    const user = firebase.auth().currentUser;
    if (user) {
        firebase.database().ref(`bb_users/${user.uid}`).set({
            uid: user.uid,
            username: n,
            phone: p,
            address: `${w}, ${c}`,
            timestamp: Date.now()
        }).catch(console.error);
    }
    
    const body = document.querySelector('#regDrawer .drawer-body');
    const footer = document.querySelector('#regDrawer .drawer-footer');
    
    body.innerHTML = `
        <div class="success-msg">
            <i class="fas fa-check-circle fa-4x"></i>
            <h2>Details Saved!</h2>
            <p>Welcome, ${n}. Your account is ready.</p>
        </div>
    `;
    footer.innerHTML = `<button class="btn-add" style="height:52px;" onclick="toggleDrawer('payDrawer')">CONTINUE TO PAYMENT</button>`;
}

function finalizeOrder(method) {
    const auth = firebase.auth();
    let user = auth.currentUser;
    if(!user) {
        alert("Reconnecting to secure database. Please try clicking order again in a moment...");
        auth.signInAnonymously().catch(console.error);
        return;
    }
    const username = localStorage.getItem('username') || 'Customer';
    const phone = localStorage.getItem('phone') || 'N/A';
    const address = localStorage.getItem('address') || 'N/A';
    
    // Add quantity property to cart items for full StaffOrder compatibility
    const orderItems = cart.map(i => ({
        ...i,
        quantity: i.qty || 1
    }));

    const order = { 
        username: username, 
        phone: phone, 
        address: address,
        location: address, // Map address to location for StaffOrder view compatibility
        items: orderItems, 
        totalPrice: parseFloat(document.getElementById('mainTotal').innerText), 
        method: method,
        paymentMethod: method, // Map method to paymentMethod for StaffOrder view compatibility
        status: 'Pending', 
        timestamp: new Date().toISOString() 
    };
    
    firebase.database().ref(`bb_orders/${user.uid}`).push(order).then(() => {
        // Double check user registration is also in database
        firebase.database().ref(`bb_users/${user.uid}`).set({
            uid: user.uid,
            username: order.username,
            phone: order.phone,
            address: order.address,
            timestamp: Date.now()
        }).catch(console.error);

        alert("Order Placed Successfully!"); 
        cart = []; 
        updateCartUI(); 
        renderItems(); 
        closeAll();
    }).catch(err => {
        console.error("Order submission failed:", err);
        alert("Could not place order: " + err.message);
    });
}

function sendMsg() {
    const inp = document.getElementById('chatInput'); if(!inp.value.trim()) return;
    const user = firebase.auth().currentUser; if(!user) return;
    firebase.database().ref(`bb_userMessages/${user.uid}`).push({ message: inp.value, timestamp: Date.now() });
    inp.value = '';
}

function renderChat(m, type) {
    const stream = document.getElementById('chatStream');
    if(!stream) return;
    const box = document.createElement('div');
    const isStaff = type === 'staff';
    box.style.cssText = `max-width:85%; padding:12px 16px; border-radius:20px; align-self:${isStaff?'flex-start':'flex-end'}; background:${isStaff?'white':'var(--accent)'}; color:${isStaff?'var(--text)':'white'}; border-bottom-${isStaff?'left':'right'}-radius:4px; font-size:0.95rem; font-weight:500; box-shadow:0 2px 4px rgba(0,0,0,0.05);`;
    box.innerText = m.message;
    stream.appendChild(box); 
    stream.scrollTop = stream.scrollHeight;
    if(isStaff && !document.getElementById('chatDrawer').classList.contains('active')) {
        const dot = document.getElementById('chatDot');
        if(dot) dot.style.display = 'flex';
    }
}

// Explicitly attach all interactive functions to the window object to guarantee global availability
window.initApp = initApp;
window.toggleDrawer = toggleDrawer;
window.closeAll = closeAll;
window.switchType = switchType;
window.addToCart = addToCart;
window.updateQty = updateQty;
window.checkRegistration = checkRegistration;
window.saveReg = saveReg;
window.finalizeOrder = finalizeOrder;
window.sendMsg = sendMsg;
window.renderChat = renderChat;

window.onload = initApp;
