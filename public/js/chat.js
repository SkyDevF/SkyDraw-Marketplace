// Chat functionality for SkyDraw Marketplace
// This file contains chat-related functions

// Chat functions
let currentChatUser = null;

function showChat(artistId) {
    if (!currentUser) {
        showAlert('กรุณาเข้าสู่ระบบก่อน', 'error');
        return;
    }
    currentChatUser = artistId;
    document.getElementById('chat-modal').style.display = 'block';
    loadMessages(artistId);
}

async function loadMessages(userId) {
    try {
        console.log('Loading messages with user:', userId);
        const response = await fetch(`/api/user/messages/${userId}`, {
            headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        });
        
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Failed to load messages');
        }
        
        const messages = await response.json();
        console.log('Loaded messages:', messages.length);
        
        const container = document.getElementById('chat-messages');
        if (messages.length > 0) {
            container.innerHTML = messages.map(msg => `
                <div class="message ${msg.sender_id === currentUser.id ? 'sent' : 'received'}">
                    <div>${escapeHtml(msg.message)}</div>
                    <div class="message-time">${new Date(msg.created_at).toLocaleString('th-TH')}</div>
                </div>
            `).join('');
        } else {
            container.innerHTML = `
                <div class="empty-state">
                    <div class="empty-state-icon">💬</div>
                    <p>ยังไม่มีข้อความ เริ่มสนทนาได้เลย</p>
                </div>
            `;
        }
        
        // Scroll to bottom
        container.scrollTop = container.scrollHeight;
        
        // Update chat title with user name
        const chatTitle = document.getElementById('chat-title');
        if (messages.length > 0) {
            const otherUser = messages[0].sender_id === currentUser.id ? messages[0].receiver_name : messages[0].sender_name;
            chatTitle.textContent = `แชทกับ ${otherUser}`;
        }
    } catch (error) {
        console.error('Load messages error:', error);
        document.getElementById('chat-messages').innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon">⚠️</div>
                <p>เกิดข้อผิดพลาดในการโหลดข้อความ: ${error.message}</p>
            </div>
        `;
    }
}

// Helper function to escape HTML
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

async function sendMessage() {
    const input = document.getElementById('message-input');
    const message = input.value.trim();
    
    if (!message) return;
    
    // Show loading state
    const sendBtn = input.nextElementSibling;
    const originalText = sendBtn.textContent;
    sendBtn.textContent = 'กำลังส่ง...';
    sendBtn.disabled = true;
    
    try {
        const response = await fetch('/api/user/message', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: JSON.stringify({
                receiver_id: currentChatUser,
                message: message
            })
        });
        
        if (response.ok) {
            input.value = '';
            loadMessages(currentChatUser);
        } else {
            const data = await response.json();
            showAlert(data.message || 'เกิดข้อผิดพลาดในการส่งข้อความ', 'error');
        }
    } catch (error) {
        console.error('Send message error:', error);
        showAlert('เกิดข้อผิดพลาดในการเชื่อมต่อ', 'error');
    } finally {
        // Remove loading state
        sendBtn.textContent = originalText;
        sendBtn.disabled = false;
    }
}

function handleMessageKeyPress(event) {
    if (event.key === 'Enter' && !event.shiftKey) {
        event.preventDefault();
        sendMessage();
    }
}

// Load customer messages
async function loadCustomerMessages() {
    try {
        const response = await fetch('/api/user/conversations', {
            headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        });
        
        if (response.ok) {
            const conversations = await response.json();
            const container = document.getElementById('customer-messages');
            
            if (conversations.length > 0) {
                container.innerHTML = conversations.map(conv => `
                    <div class="order-card" onclick="showChat(${conv.other_user_id})" style="cursor: pointer;">
                        <div style="display: flex; align-items: center; gap: 1rem;">
                            <img src="${conv.other_user_avatar || '/images/default-avatar.png'}" 
                                 alt="${conv.other_user_name}" 
                                 style="width: 50px; height: 50px; border-radius: 50%; object-fit: cover;">
                            <div style="flex: 1;">
                                <h4>${conv.other_user_name}</h4>
                                <p style="color: #64748b; margin: 0.25rem 0;">${conv.last_message || 'ยังไม่มีข้อความ'}</p>
                                <small style="color: #94a3b8;">${conv.last_message_time ? new Date(conv.last_message_time).toLocaleString('th-TH') : ''}</small>
                            </div>
                            <button class="btn btn-outline btn-sm" onclick="event.stopPropagation(); showChat(${conv.other_user_id})">แชท</button>
                        </div>
                    </div>
                `).join('');
            } else {
                container.innerHTML = `
                    <div class="empty-state">
                        <div class="empty-state-icon">💬</div>
                        <p>ยังไม่มีการสนทนา เริ่มแชทกับศิลปินได้จากหน้าร้าน</p>
                    </div>
                `;
            }
        } else {
            throw new Error('Failed to load conversations');
        }
    } catch (error) {
        console.error('Load customer messages error:', error);
        document.getElementById('customer-messages').innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon">⚠️</div>
                <p>เกิดข้อผิดพลาดในการโหลดข้อความ</p>
            </div>
        `;
    }
}

// Enhanced tab switching with proper loading
function showTab(tabName) {
    // Hide all tab contents
    document.querySelectorAll('.tab-content').forEach(tab => {
        tab.classList.add('hidden');
    });
    
    // Remove active class from all tab buttons
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    
    // Show selected tab
    document.getElementById(tabName + '-tab').classList.remove('hidden');
    
    // Add active class to clicked button
    const clickedButton = document.querySelector(`[onclick*="showTab('${tabName}')"]`);
    if (clickedButton) {
        clickedButton.classList.add('active');
    }
    
    // Load content based on tab
    if (tabName === 'messages' && currentUser && currentUser.role === 'customer') {
        loadCustomerMessages();
    }
}