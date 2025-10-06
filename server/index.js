import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import { createClient } from '@supabase/supabase-js'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

dotenv.config()

const app = express()
const port = process.env.PORT || 8787

app.use(cors())
app.use(express.json({ limit: '2mb' }))

// Serve static files from dist folder (production build)
app.use(express.static(path.join(__dirname, '../dist')))

const MUAPIAPP_API_KEY = process.env.MUAPIAPP_API_KEY || ''
const supabaseUrl = process.env.VITE_SUPABASE_URL
const supabaseAnon = process.env.VITE_SUPABASE_ANON_KEY
const supabaseService = process.env.SUPABASE_SERVICE_ROLE_KEY

// ใช้ service role (ถ้ามี) เพื่อให้อัปเดตฐานข้อมูลได้แม้ภายใต้ RLS
const supabase = createClient(supabaseUrl, supabaseService || supabaseAnon)

async function updateVideoRow({ matchField = 'id', matchValue, updates }) {
  try {
    const result = await supabase
      .from('videos')
      .update(updates)
      .eq(matchField, matchValue)
      .select()

    if (result.error) throw result.error
    const rows = Array.isArray(result.data) ? result.data.length : 0
    if (rows === 0) {
      console.warn('⚠️ No rows updated for', matchField, '=', matchValue, '(RLS or wrong id?)')
      return { ok: false, reason: 'no_rows' }
    }
    return { ok: true, data: result.data }
  } catch (e) {
    return { ok: false, error: e }
  }
}

app.post('/api/generate', async (req, res) => {
  try {
    const { prompt, resolution = '720p', aspect_ratio = '16:9', images_list: rawImagesList, mode, videoId } = req.body || {}

    if (!prompt || typeof prompt !== 'string') {
      return res.status(400).json({ error: 'Invalid prompt' })
    }

    console.log('Starting video generation:', prompt.substring(0, 50) + '...')

    const images_list = Array.isArray(rawImagesList)
      ? rawImagesList.filter((x) => typeof x === 'string' && x.trim()).map((x) => x.trim())
      : []
    const useI2V = mode === 'i2v' || (!mode && images_list.length > 0)

    let endpoint = 'https://api.muapi.ai/api/v1/openai-sora-2-text-to-video'
    let payload = { prompt, resolution, aspect_ratio }

    if (useI2V) {
      endpoint = 'https://api.muapi.ai/api/v1/openai-sora-2-image-to-video'
      payload = {
        prompt,
        images_list: images_list.length ? images_list : ['https://d3adwkbyhxyrtq.cloudfront.net/webassets/videomodels/openai-sora-2-i2v.jpg'],
        resolution,
        aspect_ratio,
      }
    }

    console.log('Sending request to MUAPI...')

    const createRes = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-api-key': MUAPIAPP_API_KEY },
      body: JSON.stringify(payload),
    })

    const createJson = await createRes.json().catch(() => ({}))
    if (!createRes.ok) {
      throw new Error(createJson?.error?.message || createJson?.message || 'MUAPI create failed')
    }

    const requestId = createJson?.request_id || createJson?.id
    if (!requestId) {
      throw new Error('MUAPI did not return a request_id')
    }

    console.log('Request ID:', requestId)
    
    // ส่ง request_id กลับไปทันที ไม่ต้องรอให้เสร็จ
    res.json({ success: true, requestId, status: 'processing' })
    
    // โพลล์ในพื้นหลัง พร้อมอัพเดท database
    if (videoId) {
      pollForResult(requestId, videoId).catch(err => {
        console.error('Background polling error for', requestId, ':', err.message)
      })
    }
    
  } catch (error) {
    console.error('Error:', error.message)
    return res.status(500).json({ error: error?.message || String(error) })
  }
})

