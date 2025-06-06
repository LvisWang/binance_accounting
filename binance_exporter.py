#!/usr/bin/env python3
"""
Binance 交易记录导出器 - 完整版本
包含网络重试机制和交互式导出功能
"""

import requests
import hmac
import hashlib
import time
import json
import csv
from datetime import datetime, timedelta
from urllib.parse import urlencode
from requests.adapters import HTTPAdapter
from urllib3.util.retry import Retry

class BinanceTradeExporter:
    """Binance 交易记录导出器"""
    
    def __init__(self, api_key, secret_key, testnet=False):
        # 要求传入 API 密钥，不再依赖 config 模块
        if not api_key or not secret_key:
            raise ValueError("API密钥和密钥不能为空")
        
        self.api_key = api_key
        self.secret_key = secret_key
        self.base_url = "https://testnet.binance.vision/api/v3" if testnet else "https://api.binance.com/api/v3"
        
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
    
    def _make_request(self, endpoint, params=None, max_retries=3):
        """发送带重试机制的请求"""
        if params is None:
            params = {}
            
        # 添加时间戳
        params['timestamp'] = int(time.time() * 1000)
        
        # 生成签名
        query_string = urlencode(params)
        signature = hmac.new(
            self.secret_key.encode('utf-8'),
            query_string.encode('utf-8'),
            hashlib.sha256
        ).hexdigest()
        params['signature'] = signature
        
        headers = {
            'X-MBX-APIKEY': self.api_key,
            'User-Agent': 'Mozilla/5.0 (compatible; BinanceTradeExporter/1.0)'
        }
        
        url = f"{self.base_url}/{endpoint}"
        
        # 重试机制
        for attempt in range(max_retries + 1):
            try:
                response = self.session.get(url, params=params, headers=headers, timeout=30)
                
                if response.status_code == 200:
                    return response.json()
                elif response.status_code == 429:
                    # 频率限制，等待更长时间
                    wait_time = 2 ** attempt
                    print(f"  ⏳ 请求频率限制，等待 {wait_time} 秒后重试...")
                    time.sleep(wait_time)
                    continue
                else:
                    response.raise_for_status()
                    
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
        print("🔍 测试API连接...")
        
        # 测试服务器连接 - 使用公开端点，无需签名
        try:
            url = f"{self.base_url}/time"
            response = self.session.get(url, timeout=30)
            
            if response.status_code == 200:
                server_time = response.json()
                server_timestamp = server_time['serverTime']
                server_datetime = datetime.fromtimestamp(server_timestamp / 1000)
                print(f"✅ 服务器连接正常，服务器时间: {server_datetime}")
            else:
                print("❌ 无法连接到服务器")
                return False
        except Exception as e:
            print(f"❌ 服务器连接测试失败: {e}")
            return False
        
        # 测试API权限 - 需要签名
        try:
            account_info = self._make_request("account")
            if account_info:
                print("✅ API权限验证成功")
                print(f"   账户类型: {account_info.get('accountType', 'UNKNOWN')}")
                print(f"   可交易: {account_info.get('canTrade', False)}")
                return True
            else:
                print("❌ API权限验证失败")
                return False
        except Exception as e:
            print(f"❌ API权限测试失败: {e}")
            return False
    
    def get_trades_for_day(self, symbol, date_str):
        """获取指定日期的交易记录"""
        try:
            # 计算时间戳
            date_obj = datetime.strptime(date_str, '%Y-%m-%d')
            start_time = int(date_obj.timestamp() * 1000)
            end_time = int((date_obj + timedelta(days=1) - timedelta(seconds=1)).timestamp() * 1000)
            
            params = {
                'symbol': symbol,
                'startTime': start_time,
                'endTime': end_time,
                'limit': 1000
            }
            
            print(f"正在获取 {date_str} 00:00 到 {date_str} 23:59 的交易记录...")
            
            trades = self._make_request("myTrades", params)
            
            if trades is None:
                print("  这个时间段没有交易记录")
                return []
            elif len(trades) == 0:
                print("  这个时间段没有交易记录")
                return []
            else:
                print(f"  获取到 {len(trades)} 条记录，累计 {len(trades)} 条")
                return trades
                
        except Exception as e:
            print(f"  获取 {date_str} 数据时出错: {e}")
            return []
    
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
            time.sleep(0.1)
        
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

