import crypto from 'crypto'
import { BybitAccount } from '@/types'

export class BybitClient {
  private account: BybitAccount
  private baseUrl: string
  private recvWindow: number = 20000
  private serverTimeOffset: number = 0

  constructor(account: BybitAccount) {
    this.account = account
    this.baseUrl = account.testnet 
      ? 'https://api-testnet.bybit.com'
      : 'https://api.bybit.com'
  }

  private async syncServerTime(): Promise<void> {
    try {
      const response = await fetch(`${this.baseUrl}/v5/market/time`)
      if (response.ok) {
        const result = await response.json()
        if (result.retCode === 0) {
          const serverTime = parseInt(result.result.timeSecond) * 1000
          const localTime = Date.now()
          this.serverTimeOffset = serverTime - localTime
        }
      }
    } catch (error) {
      console.warn('Failed to sync server time:', error)
      this.serverTimeOffset = 0
    }
  }

  private getTimestamp(): string {
    return String(Date.now() + this.serverTimeOffset)
  }

  private generateSignature(timestamp: string, params: string): string {
    const paramStr = `${timestamp}${this.account.apiKey}${this.recvWindow}${params}`
    return crypto
      .createHmac('sha256', this.account.secretKey)
      .update(paramStr)
      .digest('hex')
  }

  private async makeRequest(endpoint: string, params: Record<string, any> = {}): Promise<any> {
    await this.syncServerTime()
    
    const timestamp = this.getTimestamp()
    const queryString = new URLSearchParams(params).toString()
    const signature = this.generateSignature(timestamp, queryString)

    const url = queryString 
      ? `${this.baseUrl}/${endpoint}?${queryString}`
      : `${this.baseUrl}/${endpoint}`

    const headers = {
      'X-BAPI-API-KEY': this.account.apiKey,
      'X-BAPI-SIGN': signature,
      'X-BAPI-TIMESTAMP': timestamp,
      'X-BAPI-RECV-WINDOW': this.recvWindow.toString(),
      'Content-Type': 'application/json',
    }

    const response = await fetch(url, {
      method: 'GET',
      headers,
    })

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    }

    const data = await response.json()
    
    if (data.retCode !== 0) {
      throw new Error(`Bybit API Error: ${data.retMsg || 'Unknown error'}`)
    }

    return data.result
  }

  async testConnection(): Promise<boolean> {
    try {
      // 测试统一账户余额查询 - 这个API需要认证但是权限要求较低
      await this.makeRequest('v5/asset/transfer/query-account-coins-balance', {
        accountType: 'UNIFIED',
        coin: 'USDT'
      })
      
      return true
    } catch (error) {
      console.error('Bybit connection test failed:', error)
      return false
    }
  }

  async getAccountBalance(): Promise<any> {
    return this.makeRequest('v5/asset/transfer/query-account-coins-balance', {
      accountType: 'UNIFIED'
    })
  }

  async getExecutionHistory(symbol: string, startTime?: string, endTime?: string, limit: number = 100): Promise<any> {
    const params: Record<string, any> = {
      category: 'spot',
      symbol: symbol.toUpperCase(),
      limit: limit.toString()
    }

    if (startTime) params.startTime = startTime
    if (endTime) params.endTime = endTime

    return this.makeRequest('v5/execution/list', params)
  }

  private async getTradesForDay(symbol: string, dateStr: string): Promise<any[]> {
    try {
      // 计算当天的开始和结束时间戳
      const date = new Date(dateStr)
      const startTime = date.getTime().toString()
      const endTime = new Date(date.getTime() + 24 * 60 * 60 * 1000 - 1).getTime().toString()

      console.log(`正在获取 ${dateStr} 的交易记录...`)

      const result = await this.getExecutionHistory(symbol, startTime, endTime, 100)
      
      if (result && result.list) {
        console.log(`  获取到 ${result.list.length} 条记录`)
        return result.list
      }
      
      console.log(`  这个时间段没有交易记录`)
      return []
    } catch (error) {
      console.error(`  获取 ${dateStr} 数据时出错:`, error)
      return []
    }
  }

  async getTrades(symbol: string, startDate: string, endDate: string): Promise<any[]> {
    console.log(`开始获取 ${symbol} 从 ${startDate} 到 ${endDate} 的交易记录...`)
    
    const allTrades: any[] = []
    
    try {
      // 按天分段查询，避免7天限制
      const currentDate = new Date(startDate)
      const endDateObj = new Date(endDate)
      
      while (currentDate <= endDateObj) {
        const dateStr = currentDate.toISOString().split('T')[0]
        const dayTrades = await this.getTradesForDay(symbol, dateStr)
        
        // 转换为统一格式
        for (const trade of dayTrades) {
          allTrades.push({
            id: trade.execId || '',
            orderId: trade.orderId || '',
            symbol: symbol,
            time: trade.execTime || '',
            price: trade.execPrice || '0',
            qty: trade.execQty || '0',
            quoteQty: String(parseFloat(trade.execPrice || '0') * parseFloat(trade.execQty || '0')),
            commission: trade.execFee || '0',
            commissionAsset: trade.feeCurrency || 'USDT',
            isBuyer: trade.side?.toLowerCase() === 'buy',
            isMaker: trade.execType === 'Trade',
            account_name: this.account.name,
            exchange: 'bybit'
          })
        }
        
        // 移动到下一天
        currentDate.setDate(currentDate.getDate() + 1)
        
        // 添加延迟避免频率限制
        if (dayTrades.length > 0) {
          await new Promise(resolve => setTimeout(resolve, 200))
        }
      }
      
      console.log(`总共获取到 ${allTrades.length} 条交易记录`)
      
    } catch (error) {
      console.error('Failed to get Bybit trades:', error)
      throw error
    }

    return allTrades
  }
} 