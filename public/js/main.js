// Global variables
let currentUser = null;
let currentShop = null;
let currentArtist = null;

// Initialize app
document.addEventListener('DOMContentLoaded', function() {
    checkAuth();
    loadFeaturedShops();
    setupEventListeners();
});

// Setup event listeners
function setupEventListeners() {
    // Navigation toggle
    document.getElementById('nav-toggle').addEventListener('click', function() {
        document.getElementById('nav-menu').classList.toggle('active');
    });

    // Form submissions
    document.getElementById('login-form').addEventListener('submit', handleLogin);
    document.getElementById('register-form').addEventListener('submit', handleRegister);
    document.getElementById('commission-form').addEventListener('submit', handleCommission);

    // Modal close on outside click
    window.addEventListener('click', function(event) {
        if (event.target.classList.contains('modal')) {
            event.target.style.display = 'none';
        }
    });
}

// Authentication functions
function checkAuth() {
    const token = localStorage.getItem('token');
    const user = localStorage.getItem('user');
    
    if (token && user) {
        currentUser = JSON.parse(user);
        updateNavigation();
        showDashboard();
    }
}

function updateNavigation() {
    const authDiv = document.getElementById('nav-auth');
    const userDiv = document.getElementById('nav-user');
    
    if (currentUser) {
        authDiv.style.display = 'none';
        userDiv.style.display = 'flex';
        document.getElementById('user-name').textContent = currentUser.name;
    } else {
        authDiv.style.display = 'flex';
        userDiv.style.display = 'none';
    }
}

async function handleLogin(e) {
    e.preventDefault();
    const formData = new FormData(e.target);
    
    try {
        const response = await fetch('/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email: formData.get('email'),
                password: formData.get('password')
            })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            localStorage.setItem('token', data.token);
            localStorage.setItem('user', JSON.stringify(data.user));
            currentUser = data.user;
            updateNavigation();
            closeModal('login-modal');
            showDashboard();
            showAlert('เข้าสู่ระบบสำเร็จ', 'success');
        } else {
            showAlert(data.message, 'error');
        }
    } catch (error) {
        showAlert('เกิดข้อผิดพลาด', 'error');
    }
}

async function handleRegister(e) {
    e.preventDefault();
    const formData = new FormData(e.target);
    
    try {
        const response = await fetch('/api/auth/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                name: formData.get('name'),
                email: formData.get('email'),
                password: formData.get('password'),
                role: formData.get('role')
            })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            closeModal('register-modal');
            showAlert('สมัครสมาชิกสำเร็จ กรุณาเข้าสู่ระบบ', 'success');
            showLogin();
        } else {
            showAlert(data.message, 'error');
        }
    } catch (error) {
        showAlert('เกิดข้อผิดพลาด', 'error');
    }
}

function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    currentUser = null;
    updateNavigation();
    showHome();
    showAlert('ออกจากระบบสำเร็จ', 'success');
}

// Navigation functions
function showHome() {
    hideAllSections();
    document.getElementById('home').style.display = 'block';
    loadFeaturedShops();
}

function showExplore() {
    hideAllSections();
    document.getElementById('explore').style.display = 'block';
    loadAllShops();
}

function showLogin() {
    document.getElementById('login-modal').style.display = 'block';
}

function showRegister(role = 'customer') {
    document.getElementById('register-modal').style.display = 'block';
    if (role === 'artist') {
        document.querySelector('select[name="role"]').value = 'artist';
    }
}

function showDashboard() {
    hideAllSections();
    
    switch (currentUser.role) {
        case 'customer':
            document.getElementById('customer-dashboard').style.display = 'block';
            loadCustomerDashboard();
            break;
        case 'artist':
            document.getElementById('artist-dashboard').style.display = 'block';
            loadArtistDashboard();
            break;
        case 'admin':
            document.getElementById('admin-dashboard').style.display = 'block';
            loadAdminDashboard();
            break;
    }
}

function hideAllSections() {
    const sections = ['home', 'explore', 'shop-detail', 'customer-dashboard', 'artist-dashboard', 'admin-dashboard'];
    sections.forEach(id => {
        document.getElementById(id).style.display = 'none';
    });
}

