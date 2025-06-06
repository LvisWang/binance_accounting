'use client'

import { useState, useEffect } from 'react'
import { Search, Calendar } from 'lucide-react'

interface QueryFormProps {
  onSubmit: (params: { symbol: string; start_date: string; end_date: string }) => void
  loading: boolean
}

export default function QueryForm({ onSubmit, loading }: QueryFormProps) {
  const [formData, setFormData] = useState({
    symbol: 'PNUTUSDT',
    start_date: '',
    end_date: '',
  })
  const [selectedQuickRange, setSelectedQuickRange] = useState<number | null>(null)

  // 设置默认日期（最近7天）
  useEffect(() => {
    const today = new Date()
    const sevenDaysAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000)
    
    setFormData(prev => ({
      ...prev,
      start_date: sevenDaysAgo.toISOString().split('T')[0],
      end_date: today.toISOString().split('T')[0],
    }))
    setSelectedQuickRange(7) // 默认选中7天
  }, [])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (formData.symbol && formData.start_date && formData.end_date) {
      onSubmit(formData)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    if (name === 'symbol') {
      setFormData(prev => ({
        ...prev,
        [name]: value.toUpperCase(),
      }))
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value,
      }))
      // 如果用户手动改变日期，清除快速选择状态
      setSelectedQuickRange(null)
    }
  }

  const setQuickDate = (days: number) => {
    const today = new Date()
    const pastDate = new Date(today.getTime() - days * 24 * 60 * 60 * 1000)
    
    setFormData(prev => ({
      ...prev,
      start_date: pastDate.toISOString().split('T')[0],
      end_date: today.toISOString().split('T')[0],
    }))
    setSelectedQuickRange(days)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid md:grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            交易对
          </label>
          <input
            type="text"
            name="symbol"
            value={formData.symbol}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-binance-yellow text-gray-900 bg-white"
            placeholder="例如: BTCUSDT"
            required
            disabled={loading}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            开始日期
          </label>
          <div className="relative">
            <input
              type="date"
              name="start_date"
              value={formData.start_date}
              onChange={handleChange}
              className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg focus:outline-none focus:border-binance-yellow text-gray-900 bg-white"
              required
              disabled={loading}
            />
            <Calendar className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            结束日期
          </label>
          <div className="relative">
            <input
              type="date"
              name="end_date"
              value={formData.end_date}
              onChange={handleChange}
              className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg focus:outline-none focus:border-binance-yellow text-gray-900 bg-white"
              required
              disabled={loading}
            />
            <Calendar className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
          </div>
        </div>
      </div>

      {/* 快速日期选择 */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          快速选择时间范围
        </label>
        <div className="flex flex-wrap gap-2">
          {[
            { label: '最近3天', days: 3 },
            { label: '最近7天', days: 7 },
            { label: '最近15天', days: 15 },
            { label: '最近30天', days: 30 },
          ].map(({ label, days }) => (
            <button
              key={days}
              type="button"
              onClick={() => setQuickDate(days)}
              className={`quick-date-btn px-4 py-2 text-sm rounded-lg transition-colors ${
                selectedQuickRange === days
                  ? 'bg-binance-yellow text-binance-dark font-semibold'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
              disabled={loading}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* 提交按钮 */}
      <div className="flex justify-center">
        <button
          type="submit"
          className="px-8 py-3 bg-binance-yellow text-binance-dark rounded-lg font-medium hover:bg-yellow-400 transition-colors disabled:opacity-50 flex items-center space-x-2"
          disabled={loading || !formData.symbol || !formData.start_date || !formData.end_date}
        >
          <Search size={16} />
          <span>{loading ? '查询中...' : '查询交易记录'}</span>
        </button>
      </div>

      {/* 提示信息 */}
      <div className="text-sm text-gray-600 bg-blue-50 p-3 rounded-lg">
        <p className="font-medium mb-1">💡 查询提示：</p>
        <ul className="text-xs space-y-1 text-gray-500">
          <li>• 系统将从所有已添加的账户中查询指定交易对的记录</li>
          <li>• 系统会自动按天分段查询，避免 API 限制</li>
          <li>• 查询结果包含买入、卖出所有类型的交易</li>
        </ul>
      </div>
    </form>
  )
}