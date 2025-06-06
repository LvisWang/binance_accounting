import crypto from 'crypto'
import { BinanceAccount, BinanceTrade } from '@/types'

export class BinanceClient {
  private apiKey: string
  private secretKey: string
  private baseUrl: string

  constructor(account: BinanceAccount) {
    this.apiKey = account.apiKey
    this.secretKey = account.secretKey
    this.baseUrl = account.testnet 
      ? 'https://testnet.binance.vision/api/v3'
      : 'https://api.binance.com/api/v3'
  }

  private sign(queryString: string): string {
    return crypto
      .createHmac('sha256', this.secretKey)
      .update(queryString)
      .digest('hex')
  }

  private async makeRequest(endpoint: string, params: Record<string, any> = {}): Promise<any> {
    const timestamp = Date.now()
    const queryParams = {
      ...params,
      timestamp,
    }

    const queryString = new URLSearchParams(queryParams).toString()
    const signature = this.sign(queryString)
    const finalQueryString = `${queryString}&signature=${signature}`

    const url = `${this.baseUrl}/${endpoint}?${finalQueryString}`

    const response = await fetch(url, {
      headers: {
        'X-MBX-APIKEY': this.apiKey,
      },
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`Binance API error: ${response.status} ${errorText}`)
    }

    return response.json()
  }

  async testConnection(): Promise<boolean> {
    try {
      // 先测试服务器时间
      const serverTimeResponse = await fetch(`${this.baseUrl}/time`)
      if (!serverTimeResponse.ok) {
        return false
      }

      // 测试账户信息
      await this.makeRequest('account')
      return true
    } catch (error) {
      console.error('Connection test failed:', error)
      return false
    }
  }

  private async getTradesForDay(symbol: string, date: Date): Promise<BinanceTrade[]> {
    try {
      // 计算当天的开始和结束时间
      const startTime = new Date(date)
      startTime.setHours(0, 0, 0, 0)
      
      const endTime = new Date(date)
      endTime.setHours(23, 59, 59, 999)

      const params = {
        symbol: symbol.toUpperCase(),
        startTime: startTime.getTime(),
        endTime: endTime.getTime(),
        limit: 1000,
      }

      const trades = await this.makeRequest('myTrades', params)
      return trades || []
    } catch (error) {
      console.error(`Failed to get trades for ${date.toISOString().split('T')[0]}:`, error)
      return []
    }
  }

  async getTradesForPeriod(symbol: string, startDate: string, endDate: string): Promise<BinanceTrade[]> {
    try {
      console.log(`Getting trades for ${symbol} from ${startDate} to ${endDate}`)
      
      const allTrades: BinanceTrade[] = []
      let currentDate = new Date(startDate)
      const endDateObj = new Date(endDate)
      
      // 按天查询，避免24小时限制
      while (currentDate <= endDateObj) {
        const dayTrades = await this.getTradesForDay(symbol, currentDate)
        
        if (dayTrades.length > 0) {
          allTrades.push(...dayTrades)
          console.log(`Got ${dayTrades.length} trades for ${currentDate.toISOString().split('T')[0]}`)
        }
        
        // 移动到下一天
        currentDate.setDate(currentDate.getDate() + 1)
        
        // 添加小延迟避免频率限制
        await new Promise(resolve => setTimeout(resolve, 100))
      }

      // 按时间排序
      allTrades.sort((a, b) => parseInt(a.time) - parseInt(b.time))
      
      console.log(`Total trades found: ${allTrades.length}`)
      return allTrades
    } catch (error) {
      console.error('Failed to get trades for period:', error)
      throw error
    }
  }
}

