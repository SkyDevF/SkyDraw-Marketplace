// Complete functions for SkyDraw Marketplace

// Tab functions for different user roles
function showCustomerTab(tabName, buttonElement) {
    // Hide all customer tab contents
    document.querySelectorAll('#customer-dashboard .tab-content').forEach(tab => {
        tab.classList.add('hidden');
    });
    
    // Remove active class from customer tab buttons
    document.querySelectorAll('#customer-dashboard .tab-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    
    // Show selected tab
    const tabElement = document.getElementById('customer-' + tabName + '-tab');
    if (tabElement) {
        tabElement.classList.remove('hidden');
    }
    
    // Add active class to clicked button
    if (buttonElement) {
        buttonElement.classList.add('active');
    }
    
    // Load content based on tab
    if (tabName === 'orders') {
        loadCustomerDashboard();
    } else if (tabName === 'messages') {
        loadCustomerMessages();
    }
}

function showArtistTab(tabName, buttonElement) {
    // Hide all artist tab contents
    document.querySelectorAll('#artist-dashboard .tab-content').forEach(tab => {
        tab.classList.add('hidden');
    });
    
    // Remove active class from artist tab buttons
    document.querySelectorAll('#artist-dashboard .tab-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    
    // Show selected tab
    const tabElement = document.getElementById(tabName + '-tab');
    if (tabElement) {
        tabElement.classList.remove('hidden');
    }
    
    // Add active class to clicked button
    if (buttonElement) {
        buttonElement.classList.add('active');
    }
    
    // Load content based on tab
    if (tabName === 'shop-manage' || tabName === 'artworks' || tabName === 'orders') {
        loadArtistDashboard();
    }
}

function showAdminTab(tabName, buttonElement) {
    // Hide all admin tab contents
    document.querySelectorAll('#admin-dashboard .tab-content').forEach(tab => {
        tab.classList.add('hidden');
    });
    
    // Remove active class from admin tab buttons
    document.querySelectorAll('#admin-dashboard .tab-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    
    // Show selected tab
    const tabElement = document.getElementById(tabName + '-tab');
    if (tabElement) {
        tabElement.classList.remove('hidden');
    }
    
    // Add active class to clicked button
    if (buttonElement) {
        buttonElement.classList.add('active');
    }
    
    // Load content based on tab
    if (tabName === 'stats' || tabName === 'pending-shops' || tabName === 'all-orders') {
        loadAdminDashboard();
    }
}

// Admin dashboard function
async function loadAdminDashboard() {
    try {
        console.log('Loading admin dashboard...');
        const response = await fetch('/api/admin/dashboard', {
            headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        });
        
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Failed to load admin dashboard');
        }
        
        const data = await response.json();
        console.log('Loaded admin dashboard data:', data);
        
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
                        <div style="display: flex; justify-content: space-between; align-items: center;">
                            <div style="flex: 1;">
                                <h4>${escapeHtml(shop.name)}</h4>
                                <p><strong>เจ้าของ:</strong> ${escapeHtml(shop.owner_name)} (${escapeHtml(shop.owner_email)})</p>
                                <p><strong>คำอธิบาย:</strong> ${escapeHtml(shop.bio || 'ไม่มีคำอธิบาย')}</p>
                                <small style="color: #94a3b8;">สมัครเมื่อ: ${new Date(shop.created_at).toLocaleString('th-TH')}</small>
                            </div>
                            <div style="display: flex; gap: 0.5rem;">
                                <button class="btn btn-primary btn-sm" onclick="approveShop(${shop.id})">อนุมัติ</button>
                                <button class="btn btn-outline btn-sm" onclick="rejectShop(${shop.id})">ปฏิเสธ</button>
                            </div>
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
                        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.5rem; margin: 0.5rem 0;">
                            <p><strong>ลูกค้า:</strong> ${escapeHtml(order.customer_name)}</p>
                            <p><strong>ศิลปิน:</strong> ${escapeHtml(order.artist_name)}</p>
                            <p><strong>ราคา:</strong> ฿${parseFloat(order.price).toLocaleString()}</p>
                            <p><strong>สถานะ:</strong> <span class="order-status status-${order.status}">${getStatusText(order.status)}</span></p>
                        </div>
                        <p style="margin: 0.5rem 0; color: #64748b;"><strong>รายละเอียด:</strong> ${escapeHtml(order.detail)}</p>
                        <small style="color: #94a3b8;">สั่งเมื่อ: ${new Date(order.created_at).toLocaleString('th-TH')}</small>
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
        showAlert('เกิดข้อผิดพลาดในการโหลดแดชบอร์ดแอดมิน: ' + error.message, 'error');
    }
}

// Admin functions
async function approveShop(shopId) {
    if (!confirm('คุณแน่ใจหรือไม่ที่จะอนุมัติร้านนี้?')) {
        return;
    }
    
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
        } else {
            const errorData = await response.json();
            showAlert(errorData.message || 'เกิดข้อผิดพลาด', 'error');
        }
    } catch (error) {
        console.error('Approve shop error:', error);
        showAlert('เกิดข้อผิดพลาดในการเชื่อมต่อ', 'error');
    }
}