def display_trades_for_selection(trades):
    """显示交易列表供用户选择"""
    if not trades:
        print("没有交易记录可选择")
        return []
    
    print("\n=== 交易记录列表 ===")
    print("编号 | 时间                | 方向 | 价格        | 数量        | 金额")
    print("-" * 70)
    
    for i, trade in enumerate(trades, 1):
        trade_time = datetime.fromtimestamp(int(trade['time']) / 1000).strftime('%Y-%m-%d %H:%M:%S')
        direction = '买入' if trade['isBuyer'] else '卖出'
        price = float(trade['price'])
        qty = float(trade['qty'])
        quote_qty = float(trade['quoteQty'])
        
        print(f"{i:3d}  | {trade_time} | {direction:2s} | {price:10.6f} | {qty:10.6f} | {quote_qty:10.2f}")
    
    return trades

def select_trades_for_analysis(trades):
    """让用户选择要分析的交易"""
    if not trades:
        return []
    
    display_trades_for_selection(trades)
    
    print(f"\n请选择要分析的交易（总共 {len(trades)} 条）")
    print("输入格式示例:")
    print("  单个: 1")
    print("  多个: 1,3,5")
    print("  范围: 1-5")
    print("  组合: 1,3,5-8,10")
    print("  全选: all")
    
    while True:
        selection = input("\n请输入选择: ").strip()
        
        if not selection:
            print("❌ 输入不能为空")
            continue
            
        try:
            if selection.lower() == 'all':
                return trades
            
            selected_indices = set()
            
            # 解析输入
            parts = selection.split(',')
            for part in parts:
                part = part.strip()
                if '-' in part:
                    # 范围选择
                    start, end = part.split('-')
                    start_idx = int(start.strip()) - 1
                    end_idx = int(end.strip()) - 1
                    if start_idx < 0 or end_idx >= len(trades) or start_idx > end_idx:
                        raise ValueError(f"范围 {part} 无效")
                    selected_indices.update(range(start_idx, end_idx + 1))
                else:
                    # 单个选择
                    idx = int(part) - 1
                    if idx < 0 or idx >= len(trades):
                        raise ValueError(f"编号 {part} 无效")
                    selected_indices.add(idx)
            
            # 返回选中的交易
            selected_trades = [trades[i] for i in sorted(selected_indices)]
            print(f"\n已选择 {len(selected_trades)} 条交易")
            return selected_trades
            
        except ValueError as e:
            print(f"❌ 输入格式错误: {e}")
            print("请重新输入")