// Shop functions
async function loadFeaturedShops() {
    try {
        const response = await fetch('/api/user/shops');
        const shops = await response.json();
        
        const container = document.getElementById('featured-shops');
        container.innerHTML = shops.slice(0, 6).map(shop => `
            <div class="shop-card fade-in" onclick="showShopDetail(${shop.id})">
                <img src="${shop.owner_avatar || '/images/default-avatar.png'}" alt="${shop.name}">
                <div class="shop-card-content">
                    <h3>${shop.name}</h3>
                    <p>โดย ${shop.owner_name}</p>
                    <p>${shop.bio || 'ยินดีต้อนรับสู่ร้านของเรา'}</p>
                    <small>${shop.artwork_count} ผลงาน</small>
                </div>
            </div>
        `).join('');
    } catch (error) {
        console.error('Load featured shops error:', error);
    }
}

async function loadAllShops() {
    try {
        const response = await fetch('/api/user/shops');
        const shops = await response.json();
        
        const container = document.getElementById('shops-grid');
        container.innerHTML = shops.map(shop => `
            <div class="shop-card fade-in" onclick="showShopDetail(${shop.id})">
                <img src="${shop.owner_avatar || '/images/default-avatar.png'}" alt="${shop.name}">
                <div class="shop-card-content">
                    <h3>${shop.name}</h3>
                    <p>โดย ${shop.owner_name}</p>
                    <p>${shop.bio || 'ยินดีต้อนรับสู่ร้านของเรา'}</p>
                    <small>${shop.artwork_count} ผลงาน</small>
                </div>
            </div>
        `).join('');
    } catch (error) {
        console.error('Load shops error:', error);
    }
}

async function showShopDetail(shopId) {
    try {
        const response = await fetch(`/api/user/shop/${shopId}`);
        const data = await response.json();
        
        hideAllSections();
        document.getElementById('shop-detail').style.display = 'block';
        
        const shopInfo = document.getElementById('shop-info');
        shopInfo.innerHTML = `
            <div class="shop-header">
                <img src="${data.shop.owner_avatar || '/images/default-avatar.png'}" alt="${data.shop.name}" style="width: 100px; height: 100px; border-radius: 50%; object-fit: cover;">
                <div>
                    <h2>${data.shop.name}</h2>
                    <p>โดย ${data.shop.owner_name}</p>
                    <p>${data.shop.bio}</p>
                    ${currentUser && currentUser.role === 'customer' ? `
                        <button class="btn btn-primary mt-2" onclick="showCommissionModal(${data.shop.user_id})">สั่งวาดภาพ</button>
                        <button class="btn btn-outline mt-2" onclick="showChat(${data.shop.user_id})">แชท</button>
                    ` : ''}
                </div>
            </div>
        `;
        
        const artworksGrid = document.getElementById('artworks-grid');
        artworksGrid.innerHTML = data.artworks.map(artwork => `
            <div class="artwork-card">
                <img src="${artwork.image_url || '/images/default-artwork.png'}" alt="${artwork.title}">
                <div class="artwork-card-content">
                    <h3>${artwork.title}</h3>
                    <p>${artwork.description}</p>
                    <div class="price">฿${artwork.price}</div>
                </div>
            </div>
        `).join('');
        
        currentShop = data.shop;
    } catch (error) {
        console.error('Show shop detail error:', error);
    }
}

// Commission functions
function showCommissionModal(artistId) {
    if (!currentUser) {
        showAlert('กรุณาเข้าสู่ระบบก่อน', 'error');
        return;
    }
    currentArtist = artistId;
    document.getElementById('commission-modal').style.display = 'block';
}

async function handleCommission(e) {
    e.preventDefault();
    const formData = new FormData(e.target);
    
    try {
        const response = await fetch('/api/order/create', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: JSON.stringify({
                artist_id: currentArtist,
                detail: formData.get('detail'),
                price: formData.get('price')
            })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            closeModal('commission-modal');
            showAlert('สร้างคำสั่งซื้อสำเร็จ', 'success');
            showQRCode(data.qrCodePath, data.orderId);
        } else {
            showAlert(data.message, 'error');
        }
    } catch (error) {
        showAlert('เกิดข้อผิดพลาด', 'error');
    }
}

