import { NextRequest, NextResponse } from 'next/server'

// 强制使用 Node.js runtime
export const runtime = 'nodejs'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { endpoint, queryString, apiKey, signature, timestamp, testnet, recvWindow } = body

    if (!endpoint || !apiKey || !signature || !timestamp) {
      return NextResponse.json({
        success: false,
        message: '缺少必要参数: endpoint, apiKey, signature, timestamp 都是必需的'
      }, { status: 400 })
    }

    // Bybit API 端点
    const baseUrl = testnet 
      ? 'https://api-testnet.bybit.com'
      : 'https://api.bybit.com'

    try {
      // 构建完整 URL
      const url = queryString 
        ? `${baseUrl}/${endpoint}?${queryString}`
        : `${baseUrl}/${endpoint}`

      console.log('Bybit API request to:', url)

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'X-BAPI-API-KEY': apiKey,
          'X-BAPI-SIGN': signature,
          'X-BAPI-TIMESTAMP': timestamp,
          'X-BAPI-RECV-WINDOW': recvWindow || '20000',
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

      console.log('Bybit API response status:', response.status)

      if (response.ok) {
        const data = await response.json()
        
        // 检查 Bybit API 响应格式
        if (data.retCode === 0) {
          return NextResponse.json({
            success: true,
            data: data.result
          })
        } else {
          return NextResponse.json({
            success: false,
            message: `Bybit API 错误: ${data.retMsg || 'Unknown error'}`,
            code: data.retCode
          }, { status: 400 })
        }
      } else if (response.status === 429) {
        // 频率限制
        const errorText = await response.text()
        console.log('Bybit API rate limit hit')
        
        return NextResponse.json({
          success: false,
          message: 'Bybit API 请求频率限制，请稍后重试',
          details: errorText,
        }, { status: 429 })
      } else {
        const errorText = await response.text()
        console.error('Bybit API error:', response.status, errorText)
        
        return NextResponse.json({
          success: false,
          message: `Bybit API 错误: ${response.status}`,
          details: errorText,
        }, { status: response.status })
      }
    } catch (fetchError) {
      console.error('Bybit API network error:', fetchError)
      return NextResponse.json({
        success: false,
        message: '无法连接到 Bybit API',
        details: fetchError instanceof Error ? fetchError.message : 'Network error'
      }, { status: 503 })
    }

  } catch (error) {
    console.error('Bybit Proxy error:', error)
    return NextResponse.json({
      success: false,
      message: `Bybit 代理请求失败: ${error instanceof Error ? error.message : 'Unknown error'}`
    }, { status: 500 })
  }
} 