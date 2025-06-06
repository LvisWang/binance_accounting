import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Binance 多账户交易分析器',
  description: '分析多个 Binance 账户的交易记录，计算盈亏和手续费',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="zh-CN">
      <body className={inter.className}>
        <div className="min-h-screen bg-gray-50">
          <header className="bg-binance-dark text-white">
            <div className="container mx-auto px-4 py-4">
              <h1 className="text-2xl font-bold text-binance-yellow">
                Binance 多账户交易分析器
              </h1>
              <p className="text-gray-300">
                分析多个账户的交易记录，计算盈亏和手续费统计
              </p>
            </div>
          </header>
          <main className="container mx-auto px-4 py-8">
            {children}
          </main>
        </div>
      </body>
    </html>
  )
} 