function showQRCode(qrPath, orderId) {
    const qrModal = document.createElement('div');
    qrModal.className = 'modal';
    qrModal.style.display = 'block';
    qrModal.innerHTML = `
        <div class="modal-content">
            <span class="close" onclick="this.parentElement.parentElement.remove()">&times;</span>
            <h2>ชำระเงิน</h2>
            <div class="qr-display">
                <img src="${qrPath}" alt="QR Code">
                <p>สแกน QR Code เพื่อชำระเงิน</p>
                <button class="btn btn-primary" onclick="confirmPayment(${orderId})">ยืนยันการชำระเงิน</button>
            </div>
        </div>
    `;
    document.body.appendChild(qrModal);
}

async function confirmPayment(orderId) {
    try {
        const response = await fetch(`/api/order/${orderId}/status`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: JSON.stringify({ status: 'paid' })
        });
        
        if (response.ok) {
            showAlert('ยืนยันการชำระเงินสำเร็จ', 'success');
            document.querySelector('.modal').remove();
            loadCustomerDashboard();
        }
    } catch (error) {
        showAlert('เกิดข้อผิดพลาด', 'error');
    }
}

// Dashboard functions
async function loadCustomerDashboard() {
    try {
        const response = await fetch('/api/order/my-orders', {
            headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        });
        const orders = await response.json();
        
        const container = document.getElementById('customer-orders');
        container.innerHTML = orders.map(order => `
            <div class="order-card">
                <div style="display: flex; justify-content: space-between; align-items: center;">
                    <div>
                        <h4>คำสั่งซื้อ #${order.id}</h4>
                        <p>ศิลปิน: ${order.artist_name}</p>
                        <p>ราคา: ฿${order.price}</p>
                        <p>รายละเอียด: ${order.detail}</p>
                    </div>
                    <div>
                        <span class="order-status status-${order.status}">${getStatusText(order.status)}</span>
                    </div>
                </div>
            </div>
        `).join('');
    } catch (error) {
        console.error('Load customer dashboard error:', error);
    }
}

