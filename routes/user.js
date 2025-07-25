const express = require('express');
const { db } = require('../models/db');
const { authenticateToken } = require('../middleware/auth');
const router = express.Router();

// Get user profile
router.get('/profile', authenticateToken, async (req, res) => {
  try {
    const user = await db.users.findById(req.user.userId);
    if (!user) {
      return res.status(404).json({ message: 'ไม่พบผู้ใช้' });
    }

    // Remove password from response
    const { password, ...userProfile } = user;
    res.json(userProfile);
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ message: 'เกิดข้อผิดพลาด' });
  }
});

// Get all shops
router.get('/shops', async (req, res) => {
  try {
    // For development, show all shops (including unapproved ones)
    // In production, you might want to use findAllApproved() instead
    const shops = await db.shops.findAll();
    
    console.log('📊 Found shops:', shops.length);
    
    // Format the response to match frontend expectations
    const formattedShops = shops.map(shop => ({
      ...shop,
      owner_name: shop.users?.name || 'Unknown',
      owner_avatar: shop.users?.avatar || null,
      artwork_count: shop.artworks ? shop.artworks.length : 0
    }));

    res.json(formattedShops);
  } catch (error) {
    console.error('Get shops error:', error);
    res.status(500).json({ message: 'เกิดข้อผิดพลาด' });
  }
});

// Get shop by ID
router.get('/shop/:id', async (req, res) => {
  try {
    console.log('🏪 Loading shop detail for ID:', req.params.id);
    
    const shop = await db.shops.findById(req.params.id);
    if (!shop) {
      return res.status(404).json({ message: 'ไม่พบร้าน' });
    }

    const artworks = await db.artworks.findByShopId(req.params.id);

    // Format shop data
    const formattedShop = {
      ...shop,
      owner_name: shop.users?.name || 'Unknown',
      owner_avatar: shop.users?.avatar || null
    };

    console.log('✅ Shop loaded with', artworks.length, 'artworks');

    res.json({
      shop: formattedShop,
      artworks
    });
  } catch (error) {
    console.error('Get shop error:', error);
    res.status(500).json({ message: 'เกิดข้อผิดพลาด' });
  }
});

// Get messages
router.get('/messages/:userId', authenticateToken, async (req, res) => {
  try {
    const messages = await db.messages.findBetweenUsers(req.user.userId, req.params.userId);
    
    // Format messages to match frontend expectations
    const formattedMessages = messages.map(msg => ({
      ...msg,
      sender_name: msg.sender.name,
      receiver_name: msg.receiver.name
    }));

    res.json(formattedMessages);
  } catch (error) {
    console.error('Get messages error:', error);
    res.status(500).json({ message: 'เกิดข้อผิดพลาด' });
  }
});

// Send message
router.post('/message', authenticateToken, async (req, res) => {
  try {
    const { receiver_id, message } = req.body;

    await db.messages.create({
      sender_id: req.user.userId,
      receiver_id,
      message
    });

    res.json({ message: 'ส่งข้อความสำเร็จ' });
  } catch (error) {
    console.error('Send message error:', error);
    res.status(500).json({ message: 'เกิดข้อผิดพลาด' });
  }
});

// Get conversations
router.get('/conversations', authenticateToken, async (req, res) => {
  try {
    const { supabase } = require('../models/db');
    const { data, error } = await supabase
      .from('messages')
      .select(`
        *,
        sender:users!messages_sender_id_fkey(id, name, avatar),
        receiver:users!messages_receiver_id_fkey(id, name, avatar)
      `)
      .or(`sender_id.eq.${req.user.userId},receiver_id.eq.${req.user.userId}`)
      .order('created_at', { ascending: false });

    if (error) throw error;

    // Group by conversation partner
    const conversations = {};
    (data || []).forEach(msg => {
      const otherId = msg.sender_id === req.user.userId ? msg.receiver_id : msg.sender_id;
      const otherUser = msg.sender_id === req.user.userId ? msg.receiver : msg.sender;
      
      if (!conversations[otherId]) {
        conversations[otherId] = {
          other_user_id: otherId,
          other_user_name: otherUser.name,
          other_user_avatar: otherUser.avatar,
          last_message: msg.message,
          last_message_time: msg.created_at
        };
      }
    });

    res.json(Object.values(conversations));
  } catch (error) {
    console.error('Get conversations error:', error);
    res.status(500).json({ message: 'เกิดข้อผิดพลาด' });
  }
});

module.exports = router;