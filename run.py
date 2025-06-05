#!/usr/bin/env python3
"""
运行脚本 - 启动 Binance 多账户交易分析网站
"""

from app import app

if __name__ == '__main__':
    print("🚀 启动 Binance 多账户交易分析网站...")
    print("📍 请在浏览器中访问: http://localhost:8080")
    print("⚠️  使用 Ctrl+C 停止服务器")
    print("-" * 50)
    
    app.run(
        debug=True,
        host='0.0.0.0',
        port=8080,
        threaded=True
    ) 