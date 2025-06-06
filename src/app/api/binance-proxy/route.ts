import { NextRequest, NextResponse } from 'next/server'

// 强制使用 Node.js runtime
export const runtime = 'nodejs'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { endpoint, queryString, apiKey, testnet } = body

    // 修复参数验证：允许 queryString 为空字符串，但 endpoint 和 apiKey 仍然必需
    if (!endpoint || apiKey === undefined || apiKey === null) {
      return NextResponse.json({
        success: false,
        message: '缺少必要参数: endpoint 和 apiKey 是必需的'
      }, { status: 400 })
    }

    // 多个备用API端点来处理地理限制
    const apiEndpoints = testnet 
      ? ['https://testnet.binance.vision/api/v3']
      : [
          'https://api.binance.com/api/v3',
          'https://api1.binance.com/api/v3',
          'https://api2.binance.com/api/v3',
          'https://api3.binance.com/api/v3',
          'https://data-api.binance.vision/api/v3'
        ]

    let lastError = null

    // 尝试所有端点
    for (const baseUrl of apiEndpoints) {
      try {
        // 构建完整 URL - 如果 queryString 为空，则不添加查询参数
        const url = queryString 
          ? `${baseUrl}/${endpoint}?${queryString}`
          : `${baseUrl}/${endpoint}`

        console.log('Trying endpoint:', baseUrl)

        const response = await fetch(url, {
          method: 'GET',
          headers: {
            'X-MBX-APIKEY': apiKey,
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
            'Accept': 'application/json',
            'Accept-Language': 'en-US,en;q=0.9',
            'Accept-Encoding': 'gzip, deflate, br',
            'Connection': 'keep-alive',
            'Cache-Control': 'no-cache',
            'Pragma': 'no-cache',
          },
        })

        console.log(`Response from ${baseUrl}:`, response.status)

        if (response.ok) {
          const data = await response.json()
          return NextResponse.json({
            success: true,
            data
          })
        } else if (response.status === 451) {
          // 地理限制错误，尝试下一个端点
          const errorText = await response.text()
          console.log(`451 error from ${baseUrl}, trying next endpoint...`)
          lastError = { status: response.status, text: errorText, url: baseUrl }
          continue
        } else {
          // 其他错误，返回错误信息
          const errorText = await response.text()
          console.error('Binance API error:', response.status, errorText)
          
          return NextResponse.json({
            success: false,
            message: `Binance API 错误: ${response.status}`,
            details: errorText,
            endpoint: baseUrl
          }, { status: response.status })
        }
      } catch (fetchError) {
        console.error(`Network error with ${baseUrl}:`, fetchError)
        lastError = { error: fetchError, url: baseUrl }
        continue
      }
    }

    // 所有端点都失败了
    return NextResponse.json({
      success: false,
      message: '所有 Binance API 端点都无法访问，可能是地理限制导致的',
      details: lastError,
      suggestion: '建议使用VPN或尝试本地运行应用'
    }, { status: 451 })

  } catch (error) {
    console.error('Proxy error:', error)
    return NextResponse.json({
      success: false,
      message: `代理请求失败: ${error instanceof Error ? error.message : 'Unknown error'}`
    }, { status: 500 })
  }
} 