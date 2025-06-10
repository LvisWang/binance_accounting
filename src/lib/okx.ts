import crypto from 'crypto'
import { OKXAccount, BinanceTrade } from '@/types'

export class OKXClient {
  private apiKey: string
  private secretKey: string
  private passphrase: string
  private baseUrl: string

  constructor(account: OKXAccount) {
    this.apiKey = account.apiKey
    this.secretKey = account.secretKey
    this.passphrase = account.passphrase
    
    // 使用正确的 OKX API 端点
    this.baseUrl = 'https://www.okx.com'
    
    console.log('OKX Client initialized:', {
      baseUrl: this.baseUrl,
      hasApiKey: !!this.apiKey,
      hasSecretKey: !!this.secretKey,
      hasPassphrase: !!this.passphrase
    })
  }

  private getTimestamp(): string {
    // 使用与 Python 版本相同的时间戳格式 - 包含毫秒的 ISO 8601 格式
    const now = new Date()
    return now.toISOString().slice(0, -1) + 'Z' // 确保格式正确
  }

  private sign(timestamp: string, method: string, requestPath: string, body: string = ''): string {
    try {
      // 确保方法是大写，与 Python 版本一致
      const upperMethod = method.toUpperCase()
      
      // 构建消息：timestamp + method(大写) + requestPath + body
      const message = timestamp + upperMethod + requestPath + body
      
      console.log('OKX signing message:', {
        timestamp,
        method: upperMethod,
        requestPath: requestPath.substring(0, 50) + '...',
        bodyLength: body.length,
        messageLength: message.length
      })

      const hmac = crypto.createHmac('sha256', this.secretKey)
      const signature = hmac.update(message, 'utf8').digest('base64')
      
      console.log('OKX signature created successfully, length:', signature.length)
      return signature
    } catch (error) {
      console.error('Error creating OKX signature:', error)
      throw error
    }
  }

  private async makeRequest(endpoint: string, params: any = {}): Promise<any> {
    const timestamp = this.getTimestamp()
    const method = 'GET'
    
    // 构建完整的请求路径
    let requestPath = `/api/v5/${endpoint}`
    
    // 构建查询字符串
    if (Object.keys(params).length > 0) {
      const queryString = new URLSearchParams(params).toString()
      requestPath += `?${queryString}`
    }

    // 对于 GET 请求，body 为空字符串
    const body = ''
    const signature = this.sign(timestamp, method, requestPath, body)

    console.log('Making OKX request:', {
      endpoint,
      timestamp,
      requestPath: requestPath.substring(0, 100) + '...',
      hasSignature: !!signature
    })

    const url = `${this.baseUrl}${requestPath}`

    const response = await fetch(url, {
      method: method,
      headers: {
        'OK-ACCESS-KEY': this.apiKey,
        'OK-ACCESS-SIGN': signature,
        'OK-ACCESS-TIMESTAMP': timestamp,
        'OK-ACCESS-PASSPHRASE': this.passphrase,
        'Content-Type': 'application/json',
      },
    })

    console.log('OKX response status:', response.status, response.statusText)

    if (!response.ok) {
      const errorText = await response.text()
      console.error('OKX API Error Response:', {
        status: response.status,
        statusText: response.statusText,
        errorText: errorText.substring(0, 500)
      })
      throw new Error(`OKX API error: ${response.status} ${errorText}`)
    }

    const data = await response.json()
    
    // 检查 OKX API 响应格式
    if (data.code !== '0') {
      console.error('OKX API business error:', data)
      throw new Error(`OKX API error: ${data.msg || 'Unknown error'}`)
    }

    return data.data
  }

  async testConnection(): Promise<boolean> {
    try {
      console.log('Testing OKX connection...')
      
      // 首先尝试获取系统时间（无需身份验证）
      try {
        const timeResponse = await fetch(`${this.baseUrl}/api/v5/public/time`)
        if (timeResponse.ok) {
          const timeData = await timeResponse.json()
          console.log('OKX public endpoint accessible:', !!timeData)
        }
      } catch (e) {
        console.log('OKX public endpoint test failed:', e)
      }
      
      // 然后测试需要身份验证的端点
      const accountInfo = await this.makeRequest('account/balance')
      console.log('OKX account info request successful:', !!accountInfo)
      
      return true
    } catch (error) {
      console.error('OKX connection test failed:', {
        error: error instanceof Error ? error.message : error,
        stack: error instanceof Error ? error.stack : undefined
      })
      return false
    }
  }