async function rejectShop(shopId) {
    if (!confirm('คุณแน่ใจหรือไม่ที่จะปฏิเสธร้านนี้? การกระทำนี้ไม่สามารถยกเลิกได้')) {
        return;
    }
    
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
        } else {
            const errorData = await response.json();
            showAlert(errorData.message || 'เกิดข้อผิดพลาด', 'error');
        }
    } catch (error) {
        console.error('Reject shop error:', error);
        showAlert('เกิดข้อผิดพลาดในการเชื่อมต่อ', 'error');
    }
}

// Navigation functions
async function loadFeaturedShops() {
    try {
        console.log('Loading featured shops...');
        const response = await fetch('/api/user/shops');
        
        if (!response.ok) {
            throw new Error('Failed to load shops');
        }
        
        const shops = await response.json();
        console.log('Loaded shops:', shops.length);
        
        const container = document.getElementById('featured-shops');
        if (container) {
            if (shops.length > 0) {
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
            } else {
                container.innerHTML = `
                    <div class="empty-state">
                        <div class="empty-state-icon">🏪</div>
                        <p>ยังไม่มีร้านที่เปิดให้บริการ</p>
                    </div>
                `;
            }
        }
    } catch (error) {
        console.error('Load featured shops error:', error);
        const container = document.getElementById('featured-shops');
        if (container) {
            container.innerHTML = `
                <div class="empty-state">
                    <div class="empty-state-icon">⚠️</div>
                    <p>เกิดข้อผิดพลาดในการโหลดร้าน</p>
                </div>
            `;
        }
    }
}

async function loadAllShops() {
    try {
        console.log('Loading all shops...');
        const response = await fetch('/api/user/shops');
        
        if (!response.ok) {
            throw new Error('Failed to load shops');
        }
        
        const shops = await response.json();
        console.log('Loaded all shops:', shops.length);
        
        const container = document.getElementById('shops-grid');
        if (container) {
            if (shops.length > 0) {
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
            } else {
                container.innerHTML = `
                    <div class="empty-state">
                        <div class="empty-state-icon">🏪</div>
                        <p>ยังไม่มีร้านที่เปิดให้บริการ</p>
                    </div>
                `;
            }
        }
    } catch (error) {
        console.error('Load all shops error:', error);
        const container = document.getElementById('shops-grid');
        if (container) {
            container.innerHTML = `
                <div class="empty-state">
                    <div class="empty-state-icon">⚠️</div>
                    <p>เกิดข้อผิดพลาดในการโหลดร้าน</p>
                </div>
            `;
        }
    }
}

