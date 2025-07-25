const express = require('express');
const multer = require('multer');
const path = require('path');
const { db } = require('../models/db');
const { authenticateToken, requireRole } = require('../middleware/auth');
const router = express.Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('รองรับเฉพาะไฟล์รูปภาพ'));
    }
  }
});

// Get artist dashboard
router.get('/dashboard', authenticateToken, requireRole(['artist']), async (req, res) => {
  try {
    console.log('🎨 Loading artist dashboard for user:', req.user.userId);
    
    // Get shop info
    let shop = await db.shops.findByUserId(req.user.userId);
    
    // If no shop exists, create one automatically
    if (!shop) {
      console.log('🏪 No shop found, creating new shop for artist');
      const user = await db.users.findById(req.user.userId);
      
      shop = await db.shops.create({
        user_id: req.user.userId,
        name: `${user.name}'s Art Shop`,
        bio: 'ยินดีต้อนรับสู่ร้านของเรา',
        is_approved: false
      });
      
      console.log('✅ Shop created:', shop.id);
    }

    // Get artworks
    const artworks = await db.artworks.findByShopId(shop.id);

    // Get orders
    const orders = await db.orders.findByArtistId(req.user.userId);
    
    // Format orders
    const formattedOrders = orders.map(order => ({
      ...order,
      customer_name: order.customer.name,
      customer_email: order.customer.email
    }));

    res.json({
      shop,
      artworks,
      orders: formattedOrders
    });
  } catch (error) {
    console.error('Artist dashboard error:', error);
    res.status(500).json({ message: 'เกิดข้อผิดพลาด' });
  }
});

// Update shop info
router.put('/shop', authenticateToken, requireRole(['artist']), async (req, res) => {
  try {
    const { name, bio } = req.body;

    // Get shop first to get the ID
    const shop = await db.shops.findByUserId(req.user.userId);
    if (!shop) {
      return res.status(404).json({ message: 'ไม่พบร้าน' });
    }

    await db.shops.update(shop.id, { name, bio });

    res.json({ message: 'อัปเดตข้อมูลร้านสำเร็จ' });
  } catch (error) {
    console.error('Update shop error:', error);
    res.status(500).json({ message: 'เกิดข้อผิดพลาด' });
  }
});

// Add artwork
router.post('/artwork', authenticateToken, requireRole(['artist']), upload.single('image'), async (req, res) => {
  try {
    const { title, description, price } = req.body;
    const image_url = req.file ? `/uploads/${req.file.filename}` : null;

    // Get shop ID
    const shop = await db.shops.findByUserId(req.user.userId);
    if (!shop) {
      return res.status(404).json({ message: 'ไม่พบร้าน' });
    }

    await db.artworks.create({
      shop_id: shop.id,
      title,
      description,
      price,
      image_url
    });

    res.json({ message: 'เพิ่มผลงานสำเร็จ' });
  } catch (error) {
    console.error('Add artwork error:', error);
    res.status(500).json({ message: 'เกิดข้อผิดพลาด' });
  }
});

// Update order status
router.put('/order/:id/status', authenticateToken, requireRole(['artist']), async (req, res) => {
  try {
    const { status } = req.body;
    const orderId = req.params.id;

    await db.orders.updateStatus(orderId, status, req.user.userId);

    res.json({ message: 'อัปเดตสถานะคำสั่งซื้อสำเร็จ' });
  } catch (error) {
    console.error('Update order status error:', error);
    res.status(500).json({ message: 'เกิดข้อผิดพลาด' });
  }
});

module.exports = router;