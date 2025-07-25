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
    const navToggle = document.getElementById('nav-toggle');
    if (navToggle) {
        navToggle.addEventListener('click', function() {
            document.getElementById('nav-menu').classList.toggle('active');
        });
    }

    // Form submissions
    const loginForm = document.getElementById('login-form');
    if (loginForm) {
        loginForm.addEventListener('submit', handleLogin);
    }

    const registerForm = document.getElementById('register-form');
    if (registerForm) {
        registerForm.addEventListener('submit', handleRegister);
    }

    const commissionForm = document.getElementById('commission-form');
    if (commissionForm) {
        commissionForm.addEventListener('submit', handleCommission);
    }

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
        try {
            currentUser = JSON.parse(user);
            updateNavigation();
            showDashboard();
        } catch (error) {
            console.error('Error parsing user data:', error);
        }
    }
}

function updateNavigation() {
    const authDiv = document.getElementById('nav-auth');
    const userDiv = document.getElementById('nav-user');
    const userName = document.getElementById('user-name');
    
    if (currentUser && authDiv && userDiv) {
        authDiv.style.display = 'none';
        userDiv.style.display = 'flex';
        if (userName) {
            userName.textContent = currentUser.name;
        }
    } else if (authDiv && userDiv) {
        authDiv.style.display = 'flex';
        userDiv.style.display = 'none';
    }
}

// Login function
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
            showAlert(data.message || 'เข้าสู่ระบบไม่สำเร็จ', 'error');
        }
    } catch (error) {
        console.error('Login error:', error);
        showAlert('เกิดข้อผิดพลาดในการเชื่อมต่อ', 'error');
    }
}

// Register function
async function handleRegister(e) {
    e.preventDefault();
    const formData = new FormData(e.target);
    
    const name = formData.get('name').trim();
    const email = formData.get('email').trim();
    const password = formData.get('password');
    const role = formData.get('role');
    
    if (!name || name.length < 2) {
        showAlert('กรุณากรอกชื่อที่ถูกต้อง', 'error');
        return;
    }
    
    if (!email || !isValidEmail(email)) {
        showAlert('กรุณากรอกอีเมลที่ถูกต้อง', 'error');
        return;
    }
    
    if (!password || password.length < 6) {
        showAlert('รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร', 'error');
        return;
    }    try {

        const response = await fetch('/api/auth/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                name: name,
                email: email,
                password: password,
                role: role
            })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            closeModal('register-modal');
            showAlert('สมัครสมาชิกสำเร็จ กรุณาเข้าสู่ระบบ', 'success');
            e.target.reset();
            setTimeout(() => showLogin(), 1000);
        } else {
            showAlert(data.message || 'เกิดข้อผิดพลาดในการสมัครสมาชิก', 'error');
        }
    } catch (error) {
        console.error('Register error:', error);
        showAlert('เกิดข้อผิดพลาดในการเชื่อมต่อ', 'error');
    }
}

// Commission function
async function handleCommission(e) {
    e.preventDefault();
    const formData = new FormData(e.target);
    
    const detail = formData.get('detail').trim();
    const price = parseFloat(formData.get('price'));
    
    if (!detail || detail.length < 10) {
        showAlert('กรุณาอธิบายรายละเอียดงานอย่างน้อย 10 ตัวอักษร', 'error');
        return;
    }
    
    if (!price || price < 1) {
        showAlert('กรุณากรอกราคาที่ถูกต้อง', 'error');
        return;
    }
    
    try {
        const response = await fetch('/api/order/create', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: JSON.stringify({
                artist_id: currentArtist,
                detail: detail,
                price: price
            })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            closeModal('commission-modal');
            showAlert('สร้างคำสั่งซื้อสำเร็จ', 'success');
            e.target.reset();
            showQRCode(data.qrCodePath, data.orderId);
        } else {
            showAlert(data.message || 'เกิดข้อผิดพลาด', 'error');
        }
    } catch (error) {
        console.error('Commission error:', error);
        showAlert('เกิดข้อผิดพลาด', 'error');
    }
}

// Navigation functions
function showLogin() {
    const modal = document.getElementById('login-modal');
    if (modal) {
        modal.style.display = 'block';
    }
}

