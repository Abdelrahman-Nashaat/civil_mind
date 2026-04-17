import { auth } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'

export const maxDuration = 60

export async function POST(request) {
  const { userId } = await auth()
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { question, country } = await request.json()
  const webhookUrl = 'http://127.0.0.1:5678/webhook/civil-assistant'

  const body = JSON.stringify({
    question: `[${country === 'sa' ? 'السعودية - SBC' : 'مصر - ECP'}] ${question}`,
    user_id: userId,
  })

  try {
    const { default: http } = await import('http')
    
    const data = await new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        req.destroy()
        reject(new Error('timeout'))
      }, 55000)

      const req = http.request({
        hostname: '127.0.0.1',
        port: 5678,
        path: '/webhook/civil-assistant',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(body),
          'Accept-Encoding': 'identity',
        },
      }, (res) => {
        let chunks = ''
        res.setEncoding('utf8')
        res.on('data', chunk => { chunks += chunk })
        res.on('end', () => {
          clearTimeout(timeout)
          console.log('raw response:', chunks.substring(0, 200))
          try {
            resolve(chunks ? JSON.parse(chunks) : {})
          } catch(e) {
            resolve({})
          }
        })
      })

      req.on('error', (err) => {
        clearTimeout(timeout)
        reject(err)
      })

      req.write(body)
      req.end()
    })

    return NextResponse.json({ 
      answer: data.answer || data.message || 'لم يتم الحصول على إجابة' 
    })

  } catch (error) {
    console.error('error:', error.message)
    return NextResponse.json({ error: 'فشل الاتصال بالخادم' }, { status: 500 })
  }
}