  private convertSymbolToOKXFormat(symbol: string): string {
    // 将 BTCUSDT 转换为 BTC-USDT 格式
    const base_currencies = [
      'BTC', 'ETH', 'BNB', 'ADA', 'XRP', 'DOT', 'UNI', 'LINK', 'LTC', 'BCH',
      'SOL', 'MATIC', 'AVAX', 'ATOM', 'NEAR', 'FTM', 'ALGO', 'XLM', 'ICP',
      'HBAR', 'VET', 'MANA', 'SAND', 'AXS', 'THETA', 'EGLD', 'EOS', 'AAVE',
      'MKR', 'COMP', 'SUSHI', 'YFI', 'SNX', 'CRV', 'BAL', 'REN', 'KNC',
      'PNUT', 'DOGE', 'SHIB', 'PEPE', 'FLOKI', 'BONK'
    ]
    
    const quote_currencies = ['USDT', 'USDC', 'BTC', 'ETH', 'BNB']
    
    const symbolUpper = symbol.toUpperCase()
    
    // 尝试匹配基础货币和计价货币
    for (const base of base_currencies) {
      for (const quote of quote_currencies) {
        if (symbolUpper === base + quote) {
          return `${base}-${quote}`
        }
      }
    }
    
    // 如果没有匹配到，返回原始符号
    return symbol
  }

  private convertTradeToUnifiedFormat(okxTrade: any, originalSymbol: string, accountName: string): BinanceTrade {
    // 将 OKX 交易格式转换为统一格式（Binance 兼容）
    return {
      id: okxTrade.tradeId || okxTrade.fillId || '',
      orderId: okxTrade.ordId || '',
      symbol: originalSymbol,
      time: okxTrade.ts || '',
      price: okxTrade.fillPx || '0',
      qty: okxTrade.fillSz || '0',
      quoteQty: String(parseFloat(okxTrade.fillPx || '0') * parseFloat(okxTrade.fillSz || '0')),
      commission: Math.abs(parseFloat(okxTrade.fee || '0')).toString(),
      commissionAsset: okxTrade.feeCcy || 'USDT',
      isBuyer: (okxTrade.side || '').toLowerCase() === 'buy',
      isMaker: okxTrade.execType === 'M',
      account_name: accountName
    }
  }

  private convertOrderToTrade(order: any, originalSymbol: string, accountName: string): BinanceTrade | null {
    // 如果订单已成交，从订单信息中提取交易数据
    if (order.state === 'filled' && parseFloat(order.fillSz || '0') > 0) {
      return {
        id: order.ordId, // 使用订单ID作为交易ID
        orderId: order.ordId,
        symbol: originalSymbol,
        time: order.cTime || order.uTime, // 使用创建时间或更新时间
        price: order.avgPx || order.px || '0', // 优先使用平均成交价格
        qty: order.fillSz || '0', // 成交数量
        quoteQty: String(parseFloat(order.avgPx || order.px || '0') * parseFloat(order.fillSz || '0')),
        commission: Math.abs(parseFloat(order.fee || '0')).toString(),
        commissionAsset: order.feeCcy || 'USDT',
        isBuyer: order.side === 'buy',
        isMaker: order.ordType === 'limit', // 简单判断，限价单通常是maker
        account_name: accountName
      }
    }
    return null
  }

  private async getFillsHistory(symbol: string, startDate: Date, endDate: Date): Promise<any[]> {
    try {
      const okxSymbol = this.convertSymbolToOKXFormat(symbol)
      
      // 使用历史成交记录接口 - 参考Python版本
      const params: any = {
        limit: '100'
      }
      
      // 为现货交易对添加instType参数 - 参考Python逻辑
      if (okxSymbol.includes('-') && okxSymbol.includes('USDT')) {
        params.instType = 'SPOT'
        params.instId = okxSymbol
      } else {
        params.instId = okxSymbol
      }

      console.log('Fetching OKX fills history with params:', params)
      const fills = await this.makeRequest('trade/fills-history', params)
      
      if (!fills || !Array.isArray(fills)) {
        return []
      }

      // 过滤时间范围内的交易
      const filteredFills = fills.filter(fill => {
        const fillTime = parseInt(fill.ts)
        return fillTime >= startDate.getTime() && fillTime <= endDate.getTime()
      })

      console.log(`Found ${fills.length} total fills, ${filteredFills.length} in date range for ${okxSymbol}`)
      return filteredFills
    } catch (error) {
      console.error(`Failed to get OKX fills history for ${symbol}:`, error)
      return []
    }
  }