export function formatTrade(trade: BinanceTrade, accountName: string, index: number) {
  return {
    index,
    id: trade.id,
    account: accountName,
    time: new Date(parseInt(trade.time)).toLocaleString('zh-CN'),
    direction: trade.isBuyer ? '买入' : '卖出',
    price: parseFloat(trade.price),
    qty: parseFloat(trade.qty),
    amount: parseFloat(trade.quoteQty),
    commission: parseFloat(trade.commission),
    commission_asset: trade.commissionAsset,
    raw_data: { ...trade, account_name: accountName },
  }
}

export function analyzeTrades(selectedTrades: BinanceTrade[]) {
  if (!selectedTrades.length) {
    throw new Error('No trades selected')
  }

  const buyTrades = selectedTrades.filter(t => t.isBuyer)
  const sellTrades = selectedTrades.filter(t => !t.isBuyer)

  const analysis: any = {
    total_count: selectedTrades.length,
    buy_count: buyTrades.length,
    sell_count: sellTrades.length,
    accounts: [...new Set(selectedTrades.map(t => t.account_name))],
  }

  // 买入统计
  if (buyTrades.length > 0) {
    const totalBuyQty = buyTrades.reduce((sum, t) => sum + parseFloat(t.qty), 0)
    const weightedBuyPrice = buyTrades.reduce((sum, t) => sum + parseFloat(t.price) * parseFloat(t.qty), 0) / totalBuyQty
    const totalBuyAmount = buyTrades.reduce((sum, t) => sum + parseFloat(t.quoteQty), 0)

    const buyCommissionByAsset: Record<string, number> = {}
    buyTrades.forEach(trade => {
      const asset = trade.commissionAsset
      const commission = parseFloat(trade.commission)
      buyCommissionByAsset[asset] = (buyCommissionByAsset[asset] || 0) + commission
    })

    analysis.buy_stats = {
      avg_price: weightedBuyPrice,
      total_qty: totalBuyQty,
      total_amount: totalBuyAmount,
      commission_by_asset: buyCommissionByAsset,
    }
  }

  // 卖出统计
  if (sellTrades.length > 0) {
    const totalSellQty = sellTrades.reduce((sum, t) => sum + parseFloat(t.qty), 0)
    const weightedSellPrice = sellTrades.reduce((sum, t) => sum + parseFloat(t.price) * parseFloat(t.qty), 0) / totalSellQty
    const totalSellAmount = sellTrades.reduce((sum, t) => sum + parseFloat(t.quoteQty), 0)

    const sellCommissionByAsset: Record<string, number> = {}
    sellTrades.forEach(trade => {
      const asset = trade.commissionAsset
      const commission = parseFloat(trade.commission)
      sellCommissionByAsset[asset] = (sellCommissionByAsset[asset] || 0) + commission
    })

    analysis.sell_stats = {
      avg_price: weightedSellPrice,
      total_qty: totalSellQty,
      total_amount: totalSellAmount,
      commission_by_asset: sellCommissionByAsset,
    }
  }

  // 总手续费统计
  const totalCommissionByAsset: Record<string, number> = {}
  selectedTrades.forEach(trade => {
    const asset = trade.commissionAsset
    const commission = parseFloat(trade.commission)
    totalCommissionByAsset[asset] = (totalCommissionByAsset[asset] || 0) + commission
  })

  analysis.total_commission_by_asset = totalCommissionByAsset

  // 盈亏分析
  if (buyTrades.length > 0 && sellTrades.length > 0) {
    const minQty = Math.min(
      buyTrades.reduce((sum, t) => sum + parseFloat(t.qty), 0),
      sellTrades.reduce((sum, t) => sum + parseFloat(t.qty), 0)
    )
    const profitPerUnit = analysis.sell_stats.avg_price - analysis.buy_stats.avg_price
    const totalProfit = profitPerUnit * minQty
    const profitPercentage = (profitPerUnit / analysis.buy_stats.avg_price) * 100

    analysis.profit_stats = {
      price_diff: profitPerUnit,
      total_profit: totalProfit,
      profit_percentage: profitPercentage,
      min_qty: minQty,
    }
  }

  return analysis
} 