function showRegister(role = 'customer') {
    const modal = document.getElementById('register-modal');
    if (modal) {
        modal.style.display = 'block';
        const roleSelect = document.querySelector('select[name="role"]');
        if (roleSelect && role === 'artist') {
            roleSelect.value = 'artist';
        }
    }
}

function showHome() {
    hideAllSections();
    const homeSection = document.getElementById('home');
    if (homeSection) {
        homeSection.classList.remove('hidden');
    }
    loadFeaturedShops();
}

function showExplore() {
    hideAllSections();
    const exploreSection = document.getElementById('explore');
    if (exploreSection) {
        exploreSection.classList.remove('hidden');
    }
    loadAllShops();
}

function showDashboard() {
    if (!currentUser) {
        showHome();
        return;
    }
    
    hideAllSections();
    
    switch (currentUser.role) {
        case 'customer':
            const customerDashboard = document.getElementById('customer-dashboard');
            if (customerDashboard) {
                customerDashboard.classList.remove('hidden');
            }
            loadCustomerDashboard();
            break;
        case 'artist':
            const artistDashboard = document.getElementById('artist-dashboard');
            if (artistDashboard) {
                artistDashboard.classList.remove('hidden');
                artistDashboard.style.display = 'block';
                console.log('🎨 Showing artist dashboard');
            }
            loadArtistDashboard();
            break;
        case 'admin':
            const adminDashboard = document.getElementById('admin-dashboard');
            if (adminDashboard) {
                adminDashboard.classList.remove('hidden');
            }
            loadAdminDashboard();
            break;
        default:
            showHome();
    }
}

function hideAllSections() {
    const sections = ['home', 'explore', 'shop-detail', 'customer-dashboard', 'artist-dashboard', 'admin-dashboard'];
    sections.forEach(id => {
        const element = document.getElementById(id);
        if (element) {
            element.classList.add('hidden');
            element.style.display = 'none';
        }
    });
}

function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    currentUser = null;
    updateNavigation();
    showHome();
    showAlert('ออกจากระบบสำเร็จ', 'success');
}

// Close modal function
function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.style.display = 'none';
    }
}