  private async getHistoryOrders(symbol: string, startDate: Date, endDate: Date): Promise<any[]> {
    try {
      const okxSymbol = this.convertSymbolToOKXFormat(symbol)
      
      // 使用历史订单接口获取数据
      const params = {
        instType: 'SPOT',  // 关键参数：指定现货交易
        instId: okxSymbol,
        begin: startDate.getTime().toString(),
        end: endDate.getTime().toString(),
        limit: '100'
      }

      console.log('Fetching OKX history orders with params:', params)
      const orders = await this.makeRequest('trade/orders-history', params)
      
      if (!orders || !Array.isArray(orders)) {
        return []
      }

      console.log(`Found ${orders.length} OKX orders for ${okxSymbol}`)
      return orders
    } catch (error) {
      console.error(`Failed to get OKX orders for ${symbol}:`, error)
      return []
    }
  }

  async getTradesForPeriod(symbol: string, startDate: string, endDate: string): Promise<BinanceTrade[]> {
    try {
      console.log(`Getting OKX trades for ${symbol} from ${startDate} to ${endDate}`)
      
      const allTrades: BinanceTrade[] = []
      const startDateObj = new Date(startDate)
      const endDateObj = new Date(endDate)
      
      // 方法1：直接获取历史成交记录（推荐）
      try {
        console.log('Trying fills-history method for OKX...')
        const fills = await this.getFillsHistory(symbol, startDateObj, endDateObj)
        
        if (fills.length > 0) {
          console.log(`Found ${fills.length} fills via fills-history method`)
          for (const fill of fills) {
            const trade = this.convertTradeToUnifiedFormat(fill, symbol, '')
            allTrades.push(trade)
          }
        }
      } catch (error) {
        console.error('Fills-history method failed:', error)
      }

      // 方法2：如果没有找到交易，尝试从订单中提取
      if (allTrades.length === 0) {
        console.log('No fills found, trying order-based method...')
        const orders = await this.getHistoryOrders(symbol, startDateObj, endDateObj)
        
        for (const order of orders) {
          const trade = this.convertOrderToTrade(order, symbol, '')
          if (trade) {
            allTrades.push(trade)
          }
        }
      }

      // 按时间排序
      allTrades.sort((a, b) => parseInt(a.time) - parseInt(b.time))
      
      console.log(`Total OKX trades found: ${allTrades.length}`)
      return allTrades
    } catch (error) {
      console.error('Failed to get OKX trades for period:', error)
      throw error
    }
  }

  // 备用方法：直接获取成交记录（旧版本兼容）
  async getTradesDirectly(symbol: string, startDate: string, endDate: string): Promise<BinanceTrade[]> {
    try {
      console.log(`Trying direct OKX fills API for ${symbol}`)
      
      const okxSymbol = this.convertSymbolToOKXFormat(symbol)
      const startDateObj = new Date(startDate)
      const endDateObj = new Date(endDate)
      
      const params = {
        instId: okxSymbol,
        instType: 'SPOT',  // 关键参数
        begin: startDateObj.getTime().toString(),
        end: endDateObj.getTime().toString(),
        limit: '100'
      }

      console.log('Direct fills request params:', params)
      const fills = await this.makeRequest('trade/fills', params)
      
      if (!fills || !Array.isArray(fills)) {
        return []
      }

      const trades = fills.map(fill => this.convertTradeToUnifiedFormat(fill, symbol, ''))
      
      // 按时间排序
      trades.sort((a, b) => parseInt(a.time) - parseInt(b.time))
      
      console.log(`Direct fills method found ${trades.length} trades`)
      return trades
    } catch (error) {
      console.error('Direct fills method failed:', error)
      return []
    }
  }
} 