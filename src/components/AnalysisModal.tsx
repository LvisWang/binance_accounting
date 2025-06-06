'use client'

import { X, TrendingUp, TrendingDown, DollarSign, Users } from 'lucide-react'
import { TradeAnalysis } from '@/types'

interface AnalysisModalProps {
  analysis: TradeAnalysis
  selectedCount: number
  onClose: () => void
  onExport: () => void
}

export default function AnalysisModal({ analysis, selectedCount, onClose, onExport }: AnalysisModalProps) {
  const formatNumber = (num: number, decimals = 6) => {
    return num.toLocaleString('zh-CN', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    })
  }

  const formatCurrency = (num: number) => {
    return num.toLocaleString('zh-CN', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        {/* 头部 */}
        <div className="flex justify-between items-center p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-800">交易分析报告</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X size={24} />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* 分析摘要 */}
          <div className="analysis-card rounded-lg p-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center">
              <DollarSign className="mr-2" size={20} />
              分析摘要
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold">{selectedCount}</div>
                <div className="text-sm opacity-80">选中交易数</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-300">{analysis.buy_count}</div>
                <div className="text-sm opacity-80">买入交易</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-red-300">{analysis.sell_count}</div>
                <div className="text-sm opacity-80">卖出交易</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold">{analysis.accounts.length}</div>
                <div className="text-sm opacity-80">涉及账户</div>
              </div>
            </div>
            
            <div className="mt-4">
              <div className="flex items-center text-sm opacity-80">
                <Users className="mr-2" size={16} />
                <span>涉及账户: {analysis.accounts.join(', ')}</span>
              </div>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {/* 买入统计 */}
            {analysis.buy_stats && (
              <div className="bg-green-50 rounded-lg p-6 border border-green-200">
                <h4 className="text-lg font-semibold text-green-800 mb-4 flex items-center">
                  <TrendingUp className="mr-2" size={20} />
                  买入统计 ({analysis.buy_count} 条)
                </h4>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-green-700">平均买入价格:</span>
                    <span className="font-medium text-green-900">
                      {formatNumber(analysis.buy_stats.avg_price)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-green-700">总买入数量:</span>
                    <span className="font-medium text-green-900">
                      {formatNumber(analysis.buy_stats.total_qty)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-green-700">总买入金额:</span>
                    <span className="font-medium text-green-900">
                      ${formatCurrency(analysis.buy_stats.total_amount)}
                    </span>
                  </div>
                  <div className="border-t border-green-200 pt-2">
                    <div className="text-green-700 text-sm mb-1">买入手续费:</div>
                    {Object.entries(analysis.buy_stats.commission_by_asset).map(([asset, amount]) => (
                      <div key={asset} className="flex justify-between text-sm">
                        <span className="text-green-600">{asset}:</span>
                        <span className="font-medium text-green-800">
                          {formatNumber(amount, 8)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* 卖出统计 */}
            {analysis.sell_stats && (
              <div className="bg-red-50 rounded-lg p-6 border border-red-200">
                <h4 className="text-lg font-semibold text-red-800 mb-4 flex items-center">
                  <TrendingDown className="mr-2" size={20} />
                  卖出统计 ({analysis.sell_count} 条)
                </h4>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-red-700">平均卖出价格:</span>
                    <span className="font-medium text-red-900">
                      {formatNumber(analysis.sell_stats.avg_price)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-red-700">总卖出数量:</span>
                    <span className="font-medium text-red-900">
                      {formatNumber(analysis.sell_stats.total_qty)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-red-700">总卖出金额:</span>
                    <span className="font-medium text-red-900">
                      ${formatCurrency(analysis.sell_stats.total_amount)}
                    </span>
                  </div>
                  <div className="border-t border-red-200 pt-2">
                    <div className="text-red-700 text-sm mb-1">卖出手续费:</div>
                    {Object.entries(analysis.sell_stats.commission_by_asset).map(([asset, amount]) => (
                      <div key={asset} className="flex justify-between text-sm">
                        <span className="text-red-600">{asset}:</span>
                        <span className="font-medium text-red-800">
                          {formatNumber(amount, 8)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* 盈亏分析 */}
          {analysis.profit_stats && (
            <div className={`rounded-lg p-6 border ${
              analysis.profit_stats.profit_percentage >= 0
                ? 'bg-green-50 border-green-200'
                : 'bg-red-50 border-red-200'
            }`}>
              <h4 className="text-lg font-semibold mb-4 flex items-center">
                <DollarSign className="mr-2" size={20} />
                <span className={
                  analysis.profit_stats.profit_percentage >= 0
                    ? 'text-green-800'
                    : 'text-red-800'
                }>
                  盈亏分析
                </span>
              </h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <div className="text-sm text-gray-600">价差</div>
                  <div className={`text-lg font-bold ${
                    analysis.profit_stats.price_diff >= 0 ? 'profit-positive' : 'profit-negative'
                  }`}>
                    {analysis.profit_stats.price_diff >= 0 ? '+' : ''}
                    {formatNumber(analysis.profit_stats.price_diff)}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-gray-600">总盈亏</div>
                  <div className={`text-lg font-bold ${
                    analysis.profit_stats.total_profit >= 0 ? 'profit-positive' : 'profit-negative'
                  }`}>
                    {analysis.profit_stats.total_profit >= 0 ? '+' : ''}
                    ${formatCurrency(analysis.profit_stats.total_profit)}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-gray-600">盈亏百分比</div>
                  <div className={`text-lg font-bold ${
                    analysis.profit_stats.profit_percentage >= 0 ? 'profit-positive' : 'profit-negative'
                  }`}>
                    {analysis.profit_stats.profit_percentage >= 0 ? '+' : ''}
                    {analysis.profit_stats.profit_percentage.toFixed(2)}%
                  </div>
                </div>
                <div>
                  <div className="text-sm text-gray-600">基准数量</div>
                  <div className="text-lg font-bold text-gray-800">
                    {formatNumber(analysis.profit_stats.min_qty)}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 总手续费统计 */}
          <div className="bg-gray-50 rounded-lg p-6 border border-gray-200">
            <h4 className="text-lg font-semibold text-gray-800 mb-4">总手续费统计</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {Object.entries(analysis.total_commission_by_asset).map(([asset, amount]) => (
                <div key={asset} className="flex justify-between items-center p-3 bg-white rounded border">
                  <span className="font-medium text-gray-700">{asset}</span>
                  <span className="font-bold text-gray-900">
                    {formatNumber(amount, 8)}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* 操作按钮 */}
          <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
            <button
              onClick={onClose}
              className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              关闭
            </button>
            <button
              onClick={onExport}
              className="px-6 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
            >
              导出详细报告
            </button>
          </div>
        </div>
      </div>
    </div>
  )
} 