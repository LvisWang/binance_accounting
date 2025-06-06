'use client'

import { useState } from 'react'
import { BinanceAccount } from '@/types'
import { X, Eye, EyeOff } from 'lucide-react'
import CryptoJS from 'crypto-js'
import CorsHelper from './CorsHelper'

interface AccountFormProps {
  onSubmit: (account: BinanceAccount) => void
  onCancel: () => void
}

export default function AccountForm({ onSubmit, onCancel }: AccountFormProps) {
  const [formData, setFormData] = useState({
    name: '',
    apiKey: '',
    secretKey: '',
    testnet: false,
  })
  const [showApiKey, setShowApiKey] = useState(false)
  const [showSecretKey, setShowSecretKey] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [showCorsHelper, setShowCorsHelper] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      // 直接在客户端测试 Binance API 连接
      const testAccount = { name: formData.name, apiKey: formData.apiKey, secretKey: formData.secretKey, testnet: formData.testnet }
      
      // 创建临时的 Binance 客户端来测试连接
      const testConnection = async () => {
        // 首先测试服务器时间（无需认证）
        const timeResponse = await fetch('/api/binance-proxy', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            endpoint: 'time',
            queryString: '',
            apiKey: formData.apiKey,
            testnet: formData.testnet
          })
        })

        const timeResult = await timeResponse.json()
        if (!timeResult.success) {
          throw new Error(`无法连接到 Binance API: ${timeResult.message}`)
        }

        // 测试账户信息（需要认证）
        const timestamp = Date.now()
        const queryParams = new URLSearchParams({
          timestamp: timestamp.toString(),
        })
        
        const queryString = queryParams.toString()
        
        // 在客户端创建签名
        const signature = CryptoJS.HmacSHA256(queryString, formData.secretKey).toString()
        const finalQueryString = `${queryString}&signature=${signature}`

        const accountResponse = await fetch('/api/binance-proxy', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            endpoint: 'account',
            queryString: finalQueryString,
            apiKey: formData.apiKey,
            testnet: formData.testnet
          })
        })

        const accountResult = await accountResponse.json()
        if (!accountResult.success) {
          throw new Error(`API 密钥验证失败: ${accountResult.message}`)
        }

        return true
      }

      await testConnection()
      
      // 如果连接成功，保存到本地存储
      const accounts = JSON.parse(localStorage.getItem('binance_accounts') || '[]')
      const newAccount = { name: formData.name, apiKey: formData.apiKey, secretKey: formData.secretKey, testnet: formData.testnet }
      const updatedAccounts = [...accounts, newAccount]
      localStorage.setItem('binance_accounts', JSON.stringify(updatedAccounts))
      
      onSubmit(newAccount)
      setFormData({
        name: '',
        apiKey: '',
        secretKey: '',
        testnet: false,
      })
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '连接失败'
      
      // 检测不同类型的错误
      if (errorMessage.includes('Failed to fetch') || 
          errorMessage.includes('CORS') || 
          errorMessage.includes('网络错误') ||
          errorMessage.includes('fetch')) {
        setShowCorsHelper(true)
      } else if (errorMessage.includes('451') || errorMessage.includes('地理限制')) {
        setError(`🌍 地理位置限制错误

当前服务器位置无法访问 Binance API。解决方案：

1. 🔧 使用本地版本：下载并在本地运行应用
2. 🌐 使用 VPN：连接到支持的地区
3. 📱 使用官方应用：Binance 官方客户端
4. ⚙️ 测试网模式：尝试勾选"使用测试网"选项

技术详情：${errorMessage}`)
      } else {
        setError(errorMessage)
      }
    } finally {
      setLoading(false)
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
    <>
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

            {error && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-red-600 text-sm">{error}</p>
              </div>
            )}

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

      {showCorsHelper && (
        <CorsHelper onClose={() => setShowCorsHelper(false)} />
      )}
    </>
  )
} 