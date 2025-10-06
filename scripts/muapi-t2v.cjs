require('dotenv').config()
const axios = require('axios')

async function main() {
  console.log('Hello from MuApiApp!')

  const API_KEY = process.env.MUAPIAPP_API_KEY
  if (!API_KEY) {
    console.error('Missing MUAPIAPP_API_KEY in your environment (.env)')
    process.exitCode = 1
    return
  }
  console.log(`API_KEY: ${API_KEY.slice(0, 6)}... (hidden)`) // hide full key

  const url = 'https://api.muapi.ai/api/v1/openai-sora-2-text-to-video'
  const headers = {
    'Content-Type': 'application/json',
    'x-api-key': `${API_KEY}`,
  }

  const payload = {
    prompt:
      "A cyclist rides through a lively European street at sunrise. The camera follows behind as warm golden light hits old stone buildings, people open café shops, and pigeons scatter. You hear bicycle wheels clicking, distant chatter, and a soft morning breeze.",
    resolution: '720p',
    aspect_ratio: '16:9',
  }

  try {
    const begin = Date.now()
    const response = await axios.post(url, payload, { headers })

    if (response.status === 200) {
      const requestId = response.data.request_id || response.data.id
      if (!requestId) {
        throw new Error('No request_id returned')
      }
      console.log(`Task submitted successfully. Request ID: ${requestId}`)

      const resultUrl = `https://api.muapi.ai/api/v1/predictions/${requestId}/result`
      const pollHeaders = { 'x-api-key': `${API_KEY}` }

      while (true) {
        const pollResponse = await axios.get(resultUrl, { headers: pollHeaders })

        if (pollResponse.status === 200) {
          const status = pollResponse.data?.status

          if (status === 'completed') {
            const end = Date.now()
            console.log(`Task completed in ${((end - begin) / 1000).toFixed(1)} seconds.`)
            const outputs = pollResponse.data?.outputs
            const videoUrl = Array.isArray(outputs) ? outputs[0] : null
            console.log(`Task completed. URL: ${videoUrl || 'N/A'}`)
            break
          } else if (status === 'failed') {
            console.log(`Task failed: ${pollResponse.data?.error || 'Unknown error'}`)
            break
          } else {
            console.log(`Task processing. Status: ${status}`)
          }
        } else {
          console.log(`Error: ${pollResponse.status}, ${pollResponse.statusText}`)
          break
        }

        await new Promise((resolve) => setTimeout(resolve, 800))
      }
    } else {
      console.log(`Error: ${response.status}, ${response.statusText}`)
    }
  } catch (error) {
    console.error(`Request failed: ${error.response?.data?.error || error.message}`)
  }
}

main()

