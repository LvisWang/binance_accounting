'use client'

import { useState, useEffect } from 'react'
import { Plus, Trash2, Search, AlertCircle } from 'lucide-react'
import { BinanceAccount, FormattedTrade, AccountStats } from '@/types'
import TradesTable from '@/components/TradesTable'
import AccountForm from '@/components/AccountForm'
import QueryForm from '@/components/QueryForm'

export default function Home() {
  const [accounts, setAccounts] = useState<BinanceAccount[]>([])
  const [trades, setTrades] = useState<FormattedTrade[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [accountStats, setAccountStats] = useState<AccountStats>({})
  const [showAccountForm, setShowAccountForm] = useState(false)

  // 从 localStorage 加载账户
  useEffect(() => {
    const savedAccounts = localStorage.getItem('binance-accounts')
    if (savedAccounts) {
      try {
        setAccounts(JSON.parse(savedAccounts))
      } catch (e) {
        console.error('Failed to load accounts from localStorage:', e)
      }
    }
  }, [])

  // 保存账户到 localStorage
  useEffect(() => {
    localStorage.setItem('binance-accounts', JSON.stringify(accounts))
  }, [accounts])

  const addAccount = async (account: BinanceAccount) => {
    setLoading(true)
    setError('')

    try {
      const response = await fetch('/api/add-account', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(account),
      })

      const result = await response.json()

      if (result.success) {
        setAccounts(prev => [...prev, account])
        setShowAccountForm(false)
      } else {
        setError(result.message || '添加账户失败')
      }
    } catch (err) {
      setError('网络错误，请检查连接')
    } finally {
      setLoading(false)
    }
  }

  const removeAccount = (index: number) => {
    setAccounts(prev => prev.filter((_, i) => i !== index))
  }

  const clearAllAccounts = () => {
    setAccounts([])
    setTrades([])
    setAccountStats({})
  }

  const queryTrades = async (params: { symbol: string; start_date: string; end_date: string }) => {
    if (accounts.length === 0) {
      setError('请先添加至少一个账户')
      return
    }

    setLoading(true)
    setError('')

    try {
      const response = await fetch('/api/query-trades', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...params,
          accounts,
        }),
      })

      const result = await response.json()

      if (result.success) {
        setTrades(result.trades)
        setAccountStats(result.account_stats)
      } else {
        setError(result.message || '查询交易失败')
      }
    } catch (err) {
      setError('网络错误，请检查连接')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-8">
      {/* 账户管理区域 */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-gray-800">账户管理</h2>
          <div className="flex space-x-2">
            <button
              onClick={() => setShowAccountForm(true)}
              className="bg-binance-yellow text-binance-dark px-4 py-2 rounded-lg font-medium hover:bg-yellow-400 transition-colors flex items-center space-x-2"
            >
              <Plus size={16} />
              <span>添加账户</span>
            </button>
            {accounts.length > 0 && (
              <button
                onClick={clearAllAccounts}
                className="bg-red-500 text-white px-4 py-2 rounded-lg font-medium hover:bg-red-600 transition-colors flex items-center space-x-2"
              >
                <Trash2 size={16} />
                <span>清除所有</span>
              </button>
            )}
          </div>
        </div>

        {accounts.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <AlertCircle size={48} className="mx-auto mb-4 text-gray-300" />
            <p>还没有添加任何账户</p>
            <p className="text-sm">点击"添加账户"开始使用</p>
          </div>
        ) : (
          <div className="grid gap-4">
            {accounts.map((account, index) => (
              <div key={index} className="bg-gray-50 rounded-lg p-4 flex justify-between items-center">
                <div>
                  <h3 className="font-medium text-gray-800">{account.name}</h3>
                  <p className="text-sm text-gray-600">
                    API Key: {account.apiKey.substring(0, 8)}...
                    {account.testnet && (
                      <span className="ml-2 bg-orange-100 text-orange-800 px-2 py-1 rounded text-xs">
                        测试网
                      </span>
                    )}
                  </p>
                </div>
                <button
                  onClick={() => removeAccount(index)}
                  className="text-red-500 hover:text-red-700 p-2"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 添加账户表单模态框 */}
      {showAccountForm && (
        <AccountForm
          onSubmit={addAccount}
          onCancel={() => setShowAccountForm(false)}
          loading={loading}
        />
      )}

      {/* 查询交易区域 */}
      {accounts.length > 0 && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">查询交易记录</h2>
          <QueryForm onSubmit={queryTrades} loading={loading} />
        </div>
      )}

      {/* 错误提示 */}
      {error && (
        <div className="bg-red-50 border-l-4 border-red-400 p-4 rounded">
          <div className="flex">
            <AlertCircle className="text-red-400" size={16} />
            <div className="ml-3">
              <p className="text-red-700">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* 账户统计 */}
      {Object.keys(accountStats).length > 0 && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">账户查询结果</h3>
          <div className="grid gap-3">
            {Object.entries(accountStats).map(([accountName, stats]) => (
              <div
                key={accountName}
                className={`p-3 rounded-lg ${
                  stats.success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'
                }`}
              >
                <div className="flex justify-between items-center">
                  <span className="font-medium">{accountName}</span>
                  <span className={`text-sm ${stats.success ? 'text-green-600' : 'text-red-600'}`}>
                    {stats.success ? `${stats.count} 条记录` : '查询失败'}
                  </span>
                </div>
                {!stats.success && stats.error && (
                  <p className="text-red-600 text-sm mt-1">{stats.error}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 交易记录表格 */}
      {trades.length > 0 && <TradesTable trades={trades} />}
    </div>
  )
} 