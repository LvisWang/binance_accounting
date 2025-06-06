'use client'

import { AlertCircle, Chrome, Globe } from 'lucide-react'

interface CorsHelperProps {
  onClose: () => void
}

export default function CorsHelper({ onClose }: CorsHelperProps) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 modal-overlay flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-2xl mx-4 max-h-[80vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-gray-800">解决 CORS 限制</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            ✕
          </button>
        </div>

        <div className="space-y-4">
          <div className="flex items-start space-x-3 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <AlertCircle className="text-yellow-600 mt-1" size={20} />
            <div>
              <h4 className="font-medium text-yellow-800">CORS 限制说明</h4>
              <p className="text-yellow-700 text-sm mt-1">
                浏览器的安全策略阻止了直接访问 Binance API。我们提供几种解决方案：
              </p>
            </div>
          </div>

          <div className="space-y-6">
            <div>
              <h4 className="font-medium text-gray-800 mb-3">方案 1: 使用浏览器扩展（推荐）</h4>
              
              <div className="space-y-3">
                <div className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center space-x-2 mb-2">
                    <Chrome size={20} className="text-blue-600" />
                    <span className="font-medium">Chrome 浏览器</span>
                  </div>
                  <ol className="text-sm text-gray-600 space-y-1 ml-6">
                    <li>1. 安装 "CORS Unblock" 或 "Allow CORS" 扩展</li>
                    <li>2. 在扩展中启用 CORS</li>
                    <li>3. 刷新页面并重试添加账户</li>
                  </ol>
                  <a 
                    href="https://chrome.google.com/webstore/search/cors"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 text-sm hover:underline mt-2 inline-block"
                  >
                    → 在 Chrome 商店搜索 CORS 扩展
                  </a>
                </div>

                <div className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center space-x-2 mb-2">
                    <Globe size={20} className="text-orange-600" />
                    <span className="font-medium">Firefox 浏览器</span>
                  </div>
                  <ol className="text-sm text-gray-600 space-y-1 ml-6">
                    <li>1. 地址栏输入: about:config</li>
                    <li>2. 搜索: security.tls.insecure_fallback_hosts</li>
                    <li>3. 添加: api.binance.com</li>
                    <li>4. 重启浏览器</li>
                  </ol>
                </div>
              </div>
            </div>

            <div>
              <h4 className="font-medium text-gray-800 mb-3">方案 2: 本地代理</h4>
              <div className="border border-gray-200 rounded-lg p-4">
                <p className="text-sm text-gray-600 mb-2">
                  如果你熟悉技术，可以在本地运行一个代理服务器：
                </p>
                <pre className="bg-gray-100 p-3 rounded text-xs overflow-x-auto">
{`# 安装并运行本地代理
npm install -g cors-anywhere
cors-anywhere --port 8080

# 然后在本工具中使用代理地址
http://localhost:8080/https://api.binance.com`}
                </pre>
              </div>
            </div>

            <div>
              <h4 className="font-medium text-gray-800 mb-3">方案 3: 桌面应用</h4>
              <div className="border border-gray-200 rounded-lg p-4">
                <p className="text-sm text-gray-600">
                  考虑使用桌面版的 Binance API 工具，或者原始的 Python 版本（在本地运行）。
                </p>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t">
            <button
              onClick={onClose}
              className="w-full bg-binance-yellow text-binance-dark py-2 px-4 rounded-lg font-medium hover:bg-yellow-400 transition-colors"
            >
              我已了解，继续尝试
            </button>
          </div>
        </div>
      </div>
    </div>
  )
} 