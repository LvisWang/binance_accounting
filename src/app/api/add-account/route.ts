import { NextRequest, NextResponse } from 'next/server'
import { BinanceClient } from '@/lib/binance'

// 强制使用 Node.js runtime，因为需要 crypto 模块
export const runtime = 'nodejs'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, apiKey, secretKey, testnet } = body

    if (!name || !apiKey || !secretKey) {
      return NextResponse.json({
        success: false,
        message: '请填写完整的账户信息'
      }, { status: 400 })
    }

    // 创建 Binance 客户端并测试连接
    const client = new BinanceClient({
      name,
      apiKey,
      secretKey,
      testnet: testnet || false
    })

    const isConnected = await client.testConnection()

    if (isConnected) {
      return NextResponse.json({
        success: true,
        message: '账户连接成功'
      })
    } else {
      return NextResponse.json({
        success: false,
        message: '账户连接失败，请检查API密钥'
      }, { status: 400 })
    }
  } catch (error) {
    console.error('Add account error:', error)
    return NextResponse.json({
      success: false,
      message: `账户连接错误: ${error instanceof Error ? error.message : 'Unknown error'}`
    }, { status: 500 })
  }
} 