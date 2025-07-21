const express = require('express');
const QRCode = require('qrcode');
const generatePayload = require('promptpay-qr');
const fs = require('fs').promises;
const path = require('path');
const nodemailer = require('nodemailer');
const { google } = require('googleapis');
const { db } = require('../models/db');
const { authenticateToken } = require('../middleware/auth');
const router = express.Router();

// Gmail API setup
const OAuth2 = google.auth.OAuth2;
const oauth2Client = new OAuth2(
  process.env.GMAIL_CLIENT_ID,
  process.env.GMAIL_CLIENT_SECRET,
  "https://developers.google.com/oauthplayground"
);

oauth2Client.setCredentials({
  refresh_token: process.env.GMAIL_REFRESH_TOKEN
});

// Create order
router.post('/create', authenticateToken, async (req, res) => {
  try {
    const { artist_id, artwork_id, detail, price } = req.body;

    // Create order
    const newOrder = await db.orders.create({
      customer_id: req.user.userId,
      artist_id,
      artwork_id,
      detail,
      price
    });

    const orderId = newOrder.id;

    // Generate PromptPay QR Code
    const payload = generatePayload(process.env.PROMPTPAY_ID, { amount: parseFloat(price) });
    const qrCodePath = `uploads/qr-${orderId}.png`;
    
    await QRCode.toFile(qrCodePath, payload);

    // Update order with QR code path
    await db.orders.updateQRPath(orderId, qrCodePath);

    // Send email notification to artist
    await sendOrderNotification(artist_id, orderId, 'new_order');

    res.json({ 
      message: 'สร้างคำสั่งซื้อสำเร็จ',
      orderId,
      qrCodePath: `/${qrCodePath}`
    });
  } catch (error) {
    console.error('Create order error:', error);
    res.status(500).json({ message: 'เกิดข้อผิดพลาด' });
  }
});

// Get user orders
router.get('/my-orders', authenticateToken, async (req, res) => {
  try {
    const orders = await db.orders.findByCustomerId(req.user.userId);
    
    // Format orders to match frontend expectations
    const formattedOrders = orders.map(order => ({
      ...order,
      artist_name: order.artist.name,
      artwork_title: order.artwork?.title,
      artwork_image: order.artwork?.image_url
    }));

    res.json(formattedOrders);
  } catch (error) {
    console.error('Get orders error:', error);
    res.status(500).json({ message: 'เกิดข้อผิดพลาด' });
  }
});

// Update order status (for payment confirmation)
router.put('/:id/status', authenticateToken, async (req, res) => {
  try {
    const { status } = req.body;
    const orderId = req.params.id;

    const updatedOrder = await db.orders.updateStatus(orderId, status, req.user.userId);

    // Send notification based on status
    if (status === 'paid') {
      await sendOrderNotification(updatedOrder.artist_id, orderId, 'payment_confirmed');
    }

    res.json({ message: 'อัปเดตสถานะสำเร็จ' });
  } catch (error) {
    console.error('Update order status error:', error);
    res.status(500).json({ message: 'เกิดข้อผิดพลาด' });
  }
});

// Send email notification
async function sendOrderNotification(userId, orderId, type) {
  try {
    const accessToken = await oauth2Client.getAccessToken();
    
    const transporter = nodemailer.createTransporter({
      service: 'gmail',
      auth: {
        type: 'OAuth2',
        user: process.env.GMAIL_USER,
        clientId: process.env.GMAIL_CLIENT_ID,
        clientSecret: process.env.GMAIL_CLIENT_SECRET,
        refreshToken: process.env.GMAIL_REFRESH_TOKEN,
        accessToken: accessToken.token
      }
    });

    // Get user email
    const user = await db.users.findById(userId);
    if (!user) return;

    let subject, text;

    switch (type) {
      case 'new_order':
        subject = 'SkyDraw: คุณมีคำสั่งซื้อใหม่!';
        text = `สวัสดี ${user.name},\n\nคุณมีคำสั่งซื้อใหม่ในร้านของคุณ\nหมายเลขคำสั่งซื้อ: ${orderId}\n\nกรุณาเข้าสู่ระบบเพื่อดูรายละเอียด`;
        break;
      case 'payment_confirmed':
        subject = 'SkyDraw: ได้รับการชำระเงินแล้ว';
        text = `สวัสดี ${user.name},\n\nลูกค้าได้ชำระเงินสำหรับคำสั่งซื้อ ${orderId} แล้ว\nกรุณาเริ่มทำงานและอัปเดตสถานะ`;
        break;
    }

    await transporter.sendMail({
      from: process.env.GMAIL_USER,
      to: user.email,
      subject,
      text
    });
  } catch (error) {
    console.error('Email notification error:', error);
  }
}

module.exports = router;