def calculate_average_prices(selected_trades):
    """计算选中交易的平均价格"""
    if not selected_trades:
        print("没有选中的交易")
        return
    
    buy_trades = [t for t in selected_trades if t['isBuyer']]
    sell_trades = [t for t in selected_trades if not t['isBuyer']]
    
    print(f"\n=== 平均价格分析 ===")
    print(f"总选中交易: {len(selected_trades)} 条")
    
    buy_stats = None
    sell_stats = None
    profit_stats = None
    
    if buy_trades:
        # 计算买入平均价格（按数量加权）
        total_buy_qty = sum(float(t['qty']) for t in buy_trades)
        weighted_buy_price = sum(float(t['price']) * float(t['qty']) for t in buy_trades) / total_buy_qty
        total_buy_amount = sum(float(t['quoteQty']) for t in buy_trades)
        
        # 按资产类型统计买入手续费
        buy_commission_by_asset = {}
        for trade in buy_trades:
            asset = trade['commissionAsset']
            commission = float(trade['commission'])
            if asset in buy_commission_by_asset:
                buy_commission_by_asset[asset] += commission
            else:
                buy_commission_by_asset[asset] = commission
        
        buy_stats = {
            'count': len(buy_trades),
            'avg_price': weighted_buy_price,
            'total_qty': total_buy_qty,
            'total_amount': total_buy_amount,
            'commission_by_asset': buy_commission_by_asset
        }
        
        print(f"\n📈 买入交易 ({len(buy_trades)} 条):")
        print(f"   平均增持价格: {weighted_buy_price:.6f}")
        print(f"   总买入数量: {total_buy_qty:.6f}")
        print(f"   总买入金额: {total_buy_amount:.2f}")
        print(f"   买入手续费:")
        for asset, commission in buy_commission_by_asset.items():
            print(f"     {commission:.8f} {asset}")
    
    if sell_trades:
        # 计算卖出平均价格（按数量加权）
        total_sell_qty = sum(float(t['qty']) for t in sell_trades)
        weighted_sell_price = sum(float(t['price']) * float(t['qty']) for t in sell_trades) / total_sell_qty
        total_sell_amount = sum(float(t['quoteQty']) for t in sell_trades)
        
        # 按资产类型统计卖出手续费
        sell_commission_by_asset = {}
        for trade in sell_trades:
            asset = trade['commissionAsset']
            commission = float(trade['commission'])
            if asset in sell_commission_by_asset:
                sell_commission_by_asset[asset] += commission
            else:
                sell_commission_by_asset[asset] = commission
        
        sell_stats = {
            'count': len(sell_trades),
            'avg_price': weighted_sell_price,
            'total_qty': total_sell_qty,
            'total_amount': total_sell_amount,
            'commission_by_asset': sell_commission_by_asset
        }
        
        print(f"\n📉 卖出交易 ({len(sell_trades)} 条):")
        print(f"   平均减持价格: {weighted_sell_price:.6f}")
        print(f"   总卖出数量: {total_sell_qty:.6f}")
        print(f"   总卖出金额: {total_sell_amount:.2f}")
        print(f"   卖出手续费:")
        for asset, commission in sell_commission_by_asset.items():
            print(f"     {commission:.8f} {asset}")
    
    # 总手续费统计（按资产分类）
    total_commission_by_asset = {}
    for trade in selected_trades:
        asset = trade['commissionAsset']
        commission = float(trade['commission'])
        if asset in total_commission_by_asset:
            total_commission_by_asset[asset] += commission
        else:
            total_commission_by_asset[asset] = commission
    
    print(f"\n💳 手续费统计:")
    for asset, commission in total_commission_by_asset.items():
        print(f"   {commission:.8f} {asset}")
    
    # 如果同时有买入和卖出，计算盈亏
    if buy_trades and sell_trades:
        min_qty = min(sum(float(t['qty']) for t in buy_trades), 
                     sum(float(t['qty']) for t in sell_trades))
        profit_per_unit = sell_stats['avg_price'] - buy_stats['avg_price']
        total_profit = profit_per_unit * min_qty
        profit_percentage = (profit_per_unit / buy_stats['avg_price']) * 100
        
        profit_stats = {
            'price_diff': profit_per_unit,
            'total_profit': total_profit,
            'profit_percentage': profit_percentage,
            'min_qty': min_qty,
            'commission_by_asset': total_commission_by_asset
        }
        
        print(f"\n💰 盈亏分析:")
        print(f"   价差: {profit_per_unit:.6f}")
        print(f"   基于最小交易量的盈亏: {total_profit:.2f}")
        print(f"   盈亏百分比: {profit_percentage:+.2f}%")
        print(f"   注意: 手续费涉及多种资产，请单独考虑手续费成本")
    
    # 询问是否生成CSV报告
    print("\n是否生成分析报告CSV文件？")
    choice = input("输入 'y' 生成报告，其他任意键跳过: ").strip().lower()
    if choice == 'y':
        generate_analysis_report(selected_trades, buy_stats, sell_stats, profit_stats)

