# Wedding RSVP Project — Development Prompt

## 🎯 Project Overview
สร้างระบบ Wedding Invitation + RSVP + Admin Dashboard + AI Chatbot
สำหรับงานแต่งงาน กานต์พิชชา & ณัฐพล วันที่ 11/11/2028 จังหวัดน่าน

---

## 🛠 Tech Stack
- **Backend**: Node.js + Express (ES Modules)
- **Database**: MongoDB Atlas (free tier)
- **AI**: Anthropic Claude API (claude-haiku-4-5-20251001)
- **Frontend**: Vanilla HTML/CSS/JS (single file)
- **Deploy**: Cloudflare Pages (frontend) + Railway/Render (backend)

---

## 📁 Project Structure
```
wedding/
├── server.js          ← Express API server (already created)
├── package.json       ← (already created)
├── .env               ← copy from .env.example แล้วใส่ค่าจริง
├── .env.example       ← (already created)
└── public/
    ├── index.html     ← การ์ดเชิญ + RSVP form + Chatbot
    └── admin.html     ← Admin dashboard ดูรายชื่อแขก
```

---

## ✅ server.js สร้างแล้ว — API Routes ที่มี:

| Method | Route | Auth | Description |
|--------|-------|------|-------------|
| POST | `/api/rsvp` | public | บันทึก RSVP + Claude ตอบขอบคุณ |
| GET | `/api/rsvp/summary` | public | สรุปจำนวนแขก |
| GET | `/api/rsvp` | admin | รายชื่อทั้งหมด (ต้องส่ง x-admin-token) |
| DELETE | `/api/rsvp/:id` | admin | ลบรายการ |
| POST | `/api/chat` | public | Claude chatbot ตอบคำถามงานแต่ง |

---

## 📝 TODO — สิ่งที่ต้องสร้างเพิ่ม

### 1. `public/index.html` — Wedding Card + RSVP + Chatbot

**Design spec:**
- พื้นหลังสี `#B8AF9E` (เบจอ่อน)
- สี theme: ครีม `#F5F0E8` / น้ำตาล `#4A2E1A` / โอลีฟ `#4A5530`
- Font: `Great Vibes` (script) + `Sarabun` (Thai) + `Cormorant Garamond` (serif)
- มีซองจดหมายกดเปิดได้ → การ์ดเลื่อนขึ้นมา

**RSVP Form fields:**
```
- name (required)        ← ชื่อ-นามสกุล
- phone                  ← เบอร์โทร
- guests (number, 1-10)  ← จำนวนแขกที่มาด้วย
- session (radio)        ← morning | evening | both
- dietary                ← อาหารพิเศษ (vegetarian, halal, etc.)
- message                ← ข้อความถึงคู่บ่าวสาว
```

**RSVP Flow:**
1. แขกกรอก form แล้วกด "ยืนยันเข้าร่วม"
2. POST → `/api/rsvp`
3. แสดง loading spinner
4. แสดงข้อความขอบคุณจาก Claude (จาก response.message)
5. แสดง summary (จำนวนคนที่ RSVP แล้ว)

**Chatbot:**
- Chat bubble มุมล่างขวา 💬
- กดเปิดได้ slide up
- ส่ง POST `/api/chat` พร้อม history
- แสดง typing indicator ขณะรอ
- system prompt รู้ข้อมูลงานแต่งครบ (อยู่ใน server.js แล้ว)

**API base URL:**
```js
const API_BASE = "http://localhost:3000"; // dev
// เปลี่ยนเป็น production URL ตอน deploy
```

---

### 2. `public/admin.html` — Admin Dashboard

**Features:**
- Login ด้วย Admin Token (เก็บใน sessionStorage)
- แสดง summary cards: ยืนยันแล้ว / งานเช้า / งานเย็น / แขกทั้งหมด
- ตาราง รายชื่อแขก: ชื่อ | เบอร์ | แขก | session | อาหาร | วันที่ลงทะเบียน | ลบ
- Filter: เลือกดู session / search ชื่อ
- Export CSV (client-side จาก data ที่ได้มา)
- Auto-refresh ทุก 30 วินาที

**Auth header:**
```js
headers: { "x-admin-token": adminToken }
```

---

## 🌐 Environment Variables (.env)
```
ANTHROPIC_API_KEY=sk-ant-xxxx
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/wedding
ADMIN_TOKEN=ตั้งเองได้เลย-เช่น-wedding2028admin
PORT=3000
```

---

## 🚀 Run Dev
```bash
npm install
cp .env.example .env
# แก้ไข .env ใส่ค่าจริง
npm run dev
```

---

## 📦 Deploy

**Backend → Railway (แนะนำ):**
```bash
# railway.app → New Project → Deploy from GitHub
# ใส่ Environment Variables ใน Railway dashboard
```

**Frontend → Cloudflare Pages:**
```bash
# เปลี่ยน API_BASE ใน index.html เป็น Railway URL
# อัป public/index.html ขึ้น Cloudflare Pages
```

---

## 💡 Notes สำคัญ
- ใช้ ES Modules (`"type": "module"` ใน package.json) ← ทำแล้ว
- MongoDB collection ชื่อ `rsvp` ใน database `wedding`
- Claude model ใช้ `claude-haiku-4-5-20251001` (เร็ว + ถูก เหมาะกับ chatbot)
- Admin token ส่งผ่าน header `x-admin-token` ไม่ใช่ query string
- CORS เปิดไว้แล้วใน server.js สำหรับ dev ถ้า prod ให้ระบุ origin