// ฟังก์ชันโพลล์ในพื้นหลัง และอัพเดท database
async function pollForResult(requestId, videoId) {
  console.log('🔄 Polling for result in background:', requestId, '(videoId:', videoId, ')')
  
  const startTime = Date.now()
  const maxWaitTime = 10 * 60 * 1000

  while (Date.now() - startTime < maxWaitTime) {
    await new Promise((r) => setTimeout(r, 3000))

    try {
      const resultRes = await fetch(
        'https://api.muapi.ai/api/v1/predictions/' + requestId + '/result',
        { headers: { 'x-api-key': MUAPIAPP_API_KEY } }
      )

      const resultJson = await resultRes.json().catch(() => ({}))
      if (!resultRes.ok) continue

      const status = resultJson?.status || ''
      console.log('Status for', requestId, ':', status)

      if (/^complete(d)?$/i.test(status) || /succeed(ed)?|success/i.test(status)) {
        const videoUrl =
          (Array.isArray(resultJson?.outputs) && resultJson.outputs[0]) ||
          (Array.isArray(resultJson?.output) && resultJson.output[0]) ||
          resultJson?.output?.video_url ||
          resultJson?.video_url ||
          resultJson?.url ||
          resultJson?.data?.url ||
          resultJson?.data?.video_url ||
          (typeof resultJson?.output === 'string' ? resultJson.output : null)

        if (videoUrl) {
          console.log('✅ Video completed in background:', videoUrl)
          
          // อัพเดท database: พยายามอัพเดททั้ง video_url และสถานะให้เป็น completed
          // ถ้า column status ไม่มีอยู่ ให้ย้อนกลับไปอัพเดทเฉพาะ video_url อย่างเดียว
          let updated = await updateVideoRow({ matchValue: videoId, updates: { video_url: videoUrl, status: 'completed' } })
          if (!updated.ok) {
            console.warn('⚠️ Update with status failed, retrying without status:', updated.error?.message || updated.reason)
            updated = await updateVideoRow({ matchValue: videoId, updates: { video_url: videoUrl } })
          }
          if (updated.ok) {
            console.log('✅ Database updated for video:', videoId)
          } else {
            console.error('❌ Database not updated for video:', videoId)
          }
          
          return // เสร็จแล้ว หยุดโพลล์
        }
      }

      if (/fail|error|cancel/i.test(status)) {
        console.error('❌ Video failed in background:', resultJson?.error?.message || resultJson?.message)
        return // ล้มเหลว หยุดโพลล์ (ไม่อัพเดท database เพราะไม่มี status column)
      }
    } catch (pollError) {
      console.error('Poll error for', requestId, ':', pollError.message)
    }
  }
  
  console.log('⏱️ Video generation timeout (10 minutes) for', requestId)
  // ไม่อัพเดท database เพราะไม่มี status column
}

app.get('/api/health', (req, res) => {
  res.json({ ok: true, provider: 'muapi.ai' })
})

// API สำหรับเช็คสถานะวีดีโอที่กำลังสร้าง
app.get('/api/check-status/:requestId', async (req, res) => {
  try {
    const { requestId } = req.params
    
    if (!requestId) {
      return res.status(400).json({ error: 'Missing requestId' })
    }

    const resultRes = await fetch(
      `https://api.muapi.ai/api/v1/predictions/${requestId}/result`,
      { headers: { 'x-api-key': MUAPIAPP_API_KEY } }
    )

    const resultJson = await resultRes.json().catch(() => ({}))
    
    if (!resultRes.ok) {
      return res.json({ status: 'pending' })
    }

    const status = resultJson?.status || ''

    if (/^complete(d)?$/i.test(status) || /succeed(ed)?|success/i.test(status)) {
      const videoUrl =
        (Array.isArray(resultJson?.outputs) && resultJson.outputs[0]) ||
        (Array.isArray(resultJson?.output) && resultJson.output[0]) ||
        resultJson?.output?.video_url ||
        resultJson?.video_url ||
        resultJson?.url ||
        resultJson?.data?.url ||
        resultJson?.data?.video_url ||
        (typeof resultJson?.output === 'string' ? resultJson.output : null)

      if (videoUrl) {
        return res.json({ status: 'completed', url: videoUrl })
      }
    }

    if (/fail|error|cancel/i.test(status)) {
      return res.json({ 
        status: 'failed', 
        error: resultJson?.error?.message || resultJson?.message || 'Generation failed' 
      })
    }

    return res.json({ status: 'pending' })
  } catch (error) {
    console.error('Error checking status:', error.message)
    return res.json({ status: 'pending' })
  }
})

// API สำหรับอัพเดทวีดีโอด้วยตนเอง (สำหรับทดสอบ)
app.post('/api/update-video', async (req, res) => {
  try {
    const { requestId, videoUrl } = req.body
    
    if (!requestId || !videoUrl) {
      return res.status(400).json({ error: 'Missing requestId or videoUrl' })
    }

    console.log('📝 Manually updating video:', requestId)
    
    // อัพเดท video_url พร้อมสถานะเป็น completed ถ้าเป็นไปได้
    let result = await updateVideoRow({ matchField: 'request_id', matchValue: requestId, updates: { video_url: videoUrl, status: 'completed' } })
    if (!result.ok) {
      console.warn('⚠️ Update with status failed, retrying without status:', result.error?.message || result.reason)
      result = await updateVideoRow({ matchField: 'request_id', matchValue: requestId, updates: { video_url: videoUrl } })
      if (!result.ok) {
        return res.status(500).json({ error: result.error?.message || 'Update failed' })
      }
    }

    console.log('✅ Video updated successfully:', result.data)
    return res.json({ success: true, data: result.data })
  } catch (error) {
    console.error('Error:', error.message)
    return res.status(500).json({ error: error.message })
  }
})

// Serve index.html for all other routes (SPA fallback)
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../dist/index.html'))
})

app.listen(port, () => {
  console.log('[server] listening on http://localhost:' + port)
})