async function loadArtistDashboard() {
    try {
        const response = await fetch('/api/artist/dashboard', {
            headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        });
        const data = await response.json();
        
        // Shop management
        const shopManagement = document.getElementById('shop-management');
        shopManagement.innerHTML = `
            <div class="shop-info-card">
                <h3>ข้อมูลร้าน</h3>
                <form id="shop-form">
                    <div class="form-group">
                        <label>ชื่อร้าน</label>
                        <input type="text" name="name" value="${data.shop.name}" required>
                    </div>
                    <div class="form-group">
                        <label>คำอธิบาย</label>
                        <textarea name="bio" rows="3">${data.shop.bio || ''}</textarea>
                    </div>
                    <button type="submit" class="btn btn-primary">อัปเดต</button>
                </form>
                <div class="mt-3">
                    <p><strong>สถานะ:</strong> ${data.shop.is_approved ? 'อนุมัติแล้ว' : 'รออนุมัติ'}</p>
                </div>
            </div>
        `;
        
        // Artworks
        const artworks = document.getElementById('artist-artworks');
        artworks.innerHTML = `
            <div class="add-artwork-form">
                <h3>เพิ่มผลงานใหม่</h3>
                <form id="artwork-form" enctype="multipart/form-data">
                    <div class="form-group">
                        <label>ชื่อผลงาน</label>
                        <input type="text" name="title" required>
                    </div>
                    <div class="form-group">
                        <label>คำอธิบาย</label>
                        <textarea name="description" rows="3"></textarea>
                    </div>
                    <div class="form-group">
                        <label>ราคา (บาท)</label>
                        <input type="number" name="price" min="1" required>
                    </div>
                    <div class="form-group">
                        <label>รูปภาพ</label>
                        <input type="file" name="image" accept="image/*" required>
                    </div>
                    <button type="submit" class="btn btn-primary">เพิ่มผลงาน</button>
                </form>
            </div>
            <div class="artworks-list mt-3">
                <h3>ผลงานของฉัน</h3>
                <div class="artworks-grid">
                    ${data.artworks.map(artwork => `
                        <div class="artwork-card">
                            <img src="${artwork.image_url}" alt="${artwork.title}">
                            <div class="artwork-card-content">
                                <h4>${artwork.title}</h4>
                                <p>${artwork.description}</p>
                                <div class="price">฿${artwork.price}</div>
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
        
        // Orders
        const orders = document.getElementById('artist-orders');
        orders.innerHTML = data.orders.map(order => `
            <div class="order-card">
                <div style="display: flex; justify-content: space-between; align-items: center;">
                    <div>
                        <h4>คำสั่งซื้อ #${order.id}</h4>
                        <p>ลูกค้า: ${order.customer_name}</p>
                        <p>ราคา: ฿${order.price}</p>
                        <p>รายละเอียด: ${order.detail}</p>
                    </div>
                    <div>
                        <span class="order-status status-${order.status}">${getStatusText(order.status)}</span>
                        <select onchange="updateOrderStatus(${order.id}, this.value)" style="margin-left: 1rem;">
                            <option value="waiting" ${order.status === 'waiting' ? 'selected' : ''}>รอชำระเงิน</option>
                            <option value="paid" ${order.status === 'paid' ? 'selected' : ''}>ชำระแล้ว</option>
                            <option value="working" ${order.status === 'working' ? 'selected' : ''}>กำลังทำงาน</option>
                            <option value="done" ${order.status === 'done' ? 'selected' : ''}>เสร็จสิ้น</option>
                        </select>
                    </div>
                </div>
            </div>
        `).join('');
        
        // Setup form listeners
        document.getElementById('shop-form').addEventListener('submit', handleShopUpdate);
        document.getElementById('artwork-form').addEventListener('submit', handleArtworkAdd);
        
    } catch (error) {
        console.error('Load artist dashboard error:', error);
    }
}

async function loadAdminDashboard() {
    try {
        const response = await fetch('/api/admin/dashboard', {
            headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        });
        const data = await response.json();
        
        // Stats
        const stats = document.getElementById('admin-stats');
        stats.innerHTML = `
            <div class="stats-grid">
                <div class="stat-card">
                    <div class="stat-number">${data.stats.total_users}</div>
                    <div class="stat-label">ผู้ใช้ทั้งหมด</div>
                </div>
                <div class="stat-card">
                    <div class="stat-number">${data.stats.customers}</div>
                    <div class="stat-label">ลูกค้า</div>
                </div>
                <div class="stat-card">
                    <div class="stat-number">${data.stats.artists}</div>
                    <div class="stat-label">ศิลปิน</div>
                </div>
                <div class="stat-card">
                    <div class="stat-number">฿${data.stats.total_revenue || 0}</div>
                    <div class="stat-label">รายได้รวม</div>
                </div>
            </div>
        `;
        
        // Pending shops
        const pendingShops = document.getElementById('pending-shops');
        pendingShops.innerHTML = data.pendingShops.map(shop => `
            <div class="order-card">
                <div style="display: flex; justify-content: space-between; align-items: center;">
                    <div>
                        <h4>${shop.name}</h4>
                        <p>เจ้าของ: ${shop.owner_name} (${shop.owner_email})</p>
                        <p>คำอธิบาย: ${shop.bio}</p>
                    </div>
                    <div>
                        <button class="btn btn-primary" onclick="approveShop(${shop.id})">อนุมัติ</button>
                        <button class="btn btn-outline" onclick="rejectShop(${shop.id})">ปฏิเสธ</button>
                    </div>
                </div>
            </div>
        `).join('');
        
        // All orders
        const allOrders = document.getElementById('all-orders');
        allOrders.innerHTML = data.orders.map(order => `
            <div class="order-card">
                <h4>คำสั่งซื้อ #${order.id}</h4>
                <p>ลูกค้า: ${order.customer_name}</p>
                <p>ศิลปิน: ${order.artist_name}</p>
                <p>ราคา: ฿${order.price}</p>
                <span class="order-status status-${order.status}">${getStatusText(order.status)}</span>
            </div>
        `).join('');
        
    } catch (error) {
        console.error('Load admin dashboard error:', error);
    }
}

