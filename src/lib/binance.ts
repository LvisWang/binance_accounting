import crypto from 'crypto'
import { BinanceAccount, BinanceTrade } from '@/types'

export class BinanceClient {
  private apiKey: string
  private secretKey: string
  private baseUrl: string

  constructor(account: BinanceAccount) {
    this.apiKey = account.apiKey
    this.secretKey = account.secretKey
    
    // 尝试不同的 API 端点，提高连接成功率
    if (account.testnet) {
      this.baseUrl = 'https://testnet.binance.vision/api/v3'
    } else {
      // 生产环境：优先使用主域名，如果失败会在 testConnection 中尝试其他端点
      this.baseUrl = 'https://api.binance.com/api/v3'
    }
    
    // 调试 crypto 模块
    console.log('Crypto module available:', {
      hasCrypto: !!crypto,
      hasCreateHmac: !!(crypto && crypto.createHmac),
      baseUrl: this.baseUrl
    })
  }

  private sign(queryString: string): string {
    try {
      console.log('Signing query string, length:', queryString.length)
      const hmac = crypto.createHmac('sha256', this.secretKey)
      const signature = hmac.update(queryString).digest('hex')
      console.log('Signature created successfully, length:', signature.length)
      return signature
    } catch (error) {
      console.error('Error creating signature:', error)
      throw error
    }
  }

  private async makeRequest(endpoint: string, params: any = {}): Promise<any> {
    const timestamp = Date.now()
    const queryParams = {
      ...params,
      timestamp: timestamp.toString(),
    }

    console.log('Making request:', {
      endpoint,
      timestamp,
      params: Object.keys(params)
    })

    const queryString = new URLSearchParams(queryParams).toString()
    const signature = this.sign(queryString)
    const finalQueryString = `${queryString}&signature=${signature}`

    console.log('Request details:', {
      queryString: queryString.substring(0, 100) + '...',
      signatureLength: signature.length,
      finalQueryStringLength: finalQueryString.length
    })

    const url = `${this.baseUrl}/${endpoint}?${finalQueryString}`

    const response = await fetch(url, {
      headers: {
        'X-MBX-APIKEY': this.apiKey,
      },
    })

    console.log('Response status:', response.status, response.statusText)

    if (!response.ok) {
      const errorText = await response.text()
      console.error('API Error Response:', {
        status: response.status,
        statusText: response.statusText,
        errorText: errorText.substring(0, 500)
      })
      throw new Error(`Binance API error: ${response.status} ${errorText}`)
    }

    return response.json()
  }

  async testConnection(): Promise<boolean> {
    // 备用 API 端点列表
    const apiEndpoints = [
      'https://api.binance.com/api/v3',
      'https://api1.binance.com/api/v3',
      'https://api2.binance.com/api/v3',
      'https://api3.binance.com/api/v3'
    ]

    // 如果是测试网，只使用测试网端点
    const endpointsToTry = this.baseUrl.includes('testnet') 
      ? ['https://testnet.binance.vision/api/v3']
      : apiEndpoints

    for (const endpoint of endpointsToTry) {
      try {
        console.log(`Testing Binance connection with endpoint: ${endpoint}`)
        
        // 先测试服务器时间
        const serverTimeResponse = await fetch(`${endpoint}/time`)
        console.log(`Server time response status for ${endpoint}:`, serverTimeResponse.status)
        
        if (!serverTimeResponse.ok) {
          console.error(`Server time request failed for ${endpoint}:`, serverTimeResponse.status)
          continue // 尝试下一个端点
        }

        const serverTime = await serverTimeResponse.json()
        console.log(`Server time from ${endpoint}:`, serverTime)

        // 如果服务器时间测试成功，更新 baseUrl 并测试账户信息
        const originalBaseUrl = this.baseUrl
        this.baseUrl = endpoint

        console.log('Testing account info request...')
        const accountInfo = await this.makeRequest('account')
        console.log('Account info request successful:', !!accountInfo)
        
        return true // 成功
      } catch (error) {
        console.error(`Connection test failed for endpoint ${endpoint}:`, {
          error: error instanceof Error ? error.message : error,
          stack: error instanceof Error ? error.stack : undefined,
          name: error instanceof Error ? error.name : undefined
        })
        continue // 尝试下一个端点
      }
    }

    console.error('All API endpoints failed')
    return false
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
        startTime: startTime.getTime().toString(),
        endTime: endTime.getTime().toString(),
        limit: '1000',
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
    exchange: trade.exchange || 'binance', // 默认为 binance，支持 OKX 传入的 exchange 字段
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
    accounts: Array.from(new Set(selectedTrades.map(t => t.account_name))),
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