def generate_analysis_report(selected_trades, buy_stats, sell_stats, profit_stats):
    """生成分析报告CSV文件"""
    timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
    symbol = selected_trades[0]['symbol'] if selected_trades else 'UNKNOWN'
    filename = f"{symbol}_analysis_report_{timestamp}.csv"
    
    try:
        with open(filename, 'w', newline='', encoding='utf-8-sig') as csvfile:
            writer = csv.writer(csvfile)
            
            # 写入标题
            writer.writerow(['Binance 交易分析报告'])
            writer.writerow(['生成时间:', datetime.now().strftime('%Y-%m-%d %H:%M:%S')])
            writer.writerow(['交易对:', symbol])
            writer.writerow([''])
            
            # 写入分析摘要
            writer.writerow(['=== 分析摘要 ==='])
            writer.writerow(['总选中交易数:', len(selected_trades)])
            
            if buy_stats:
                writer.writerow(['买入交易数:', buy_stats['count']])
                writer.writerow(['平均增持价格:', f"{buy_stats['avg_price']:.6f}"])
                writer.writerow(['总买入数量:', f"{buy_stats['total_qty']:.6f}"])
                writer.writerow(['总买入金额:', f"{buy_stats['total_amount']:.2f}"])
                writer.writerow(['买入手续费:'])
                for asset, commission in buy_stats['commission_by_asset'].items():
                    writer.writerow(['', f"{commission:.8f} {asset}"])
            
            if sell_stats:
                writer.writerow(['卖出交易数:', sell_stats['count']])
                writer.writerow(['平均减持价格:', f"{sell_stats['avg_price']:.6f}"])
                writer.writerow(['总卖出数量:', f"{sell_stats['total_qty']:.6f}"])
                writer.writerow(['总卖出金额:', f"{sell_stats['total_amount']:.2f}"])
                writer.writerow(['卖出手续费:'])
                for asset, commission in sell_stats['commission_by_asset'].items():
                    writer.writerow(['', f"{commission:.8f} {asset}"])
            
            # 总手续费统计
            total_commission_by_asset = {}
            for trade in selected_trades:
                asset = trade['commissionAsset']
                commission = float(trade['commission'])
                if asset in total_commission_by_asset:
                    total_commission_by_asset[asset] += commission
                else:
                    total_commission_by_asset[asset] = commission
            
            writer.writerow([''])
            writer.writerow(['=== 手续费统计 ==='])
            for asset, commission in total_commission_by_asset.items():
                writer.writerow([f'总手续费 ({asset}):', f"{commission:.8f}"])
            
            if profit_stats:
                writer.writerow([''])
                writer.writerow(['=== 盈亏分析 ==='])
                writer.writerow(['价差:', f"{profit_stats['price_diff']:.6f}"])
                writer.writerow(['基于最小交易量的盈亏:', f"{profit_stats['total_profit']:.2f}"])
                writer.writerow(['盈亏百分比:', f"{profit_stats['profit_percentage']:+.2f}%"])
                writer.writerow(['最小交易量:', f"{profit_stats['min_qty']:.6f}"])
                writer.writerow(['备注:', '手续费涉及多种资产，请单独考虑手续费成本'])
            
            # 写入详细交易记录
            writer.writerow([''])
            writer.writerow(['=== 选中的交易记录 ==='])
            writer.writerow(['交易ID', '订单ID', '交易时间', '买卖方向', '价格', '数量', '金额', '手续费', '手续费资产'])
            
            # 按时间排序
            sorted_trades = sorted(selected_trades, key=lambda x: int(x['time']))
            
            for trade in sorted_trades:
                trade_time = datetime.fromtimestamp(int(trade['time']) / 1000).strftime('%Y-%m-%d %H:%M:%S')
                direction = '买入' if trade['isBuyer'] else '卖出'
                
                writer.writerow([
                    trade['id'],
                    trade['orderId'],
                    trade_time,
                    direction,
                    float(trade['price']),
                    float(trade['qty']),
                    float(trade['quoteQty']),
                    float(trade['commission']),
                    trade['commissionAsset']
                ])
        
        print(f"✅ 分析报告已生成: {filename}")
        
    except Exception as e:
        print(f"❌ 生成报告失败: {e}")

def analyze_selected_trades(trades):
    """交易分析主函数"""
    if not trades:
        print("没有交易记录可分析")
        return
    
    while True:
        print("\n" + "="*50)
        print("📊 交易分析")
        print("="*50)
        
        selected_trades = select_trades_for_analysis(trades)
        if selected_trades:
            calculate_average_prices(selected_trades)
        
        print("\n是否继续分析其他交易？")
        choice = input("输入 'y' 继续，其他任意键退出: ").strip().lower()
        if choice != 'y':
            break

