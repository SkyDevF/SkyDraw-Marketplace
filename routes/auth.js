const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { db } = require('../models/db');
const router = express.Router();

// Register
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, role = 'customer' } = req.body;

    // Validate input
    if (!name || name.trim().length < 2) {
      return res.status(400).json({ message: 'กรุณากรอกชื่อที่ถูกต้อง (อย่างน้อย 2 ตัวอักษร)' });
    }

    if (!email || !email.includes('@')) {
      return res.status(400).json({ message: 'กรุณากรอกอีเมลที่ถูกต้อง' });
    }

    if (!password || password.length < 6) {
      return res.status(400).json({ message: 'รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร' });
    }

    if (!['customer', 'artist'].includes(role)) {
      return res.status(400).json({ message: 'ประเภทบัญชีไม่ถูกต้อง' });
    }

    // Check if user exists
    const existingUser = await db.users.findByEmail(email.toLowerCase().trim());
    if (existingUser) {
      return res.status(400).json({ message: 'อีเมลนี้ถูกใช้งานแล้ว' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create user
    const newUser = await db.users.create({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      password: hashedPassword,
      role
    });

    // If artist, create shop (this should be handled by the database trigger, but let's ensure it)
    if (role === 'artist') {
      try {
        const existingShop = await db.shops.findByUserId(newUser.id);
        if (!existingShop) {
          await db.shops.create({
            user_id: newUser.id,
            name: `${name.trim()}'s Art Shop`,
            bio: 'ยินดีต้อนรับสู่ร้านของเรา',
            is_approved: false
          });
        }
      } catch (shopError) {
        console.error('Shop creation error:', shopError);
        // Don't fail registration if shop creation fails
      }
    }

    console.log('✅ User registered successfully:', { id: newUser.id, email: newUser.email, role: newUser.role });

    res.status(201).json({ 
      message: role === 'artist' ? 'สมัครสมาชิกสำเร็จ ร้านของคุณรออนุมัติจากแอดมิน' : 'สมัครสมาชิกสำเร็จ',
      userId: newUser.id 
    });
  } catch (error) {
    console.error('❌ Register error:', error);
    
    // Handle specific database errors
    if (error.code === '23505') { // Unique constraint violation
      return res.status(400).json({ message: 'อีเมลนี้ถูกใช้งานแล้ว' });
    }
    
    res.status(500).json({ message: 'เกิดข้อผิดพลาดในการสมัครสมาชิก กรุณาลองใหม่อีกครั้ง' });
  }
});

// Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    console.log('🔐 Login attempt for:', email);

    // Find user
    const user = await db.users.findByEmail(email);
    console.log('👤 User found:', user ? 'Yes' : 'No');
    
    if (!user) {
      console.log('❌ User not found for email:', email);
      return res.status(401).json({ message: 'อีเมลหรือรหัสผ่านไม่ถูกต้อง' });
    }

    console.log('🔍 User details:', { id: user.id, email: user.email, role: user.role });

    // Check password
    const isValidPassword = await bcrypt.compare(password, user.password);
    console.log('🔑 Password valid:', isValidPassword);
    
    if (!isValidPassword) {
      console.log('❌ Invalid password for user:', email);
      return res.status(401).json({ message: 'อีเมลหรือรหัสผ่านไม่ถูกต้อง' });
    }

    // Generate JWT
    const token = jwt.sign(
      { userId: user.id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    console.log('✅ Login successful for:', email, 'Role:', user.role);

    res.json({
      message: 'เข้าสู่ระบบสำเร็จ',
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatar: user.avatar
      }
    });
  } catch (error) {
    console.error('❌ Login error:', error);
    res.status(500).json({ message: 'เกิดข้อผิดพลาดในการเข้าสู่ระบบ' });
  }
});

module.exports = router;