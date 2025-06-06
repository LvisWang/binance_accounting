#!/usr/bin/env python3
"""
配置文件 - 默认配置参数
"""

# 🔑 Binance API 配置（在网站中动态输入，这里只作为示例）
API_KEY = ""  # 用户在网站中输入
SECRET_KEY = ""  # 用户在网站中输入

# 🎯 交易配置
DEFAULT_SYMBOL = "PNUTUSDT"  # 默认交易对
DEFAULT_DAYS = 30  # 默认导出天数

# 🌐 其他配置
TESTNET = False  # 是否使用测试网
EXPORT_FORMAT = "both"  # 导出格式: "csv", "json", "both" 