async function showShopDetail(shopId) {
    try {
        console.log('Loading shop detail:', shopId);
        const response = await fetch(`/api/user/shop/${shopId}`);
        
        if (!response.ok) {
            throw new Error('Failed to load shop detail');
        }
        
        const data = await response.json();
        console.log('Loaded shop detail:', data);
        
        hideAllSections();
        document.getElementById('shop-detail').classList.remove('hidden');
        
        const shopInfo = document.getElementById('shop-info');
        if (shopInfo) {
            shopInfo.innerHTML = `
                <div class="shop-header">
                    <img src="${data.shop.owner_avatar || '/images/default-avatar.png'}" 
                         alt="${data.shop.name}" 
                         onerror="this.src='/images/default-avatar.png'">
                    <div>
                        <h2>${escapeHtml(data.shop.name)}</h2>
                        <p>โดย ${escapeHtml(data.shop.owner_name)}</p>
                        <p>${escapeHtml(data.shop.bio || 'ยินดีต้อนรับสู่ร้านของเรา')}</p>
                        ${currentUser && currentUser.role === 'customer' ? `
                            <div style="margin-top: 1rem; display: flex; gap: 1rem;">
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
                        <img src="${artwork.image_url || '/images/default-artwork.png'}" 
                             alt="${artwork.title}"
                             onerror="this.src='/images/default-artwork.png'">
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
        showAlert('เกิดข้อผิดพลาดในการโหลดข้อมูลร้าน: ' + error.message, 'error');
    }
}

// Search function
async function searchShops() {
    const query = document.getElementById('search-input').value.trim();
    
    try {
        const response = await fetch('/api/user/shops');
        if (!response.ok) {
            throw new Error('Failed to search shops');
        }
        
        const shops = await response.json();
        
        let filteredShops = shops;
        if (query) {
            filteredShops = shops.filter(shop => 
                shop.name.toLowerCase().includes(query.toLowerCase()) ||
                shop.owner_name.toLowerCase().includes(query.toLowerCase()) ||
                (shop.bio && shop.bio.toLowerCase().includes(query.toLowerCase()))
            );
        }
        
        const container = document.getElementById('shops-grid');
        if (filteredShops.length > 0) {
            container.innerHTML = filteredShops.map(shop => `
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
        } else {
            container.innerHTML = `
                <div class="empty-state">
                    <div class="empty-state-icon">🔍</div>
                    <p>${query ? `ไม่พบร้านที่ค้นหา "${query}"` : 'ไม่พบร้าน'}</p>
                </div>
            `;
        }
    } catch (error) {
        console.error('Search shops error:', error);
        showAlert('เกิดข้อผิดพลาดในการค้นหา', 'error');
    }
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
    document.getElementById('commission-modal').style.display = 'block';
}

// Escape HTML function
function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Dashboard functions
async function loadCustomerDashboard() {
    try {
        console.log('Loading customer dashboard...');
        const response = await fetch('/api/order/my-orders', {
            headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        });
        
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Failed to load orders');
        }
        
        const orders = await response.json();
        console.log('Loaded orders:', orders.length);
        
        const container = document.getElementById('customer-orders');
        if (orders.length > 0) {
            container.innerHTML = orders.map(order => `
                <div class="order-card">
                    <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 1rem;">
                        <div style="flex: 1;">
                            <h4 style="margin: 0 0 0.5rem 0; color: #1e293b;">คำสั่งซื้อ #${order.id}</h4>
                            <p style="margin: 0.25rem 0; color: #64748b;"><strong>ศิลปิน:</strong> ${escapeHtml(order.artist_name || 'ไม่ระบุ')}</p>
                            <p style="margin: 0.25rem 0; color: #64748b;"><strong>ราคา:</strong> ฿${parseFloat(order.price).toLocaleString()}</p>
                            <p style="margin: 0.25rem 0; color: #64748b;"><strong>รายละเอียด:</strong> ${escapeHtml(order.detail)}</p>
                            <small style="color: #94a3b8;">สั่งเมื่อ: ${new Date(order.created_at).toLocaleString('th-TH')}</small>
                        </div>
                        <div style="text-align: right;">
                            <span class="order-status status-${order.status}">${getStatusText(order.status)}</span>
                            ${order.status === 'waiting' ? `
                                <div style="margin-top: 0.5rem;">
                                    <button class="btn btn-primary btn-sm" onclick="confirmPayment(${order.id})">ยืนยันการชำระเงิน</button>
                                </div>
                            ` : ''}
                        </div>
                    </div>
                    ${order.artwork_title ? `
                        <div style="display: flex; align-items: center; gap: 1rem; padding-top: 1rem; border-top: 1px solid #e2e8f0;">
                            ${order.artwork_image ? `<img src="${order.artwork_image}" alt="${order.artwork_title}" style="width: 60px; height: 60px; object-fit: cover; border-radius: 8px;">` : ''}
                            <div>
                                <p style="margin: 0; font-weight: 500;">ผลงานอ้างอิง: ${escapeHtml(order.artwork_title)}</p>
                            </div>
                        </div>
                    ` : ''}
                </div>
            `).join('');
        } else {
            container.innerHTML = `
                <div class="empty-state">
                    <div class="empty-state-icon">📋</div>
                    <p>ยังไม่มีคำสั่งซื้อ เริ่มสั่งงานจากศิลปินได้เลย</p>
                    <button class="btn btn-primary mt-2" onclick="showExplore()">ค้นหาศิลปิน</button>
                </div>
            `;
        }
    } catch (error) {
        console.error('Load customer dashboard error:', error);
        const container = document.getElementById('customer-orders');
        if (container) {
            container.innerHTML = `
                <div class="empty-state">
                    <div class="empty-state-icon">⚠️</div>
                    <p>เกิดข้อผิดพลาดในการโหลดคำสั่งซื้อ: ${error.message}</p>
                    <button class="btn btn-outline mt-2" onclick="loadCustomerDashboard()">ลองใหม่</button>
                </div>
            `;
        }
    }
}

// Helper function to get status text
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
            // Remove QR modal if exists
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

// Artist dashboard function
async function loadArtistDashboard() {
    try {
        console.log('Loading artist dashboard...');
        const response = await fetch('/api/artist/dashboard', {
            headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        });
        
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Failed to load dashboard');
        }
        
        const data = await response.json();
        console.log('Loaded artist dashboard data:', data);
        
        // Shop management
        const shopManagement = document.getElementById('shop-management');
        if (shopManagement) {
            shopManagement.innerHTML = `
                <div class="info-card">
                    <h3>ข้อมูลร้าน</h3>
                    <form id="shop-form">
                        <div class="form-row">
                            <div class="form-group">
                                <label>ชื่อร้าน</label>
                                <input type="text" name="name" value="${escapeHtml(data.shop.name)}" required>
                            </div>
                        </div>
                        <div class="form-group">
                            <label>คำอธิบายร้าน</label>
                            <textarea name="bio" rows="3" placeholder="เล่าเกี่ยวกับร้านของคุณ...">${escapeHtml(data.shop.bio || '')}</textarea>
                        </div>
                        <div class="form-actions">
                            <button type="submit" class="btn btn-primary">อัปเดตข้อมูล</button>
                        </div>
                    </form>
                    <div class="mt-3" style="padding-top: 1rem; border-top: 1px solid #e2e8f0;">
                        <p><strong>สถานะร้าน:</strong> 
                            <span class="order-status ${data.shop.is_approved ? 'status-done' : 'status-waiting'}">
                                ${data.shop.is_approved ? 'อนุมัติแล้ว' : 'รออนุมัติ'}
                            </span>
                        </p>
                        ${!data.shop.is_approved ? '<p style="color: #64748b; font-size: 0.875rem;">ร้านของคุณรออนุมัติจากแอดมิน</p>' : ''}
                    </div>
                </div>
            `;
        }
        
        // Artworks
        const artworks = document.getElementById('artist-artworks');
        if (artworks) {
            artworks.innerHTML = `
                <div class="artwork-upload info-card">
                    <h3>เพิ่มผลงานใหม่</h3>
                    <form id="artwork-form" enctype="multipart/form-data">
                        <div class="form-row">
                            <div class="form-group">
                                <label>ชื่อผลงาน</label>
                                <input type="text" name="title" required placeholder="ชื่อผลงานของคุณ">
                            </div>
                            <div class="form-group">
                                <label>ราคา (บาท)</label>
                                <input type="number" name="price" min="1" required placeholder="0">
                            </div>
                        </div>
                        <div class="form-group">
                            <label>คำอธิบายผลงาน</label>
                            <textarea name="description" rows="3" placeholder="อธิบายรายละเอียดผลงาน เทคนิคที่ใช้ หรือแรงบันดาลใจ..."></textarea>
                        </div>
                        <div class="form-group">
                            <label>รูปภาพผลงาน</label>
                            <div class="file-upload">
                                <input type="file" name="image" accept="image/*" required id="artwork-image">
                                <label for="artwork-image" class="file-upload-label">
                                    <div class="file-upload-icon">📷</div>
                                    <div>คลิกเพื่อเลือกรูปภาพ</div>
                                    <small>รองรับ JPG, PNG, GIF (ขนาดไม่เกิน 5MB)</small>
                                </label>
                            </div>
                            <div id="image-preview" class="mt-2"></div>
                        </div>
                        <div class="form-actions">
                            <button type="submit" class="btn btn-primary">เพิ่มผลงาน</button>
                        </div>
                    </form>
                </div>
                <div class="info-card">
                    <h3>ผลงานของฉัน (${data.artworks.length} ชิ้น)</h3>
                    ${data.artworks.length > 0 ? `
                        <div class="artworks-grid">
                            ${data.artworks.map(artwork => `
                                <div class="artwork-card">
                                    <img src="${artwork.image_url}" alt="${artwork.title}" onerror="this.src='/images/default-artwork.png'">
                                    <div class="artwork-card-content">
                                        <h4>${escapeHtml(artwork.title)}</h4>
                                        <p>${escapeHtml(artwork.description || 'ไม่มีคำอธิบาย')}</p>
                                        <div class="price">฿${parseFloat(artwork.price).toLocaleString()}</div>
                                        <small style="color: #94a3b8;">เพิ่มเมื่อ ${new Date(artwork.created_at).toLocaleDateString('th-TH')}</small>
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
        
        // Orders received by artist
        const orders = document.getElementById('artist-orders');
        if (orders) {
            orders.innerHTML = `
                <div class="info-card">
                    <h3>คำสั่งซื้อที่ได้รับ (${data.orders.length} รายการ)</h3>
                    ${data.orders.length > 0 ? `
                        ${data.orders.map(order => `
                            <div class="order-card">
                                <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 1rem;">
                                    <div style="flex: 1;">
                                        <h4 style="margin: 0 0 0.5rem 0; color: #1e293b;">คำสั่งซื้อ #${order.id}</h4>
                                        <p style="margin: 0.25rem 0; color: #64748b;"><strong>ลูกค้า:</strong> ${escapeHtml(order.customer_name)}</p>
                                        <p style="margin: 0.25rem 0; color: #64748b;"><strong>อีเมล:</strong> ${escapeHtml(order.customer_email)}</p>
                                        <p style="margin: 0.25rem 0; color: #64748b;"><strong>ราคา:</strong> ฿${parseFloat(order.price).toLocaleString()}</p>
                                        <p style="margin: 0.25rem 0; color: #64748b;"><strong>รายละเอียด:</strong> ${escapeHtml(order.detail)}</p>
                                        <small style="color: #94a3b8;">สั่งเมื่อ: ${new Date(order.created_at).toLocaleString('th-TH')}</small>
                                    </div>
                                    <div style="text-align: right;">
                                        <span class="order-status status-${order.status}">${getStatusText(order.status)}</span>
                                        <div style="margin-top: 0.5rem;">
                                            <select onchange="updateOrderStatus(${order.id}, this.value)" style="padding: 0.25rem; border-radius: 4px; border: 1px solid #e2e8f0;">
                                                <option value="waiting" ${order.status === 'waiting' ? 'selected' : ''}>รอชำระเงิน</option>
                                                <option value="paid" ${order.status === 'paid' ? 'selected' : ''}>ชำระแล้ว</option>
                                                <option value="working" ${order.status === 'working' ? 'selected' : ''}>กำลังทำงาน</option>
                                                <option value="done" ${order.status === 'done' ? 'selected' : ''}>เสร็จสิ้น</option>
                                            </select>
                                        </div>
                                        <div style="margin-top: 0.5rem;">
                                            <button class="btn btn-outline btn-sm" onclick="showChat(${order.customer_id})">แชทกับลูกค้า</button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        `).join('')}
                    ` : `
                        <div class="empty-state">
                            <div class="empty-state-icon">📋</div>
                            <p>ยังไม่มีคำสั่งซื้อ รอลูกค้าสั่งงานจากคุณ</p>
                        </div>
                    `}
                </div>
            `;
        }
        
        // Setup form listeners
        const shopForm = document.getElementById('shop-form');
        if (shopForm) {
            shopForm.addEventListener('submit', handleShopUpdate);
        }
        
        const artworkForm = document.getElementById('artwork-form');
        if (artworkForm) {
            artworkForm.addEventListener('submit', handleArtworkAdd);
        }
        
        // Setup image preview
        const artworkImage = document.getElementById('artwork-image');
        if (artworkImage) {
            artworkImage.addEventListener('change', handleImagePreview);
        }
        
    } catch (error) {
        console.error('Load artist dashboard error:', error);
        showAlert('เกิดข้อผิดพลาดในการโหลดแดชบอร์ด: ' + error.message, 'error');
    }
}

// Update order status function
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
            loadArtistDashboard(); // Reload to show updated status
        } else {
            const errorData = await response.json();
            showAlert(errorData.message || 'เกิดข้อผิดพลาด', 'error');
        }
    } catch (error) {
        console.error('Update order status error:', error);
        showAlert('เกิดข้อผิดพลาดในการเชื่อมต่อ', 'error');
    }
}

// Handle shop update
async function handleShopUpdate(e) {
    e.preventDefault();
    const formData = new FormData(e.target);
    const submitBtn = e.target.querySelector('button[type="submit"]');
    
    submitBtn.classList.add('loading');
    submitBtn.disabled = true;
    
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
            const errorData = await response.json();
            showAlert(errorData.message || 'เกิดข้อผิดพลาด', 'error');
        }
    } catch (error) {
        console.error('Update shop error:', error);
        showAlert('เกิดข้อผิดพลาดในการเชื่อมต่อ', 'error');
    } finally {
        submitBtn.classList.remove('loading');
        submitBtn.disabled = false;
    }
}

