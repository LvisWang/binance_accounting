#!/usr/bin/env python3
"""
OKX 交易记录导出器 - 对应 Binance 版本
包含网络重试机制和交互式导出功能
"""

import requests
import hmac
import hashlib
import time
import json
import csv
import base64
from datetime import datetime, timedelta
from urllib.parse import urlencode
from requests.adapters import HTTPAdapter
from urllib3.util.retry import Retry

class OKXTradeExporter:
    """OKX 交易记录导出器"""
    
    def __init__(self, api_key=None, secret_key=None, passphrase=None, testnet=None):
        self.api_key = api_key
        self.secret_key = secret_key
        self.passphrase = passphrase
        testnet = testnet if testnet is not None else False
        self.base_url = "https://www.okx.com" if not testnet else "https://www.okx.com"
        
        # 创建带重试机制的session
        self.session = self._create_retry_session()
        
    def _create_retry_session(self):
        """创建带重试机制的requests session"""
        session = requests.Session()
        
        # 配置重试策略
        retry_strategy = Retry(
            total=5,  # 总重试次数
            backoff_factor=1,  # 退避因子，重试间隔会递增
            status_forcelist=[429, 500, 502, 503, 504],  # 需要重试的HTTP状态码
            allowed_methods=["HEAD", "GET", "OPTIONS"]  # 允许重试的HTTP方法
        )
        
        adapter = HTTPAdapter(max_retries=retry_strategy)
        session.mount("http://", adapter)
        session.mount("https://", adapter)
        
        # 增加超时设置
        session.timeout = 30
        
        return session
    
    def _get_timestamp(self):
        """获取 OKX 格式的时间戳"""
        return datetime.utcnow().isoformat()[:-3] + 'Z'
    
    def _sign(self, timestamp, method, request_path, body=''):
        """生成 OKX API 签名"""
        if body:
            message = timestamp + method + request_path + body
        else:
            message = timestamp + method + request_path
        
        mac = hmac.new(
            bytes(self.secret_key, encoding='utf-8'),
            bytes(message, encoding='utf-8'),
            digestmod='sha256'
        )
        d = mac.digest()
        return base64.b64encode(d).decode()
    
    def _make_request(self, endpoint, params=None, max_retries=3):
        """发送带重试机制的请求"""
        if params is None:
            params = {}
            
        # 构建请求路径
        request_path = f"/api/v5/{endpoint}"
        if params:
            request_path += '?' + urlencode(params)
        
        # 生成时间戳和签名
        timestamp = self._get_timestamp()
        signature = self._sign(timestamp, 'GET', request_path)
        
        headers = {
            'OK-ACCESS-KEY': self.api_key,
            'OK-ACCESS-SIGN': signature,
            'OK-ACCESS-TIMESTAMP': timestamp,
            'OK-ACCESS-PASSPHRASE': self.passphrase,
            'Content-Type': 'application/json'
        }
        
        url = f"{self.base_url}{request_path}"
        
        # 重试机制
        for attempt in range(max_retries + 1):
            try:
                response = self.session.get(url, headers=headers, timeout=30)
                
                if response.status_code == 200:
                    data = response.json()
                    if data.get('code') == '0':
                        return data.get('data', [])
                    else:
                        print(f"API 错误: {data.get('msg', 'Unknown error')}")
                        return None
                elif response.status_code == 429:
                    # 频率限制，等待更长时间
                    wait_time = 2 ** attempt
                    print(f"  ⏳ 请求频率限制，等待 {wait_time} 秒后重试...")
                    time.sleep(wait_time)
                    continue
                else:
                    print(f"HTTP 错误: {response.status_code}")
                    return None
                    
            except (requests.exceptions.SSLError, 
                    requests.exceptions.ConnectionError,
                    requests.exceptions.Timeout) as e:
                
                if attempt < max_retries:
                    wait_time = 2 ** attempt  # 指数退避
                    print(f"  ⚠️  网络错误 (尝试 {attempt + 1}/{max_retries + 1}): {str(e)[:100]}...")
                    print(f"  ⏳ 等待 {wait_time} 秒后重试...")
                    time.sleep(wait_time)
                    continue
                else:
                    print(f"❌ 网络请求错误: {e}")
                    return None
                    
            except requests.exceptions.RequestException as e:
                if attempt < max_retries:
                    wait_time = 2 ** attempt
                    print(f"  ⚠️  请求错误 (尝试 {attempt + 1}/{max_retries + 1}): {str(e)[:100]}...")
                    print(f"  ⏳ 等待 {wait_time} 秒后重试...")
                    time.sleep(wait_time)
                    continue
                else:
                    print(f"❌ 请求错误: {e}")
                    return None
        
        return None
    
    def test_connection(self):
        """测试API连接和权限"""
        print("🔍 测试 OKX API 连接...")
        
        try:
            # 测试账户信息 API
            account_info = self._make_request("account/balance")
            if account_info is not None:
                print("✅ OKX API 权限验证成功")
                return True
            else:
                print("❌ OKX API 权限验证失败")
                return False
        except Exception as e:
            print(f"❌ OKX API 权限测试失败: {e}")
            return False
    
    def _convert_symbol_to_okx_format(self, symbol):
        """将交易对转换为 OKX 格式 (例如: BTCUSDT -> BTC-USDT)"""
        # 常见的基础货币列表
        base_currencies = [
            'BTC', 'ETH', 'BNB', 'ADA', 'XRP', 'DOT', 'UNI', 'LINK', 'LTC', 'BCH',
            'SOL', 'MATIC', 'AVAX', 'ATOM', 'NEAR', 'FTM', 'ALGO', 'XLM', 'ICP',
            'HBAR', 'VET', 'MANA', 'SAND', 'AXS', 'THETA', 'EGLD', 'EOS', 'AAVE',
            'MKR', 'COMP', 'SUSHI', 'YFI', 'SNX', 'CRV', 'BAL', 'REN', 'KNC',
            'PNUT', 'DOGE', 'SHIB', 'PEPE', 'FLOKI', 'BONK'
        ]
        
        # 常见的计价货币
        quote_currencies = ['USDT', 'USDC', 'BTC', 'ETH', 'BNB']
        
        symbol_upper = symbol.upper()
        
        # 尝试匹配基础货币和计价货币
        for base in base_currencies:
            for quote in quote_currencies:
                if symbol_upper == base + quote:
                    return f"{base}-{quote}"
        
        # 如果没有匹配到，返回原始符号（可能需要手动处理）
        return symbol
    
    def get_trades_for_day(self, symbol, date_str):
        """获取指定日期的交易记录"""
        try:
            # 转换交易对格式
            okx_symbol = self._convert_symbol_to_okx_format(symbol)
            
            # 计算时间戳 (OKX 使用毫秒时间戳)
            date_obj = datetime.strptime(date_str, '%Y-%m-%d')
            start_time = int(date_obj.timestamp() * 1000)
            end_time = int((date_obj + timedelta(days=1) - timedelta(seconds=1)).timestamp() * 1000)
            
            params = {
                'instId': okx_symbol,
                'begin': str(start_time),
                'end': str(end_time),
                'limit': '100'
            }
            
            print(f"正在获取 {date_str} 00:00 到 {date_str} 23:59 的交易记录...")
            
            trades = self._make_request("trade/fills", params)
            
            if trades is None:
                print("  这个时间段没有交易记录")
                return []
            elif len(trades) == 0:
                print("  这个时间段没有交易记录")
                return []
            else:
                # 转换为 Binance 兼容格式
                converted_trades = self._convert_trades_to_binance_format(trades, symbol)
                print(f"  获取到 {len(converted_trades)} 条记录")
                return converted_trades
                
        except Exception as e:
            print(f"  获取 {date_str} 数据时出错: {e}")
            return []
    
    def _convert_trades_to_binance_format(self, okx_trades, original_symbol):
        """将 OKX 交易格式转换为 Binance 兼容格式"""
        converted_trades = []
        
        for trade in okx_trades:
            # OKX 交易记录格式转换为 Binance 格式
            converted_trade = {
                'id': trade.get('tradeId', ''),
                'orderId': trade.get('ordId', ''),
                'symbol': original_symbol,
                'time': trade.get('ts', ''),
                'isBuyer': trade.get('side', '').lower() == 'buy',
                'isMaker': trade.get('execType', '') == 'M',
                'price': trade.get('fillPx', '0'),
                'qty': trade.get('fillSz', '0'),
                'quoteQty': str(float(trade.get('fillPx', '0')) * float(trade.get('fillSz', '0'))),
                'commission': trade.get('fee', '0'),
                'commissionAsset': trade.get('feeCcy', 'USDT')
            }
            converted_trades.append(converted_trade)
        
        return converted_trades
    
    def get_all_trades_in_period(self, symbol, start_date, end_date):
        """获取指定时间段内的所有交易记录"""
        print(f"开始获取 {symbol} 从 {start_date} 到 {end_date} 的交易记录...")
        
        all_trades = []
        current_date = datetime.strptime(start_date, '%Y-%m-%d')
        end_date_obj = datetime.strptime(end_date, '%Y-%m-%d')
        
        total_trades = 0
        
        while current_date <= end_date_obj:
            date_str = current_date.strftime('%Y-%m-%d')
            day_trades = self.get_trades_for_day(symbol, date_str)
            
            if day_trades:
                all_trades.extend(day_trades)
                total_trades += len(day_trades)
                print(f"  获取到 {len(day_trades)} 条记录，累计 {total_trades} 条")
            
            current_date += timedelta(days=1)
            
            # 添加延迟避免频率限制
            time.sleep(0.2)
        
        print(f"\n总共获取到 {len(all_trades)} 条交易记录")
        
        if all_trades:
            self._print_trade_summary(all_trades)
        
        return all_trades
    
    def _print_trade_summary(self, trades):
        """打印交易统计信息"""
        if not trades:
            return
            
        buy_count = sum(1 for t in trades if t['isBuyer'])
        sell_count = len(trades) - buy_count
        total_commission = sum(float(t['commission']) for t in trades)
        
        # 时间范围
        timestamps = [int(t['time']) for t in trades]
        start_time = datetime.fromtimestamp(min(timestamps) / 1000)
        end_time = datetime.fromtimestamp(max(timestamps) / 1000)
        
        print(f"\n=== 交易统计 ===")
        print(f"总交易数: {len(trades)}")
        print(f"买入交易: {buy_count}")
        print(f"卖出交易: {sell_count}")
        print(f"总手续费: {total_commission:.8f}")
        print(f"交易时间范围: {start_time.strftime('%Y-%m-%d %H:%M:%S')} 至 {end_time.strftime('%Y-%m-%d %H:%M:%S')}")
    
    def export_to_csv(self, trades, filename):
        """导出交易记录到CSV文件"""
        if not trades:
            print("没有交易记录可导出")
            return
        
        # 转换数据格式
        formatted_trades = []
        for trade in trades:
            formatted_trade = {
                '交易ID': trade['id'],
                '订单ID': trade['orderId'],
                '交易对': trade['symbol'],
                '交易时间': datetime.fromtimestamp(int(trade['time']) / 1000).strftime('%Y-%m-%d %H:%M:%S'),
                '买卖方向': '买入' if trade['isBuyer'] else '卖出',
                '价格': float(trade['price']),
                '数量': float(trade['qty']),
                '金额': float(trade['quoteQty']),
                '手续费': float(trade['commission']),
                '手续费资产': trade['commissionAsset'],
                '是否maker': '是' if trade['isMaker'] else '否',
                '原始时间戳': trade['time']
            }
            formatted_trades.append(formatted_trade)
        
        # 按时间排序
        formatted_trades.sort(key=lambda x: x['原始时间戳'])
        
        # 写入CSV文件
        with open(filename, 'w', newline='', encoding='utf-8-sig') as csvfile:
            fieldnames = list(formatted_trades[0].keys())
            writer = csv.DictWriter(csvfile, fieldnames=fieldnames)
            
            writer.writeheader()
            for trade in formatted_trades:
                writer.writerow(trade)
        
        print(f"✅ 交易记录已成功导出到: {filename}")
    
    def export_to_json(self, trades, filename):
        """导出交易记录到JSON文件"""
        if not trades:
            print("没有交易记录可导出")
            return
        
        with open(filename, 'w', encoding='utf-8') as jsonfile:
            json.dump(trades, jsonfile, indent=2, ensure_ascii=False)
        
        print(f"✅ 交易记录已成功导出到: {filename}") 