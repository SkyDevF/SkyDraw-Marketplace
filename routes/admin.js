const express = require('express');
const { db } = require('../models/db');
const { authenticateToken, requireRole } = require('../middleware/auth');
const router = express.Router();

// Get admin dashboard
router.get('/dashboard', authenticateToken, requireRole(['admin']), async (req, res) => {
  try {
    // Get pending shops
    const pendingShops = await db.shops.findPending();
    
    // Format pending shops
    const formattedPendingShops = pendingShops.map(shop => ({
      ...shop,
      owner_name: shop.users.name,
      owner_email: shop.users.email
    }));

    // Get all orders
    const orders = await db.orders.findAll();
    
    // Format orders
    const formattedOrders = orders.map(order => ({
      ...order,
      customer_name: order.customer.name,
      customer_email: order.customer.email,
      artist_name: order.artist.name
    }));

    // Get statistics
    const userStats = await db.stats.getUserStats();
    const orderStats = await db.stats.getOrderStats();

    res.json({
      pendingShops: formattedPendingShops,
      orders: formattedOrders,
      stats: {
        ...userStats,
        ...orderStats
      }
    });
  } catch (error) {
    console.error('Admin dashboard error:', error);
    res.status(500).json({ message: 'เกิดข้อผิดพลาด' });
  }
});

// Approve shop
router.put('/shop/:id/approve', authenticateToken, requireRole(['admin']), async (req, res) => {
  try {
    await db.shops.approve(req.params.id);
    res.json({ message: 'อนุมัติร้านสำเร็จ' });
  } catch (error) {
    console.error('Approve shop error:', error);
    res.status(500).json({ message: 'เกิดข้อผิดพลาด' });
  }
});

// Reject/Delete shop
router.delete('/shop/:id', authenticateToken, requireRole(['admin']), async (req, res) => {
  try {
    await db.shops.delete(req.params.id);
    res.json({ message: 'ลบร้านสำเร็จ' });
  } catch (error) {
    console.error('Delete shop error:', error);
    res.status(500).json({ message: 'เกิดข้อผิดพลาด' });
  }
});

// Delete user
router.delete('/user/:id', authenticateToken, requireRole(['admin']), async (req, res) => {
  try {
    await db.users.delete(req.params.id);
    res.json({ message: 'ลบผู้ใช้สำเร็จ' });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ message: 'เกิดข้อผิดพลาด' });
  }
});

module.exports = router;