import { NextRequest, NextResponse } from 'next/server'
import { BinanceClient } from '@/lib/binance'
import { OKXClient } from '@/lib/okx'
import { BybitClient } from '@/lib/bybit'

// 强制使用 Node.js runtime，因为需要 crypto 模块
export const runtime = 'nodejs'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, exchange, apiKey, secretKey, passphrase, testnet } = body

    if (!name || !exchange || !apiKey || !secretKey) {
      return NextResponse.json({
        success: false,
        message: '请填写完整的账户信息'
      }, { status: 400 })
    }

    // 检查 OKX 是否提供了必需的 passphrase
    if (exchange === 'okx' && !passphrase) {
      return NextResponse.json({
        success: false,
        message: 'OKX 账户需要提供 API 密码 (Passphrase)'
      }, { status: 400 })
    }

    let isConnected = false
    let errorMessage = ''

    try {
      if (exchange === 'binance') {
        // 创建 Binance 客户端并测试连接
        const client = new BinanceClient({
          name,
          apiKey,
          secretKey,
          testnet: testnet || false
        })

        isConnected = await client.testConnection()
        if (!isConnected) {
          errorMessage = 'Binance 账户连接失败，请检查 API 密钥和权限'
        }
      } else if (exchange === 'okx') {
        // 创建 OKX 客户端并测试连接
        const client = new OKXClient({
          name,
          apiKey,
          secretKey,
          passphrase,
          testnet: testnet || false
        })

        isConnected = await client.testConnection()
        if (!isConnected) {
          errorMessage = 'OKX 账户连接失败，请检查 API 密钥、密码和权限'
        }
      } else if (exchange === 'bybit') {
        // 创建 Bybit 客户端并测试连接
        const client = new BybitClient({
          name,
          apiKey,
          secretKey,
          testnet: testnet || false
        })

        isConnected = await client.testConnection()
        if (!isConnected) {
          errorMessage = 'Bybit 账户连接失败，请检查 API 密钥和权限'
        }
      } else {
        return NextResponse.json({
          success: false,
          message: `不支持的交易所: ${exchange}`
        }, { status: 400 })
      }

      if (isConnected) {
        return NextResponse.json({
          success: true,
          message: `${exchange.toUpperCase()} 账户连接成功`
        })
      } else {
        return NextResponse.json({
          success: false,
          message: errorMessage
        }, { status: 400 })
      }
    } catch (connectionError) {
      console.error(`${exchange} connection error:`, connectionError)
      return NextResponse.json({
        success: false,
        message: `${exchange.toUpperCase()} 连接测试失败: ${connectionError instanceof Error ? connectionError.message : 'Unknown error'}`
      }, { status: 500 })
    }
  } catch (error) {
    console.error('Add account error:', error)
    return NextResponse.json({
      success: false,
      message: `账户连接错误: ${error instanceof Error ? error.message : 'Unknown error'}`
    }, { status: 500 })
  }
} 