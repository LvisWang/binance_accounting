import { NextRequest, NextResponse } from 'next/server'
import { BinanceClient, formatTrade } from '@/lib/binance'
import { BinanceAccount } from '@/types'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { symbol, start_date, end_date, accounts } = body

    if (!symbol || !start_date || !end_date || !accounts || accounts.length === 0) {
      return NextResponse.json({
        success: false,
        message: '请提供完整的查询参数'
      }, { status: 400 })
    }

    const allTrades: any[] = []
    const accountStats: any = {}
    let tradeIndex = 0

    // 并行查询所有账户
    const promises = accounts.map(async (account: BinanceAccount) => {
      try {
        const client = new BinanceClient(account)
        const trades = await client.getTradesForPeriod(symbol, start_date, end_date)

        // 格式化交易数据
        const formattedTrades = trades.map(trade => 
          formatTrade(trade, account.name, tradeIndex++)
        )

        return {
          accountName: account.name,
          trades: formattedTrades,
          success: true,
          count: trades.length
        }
      } catch (error) {
        console.error(`Error fetching trades for account ${account.name}:`, error)
        return {
          accountName: account.name,
          trades: [],
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
          count: 0
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
        error: result.error
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

    return NextResponse.json({
      success: true,
      trades: allTrades,
      account_stats: accountStats,
      total_count: allTrades.length
    })

  } catch (error) {
    console.error('Query trades error:', error)
    return NextResponse.json({
      success: false,
      message: `查询失败: ${error instanceof Error ? error.message : 'Unknown error'}`
    }, { status: 500 })
  }
} 