import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://fvnbfaljmyzbjehvbjxm.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ2bmJmYWxqbXl6YmplaHZianhtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk3MzkyNTIsImV4cCI6MjA3NTMxNTI1Mn0.E_OG0TDrWsn9OxzE1PNsBQa9YytSOzXmQB40KP_jEvk'

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function testDatabase() {
  // ดึงข้อมูล user ปัจจุบัน
  const { data: { user }, error: userError } = await supabase.auth.getUser()
  
  if (userError || !user) {
    console.error('Not logged in:', userError)
    return
  }
  
  console.log('User ID:', user.id)
  
  // ดึงวีดีโอทั้งหมด
  const { data: videos, error: videosError } = await supabase
    .from('videos')
    .select('*')
    .eq('user_id', user.id)
  
  if (videosError) {
    console.error('Error loading videos:', videosError)
  } else {
    console.log('Videos:', videos)
  }
  
  // ลองเพิ่มวีดีโอทดสอบ
  const { data: newVideo, error: insertError } = await supabase
    .from('videos')
    .insert([{
      user_id: user.id,
      prompt: 'ทดสอบวีดีโอ: ดอกไม้ในสวน',
      aspect_ratio: '16:9',
      video_url: 'https://example.com/test-video.mp4'
    }])
    .select()
    .single()
  
  if (insertError) {
    console.error('Error inserting video:', insertError)
  } else {
    console.log('New video:', newVideo)
  }
}

testDatabase()
