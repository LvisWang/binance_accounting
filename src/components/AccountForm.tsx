'use client'

import { useState } from 'react'
import { X, Eye, EyeOff } from 'lucide-react'
import { BinanceAccount } from '@/types'

interface AccountFormProps {
  onSubmit: (account: BinanceAccount) => void
  onCancel: () => void
  loading: boolean
}

export default function AccountForm({ onSubmit, onCancel, loading }: AccountFormProps) {
  const [formData, setFormData] = useState({
    name: '',
    apiKey: '',
    secretKey: '',
    testnet: false,
  })
  const [showApiKey, setShowApiKey] = useState(false)
  const [showSecretKey, setShowSecretKey] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (formData.name && formData.apiKey && formData.secretKey) {
      onSubmit(formData)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }))
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 modal-overlay flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-gray-800">添加 Binance 账户</h3>
          <button
            onClick={onCancel}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            disabled={loading}
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              账户名称
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-binance-yellow text-gray-900 bg-white"
              placeholder="输入账户名称"
              required
              disabled={loading}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              API Key
            </label>
            <div className="relative">
              <input
                type={showApiKey ? 'text' : 'password'}
                name="apiKey"
                value={formData.apiKey}
                onChange={handleChange}
                className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg focus:outline-none focus:border-binance-yellow text-gray-900 bg-white"
                placeholder="输入 API Key"
                required
                disabled={loading}
              />
              <button
                type="button"
                onClick={() => setShowApiKey(!showApiKey)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                disabled={loading}
              >
                {showApiKey ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Secret Key
            </label>
            <div className="relative">
              <input
                type={showSecretKey ? 'text' : 'password'}
                name="secretKey"
                value={formData.secretKey}
                onChange={handleChange}
                className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg focus:outline-none focus:border-binance-yellow text-gray-900 bg-white"
                placeholder="输入 Secret Key"
                required
                disabled={loading}
              />
              <button
                type="button"
                onClick={() => setShowSecretKey(!showSecretKey)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                disabled={loading}
              >
                {showSecretKey ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              name="testnet"
              id="testnet"
              checked={formData.testnet}
              onChange={handleChange}
              className="h-4 w-4 text-binance-yellow focus:ring-binance-yellow border-gray-300 rounded"
              disabled={loading}
            />
            <label htmlFor="testnet" className="ml-2 block text-sm text-gray-700">
              使用测试网
            </label>
          </div>

          <div className="flex space-x-3 pt-4">
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              disabled={loading}
            >
              取消
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-binance-yellow text-binance-dark rounded-lg hover:bg-yellow-400 transition-colors disabled:opacity-50"
              disabled={loading || !formData.name || !formData.apiKey || !formData.secretKey}
            >
              {loading ? '添加中...' : '添加账户'}
            </button>
          </div>
        </form>

        <div className="mt-4 text-sm text-gray-600">
          <p className="mb-2">⚠️ 安全提示：</p>
          <ul className="text-xs space-y-1 text-gray-500">
            <li>• API Key 仅在本地存储，不会上传到服务器</li>
            <li>• 建议创建仅用于查询的只读 API Key</li>
            <li>• 不要在公共环境中输入真实的 API 密钥</li>
          </ul>
        </div>
      </div>
    </div>
  )
} 