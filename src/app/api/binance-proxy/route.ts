import { NextRequest, NextResponse } from 'next/server'

// 强制使用 Node.js runtime
export const runtime = 'nodejs'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { endpoint, queryString, apiKey, testnet } = body

    if (!endpoint || !queryString || !apiKey) {
      return NextResponse.json({
        success: false,
        message: '缺少必要参数'
      }, { status: 400 })
    }

    const baseUrl = testnet 
      ? 'https://testnet.binance.vision/api/v3'
      : 'https://api.binance.com/api/v3'

    // 构建完整 URL
    const url = `${baseUrl}/${endpoint}?${queryString}`

    console.log('Proxying request to:', url.substring(0, 100) + '...')

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'X-MBX-APIKEY': apiKey,
        'User-Agent': 'Binance Multi-Account Analyzer',
      },
    })

    console.log('Binance response status:', response.status)

    if (!response.ok) {
      const errorText = await response.text()
      console.error('Binance API error:', response.status, errorText)
      
      return NextResponse.json({
        success: false,
        message: `Binance API 错误: ${response.status}`,
        details: errorText
      }, { status: response.status })
    }

    const data = await response.json()
    
    return NextResponse.json({
      success: true,
      data
    })

  } catch (error) {
    console.error('Proxy error:', error)
    return NextResponse.json({
      success: false,
      message: `代理请求失败: ${error instanceof Error ? error.message : 'Unknown error'}`
    }, { status: 500 })
  }
} 