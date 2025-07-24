# SkyDraw Marketplace 🎨

ตลาดกลางสำหรับนักวาดภาพและลูกค้า - เว็บไซต์ที่เชื่อมต่อศิลปินกับลูกค้าที่ต้องการบริการวาดภาพตามสั่ง

## ฟีเจอร์หลัก

### 🎯 ระบบบัญชี 3 ประเภท
- **ลูกค้า**: ค้นหาร้าน, สั่งวาดภาพ, แชท, ติดตามสถานะงาน
- **ศิลปิน**: จัดการร้าน, อัปโหลดผลงาน, รับคำสั่งซื้อ, อัปเดตสถานะงาน
- **แอดมิน**: อนุมัติร้าน, จัดการผู้ใช้, ดูสถิติ

### 💳 ระบบชำระเงิน
- สร้าง PromptPay QR Code อัตโนมัติ
- ระบบยืนยันการชำระเงิน
- ติดตามสถานะการชำระเงิน

### 📧 ระบบแจ้งเตือน
- ส่งอีเมลผ่าน Gmail API
- แจ้งเตือนคำสั่งซื้อใหม่
- แจ้งเตือนการชำระเงิน

### 💬 ระบบแชท
- แชทข้อความระหว่างลูกค้าและศิลปิน
- ประวัติการสนทนา
- แชทแบบเรียลไทม์

## การติดตั้งและใช้งาน

### 1. ติดตั้ง Dependencies
```bash
npm install
```

### 2. ตั้งค่าฐานข้อมูล Supabase
1. สร้างโปรเจค Supabase ใหม่
2. รันคำสั่ง SQL ใน `supabase-schema.sql`
3. คัดลอก URL และ Keys มาใส่ใน `.env`

### 3. ตั้งค่าไฟล์ Environment
สร้างไฟล์ `.env` และใส่ค่าต่อไปนี้:
```env
# Supabase Configuration
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_KEY=your_service_key

# JWT Secret
JWT_SECRET=your_jwt_secret_key

# Gmail API (สำหรับส่งอีเมล)
GMAIL_CLIENT_ID=your_gmail_client_id
GMAIL_CLIENT_SECRET=your_gmail_client_secret
GMAIL_REFRESH_TOKEN=your_refresh_token
GMAIL_USER=your_gmail_address

# PromptPay (สำหรับ QR Code)
PROMPTPAY_ID=your_promptpay_id

# Port
PORT=3001
```

### 4. รันเซิร์ฟเวอร์
```bash
npm start
```

หรือสำหรับ Development:
```bash
npm run dev
```

### 5. เข้าใช้งาน
เปิดเบราว์เซอร์และไปที่ `http://localhost:3001`

## การใช้งาน

### สำหรับลูกค้า
1. สมัครสมาชิกเป็น "ลูกค้า"
2. เข้าสู่ระบบ
3. ค้นหาร้านศิลปิน
4. ดูผลงานและสั่งวาดภาพ
5. แชทกับศิลปิน
6. ติดตามสถานะงาน

### สำหรับศิลปิน
1. สมัครสมาชิกเป็น "ศิลปิน"
2. รอการอนุมัติจากแอดมิน
3. จัดการข้อมูลร้าน
4. อัปโหลดผลงาน
5. รับและจัดการคำสั่งซื้อ
6. แชทกับลูกค้า

### สำหรับแอดมิน
1. เข้าสู่ระบบด้วยบัญชีแอดมิน
2. อนุมัติร้านศิลปิน
3. ดูสถิติและจัดการระบบ

## บัญชีทดสอบ

### แอดมิน
- อีเมล: admin@skydraw.com
- รหัสผ่าน: admin123

## เทคโนโลยีที่ใช้

- **Backend**: Node.js, Express.js
- **Database**: Supabase (PostgreSQL)
- **Frontend**: HTML, CSS, JavaScript (Vanilla)
- **Authentication**: JWT
- **File Upload**: Multer
- **Payment**: PromptPay QR Code
- **Email**: Gmail API
- **Real-time**: WebSocket (สำหรับแชท)