def export_recent_trades():
    """导出最近指定天数的交易记录"""
    symbol = input(f"请输入交易对 (默认: BTCUSDT): ").strip().upper() or "BTCUSDT"
    days_input = input(f"请输入天数 (默认: 7): ").strip()
    days = int(days_input) if days_input else 7
    
    # 计算时间范围
    end_date = datetime.now()
    start_date = end_date - timedelta(days=days)
    
    start_date_str = start_date.strftime('%Y-%m-%d')
    end_date_str = end_date.strftime('%Y-%m-%d')
    
    print(f"\n准备导出 {symbol} 最近{days}天的交易记录...")
    print(f"时间范围: {start_date_str} 到 {end_date_str}")
    
    try:
        # 需要用户提供 API 密钥，因为不再从 config 读取
        print("请输入您的 API 密钥：")
        api_key = input("API Key: ").strip()
        secret_key = input("Secret Key: ").strip()
        
        if not api_key or not secret_key:
            print("❌ API 密钥不能为空")
            return
        
        # 初始化导出器
        exporter = BinanceTradeExporter(api_key, secret_key)
        
        # 先测试API连接
        print("\n🔍 测试API连接和权限...")
        if not exporter.test_connection():
            print("❌ API连接测试失败，请检查:")
            print("   1. API密钥是否正确")
            print("   2. 是否启用了现货交易权限")
            print("   3. IP是否在白名单中（如果设置了IP限制）")
            print("   4. 网络连接是否正常")
            return
        
        print(f"\n📊 开始获取交易数据...")
        
        # 获取交易记录
        trades = exporter.get_all_trades_in_period(symbol, start_date_str, end_date_str)
        
        if trades:
            # 导出文件
            timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
            
            # 默认导出 CSV 格式
            csv_filename = f"{symbol}_trades_{timestamp}.csv"
            exporter.export_to_csv(trades, csv_filename)
            
            print(f"\n✅ 导出成功！")
            
            # 询问是否进行交易分析
            print("\n是否要分析这些交易数据？")
            choice = input("输入 'y' 进行分析，其他任意键跳过: ").strip().lower()
            if choice == 'y':
                analyze_selected_trades(trades)
        else:
            print("❌ 没有找到交易记录")
            
    except Exception as e:
        print(f"❌ 导出失败: {e}")

def export_custom_period():
    """自定义时间段导出"""
    symbol = input(f"请输入交易对 (默认: BTCUSDT): ").strip().upper() or "BTCUSDT"
    start_date = input("请输入开始日期 (格式: YYYY-MM-DD): ").strip()
    end_date = input("请输入结束日期 (格式: YYYY-MM-DD): ").strip()
    
    if not start_date or not end_date:
        print("❌ 日期不能为空")
        return
    
    print(f"\n导出 {symbol} 从 {start_date} 到 {end_date} 的交易记录...")
    
    try:
        # 需要用户提供 API 密钥
        print("请输入您的 API 密钥：")
        api_key = input("API Key: ").strip()
        secret_key = input("Secret Key: ").strip()
        
        if not api_key or not secret_key:
            print("❌ API 密钥不能为空")
            return
        
        exporter = BinanceTradeExporter(api_key, secret_key)
        
        # 先测试API连接
        if not exporter.test_connection():
            print("❌ API连接测试失败")
            return
        
        trades = exporter.get_all_trades_in_period(symbol, start_date, end_date)
        
        if trades:
            timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
            
            # 默认导出 CSV 格式
            csv_file = f"{symbol}_{start_date}_to_{end_date}_{timestamp}.csv"
            exporter.export_to_csv(trades, csv_file)
            
            print(f"\n✅ 导出完成！")
            
            # 询问是否进行交易分析
            print("\n是否要分析这些交易数据？")
            choice = input("输入 'y' 进行分析，其他任意键跳过: ").strip().lower()
            if choice == 'y':
                analyze_selected_trades(trades)
        else:
            print("❌ 没有找到交易记录")
            
    except Exception as e:
        print(f"❌ 导出失败: {e}")

def main():
    """主程序"""
    print("=== Binance 交易记录导出工具 ===\n")
    print(f"当前配置:")
    print(f"  默认交易对: BTCUSDT")
    print(f"  导出格式: CSV")
    print(f"  测试网模式: False")
    
    print("\n选择导出方式:")
    print("1. 导出最近N天的交易记录")
    print("2. 导出自定义时间段的交易记录")
    
    choice = input("\n请输入选择 (1 或 2): ").strip()
    
    if choice == "1":
        export_recent_trades()
    elif choice == "2":
        export_custom_period()
    else:
        print("❌ 无效选择")

if __name__ == "__main__":
    main() 