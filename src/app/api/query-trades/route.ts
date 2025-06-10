import { NextRequest, NextResponse } from 'next/server'
import { BinanceClient, formatTrade } from '@/lib/binance'
import { OKXClient } from '@/lib/okx'
import { BybitClient } from '@/lib/bybit'
import { Account } from '@/types'

// 强制使用 Node.js runtime
export const runtime = 'nodejs'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { symbol, start_date, end_date, accounts, exchange_filter } = body

    if (!symbol || !start_date || !end_date || !accounts || accounts.length === 0) {
      return NextResponse.json({
        success: false,
        message: '请提供完整的查询参数'
      }, { status: 400 })
    }

    const allTrades: any[] = []
    const accountStats: any = {}
    let tradeIndex = 0

    // 根据交易所筛选账户
    const filteredAccounts = exchange_filter 
      ? accounts.filter((account: Account) => account.exchange === exchange_filter)
      : accounts

    if (filteredAccounts.length === 0) {
      return NextResponse.json({
        success: false,
        message: `没有找到 ${exchange_filter ? exchange_filter.toUpperCase() + ' ' : ''}账户`
      }, { status: 400 })
    }

    // 并行查询所有账户
    const promises = filteredAccounts.map(async (account: Account) => {
      try {
        let trades: any[] = []

        if (account.exchange === 'binance') {
          console.log(`Querying Binance account: ${account.name}`)
          const client = new BinanceClient({
            name: account.name,
            apiKey: account.apiKey,
            secretKey: account.secretKey,
            testnet: account.testnet
          })
          trades = await client.getTradesForPeriod(symbol, start_date, end_date)
          
        } else if (account.exchange === 'okx') {
          console.log(`Querying OKX account: ${account.name}`)
          const client = new OKXClient({
            name: account.name,
            apiKey: account.apiKey,
            secretKey: account.secretKey,
            passphrase: account.passphrase!,
            testnet: account.testnet
          })
          
          try {
            // 首先尝试通过历史订单获取交易
            console.log(`Trying order-based method for OKX account: ${account.name}`)
            trades = await client.getTradesForPeriod(symbol, start_date, end_date)
            
            // 如果没有找到交易，尝试直接查询成交记录
            if (trades.length === 0) {
              console.log(`No trades found via orders, trying direct fills method for: ${account.name}`)
              trades = await client.getTradesDirectly(symbol, start_date, end_date)
            }
            
          } catch (okxError) {
            console.error(`OKX order method failed for ${account.name}, trying direct method:`, okxError)
            
            // 如果订单方法失败，尝试直接查询成交记录
            try {
              trades = await client.getTradesDirectly(symbol, start_date, end_date)
            } catch (directError) {
              console.error(`OKX direct method also failed for ${account.name}:`, directError)
              throw okxError // 抛出原始错误
            }
          }
          
        } else if (account.exchange === 'bybit') {
          console.log(`Querying Bybit account: ${account.name}`)
          const client = new BybitClient({
            name: account.name,
            apiKey: account.apiKey,
            secretKey: account.secretKey,
            testnet: account.testnet
          })
          trades = await client.getTrades(symbol, start_date, end_date)
          
        } else {
          throw new Error(`不支持的交易所: ${account.exchange}`)
        }

        console.log(`Found ${trades.length} trades for ${account.exchange} account: ${account.name}`)

        // 格式化交易数据，添加交易所信息
        const formattedTrades = trades.map(trade => {
          const formatted = formatTrade(trade, account.name, tradeIndex++)
          formatted.exchange = account.exchange
          formatted.raw_data.exchange = account.exchange
          return formatted
        })

        return {
          accountName: account.name,
          exchange: account.exchange,
          trades: formattedTrades,
          success: true,
          count: trades.length,
          message: `成功获取 ${trades.length} 条交易记录`
        }
      } catch (error) {
        console.error(`Error fetching trades for ${account.exchange} account ${account.name}:`, error)
        
        // 为不同类型的错误提供更具体的消息
        let errorMessage = 'Unknown error'
        if (error instanceof Error) {
          errorMessage = error.message
          
          // 特殊处理常见的错误
          if (account.exchange === 'okx') {
            if (errorMessage.includes('Invalid Sign')) {
              errorMessage = 'OKX API 签名验证失败，请检查 API 密钥和密码是否正确'
            } else if (errorMessage.includes('doesn\'t exist')) {
              errorMessage = `交易对 ${symbol} 在 OKX 上不存在或格式不正确`
            } else if (errorMessage.includes('Parameter')) {
              errorMessage = 'OKX API 参数错误，请检查交易对格式和时间范围'
            }
          } else if (account.exchange === 'bybit') {
            if (errorMessage.includes('Invalid Sign') || errorMessage.includes('signature')) {
              errorMessage = 'Bybit API 签名验证失败，请检查 API 密钥是否正确'
            } else if (errorMessage.includes('symbol')) {
              errorMessage = `交易对 ${symbol} 在 Bybit 上不存在或格式不正确`
            } else if (errorMessage.includes('permission')) {
              errorMessage = 'Bybit API 权限不足，请确认API密钥有交易历史读取权限'
            }
          }
        }
        
        return {
          accountName: account.name,
          exchange: account.exchange,
          trades: [],
          success: false,
          error: errorMessage,
          count: 0,
          message: `查询失败: ${errorMessage}`
        }
      }
    })

    const results = await Promise.all(promises)

    // 收集所有交易和统计信息
    results.forEach(result => {
      allTrades.push(...result.trades)
      accountStats[result.accountName] = {
        count: result.count,
        success: result.success,
        error: result.error,
        exchange: result.exchange,
        message: result.message
      }
    })

    // 按时间排序所有交易
    allTrades.sort((a, b) => {
      const timeA = parseInt(a.raw_data.time)
      const timeB = parseInt(b.raw_data.time)
      return timeA - timeB
    })

    // 重新分配索引
    allTrades.forEach((trade, index) => {
      trade.index = index
    })

    // 计算总体统计
    const successfulAccounts = results.filter(r => r.success).length
    const totalAccounts = results.length
    const hasPartialSuccess = successfulAccounts > 0 && successfulAccounts < totalAccounts
    const hasAnySuccess = successfulAccounts > 0

    let message = ''
    if (successfulAccounts === totalAccounts) {
      message = `成功查询所有 ${totalAccounts} 个账户，共找到 ${allTrades.length} 条交易记录`
    } else if (hasPartialSuccess) {
      message = `部分成功：${successfulAccounts}/${totalAccounts} 个账户查询成功，共找到 ${allTrades.length} 条交易记录`
    } else {
      message = `查询失败：所有账户都无法获取交易数据`
    }

    return NextResponse.json({
      success: hasAnySuccess,
      trades: allTrades,
      account_stats: accountStats,
      total_count: allTrades.length,
      message,
      summary: {
        total_accounts: totalAccounts,
        successful_accounts: successfulAccounts,
        failed_accounts: totalAccounts - successfulAccounts,
        total_trades: allTrades.length
      }
    })

  } catch (error) {
    console.error('Query trades error:', error)
    return NextResponse.json({
      success: false,
      message: `查询失败: ${error instanceof Error ? error.message : 'Unknown error'}`,
      trades: [],
      account_stats: {},
      total_count: 0
    }, { status: 500 })
  }
} 