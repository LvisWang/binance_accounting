import { NextRequest, NextResponse } from 'next/server'

// 强制使用 Node.js runtime
export const runtime = 'nodejs'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { endpoint, apiKey, signature, timestamp, passphrase, testnet } = body

    if (!endpoint || !apiKey || !signature || !timestamp || !passphrase) {
      return NextResponse.json({
        success: false,
        message: '缺少必要参数: endpoint, apiKey, signature, timestamp, passphrase 都是必需的'
      }, { status: 400 })
    }

    // OKX API 端点
    const baseUrl = testnet 
      ? 'https://www.okx.com'  // OKX 没有独立的测试网 URL
      : 'https://www.okx.com'

    try {
      const url = `${baseUrl}/api/v5/${endpoint}`

      console.log('OKX API request to:', url)

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'OK-ACCESS-KEY': apiKey,
          'OK-ACCESS-SIGN': signature,
          'OK-ACCESS-TIMESTAMP': timestamp,
          'OK-ACCESS-PASSPHRASE': passphrase,
          'Content-Type': 'application/json',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
          'Accept': 'application/json',
          'Accept-Language': 'en-US,en;q=0.9',
          'Accept-Encoding': 'gzip, deflate, br',
          'Connection': 'keep-alive',
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache',
        },
      })

      console.log('OKX API response status:', response.status)

      if (response.ok) {
        const data = await response.json()
        
        // 检查 OKX API 响应格式
        if (data.code === '0') {
          return NextResponse.json({
            success: true,
            data: data.data
          })
        } else {
          return NextResponse.json({
            success: false,
            message: `OKX API 错误: ${data.msg || 'Unknown error'}`,
            code: data.code
          }, { status: 400 })
        }
      } else {
        const errorText = await response.text()
        console.error('OKX API error:', response.status, errorText)
        
        return NextResponse.json({
          success: false,
          message: `OKX API 错误: ${response.status}`,
          details: errorText,
        }, { status: response.status })
      }
    } catch (fetchError) {
      console.error('OKX API network error:', fetchError)
      return NextResponse.json({
        success: false,
        message: '无法连接到 OKX API',
        details: fetchError instanceof Error ? fetchError.message : 'Network error'
      }, { status: 503 })
    }

  } catch (error) {
    console.error('OKX Proxy error:', error)
    return NextResponse.json({
      success: false,
      message: `OKX 代理请求失败: ${error instanceof Error ? error.message : 'Unknown error'}`
    }, { status: 500 })
  }
} 