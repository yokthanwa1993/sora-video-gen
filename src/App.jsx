import { useState, useEffect } from 'react'
import { useAuth } from './AuthProvider'
import { LoginPage } from './LoginPage'
import { supabase } from './lib/supabase'
import './App.css'

function App() {
  const { user, loading: authLoading, signOut } = useAuth()
  // ค่าตั้งต้นเว้นว่าง แล้วใช้ placeholder เป็นตัวอย่างแทน
  const [prompt, setPrompt] = useState('')
  const [mode, setMode] = useState('t2v')
  const [aspectRatio, setAspectRatio] = useState('16:9')
  const [imagesText, setImagesText] = useState('https://d3adwkbyhxyrtq.cloudfront.net/webassets/videomodels/openai-sora-2-i2v.jpg')
  
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [videoUrl, setVideoUrl] = useState('')
  const [showModal, setShowModal] = useState(false)
  
  const [videos, setVideos] = useState([]) // รายการวีดีโอทั้งหมด (รวมกำลังสร้างและเสร็จแล้ว)

  // ดึงประวัติวีดีโอจาก Supabase เมื่อ user login
  useEffect(() => {
    if (user) {
      loadVideos()
    }
  }, [user])

  // โหลดข้อมูลใหม่จาก database ทุก 10 วินาที ถ้ามีวีดีโอที่กำลังสร้างอยู่
  useEffect(() => {
    if (!user) return

    const hasLoadingVideos = videos.some(v => v.status === 'loading')
    if (!hasLoadingVideos) return

    console.log('🔄 Has loading videos, will refresh data every 10 seconds...')

    const refreshInterval = setInterval(() => {
      console.log('🔄 Refreshing videos from database...')
      loadVideos()
    }, 10000) // รีเฟรชทุก 10 วินาที

    return () => clearInterval(refreshInterval)
  }, [videos, user])

  // Fallback โพลล์ MUAPI ผ่าน backend สำหรับรายการที่มี request_id แต่ยังไม่มี video_url
  useEffect(() => {
    if (!user) return

    const targets = videos.filter(v => v.status === 'loading' && v.request_id && !v.url)
    if (targets.length === 0) return

    let cancelled = false

    const tick = async () => {
      for (const v of targets) {
        try {
          const res = await fetch(`/api/check-status/${v.request_id}`)
          const json = await res.json().catch(() => ({}))
          if (json?.status === 'completed' && json?.url) {
            // อัพเดทฐานข้อมูลให้เป็น completed ถ้า column รองรับ
            try {
              await supabase
                .from('videos')
                .update({ video_url: json.url, status: 'completed' })
                .eq('id', v.id)
            } catch (_) {
              await supabase
                .from('videos')
                .update({ video_url: json.url })
                .eq('id', v.id)
            }

            if (!cancelled) {
              setVideos(prev => prev.map(x => x.id === v.id ? { ...x, url: json.url, status: 'completed' } : x))
            }
          }
        } catch (e) {
          // ignore once and try again on next tick
        }
      }
    }

    // โพลล์ทันทีรอบแรก แล้วทุก ๆ 6 วินาที
    tick()
    const interval = setInterval(tick, 6000)
    return () => { cancelled = true; clearInterval(interval) }
  }, [videos, user])

  async function loadVideos() {
    try {
      const { data, error } = await supabase
        .from('videos')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error loading videos:', error)
        return
      }
      
      // แปลงข้อมูลจาก database ให้ตรงกับ format ของ state
      const formattedVideos = data.map(v => {
        // ถ้ามี video_url แล้วให้ถือว่า "เสร็จแล้ว" แม้ status จะยังเป็น 'loading'
        // แต่ยังคงแสดง 'failed' หากสถานะเป็นล้มเหลว
        const derivedStatus = v.status === 'failed'
          ? 'failed'
          : (v.video_url ? 'completed' : (v.status || 'loading'))

        return {
          id: v.id,
          prompt: v.prompt,
          status: derivedStatus,
          url: v.video_url,
          aspectRatio: v.aspect_ratio,
          request_id: v.request_id,
          timestamp: new Date(v.created_at).getTime(),
        }
      })
      
      setVideos(formattedVideos)
    } catch (err) {
      console.error('Error loading videos:', err)
    }
  }

  // Show loading while checking auth
  if (authLoading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div>Loading...</div>
      </div>
    )
  }

  // Show login page if not authenticated
  if (!user) {
    return <LoginPage />
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!prompt.trim() || loading) return
    
    const currentPrompt = prompt.trim()
    
    setLoading(true)
    setError('')
    setVideoUrl('')
    
    // บันทึกวีดีโอลง Supabase ทันทีด้วยสถานะ 'loading'
    let videoRecord
    try {
      const insertData = {
        user_id: user.id,
        prompt: currentPrompt,
        aspect_ratio: aspectRatio,
        video_url: '', // ใช้ empty string แทน null เพื่อหลีกเลี่ยง NOT NULL constraint
      }
      
      // พยายามเพิ่ม status ถ้า column มีอยู่
      try {
        insertData.status = 'loading'
        const { data, error } = await supabase
          .from('videos')
          .insert([insertData])
          .select()
          .single()
        
        if (error) throw error
        videoRecord = data
      } catch (statusError) {
        // ถ้า error อาจเป็นเพราะไม่มี status column ลองใหม่โดยไม่ใส่ status
        console.log('Retrying without status column:', statusError)
        delete insertData.status
        const { data, error } = await supabase
          .from('videos')
          .insert([insertData])
          .select()
          .single()
        
        if (error) throw error
        videoRecord = data
      }
      
      // เพิ่มการ์ดแสดงสถานะกำลังสร้างทันที (ยังไม่มี request_id)
      setVideos(prev => [{
        id: videoRecord.id,
        prompt: currentPrompt,
        status: 'loading',
        aspectRatio,
        request_id: null,
        timestamp: new Date(videoRecord.created_at).getTime(),
      }, ...prev])
      
    } catch (err) {
      console.error('Error saving to database:', err)
      setError('ไม่สามารถบันทึกข้อมูลได้: ' + err.message)
      setLoading(false)
      return
    }
    
    try {
      const images_list = mode === 'i2v'
        ? imagesText.split(/\n|,/).map((s) => s.trim()).filter(Boolean)
        : []

      console.log('📤 Sending generation request...')
      
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: currentPrompt,
          resolution: '720p',
          aspect_ratio: aspectRatio,
          images_list,
          mode,
          videoId: videoRecord.id, // ส่ง videoId ไปให้ Backend
        }),
      })
      
      const data = await res.json()
      
      if (!res.ok) {
        // อัพเดทสถานะเป็น failed ใน database (ถ้า column มีอยู่)
        try {
          await supabase
            .from('videos')
            .update({ status: 'failed' })
            .eq('id', videoRecord.id)
        } catch (updateError) {
          console.log('Could not update status (column may not exist):', updateError)
        }
        
        // อัพเดทใน state
        setVideos(prev => prev.map(v => 
          v.id === videoRecord.id ? { ...v, status: 'failed', error: data?.error || 'Generation failed' } : v
        ))
        throw new Error(data?.error || 'Generation failed')
      }
      
      console.log('✅ Got request_id:', data.requestId)
      
      // บันทึก request_id ลง database ทันที (ระบบจะโพลล์ต่ออัตโนมัติ)
      try {
        await supabase
          .from('videos')
          .update({ request_id: data.requestId })
          .eq('id', videoRecord.id)
      } catch (updateError) {
        console.log('Could not update request_id:', updateError)
      }
      
      // อัพเดท state ให้มี request_id เพื่อให้โพลล์ได้
      setVideos(prev => prev.map(v =>
        v.id === videoRecord.id ? { ...v, request_id: data.requestId } : v
      ))
      
    } catch (err) {
      console.error('❌ Error:', err)
      setError(err.message || String(err))
    } finally {
      setLoading(false)
    }
  }

  function openModal(url) {
    setVideoUrl(url)
    setShowModal(true)
  }

  function closeModal() {
    setShowModal(false)
  }

  async function deleteVideo(videoId) {
    if (!confirm('ต้องการลบวีดีโอนี้ใช่หรือไม่?')) return
    
    try {
      const { error } = await supabase
        .from('videos')
        .delete()
        .eq('id', videoId)
      
      if (error) throw error
      
      setVideos(prev => prev.filter(v => v.id !== videoId))
    } catch (err) {
      console.error('Error deleting video:', err)
      alert('ไม่สามารถลบวีดีโอได้')
    }
  }

  // ตรวจสอบสถานะวิดีโอรายตัวทันทีจาก MUAPI ผ่าน backend
  async function checkNow(video) {
    if (!video?.request_id) return
    try {
      const res = await fetch(`/api/check-status/${video.request_id}`)
      const json = await res.json().catch(() => ({}))
      if (json?.status === 'completed' && json?.url) {
        try {
          await supabase
            .from('videos')
            .update({ video_url: json.url, status: 'completed' })
            .eq('id', video.id)
        } catch (_) {
          await supabase
            .from('videos')
            .update({ video_url: json.url })
            .eq('id', video.id)
        }
        setVideos(prev => prev.map(v => v.id === video.id ? { ...v, url: json.url, status: 'completed' } : v))
      }
    } catch (e) {
      console.warn('Manual check failed:', e?.message || e)
    }
  }

  // deleteAllVideos ถูกยกเลิกการใช้งาน

  return (
    <div className="page">
      <div className="hero">
        <div className="brand">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <div>
              <span className="badge">Sora 2</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              {user?.user_metadata?.avatar_url && (
                <img 
                  src={user.user_metadata.avatar_url} 
                  alt="Avatar" 
                  style={{ width: '32px', height: '32px', borderRadius: '50%' }}
                />
              )}
              <span style={{ fontSize: '14px', color: '#666' }}>
                {user?.user_metadata?.full_name || user?.email}
              </span>
              <button onClick={signOut} className="link-logout" title="ออกจากระบบ">ออกจากระบบ</button>
            </div>
          </div>
          <span className="badge">Sora 2</span>
          <h1>AI Video Generator</h1>
          <p className="subtitle">พิมพ์ Prompt แล้วให้ Sora สร้างวีดีโอให้คุณแบบทันสมัย</p>
        </div>

        <form className="panel" onSubmit={handleSubmit}>
          <div className="prompt">
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="ศิลปินกำลังเต้นกลางเมืองยามค่ำ ทันสมัย สดใส กล้องแพนช้าๆ โทนภาพนีออน"
              rows={3}
              disabled={loading}
            />
          </div>

          <div className="options">
            <div className="field">
              <label>โหมด</label>
              <select value={mode} onChange={(e) => setMode(e.target.value)} disabled={loading}>
                <option value="t2v">Text → Video</option>
                <option value="i2v">Image → Video</option>
              </select>
            </div>
            <div className="field">
              <label>ความละเอียด</label>
              <span className="chip">720p</span>
              <span className="hint">คงที่</span>
            </div>
            <div className="field">
              <label>อัตราส่วน</label>
              <select value={aspectRatio} onChange={(e) => setAspectRatio(e.target.value)} disabled={loading}>
                <option value="16:9">16:9</option>
                <option value="9:16">9:16</option>
              </select>
            </div>
          </div>

          {mode === 'i2v' && (
            <div className="field" style={{ marginTop: 8 }}>
              <label>รูปภาพ (URLs)</label>
              <textarea
                rows={2}
                placeholder="แปะลิงก์รูป 1 บรรทัดต่อ 1 รูป หรือคั่นด้วย ,"
                value={imagesText}
                onChange={(e) => setImagesText(e.target.value)}
                disabled={loading}
                style={{ width: '100%', background: 'transparent', border: 'none', color: 'inherit' }}
              />
            </div>
          )}

          {error && <div className="error">{error}</div>}

          <div className="panel-actions">
            <button className="primary" type="submit" disabled={!prompt.trim() || loading}>
              {loading ? 'กำลังสร้าง...' : 'สร้างวีดีโอ'}
            </button>
          </div>
        </form>
      </div>

      <div className="results">
        {videos.length === 0 ? (
          <div className="empty">ยังไม่มีผลงาน ลองพิมพ์ Prompt แล้วกด "สร้างวีดีโอ"</div>
        ) : (
          <>
            {/* ปุ่มลบทั้งหมดถูกนำออกตามคำขอ */}
            {videos.map((v) => (
              <div className="card" key={v.id}>
                {/* Status & Metadata - แสดงด้านบน */}
                <div className="meta">
                  <div className="meta-left">
                    {v.status === 'loading' && <div className="status running">กำลังสร้าง...</div>}
                    {v.status === 'completed' && <div className="status succeeded">สำเร็จ</div>}
                    {v.status === 'failed' && <div className="status failed">ล้มเหลว</div>}
                    <div className="details">
                      <span>10s</span>
                      <span>•</span>
                      <span>720p</span>
                      <span>•</span>
                      <span>{v.aspectRatio}</span>
                    </div>
                  </div>
                  <button 
                    onClick={() => deleteVideo(v.id)}
                    title="ลบวีดีโอ"
                    className="delete-btn"
                  >
                    ❌
                  </button>
                </div>

                {/* Video/Thumbnail Section - แสดงตรงกลาง */}
                {v.status === 'loading' && (
                  <div className="video skeleton" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#666', position: 'relative' }}>
                    ⏳
                    {v.request_id && (
                      <button
                        onClick={() => checkNow(v)}
                        style={{ position: 'absolute', right: 10, bottom: 10, fontSize: 12, padding: '4px 8px', borderRadius: 6, border: '1px solid #888', background: 'transparent', color: 'inherit', cursor: 'pointer', opacity: 0.8 }}
                        title="ตรวจสอบสถานะตอนนี้"
                      >รีเฟรช</button>
                    )}
                  </div>
                )}
                
                {v.status === 'completed' && v.url && (
                  <video
                    className="video"
                    src={v.url}
                    controls
                    playsInline
                    onClick={() => openModal(v.url)}
                    style={{ cursor: 'pointer' }}
                  />
                )}
                
                {v.status === 'failed' && (
                  <div className="video" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#2a1a1a', color: '#ff9c9c', minHeight: '200px' }}>
                    ⚠️ {v.error || 'เกิดข้อผิดพลาด'}
                  </div>
                )}

                {/* Prompt Text - แสดงด้านล่าง */}
                <div className="prompt-text" title={v.prompt}>{v.prompt}</div>
              </div>
            ))}
          </>
        )}
      </div>

      {/* footer removed as requested */}

      {showModal && (
        <div className="modal" role="dialog" aria-modal="true">
          <div className="backdrop" onClick={closeModal} />
          <div className="modal-body">
            <button className="modal-close" onClick={closeModal}>×</button>
            {videoUrl ? (
              <video src={videoUrl} controls autoPlay style={{ width: '100%', borderRadius: 12 }} />
            ) : (
              <div style={{ padding: 20 }}>No video</div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default App