// Helper functions
function getStatusText(status) {
    const statusMap = {
        'waiting': 'รอชำระเงิน',
        'paid': 'ชำระแล้ว',
        'working': 'กำลังทำงาน',
        'done': 'เสร็จสิ้น'
    };
    return statusMap[status] || status;
}

function showTab(tabName) {
    // Hide all tab contents
    document.querySelectorAll('.tab-content').forEach(tab => {
        tab.style.display = 'none';
    });
    
    // Remove active class from all tab buttons
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    
    // Show selected tab
    document.getElementById(tabName + '-tab').style.display = 'block';
    
    // Add active class to clicked button
    event.target.classList.add('active');
}

function closeModal(modalId) {
    document.getElementById(modalId).style.display = 'none';
}

function showAlert(message, type = 'info') {
    const alert = document.createElement('div');
    alert.className = `alert alert-${type}`;
    alert.style.cssText = `
        position: fixed;
        top: 100px;
        right: 20px;
        padding: 1rem 2rem;
        background: ${type === 'success' ? '#10b981' : type === 'error' ? '#ef4444' : '#3b82f6'};
        color: white;
        border-radius: 8px;
        z-index: 3000;
        animation: slideIn 0.3s ease-out;
    `;
    alert.textContent = message;
    
    document.body.appendChild(alert);
    
    setTimeout(() => {
        alert.remove();
    }, 3000);
}

// Additional functions for artist dashboard
async function handleShopUpdate(e) {
    e.preventDefault();
    const formData = new FormData(e.target);
    
    try {
        const response = await fetch('/api/artist/shop', {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: JSON.stringify({
                name: formData.get('name'),
                bio: formData.get('bio')
            })
        });
        
        if (response.ok) {
            showAlert('อัปเดตข้อมูลร้านสำเร็จ', 'success');
        }
    } catch (error) {
        showAlert('เกิดข้อผิดพลาด', 'error');
    }
}

async function handleArtworkAdd(e) {
    e.preventDefault();
    const formData = new FormData(e.target);
    
    try {
        const response = await fetch('/api/artist/artwork', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: formData
        });
        
        if (response.ok) {
            showAlert('เพิ่มผลงานสำเร็จ', 'success');
            e.target.reset();
            loadArtistDashboard();
        }
    } catch (error) {
        showAlert('เกิดข้อผิดพลาด', 'error');
    }
}

async function updateOrderStatus(orderId, status) {
    try {
        const response = await fetch(`/api/artist/order/${orderId}/status`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: JSON.stringify({ status })
        });
        
        if (response.ok) {
            showAlert('อัปเดตสถานะสำเร็จ', 'success');
        }
    } catch (error) {
        showAlert('เกิดข้อผิดพลาด', 'error');
    }
}

// Admin functions
async function approveShop(shopId) {
    try {
        const response = await fetch(`/api/admin/shop/${shopId}/approve`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });
        
        if (response.ok) {
            showAlert('อนุมัติร้านสำเร็จ', 'success');
            loadAdminDashboard();
        }
    } catch (error) {
        showAlert('เกิดข้อผิดพลาด', 'error');
    }
}

async function rejectShop(shopId) {
    if (confirm('คุณแน่ใจหรือไม่ที่จะปฏิเสธร้านนี้?')) {
        try {
            const response = await fetch(`/api/admin/shop/${shopId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });
            
            if (response.ok) {
                showAlert('ปฏิเสธร้านสำเร็จ', 'success');
                loadAdminDashboard();
            }
        } catch (error) {
            showAlert('เกิดข้อผิดพลาด', 'error');
        }
    }
}

// Search function
async function searchShops() {
    const query = document.getElementById('search-input').value;
    // Implementation for search functionality
    loadAllShops(); // For now, just reload all shops
}