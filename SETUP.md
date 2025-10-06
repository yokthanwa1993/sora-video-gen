# Sora AI Video Generator with Supabase Auth

## 🚀 Setup Instructions

### 1. สร้าง Supabase Project

1. ไปที่ [supabase.com](https://supabase.com) และสร้างบัญชี
2. สร้าง project ใหม่
3. รอจนกว่า project จะพร้อม (ประมาณ 2 นาที)

### 2. ตั้งค่า Google OAuth

1. ไปที่ **Authentication > Providers** ใน Supabase Dashboard
2. เปิดใช้งาน **Google** provider
3. ทำตาม Google Cloud Console setup:
   - ไปที่ [Google Cloud Console](https://console.cloud.google.com/)
   - สร้าง OAuth 2.0 Client ID
   - เพิ่ม Authorized redirect URI: `https://<YOUR_PROJECT_REF>.supabase.co/auth/v1/callback`
   - คัดลอก Client ID และ Client Secret มาใส่ใน Supabase
4. บันทึกการตั้งค่า

### 3. คัดลอก API Keys

1. ไปที่ **Settings > API** ใน Supabase Dashboard
2. คัดลอก:
   - **Project URL** (เช่น `https://xxxxx.supabase.co`)
   - **anon public** key

### 4. ตั้งค่า Environment Variables

แก้ไขไฟล์ `.env`:

```env
MUAPIAPP_API_KEY=your_muapi_key
PORT=8787

# Supabase
VITE_SUPABASE_URL=https://xxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key
```

### 5. Run Database Migrations

เชื่อมต่อกับ Supabase project:

```bash
supabase link --project-ref your-project-ref
```

Push migrations ไปที่ Supabase:

```bash
supabase db push
```

หรือ copy SQL ใน `supabase/migrations/20250106_create_videos_table.sql` ไปรันใน SQL Editor ของ Supabase Dashboard

### 6. รันโปรเจค

```bash
# ติดตั้ง dependencies (ถ้ายังไม่ได้ทำ)
npm install

# รัน backend server
node server/index.js

# รัน frontend (terminal อื่น)
npm run dev
```

### 7. ทดสอบ

1. เปิดเบราว์เซอร์ไปที่ `http://localhost:5174`
2. คลิก "เข้าสู่ระบบด้วย Google"
3. Login ด้วย Google account
4. ทดสอบสร้างวีดีโอ

## 📁 โครงสร้างโปรเจค

```
SORA/
├── src/
│   ├── lib/
│   │   └── supabase.js          # Supabase client
│   ├── AuthProvider.jsx         # Auth context
│   ├── LoginPage.jsx           # หน้า Login
│   ├── LoginPage.css           # สไตล์หน้า Login
│   └── App.jsx                 # หน้าหลัก (ต้อง login ก่อน)
├── supabase/
│   └── migrations/
│       └── 20250106_create_videos_table.sql
├── server/
│   └── index.js                # Backend API
└── .env                        # Environment variables
```

## 🔐 Security Features

- ✅ Google OAuth authentication
- ✅ Row Level Security (RLS) - users can only see their own videos
- ✅ Session management with auto-refresh
- ✅ Protected routes (must login to create videos)

## 🎥 Features

- Login ด้วย Google
- สร้างวีดีโอจาก Text prompt
- แสดง Avatar และชื่อผู้ใช้
- บันทึกประวัติวีดีโอใน Supabase
- แสดงเฉพาะวีดีโอของตัวเอง

## 🐛 Troubleshooting

**"Failed to fetch"**
- ตรวจสอบว่า backend server รันอยู่ที่ port 8787
- ตรวจสอบ CORS settings

**"Invalid API key"**
- ตรวจสอบว่า VITE_SUPABASE_URL และ VITE_SUPABASE_ANON_KEY ถูกต้อง
- Restart dev server หลังแก้ .env

**Google login ไม่ทำงาน**
- ตรวจสอบว่า Google OAuth ถูกเปิดใช้งานใน Supabase
- ตรวจสอบ redirect URI ใน Google Cloud Console