// Show alert function
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
        box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    `;
    alert.textContent = message;
    
    document.body.appendChild(alert);
    
    setTimeout(() => {
        if (alert.parentNode) {
            alert.remove();
        }
    }, 4000);
}

// Email validation helper
function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

// Escape HTML function
function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Commission modal functions
function showCommissionModal(artistId) {
    if (!currentUser) {
        showAlert('กรุณาเข้าสู่ระบบก่อน', 'error');
        return;
    }
    
    if (currentUser.role !== 'customer') {
        showAlert('เฉพาะลูกค้าเท่านั้นที่สามารถสั่งงานได้', 'error');
        return;
    }
    
    currentArtist = artistId;
    const modal = document.getElementById('commission-modal');
    if (modal) {
        modal.style.display = 'block';
    }
}

// QR Code display function
function showQRCode(qrPath, orderId) {
    const qrModal = document.createElement('div');
    qrModal.className = 'modal';
    qrModal.style.display = 'block';
    qrModal.id = 'qr-payment-modal';
    
    if (qrPath) {
        qrModal.innerHTML = `
            <div class="modal-content">
                <span class="close" onclick="this.parentElement.parentElement.remove()">&times;</span>
                <h2>ชำระเงิน</h2>
                <div class="qr-display">
                    <img src="${qrPath}" alt="QR Code" style="max-width: 250px; border: 2px solid #e2e8f0; border-radius: 8px;">
                    <p style="margin: 1rem 0; color: #64748b;">สแกน QR Code เพื่อชำระเงินผ่าน PromptPay</p>
                    <div style="display: flex; gap: 1rem; justify-content: center;">
                        <button class="btn btn-outline" onclick="this.closest('.modal').remove()">ปิด</button>
                        <button class="btn btn-primary" onclick="confirmPayment(${orderId})">ยืนยันการชำระเงิน</button>
                    </div>
                </div>
            </div>
        `;
    } else {
        qrModal.innerHTML = `
            <div class="modal-content">
                <span class="close" onclick="this.parentElement.parentElement.remove()">&times;</span>
                <h2>คำสั่งซื้อสำเร็จ</h2>
                <div class="qr-display">
                    <div style="font-size: 3rem; margin-bottom: 1rem;">✅</div>
                    <p>คำสั่งซื้อของคุณถูกสร้างเรียบร้อยแล้ว</p>
                    <div style="display: flex; gap: 1rem; justify-content: center;">
                        <button class="btn btn-outline" onclick="this.closest('.modal').remove()">ปิด</button>
                        <button class="btn btn-primary" onclick="confirmPayment(${orderId})">ยืนยันการชำระเงิน</button>
                    </div>
                </div>
            </div>
        `;
    }
    
    document.body.appendChild(qrModal);
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

// Confirm payment function
async function confirmPayment(orderId) {
    if (!confirm('คุณแน่ใจหรือไม่ว่าได้ชำระเงินแล้ว?')) {
        return;
    }
    
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
            const qrModal = document.getElementById('qr-payment-modal');
            if (qrModal) {
                qrModal.remove();
            }
            loadCustomerDashboard();
        } else {
            const errorData = await response.json();
            showAlert(errorData.message || 'เกิดข้อผิดพลาด', 'error');
        }
    } catch (error) {
        console.error('Confirm payment error:', error);
        showAlert('เกิดข้อผิดพลาดในการเชื่อมต่อ', 'error');
    }
}

// Image preview function
function handleImagePreview(event) {
    const file = event.target.files[0];
    const preview = document.getElementById('image-preview');
    
    if (file && preview) {
        const reader = new FileReader();
        reader.onload = function(e) {
            preview.innerHTML = `
                <div style="margin-top: 1rem;">
                    <img src="${e.target.result}" alt="Preview" style="max-width: 200px; max-height: 200px; border-radius: 8px; border: 2px solid #e2e8f0;">
                    <p style="margin-top: 0.5rem; color: #64748b; font-size: 0.875rem;">ตัวอย่างรูปภาพ</p>
                </div>
            `;
        };
        reader.readAsDataURL(file);
    } else if (preview) {
        preview.innerHTML = '';
    }
}

// Dashboard loading functions
async function loadFeaturedShops() {
    try {
        const response = await fetch('/api/user/shops');
        if (!response.ok) throw new Error('Failed to load shops');
        
        const shops = await response.json();
        const container = document.getElementById('featured-shops');
        
        if (container && shops.length > 0) {
            container.innerHTML = shops.slice(0, 6).map(shop => `
                <div class="shop-card fade-in" onclick="showShopDetail(${shop.id})" style="cursor: pointer;">
                    <img src="${shop.owner_avatar || '/images/default-avatar.png'}" alt="${shop.name}" onerror="this.src='/images/default-avatar.png'">
                    <div class="shop-card-content">
                        <h3>${escapeHtml(shop.name)}</h3>
                        <p>โดย ${escapeHtml(shop.owner_name)}</p>
                        <p>${escapeHtml(shop.bio || 'ยินดีต้อนรับสู่ร้านของเรา')}</p>
                        <small>${shop.artwork_count || 0} ผลงาน</small>
                    </div>
                </div>
            `).join('');
        }
    } catch (error) {
        console.error('Load featured shops error:', error);
    }
}

async function loadAllShops() {
    try {
        const response = await fetch('/api/user/shops');
        if (!response.ok) throw new Error('Failed to load shops');
        
        const shops = await response.json();
        const container = document.getElementById('shops-grid');
        
        if (container && shops.length > 0) {
            container.innerHTML = shops.map(shop => `
                <div class="shop-card fade-in" onclick="showShopDetail(${shop.id})" style="cursor: pointer;">
                    <img src="${shop.owner_avatar || '/images/default-avatar.png'}" alt="${shop.name}" onerror="this.src='/images/default-avatar.png'">
                    <div class="shop-card-content">
                        <h3>${escapeHtml(shop.name)}</h3>
                        <p>โดย ${escapeHtml(shop.owner_name)}</p>
                        <p>${escapeHtml(shop.bio || 'ยินดีต้อนรับสู่ร้านของเรา')}</p>
                        <small>${shop.artwork_count || 0} ผลงาน</small>
                    </div>
                </div>
            `).join('');
        }
    } catch (error) {
        console.error('Load all shops error:', error);
    }
}

async function loadCustomerDashboard() {
    try {
        const response = await fetch('/api/order/my-orders', {
            headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        });
        
        if (!response.ok) throw new Error('Failed to load orders');
        
        const orders = await response.json();
        const container = document.getElementById('customer-orders');
        
        if (container) {
            if (orders.length > 0) {
                container.innerHTML = orders.map(order => `
                    <div class="order-card">
                        <h4>คำสั่งซื้อ #${order.id}</h4>
                        <p><strong>ศิลปิน:</strong> ${escapeHtml(order.artist_name || 'ไม่ระบุ')}</p>
                        <p><strong>ราคา:</strong> ฿${parseFloat(order.price).toLocaleString()}</p>
                        <p><strong>รายละเอียด:</strong> ${escapeHtml(order.detail)}</p>
                        <p><strong>สถานะ:</strong> <span class="order-status status-${order.status}">${getStatusText(order.status)}</span></p>
                        <small>สั่งเมื่อ: ${new Date(order.created_at).toLocaleString('th-TH')}</small>
                        ${order.status === 'waiting' ? `
                            <div style="margin-top: 1rem;">
                                <button class="btn btn-primary btn-sm" onclick="confirmPayment(${order.id})">ยืนยันการชำระเงิน</button>
                            </div>
                        ` : ''}
                    </div>
                `).join('');
            } else {
                container.innerHTML = `
                    <div class="empty-state">
                        <div class="empty-state-icon">📋</div>
                        <p>ยังไม่มีคำสั่งซื้อ</p>
                        <button class="btn btn-primary mt-2" onclick="showExplore()">ค้นหาศิลปิน</button>
                    </div>
                `;
            }
        }
    } catch (error) {
        console.error('Load customer dashboard error:', error);
    }
}

async function loadArtistDashboard() {
    try {
        console.log('🎨 Loading artist dashboard...');
        const response = await fetch('/api/artist/dashboard', {
            headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        });
        
        if (!response.ok) throw new Error('Failed to load dashboard');
        
        const data = await response.json();
        console.log('✅ Artist dashboard data loaded:', data);
        
        // Shop management
        const shopManagement = document.getElementById('shop-management');
        if (shopManagement) {
            shopManagement.innerHTML = `
                <div class="info-card">
                    <h3>ข้อมูลร้าน</h3>
                    <form id="shop-form">
                        <div class="form-group">
                            <label>ชื่อร้าน</label>
                            <input type="text" name="name" value="${escapeHtml(data.shop.name)}" required>
                        </div>
                        <div class="form-group">
                            <label>คำอธิบายร้าน</label>
                            <textarea name="bio" rows="3">${escapeHtml(data.shop.bio || '')}</textarea>
                        </div>
                        <button type="submit" class="btn btn-primary">อัปเดตข้อมูล</button>
                    </form>
                    <div class="mt-3">
                        <p><strong>สถานะร้าน:</strong> 
                            <span class="order-status ${data.shop.is_approved ? 'status-done' : 'status-waiting'}">
                                ${data.shop.is_approved ? 'อนุมัติแล้ว' : 'รออนุมัติ'}
                            </span>
                        </p>
                    </div>
                </div>
            `;
        }
        
        // Artworks section
        const artworks = document.getElementById('artist-artworks');
        if (artworks) {
            artworks.innerHTML = `
                <div class="info-card">
                    <h3>🎨 เพิ่มผลงานใหม่</h3>
                    <form id="artwork-form" enctype="multipart/form-data" style="background: #f8fafc; padding: 1.5rem; border-radius: 8px; margin-bottom: 1rem;">
                        <div class="form-row">
                            <div class="form-group">
                                <label>ชื่อผลงาน</label>
                                <input type="text" name="title" required placeholder="เช่น ภาพวาดสีน้ำ">
                            </div>
                            <div class="form-group">
                                <label>ราคา (บาท)</label>
                                <input type="number" name="price" min="1" required placeholder="500">
                            </div>
                        </div>
                        <div class="form-group">
                            <label>คำอธิบายผลงาน</label>
                            <textarea name="description" rows="3" placeholder="อธิบายรายละเอียดผลงาน เทคนิคที่ใช้ หรือแรงบันดาลใจ..."></textarea>
                        </div>
                        <div class="form-group">
                            <label>รูปภาพผลงาน</label>
                            <div class="file-upload" style="border: 2px dashed #cbd5e1; padding: 2rem; text-align: center; border-radius: 8px; background: white;">
                                <input type="file" name="image" accept="image/*" required id="artwork-image" style="display: none;">
                                <label for="artwork-image" style="cursor: pointer; display: block;">
                                    <div style="font-size: 2rem; margin-bottom: 0.5rem;">📷</div>
                                    <div style="color: #64748b;">คลิกเพื่อเลือกรูปภาพ</div>
                                    <small style="color: #94a3b8;">รองรับ JPG, PNG, GIF (ขนาดไม่เกิน 5MB)</small>
                                </label>
                            </div>
                            <div id="image-preview" class="mt-2"></div>
                        </div>
                        <div style="text-align: center; margin-top: 1rem;">
                            <button type="submit" class="btn btn-primary" style="padding: 0.75rem 2rem;">🎨 เพิ่มผลงาน</button>
                        </div>
                    </form>
                </div>
                <div class="info-card">
                    <h3>ผลงานของฉัน (${data.artworks.length} ชิ้น)</h3>
                    ${data.artworks.length > 0 ? `
                        <div class="artworks-grid">
                            ${data.artworks.map(artwork => `
                                <div class="artwork-card">
                                    <img src="${artwork.image_url}" alt="${artwork.title}">
                                    <div class="artwork-card-content">
                                        <h4>${escapeHtml(artwork.title)}</h4>
                                        <p>${escapeHtml(artwork.description || 'ไม่มีคำอธิบาย')}</p>
                                        <div class="price">฿${parseFloat(artwork.price).toLocaleString()}</div>
                                    </div>
                                </div>
                            `).join('')}
                        </div>
                    ` : `
                        <div class="empty-state">
                            <div class="empty-state-icon">🎨</div>
                            <p>ยังไม่มีผลงาน เริ่มเพิ่มผลงานแรกของคุณ</p>
                        </div>
                    `}
                </div>
            `;
        }
        
        // Orders section
        const orders = document.getElementById('artist-orders');
        if (orders) {
            orders.innerHTML = `
                <div class="info-card">
                    <h3>คำสั่งซื้อที่ได้รับ (${data.orders.length} รายการ)</h3>
                    ${data.orders.length > 0 ? `
                        ${data.orders.map(order => `
                            <div class="order-card">
                                <h4>คำสั่งซื้อ #${order.id}</h4>
                                <p><strong>ลูกค้า:</strong> ${escapeHtml(order.customer_name)}</p>
                                <p><strong>ราคา:</strong> ฿${parseFloat(order.price).toLocaleString()}</p>
                                <p><strong>รายละเอียด:</strong> ${escapeHtml(order.detail)}</p>
                                <p><strong>สถานะ:</strong> 
                                    <select onchange="updateOrderStatus(${order.id}, this.value)">
                                        <option value="waiting" ${order.status === 'waiting' ? 'selected' : ''}>รอชำระเงิน</option>
                                        <option value="paid" ${order.status === 'paid' ? 'selected' : ''}>ชำระแล้ว</option>
                                        <option value="working" ${order.status === 'working' ? 'selected' : ''}>กำลังทำงาน</option>
                                        <option value="done" ${order.status === 'done' ? 'selected' : ''}>เสร็จสิ้น</option>
                                    </select>
                                </p>
                                <small>สั่งเมื่อ: ${new Date(order.created_at).toLocaleString('th-TH')}</small>
                            </div>
                        `).join('')}
                    ` : `
                        <div class="empty-state">
                            <div class="empty-state-icon">📋</div>
                            <p>ยังไม่มีคำสั่งซื้อ</p>
                        </div>
                    `}
                </div>
            `;
        }
        
        // Setup form listeners
        setupArtistFormListeners();
        
    } catch (error) {
        console.error('Load artist dashboard error:', error);
        showAlert('เกิดข้อผิดพลาดในการโหลดแดชบอร์ด', 'error');
    }
}

async function loadAdminDashboard() {
    try {
        const response = await fetch('/api/admin/dashboard', {
            headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        });
        
        if (!response.ok) throw new Error('Failed to load admin dashboard');
        
        const data = await response.json();
        
        // Stats
        const stats = document.getElementById('admin-stats');
        if (stats) {
            stats.innerHTML = `
                <div class="stats-grid">
                    <div class="stat-card">
                        <div class="stat-number">${data.stats.total_users || 0}</div>
                        <div class="stat-label">ผู้ใช้ทั้งหมด</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-number">${data.stats.customers || 0}</div>
                        <div class="stat-label">ลูกค้า</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-number">${data.stats.artists || 0}</div>
                        <div class="stat-label">ศิลปิน</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-number">฿${(data.stats.total_revenue || 0).toLocaleString()}</div>
                        <div class="stat-label">รายได้รวม</div>
                    </div>
                </div>
            `;
        }
        
        // Pending shops
        const pendingShops = document.getElementById('pending-shops');
        if (pendingShops) {
            if (data.pendingShops && data.pendingShops.length > 0) {
                pendingShops.innerHTML = data.pendingShops.map(shop => `
                    <div class="order-card">
                        <h4>${escapeHtml(shop.name)}</h4>
                        <p><strong>เจ้าของ:</strong> ${escapeHtml(shop.owner_name)} (${escapeHtml(shop.owner_email)})</p>
                        <p><strong>คำอธิบาย:</strong> ${escapeHtml(shop.bio || 'ไม่มีคำอธิบาย')}</p>
                        <div style="margin-top: 1rem;">
                            <button class="btn btn-primary btn-sm" onclick="approveShop(${shop.id})">อนุมัติ</button>
                            <button class="btn btn-outline btn-sm" onclick="rejectShop(${shop.id})">ปฏิเสธ</button>
                        </div>
                    </div>
                `).join('');
            } else {
                pendingShops.innerHTML = `
                    <div class="empty-state">
                        <div class="empty-state-icon">✅</div>
                        <p>ไม่มีร้านรออนุมัติ</p>
                    </div>
                `;
            }
        }
        
        // All orders
        const allOrders = document.getElementById('all-orders');
        if (allOrders) {
            if (data.orders && data.orders.length > 0) {
                allOrders.innerHTML = data.orders.map(order => `
                    <div class="order-card">
                        <h4>คำสั่งซื้อ #${order.id}</h4>
                        <p><strong>ลูกค้า:</strong> ${escapeHtml(order.customer_name)}</p>
                        <p><strong>ศิลปิน:</strong> ${escapeHtml(order.artist_name)}</p>
                        <p><strong>ราคา:</strong> ฿${parseFloat(order.price).toLocaleString()}</p>
                        <p><strong>สถานะ:</strong> <span class="order-status status-${order.status}">${getStatusText(order.status)}</span></p>
                        <p><strong>รายละเอียด:</strong> ${escapeHtml(order.detail)}</p>
                        <small>สั่งเมื่อ: ${new Date(order.created_at).toLocaleString('th-TH')}</small>
                    </div>
                `).join('');
            } else {
                allOrders.innerHTML = `
                    <div class="empty-state">
                        <div class="empty-state-icon">📋</div>
                        <p>ยังไม่มีคำสั่งซื้อ</p>
                    </div>
                `;
            }
        }
        
    } catch (error) {
        console.error('Load admin dashboard error:', error);
        showAlert('เกิดข้อผิดพลาดในการโหลดแดชบอร์ดแอดมิน', 'error');
    }
}

// Additional functions
function setupArtistFormListeners() {
    const shopForm = document.getElementById('shop-form');
    if (shopForm) {
        shopForm.addEventListener('submit', handleShopUpdate);
    }
    
    const artworkForm = document.getElementById('artwork-form');
    if (artworkForm) {
        artworkForm.addEventListener('submit', handleArtworkAdd);
    }
    
    const artworkImage = document.getElementById('artwork-image');
    if (artworkImage) {
        artworkImage.addEventListener('change', handleImagePreview);
    }
}

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
                name: formData.get('name').trim(),
                bio: formData.get('bio').trim()
            })
        });
        
        if (response.ok) {
            showAlert('อัปเดตข้อมูลร้านสำเร็จ', 'success');
        } else {
            showAlert('เกิดข้อผิดพลาด', 'error');
        }
    } catch (error) {
        showAlert('เกิดข้อผิดพลาด', 'error');
    }
}

async function handleArtworkAdd(e) {
    e.preventDefault();
    const formData = new FormData(e.target);
    
    const title = formData.get('title').trim();
    const price = parseFloat(formData.get('price'));
    const image = formData.get('image');
    
    if (!title || !price || !image || image.size === 0) {
        showAlert('กรุณากรอกข้อมูลให้ครบถ้วน', 'error');
        return;
    }
    
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
            const preview = document.getElementById('image-preview');
            if (preview) preview.innerHTML = '';
            loadArtistDashboard();
        } else {
            showAlert('เกิดข้อผิดพลาด', 'error');
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
            loadArtistDashboard();
        } else {
            showAlert('เกิดข้อผิดพลาด', 'error');
        }
    } catch (error) {
        showAlert('เกิดข้อผิดพลาด', 'error');
    }
}

async function approveShop(shopId) {
    if (!confirm('คุณแน่ใจหรือไม่ที่จะอนุมัติร้านนี้?')) return;
    
    try {
        const response = await fetch(`/api/admin/shop/${shopId}/approve`, {
            method: 'PUT',
            headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        });
        
        if (response.ok) {
            showAlert('อนุมัติร้านสำเร็จ', 'success');
            loadAdminDashboard();
        } else {
            showAlert('เกิดข้อผิดพลาด', 'error');
        }
    } catch (error) {
        showAlert('เกิดข้อผิดพลาด', 'error');
    }
}

async function rejectShop(shopId) {
    if (!confirm('คุณแน่ใจหรือไม่ที่จะปฏิเสธร้านนี้?')) return;
    
    try {
        const response = await fetch(`/api/admin/shop/${shopId}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        });
        
        if (response.ok) {
            showAlert('ปฏิเสธร้านสำเร็จ', 'success');
            loadAdminDashboard();
        } else {
            showAlert('เกิดข้อผิดพลาด', 'error');
        }
    } catch (error) {
        showAlert('เกิดข้อผิดพลาด', 'error');
    }
}

