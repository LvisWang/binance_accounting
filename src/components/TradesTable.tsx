'use client'

import { useState } from 'react'
import { BarChart3, Download, CheckSquare, Square } from 'lucide-react'
import { FormattedTrade, TradeAnalysis } from '@/types'
import AnalysisModal from './AnalysisModal'

interface TradesTableProps {
  trades: FormattedTrade[]
}

export default function TradesTable({ trades }: TradesTableProps) {
  const [selectedTrades, setSelectedTrades] = useState<number[]>([])
  const [analysis, setAnalysis] = useState<TradeAnalysis | null>(null)
  const [showAnalysis, setShowAnalysis] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleSelectAll = () => {
    if (selectedTrades.length === trades.length) {
      setSelectedTrades([])
    } else {
      setSelectedTrades(trades.map((_, index) => index))
    }
  }

  const handleSelectTrade = (index: number) => {
    setSelectedTrades(prev => {
      if (prev.includes(index)) {
        return prev.filter(i => i !== index)
      } else {
        return [...prev, index]
      }
    })
  }

  const getExchangeBadge = (exchange: string) => {
    if (exchange === 'binance') {
      return (
        <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-800">
          Binance
        </span>
      )
    } else if (exchange === 'okx') {
      return (
        <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
          OKX
        </span>
      )
    }
    return (
      <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-800">
        Unknown
      </span>
    )
  }

  const analyzeTrades = async () => {
    if (selectedTrades.length === 0) {
      alert('请先选择要分析的交易')
      return
    }

    setLoading(true)
    try {
      const response = await fetch('/api/analyze-trades', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          selected_indices: selectedTrades,
          trades: trades.map(t => t.raw_data),
        }),
      })

      const result = await response.json()

      if (result.success) {
        setAnalysis(result.analysis)
        setShowAnalysis(true)
      } else {
        alert(result.message || '分析失败')
      }
    } catch (err) {
      alert('网络错误，请检查连接')
    } finally {
      setLoading(false)
    }
  }

  const exportCSV = async () => {
    if (!analysis) {
      alert('请先进行交易分析')
      return
    }

    try {
      const selectedTradesData = selectedTrades.map(index => trades[index].raw_data)
      
      const response = await fetch('/api/export-csv', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          analysis,
          selected_trades: selectedTradesData,
          symbol: trades[0]?.raw_data.symbol || 'UNKNOWN',
        }),
      })

      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.style.display = 'none'
        a.href = url
        a.download = `trade_analysis_${new Date().toISOString().split('T')[0]}.csv`
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
      } else {
        alert('导出失败')
      }
    } catch (err) {
      alert('导出错误')
    }
  }

  return (
    <div className="bg-white rounded-lg shadow-md">
      <div className="p-6 border-b border-gray-200">
        <div className="flex justify-between items-center">
          <div>
            <h3 className="text-lg font-semibold text-gray-800">
              交易记录 ({trades.length} 条)
            </h3>
            {selectedTrades.length > 0 && (
              <p className="text-sm text-gray-600">
                已选择 {selectedTrades.length} 条记录
              </p>
            )}
          </div>
          <div className="flex space-x-2">
            <button
              onClick={analyzeTrades}
              disabled={selectedTrades.length === 0 || loading}
              className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50 flex items-center space-x-2"
            >
              <BarChart3 size={16} />
              <span>{loading ? '分析中...' : '分析选中'}</span>
            </button>
            {analysis && (
              <button
                onClick={exportCSV}
                className="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 transition-colors flex items-center space-x-2"
              >
                <Download size={16} />
                <span>导出报告</span>
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left">
                <button
                  onClick={handleSelectAll}
                  className="flex items-center space-x-2 text-gray-600 hover:text-gray-800"
                >
                  {selectedTrades.length === trades.length ? (
                    <CheckSquare size={16} />
                  ) : (
                    <Square size={16} />
                  )}
                  <span className="text-xs font-medium uppercase tracking-wider">
                    全选
                  </span>
                </button>
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                账户
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                交易所
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                时间
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                方向
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                价格
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                数量
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                金额
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                手续费
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {trades.map((trade, index) => (
              <tr
                key={trade.id}
                className={`trade-row cursor-pointer ${
                  selectedTrades.includes(index) ? 'bg-yellow-50 border-l-4 border-binance-yellow' : 'hover:bg-gray-50'
                }`}
                onClick={() => handleSelectTrade(index)}
              >
                <td className="px-6 py-4 whitespace-nowrap">
                  <button className="flex items-center">
                    {selectedTrades.includes(index) ? (
                      <CheckSquare size={16} className="text-binance-yellow" />
                    ) : (
                      <Square size={16} className="text-gray-400" />
                    )}
                  </button>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="text-sm font-medium text-gray-900">
                    {trade.account}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {getExchangeBadge(trade.exchange)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="text-sm text-gray-900">
                    {new Date(trade.time).toLocaleString('zh-CN', {
                      year: 'numeric',
                      month: '2-digit',
                      day: '2-digit',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span
                    className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      trade.direction === '买入'
                        ? 'bg-green-100 text-green-800'
                        : 'bg-red-100 text-red-800'
                    }`}
                  >
                    {trade.direction}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-900">
                  {trade.price.toFixed(6)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-900">
                  {trade.qty.toFixed(6)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-900">
                  {trade.amount.toFixed(2)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-900">
                  {trade.commission.toFixed(8)} {trade.commission_asset}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {trades.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          <p>暂无交易记录</p>
        </div>
      )}

      {/* 分析结果模态框 */}
      {showAnalysis && analysis && (
        <AnalysisModal
          analysis={analysis}
          selectedCount={selectedTrades.length}
          onClose={() => setShowAnalysis(false)}
          onExport={exportCSV}
        />
      )}
    </div>
  )
} 