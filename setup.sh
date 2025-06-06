#!/bin/bash

# 币安多账户交易分析工具安装脚本

echo "🚀 币安多账户交易分析工具 - 安装脚本"
echo "======================================="

# 检查Node.js是否安装
if ! command -v node &> /dev/null; then
    echo "❌ Node.js 未安装，请先安装 Node.js (建议版本 18+)"
    echo "   下载地址: https://nodejs.org/"
    exit 1
fi

echo "✅ Node.js 版本: $(node --version)"

# 检查npm是否可用
if ! command -v npm &> /dev/null; then
    echo "❌ npm 未安装"
    exit 1
fi

echo "✅ npm 版本: $(npm --version)"

# 安装依赖
echo ""
echo "📦 安装项目依赖..."
npm install

if [ $? -eq 0 ]; then
    echo "✅ 依赖安装成功"
else
    echo "❌ 依赖安装失败"
    exit 1
fi

# 创建配置文件
echo ""
echo "⚙️ 设置配置文件..."
if [ ! -f "config.py" ]; then
    cp config.py.template config.py
    echo "✅ 已创建 config.py 配置文件"
    echo "📝 请编辑 config.py 文件，添加你的 Binance API 密钥"
else
    echo "ℹ️ config.py 已存在，跳过创建"
fi

# 完成提示
echo ""
echo "🎉 安装完成！"
echo ""
echo "📋 下一步:"
echo "   1. 编辑 config.py 文件，添加你的 Binance API 密钥"
echo "   2. 运行 'npm run dev' 启动 Web 版本"
echo "   3. 或运行 'python app.py' 启动 Python 版本"
echo ""
echo "🔗 访问地址:"
echo "   Web 版本: http://localhost:3000"
echo "   Python 版本: http://localhost:5000"
echo ""
echo "⚠️ 安全提示: 请确保只给 API Key 读取权限，不要开启交易权限" 