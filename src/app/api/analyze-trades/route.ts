import { NextRequest, NextResponse } from 'next/server'
import { analyzeTrades } from '@/lib/binance'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { selected_indices, trades } = body

    if (!selected_indices || !Array.isArray(selected_indices) || selected_indices.length === 0) {
      return NextResponse.json({
        success: false,
        message: '请选择要分析的交易'
      }, { status: 400 })
    }

    if (!trades || !Array.isArray(trades)) {
      return NextResponse.json({
        success: false,
        message: '没有找到交易数据'
      }, { status: 400 })
    }

    // 获取选中的交易
    const selectedTrades = selected_indices
      .filter((index: number) => index >= 0 && index < trades.length)
      .map((index: number) => trades[index])

    if (selectedTrades.length === 0) {
      return NextResponse.json({
        success: false,
        message: '选中的交易无效'
      }, { status: 400 })
    }

    // 分析交易
    const analysis = analyzeTrades(selectedTrades)

    return NextResponse.json({
      success: true,
      analysis
    })

  } catch (error) {
    console.error('Analyze trades error:', error)
    return NextResponse.json({
      success: false,
      message: `分析失败: ${error instanceof Error ? error.message : 'Unknown error'}`
    }, { status: 500 })
  }
} 