// Handle artwork add
async function handleArtworkAdd(e) {
    e.preventDefault();
    const formData = new FormData(e.target);
    const submitBtn = e.target.querySelector('button[type="submit"]');
    
    // Validate
    const title = formData.get('title').trim();
    const price = parseFloat(formData.get('price'));
    const image = formData.get('image');
    
    if (!title || title.length < 2) {
        showAlert('กรุณากรอกชื่อผลงานที่ถูกต้อง', 'error');
        return;
    }
    
    if (!price || price < 1) {
        showAlert('กรุณากรอกราคาที่ถูกต้อง', 'error');
        return;
    }
    
    if (!image || image.size === 0) {
        showAlert('กรุณาเลือกรูปภาพผลงาน', 'error');
        return;
    }
    
    if (image.size > 5 * 1024 * 1024) {
        showAlert('ขนาดไฟล์ต้องไม่เกิน 5MB', 'error');
        return;
    }
    
    submitBtn.classList.add('loading');
    submitBtn.disabled = true;
    
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
            document.getElementById('image-preview').innerHTML = '';
            loadArtistDashboard(); // Reload to show new artwork
        } else {
            const errorData = await response.json();
            showAlert(errorData.message || 'เกิดข้อผิดพลาด', 'error');
        }
    } catch (error) {
        console.error('Add artwork error:', error);
        showAlert('เกิดข้อผิดพลาดในการเชื่อมต่อ', 'error');
    } finally {
        submitBtn.classList.remove('loading');
        submitBtn.disabled = false;
    }
}

// Image preview function
function handleImagePreview(event) {
    const file = event.target.files[0];
    const preview = document.getElementById('image-preview');
    
    if (file) {
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
    } else {
        preview.innerHTML = '';
    }
}