// Tab functions
function showCustomerTab(tabName, buttonElement) {
    document.querySelectorAll('#customer-dashboard .tab-content').forEach(tab => {
        tab.classList.add('hidden');
    });
    
    document.querySelectorAll('#customer-dashboard .tab-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    
    const tabElement = document.getElementById('customer-' + tabName + '-tab');
    if (tabElement) {
        tabElement.classList.remove('hidden');
    }
    
    if (buttonElement) {
        buttonElement.classList.add('active');
    }
    
    if (tabName === 'orders') {
        loadCustomerDashboard();
    }
}

function showArtistTab(tabName, buttonElement) {
    document.querySelectorAll('#artist-dashboard .tab-content').forEach(tab => {
        tab.classList.add('hidden');
    });
    
    document.querySelectorAll('#artist-dashboard .tab-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    
    const tabElement = document.getElementById(tabName + '-tab');
    if (tabElement) {
        tabElement.classList.remove('hidden');
    }
    
    if (buttonElement) {
        buttonElement.classList.add('active');
    }
}

function showAdminTab(tabName, buttonElement) {
    document.querySelectorAll('#admin-dashboard .tab-content').forEach(tab => {
        tab.classList.add('hidden');
    });
    
    document.querySelectorAll('#admin-dashboard .tab-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    
    const tabElement = document.getElementById(tabName + '-tab');
    if (tabElement) {
        tabElement.classList.remove('hidden');
    }
    
    if (buttonElement) {
        buttonElement.classList.add('active');
    }
}

// Shop detail and search functions
async function showShopDetail(shopId) {
    try {
        const response = await fetch(`/api/user/shop/${shopId}`);
        if (!response.ok) throw new Error('Failed to load shop detail');
        
        const data = await response.json();
        
        hideAllSections();
        const shopDetailSection = document.getElementById('shop-detail');
        if (shopDetailSection) {
            shopDetailSection.classList.remove('hidden');
        }
        
        const shopInfo = document.getElementById('shop-info');
        if (shopInfo) {
            shopInfo.innerHTML = `
                <div class="shop-header">
                    <img src="${data.shop.owner_avatar || '/images/default-avatar.png'}" alt="${data.shop.name}">
                    <div>
                        <h2>${escapeHtml(data.shop.name)}</h2>
                        <p>โดย ${escapeHtml(data.shop.owner_name)}</p>
                        <p>${escapeHtml(data.shop.bio || 'ยินดีต้อนรับสู่ร้านของเรา')}</p>
                        ${currentUser && currentUser.role === 'customer' ? `
                            <div style="margin-top: 1rem;">
                                <button class="btn btn-primary" onclick="showCommissionModal(${data.shop.user_id})">สั่งวาดภาพ</button>
                                <button class="btn btn-outline" onclick="showChat(${data.shop.user_id})">แชท</button>
                            </div>
                        ` : ''}
                    </div>
                </div>
            `;
        }
        
        const artworksGrid = document.getElementById('artworks-grid');
        if (artworksGrid) {
            if (data.artworks && data.artworks.length > 0) {
                artworksGrid.innerHTML = data.artworks.map(artwork => `
                    <div class="artwork-card">
                        <img src="${artwork.image_url || '/images/default-artwork.png'}" alt="${artwork.title}">
                        <div class="artwork-card-content">
                            <h3>${escapeHtml(artwork.title)}</h3>
                            <p>${escapeHtml(artwork.description || 'ไม่มีคำอธิบาย')}</p>
                            <div class="price">฿${parseFloat(artwork.price).toLocaleString()}</div>
                        </div>
                    </div>
                `).join('');
            } else {
                artworksGrid.innerHTML = `
                    <div class="empty-state">
                        <div class="empty-state-icon">🎨</div>
                        <p>ร้านนี้ยังไม่มีผลงาน</p>
                    </div>
                `;
            }
        }
        
        currentShop = data.shop;
    } catch (error) {
        console.error('Show shop detail error:', error);
        showAlert('เกิดข้อผิดพลาดในการโหลดข้อมูลร้าน', 'error');
    }
}

async function searchShops() {
    const searchInput = document.getElementById('search-input');
    const query = searchInput ? searchInput.value.trim() : '';
    
    try {
        const response = await fetch('/api/user/shops');
        if (!response.ok) throw new Error('Failed to search shops');
        
        const shops = await response.json();
        let filteredShops = query ? shops.filter(shop => 
            shop.name.toLowerCase().includes(query.toLowerCase()) ||
            shop.owner_name.toLowerCase().includes(query.toLowerCase()) ||
            (shop.bio && shop.bio.toLowerCase().includes(query.toLowerCase()))
        ) : shops;
        
        const container = document.getElementById('shops-grid');
        if (container) {
            if (filteredShops.length > 0) {
                container.innerHTML = filteredShops.map(shop => `
                    <div class="shop-card fade-in" onclick="showShopDetail(${shop.id})" style="cursor: pointer;">
                        <img src="${shop.owner_avatar || '/images/default-avatar.png'}" alt="${shop.name}">
                        <div class="shop-card-content">
                            <h3>${escapeHtml(shop.name)}</h3>
                            <p>โดย ${escapeHtml(shop.owner_name)}</p>
                            <p>${escapeHtml(shop.bio || 'ยินดีต้อนรับสู่ร้านของเรา')}</p>
                            <small>${shop.artwork_count || 0} ผลงาน</small>
                        </div>
                    </div>
                `).join('');
            } else {
                container.innerHTML = `
                    <div class="empty-state">
                        <div class="empty-state-icon">🔍</div>
                        <p>${query ? `ไม่พบร้านที่ค้นหา "${query}"` : 'ไม่พบร้าน'}</p>
                    </div>
                `;
            }
        }
    } catch (error) {
        console.error('Search shops error:', error);
        showAlert('เกิดข้อผิดพลาดในการค้นหา', 'error');
    }
}

// Chat function placeholder
function showChat(userId) {
    showAlert('ฟีเจอร์แชทจะเปิดใช้งานเร็วๆ นี้', 'info');
}