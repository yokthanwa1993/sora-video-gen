# 🔐 วิธีตั้งค่า Google OAuth สำหรับ Supabase

## ✅ Supabase Project พร้อมใช้งานแล้ว!

- **Project Name:** sora-video-gen
- **Project URL:** https://fvnbfaljmyzbjehvbjxm.supabase.co
- **Dashboard:** https://supabase.com/dashboard/project/fvnbfaljmyzbjehvbjxm

## 📝 ขั้นตอนการตั้งค่า Google OAuth

### 1. สร้าง Google OAuth Client

1. ไปที่ [Google Cloud Console](https://console.cloud.google.com/)
2. สร้าง Project ใหม่ หรือเลือก Project ที่มีอยู่
3. ไปที่ **APIs & Services** → **Credentials**
4. คลิก **Create Credentials** → **OAuth client ID**
5. เลือก Application type: **Web application**
6. ใส่ชื่อ: `Sora Video Generator`

### 2. ตั้งค่า Authorized redirect URIs

เพิ่ม URL นี้ใน **Authorized redirect URIs**:

```
https://fvnbfaljmyzbjehvbjxm.supabase.co/auth/v1/callback
```

### 3. คัดลอก Client ID และ Client Secret

หลังจากสร้างเสร็จ จะได้:
- **Client ID**: `your-client-id.apps.googleusercontent.com`
- **Client Secret**: `GOCSPX-xxxxx`

### 4. ตั้งค่าใน Supabase

1. ไปที่: https://supabase.com/dashboard/project/fvnbfaljmyzbjehvbjxm/auth/providers
2. เลื่อนหา **Google** provider
3. เปิดใช้งาน (Toggle ON)
4. ใส่ **Client ID** และ **Client Secret** ที่ได้จากขั้นตอนที่ 3
5. คลิก **Save**

---

## 🚀 ทดสอบระบบ

รันคำสั่งนี้เพื่อรีสตาร์ทเซิร์ฟเวอร์:

\`\`\`bash
npm run dev
\`\`\`

แล้วเปิด http://localhost:5174 - คุณจะเห็นหน้า Login ด้วย Google!

---

## 🔑 Environment Variables ที่ใช้

ไฟล์ `.env` มี keys ดังนี้:

\`\`\`env
VITE_SUPABASE_URL=https://fvnbfaljmyzbjehvbjxm.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGc...
\`\`\`

---

## 📊 Database Schema

Table `videos` ถูกสร้างแล้วด้วย columns:
- `id` (uuid, primary key)
- `user_id` (uuid, foreign key to auth.users)
- `prompt` (text)
- `video_url` (text)
- `request_id` (text)
- `resolution` (text)
- `aspect_ratio` (text)
- `duration` (integer)
- `created_at` (timestamp)

---

## 🎯 สิ่งที่ทำได้แล้ว

✅ สร้าง Supabase project ผ่าน CLI  
✅ Link project กับ local  
✅ Push database migration  
✅ ตั้งค่า environment variables  
✅ สร้าง Auth components (LoginPage, AuthProvider)  
✅ เพิ่ม Auth guard ให้ต้อง login ก่อนใช้งาน  

## ⏳ สิ่งที่ต้องทำต่อ (ทำเอง)

⬜ ตั้งค่า Google OAuth ใน Google Cloud Console  
⬜ ใส่ Client ID และ Secret ใน Supabase Dashboard  
⬜ ทดสอบ Login

---

## 🆘 หากมีปัญหา

ตรวจสอบ console log ใน browser (F12) และดู error messages
