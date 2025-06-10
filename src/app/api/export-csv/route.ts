import { NextRequest, NextResponse } from 'next/server'

// 强制使用 Node.js runtime
export const runtime = 'nodejs'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { analysis, selected_trades, symbol } = body

    if (!analysis || !selected_trades) {
      return NextResponse.json({
        success: false,
        message: '没有找到分析数据'
      }, { status: 400 })
    }

    // 生成 CSV 内容
    const csvLines: string[] = []
    
    // 写入标题
    csvLines.push('多交易所多账户交易分析报告')
    csvLines.push(`生成时间,${new Date().toLocaleString('zh-CN')}`)
    csvLines.push(`交易对,${symbol || 'UNKNOWN'}`)
    csvLines.push(`涉及账户,"${analysis.accounts.join(', ')}"`)
    csvLines.push(`涉及交易所,"${(analysis.exchanges || ['unknown']).join(', ')}"`)
    csvLines.push('')

    // 分析摘要
    csvLines.push('=== 分析摘要 ===')
    csvLines.push(`总选中交易数,${analysis.total_count}`)
    csvLines.push(`买入交易数,${analysis.buy_count}`)
    csvLines.push(`卖出交易数,${analysis.sell_count}`)
    csvLines.push('')

    // 买入统计
    if (analysis.buy_stats) {
      csvLines.push('=== 买入统计 ===')
      csvLines.push(`平均增持价格,${analysis.buy_stats.avg_price.toFixed(6)}`)
      csvLines.push(`总买入数量,${analysis.buy_stats.total_qty.toFixed(6)}`)
      csvLines.push(`总买入金额,${analysis.buy_stats.total_amount.toFixed(2)}`)
      csvLines.push('买入手续费:')
      Object.entries(analysis.buy_stats.commission_by_asset).forEach(([asset, commission]) => {
        csvLines.push(`,${(commission as number).toFixed(8)} ${asset}`)
      })
      csvLines.push('')
    }

    // 卖出统计
    if (analysis.sell_stats) {
      csvLines.push('=== 卖出统计 ===')
      csvLines.push(`平均减持价格,${analysis.sell_stats.avg_price.toFixed(6)}`)
      csvLines.push(`总卖出数量,${analysis.sell_stats.total_qty.toFixed(6)}`)
      csvLines.push(`总卖出金额,${analysis.sell_stats.total_amount.toFixed(2)}`)
      csvLines.push('卖出手续费:')
      Object.entries(analysis.sell_stats.commission_by_asset).forEach(([asset, commission]) => {
        csvLines.push(`,${(commission as number).toFixed(8)} ${asset}`)
      })
      csvLines.push('')
    }

    // 盈亏分析
    if (analysis.profit_stats) {
      csvLines.push('=== 盈亏分析 ===')
      csvLines.push(`价差,${analysis.profit_stats.price_diff.toFixed(6)}`)
      csvLines.push(`基于最小交易量的盈亏,${analysis.profit_stats.total_profit.toFixed(2)}`)
      csvLines.push(`盈亏百分比,${analysis.profit_stats.profit_percentage >= 0 ? '+' : ''}${analysis.profit_stats.profit_percentage.toFixed(2)}%`)
      csvLines.push(`最小交易量,${analysis.profit_stats.min_qty.toFixed(6)}`)
      csvLines.push('')
    }

    // 总手续费统计
    csvLines.push('=== 总手续费统计 ===')
    Object.entries(analysis.total_commission_by_asset).forEach(([asset, commission]) => {
      csvLines.push(`总手续费 (${asset}),${(commission as number).toFixed(8)}`)
    })
    csvLines.push('')

    // 详细交易记录
    csvLines.push('=== 选中的交易记录 ===')
    csvLines.push('账户,交易所,交易ID,交易时间,买卖方向,价格,数量,金额,手续费,手续费资产')

    selected_trades.forEach((trade: any) => {
      const tradeTime = new Date(parseInt(trade.time)).toLocaleString('zh-CN')
      const direction = trade.isBuyer ? '买入' : '卖出'
      
      csvLines.push([
        trade.account_name,
        trade.exchange || 'unknown',
        trade.id,
        tradeTime,
        direction,
        parseFloat(trade.price).toFixed(6),
        parseFloat(trade.qty).toFixed(6),
        parseFloat(trade.quoteQty).toFixed(2),
        parseFloat(trade.commission).toFixed(8),
        trade.commissionAsset
      ].join(','))
    })

    // 转换为 CSV 字符串
    const csvContent = csvLines.join('\n')
    
    // 添加 BOM 以支持中文
    const bom = '\uFEFF'
    const csvWithBom = bom + csvContent

    // 创建响应
    const response = new NextResponse(csvWithBom, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="trade_analysis_${new Date().toISOString().split('T')[0]}.csv"`,
      },
    })

    return response

  } catch (error) {
    console.error('Export CSV error:', error)
    return NextResponse.json({
      success: false,
      message: `导出失败: ${error instanceof Error ? error.message : 'Unknown error'}`
    }, { status: 500 })
  }
} 