#!/usr/bin/env python3
"""
Binance 多账户交易分析网站 - Vercel 部署版本
"""

from flask import Flask, render_template, request, jsonify, session, send_file, flash, redirect, url_for
import os
import json
import csv
import tempfile
from datetime import datetime, timedelta
import sys
import traceback

# 添加项目根目录到 Python 路径
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from binance_exporter import BinanceTradeExporter

app = Flask(__name__, 
            template_folder='../templates',
            static_folder='../static')

# 从环境变量获取密钥，如果没有则使用默认值
app.secret_key = os.environ.get('SECRET_KEY', 'your-secret-key-change-in-production')

class MultiAccountTradeAnalyzer:
    """多账户交易分析器"""
    
    def __init__(self):
        self.accounts = {}
        self.all_trades = []
    
    def add_account(self, account_name, api_key, secret_key, testnet=False):
        """添加账户"""
        try:
            exporter = BinanceTradeExporter(api_key, secret_key, testnet)
            if exporter.test_connection():
                self.accounts[account_name] = exporter
                return True, "账户连接成功"
            else:
                return False, "账户连接失败，请检查API密钥"
        except Exception as e:
            return False, f"账户连接错误: {str(e)}"
    
    def get_trades_from_all_accounts(self, symbol, start_date, end_date):
        """从所有账户获取交易记录"""
        all_trades = []
        account_stats = {}
        
        for account_name, exporter in self.accounts.items():
            try:
                trades = exporter.get_all_trades_in_period(symbol, start_date, end_date)
                
                # 为每条交易添加账户信息
                for trade in trades:
                    trade['account_name'] = account_name
                
                all_trades.extend(trades)
                account_stats[account_name] = {
                    'count': len(trades),
                    'success': True
                }
                
            except Exception as e:
                account_stats[account_name] = {
                    'count': 0,
                    'success': False,
                    'error': str(e)
                }
        
        # 按时间排序
        all_trades.sort(key=lambda x: int(x['time']))
        
        return all_trades, account_stats
    
    def analyze_trades(self, selected_trades):
        """分析选中的交易"""
        if not selected_trades:
            return None
        
        buy_trades = [t for t in selected_trades if t['isBuyer']]
        sell_trades = [t for t in selected_trades if not t['isBuyer']]
        
        analysis = {
            'total_count': len(selected_trades),
            'buy_count': len(buy_trades),
            'sell_count': len(sell_trades),
            'accounts': list(set(t['account_name'] for t in selected_trades))
        }
        
        # 买入分析
        if buy_trades:
            total_buy_qty = sum(float(t['qty']) for t in buy_trades)
            weighted_buy_price = sum(float(t['price']) * float(t['qty']) for t in buy_trades) / total_buy_qty
            total_buy_amount = sum(float(t['quoteQty']) for t in buy_trades)
            
            buy_commission_by_asset = {}
            for trade in buy_trades:
                asset = trade['commissionAsset']
                commission = float(trade['commission'])
                buy_commission_by_asset[asset] = buy_commission_by_asset.get(asset, 0) + commission
            
            analysis['buy_stats'] = {
                'avg_price': weighted_buy_price,
                'total_qty': total_buy_qty,
                'total_amount': total_buy_amount,
                'commission_by_asset': buy_commission_by_asset
            }
        
        # 卖出分析
        if sell_trades:
            total_sell_qty = sum(float(t['qty']) for t in sell_trades)
            weighted_sell_price = sum(float(t['price']) * float(t['qty']) for t in sell_trades) / total_sell_qty
            total_sell_amount = sum(float(t['quoteQty']) for t in sell_trades)
            
            sell_commission_by_asset = {}
            for trade in sell_trades:
                asset = trade['commissionAsset']
                commission = float(trade['commission'])
                sell_commission_by_asset[asset] = sell_commission_by_asset.get(asset, 0) + commission
            
            analysis['sell_stats'] = {
                'avg_price': weighted_sell_price,
                'total_qty': total_sell_qty,
                'total_amount': total_sell_amount,
                'commission_by_asset': sell_commission_by_asset
            }
        
        # 总手续费统计
        total_commission_by_asset = {}
        for trade in selected_trades:
            asset = trade['commissionAsset']
            commission = float(trade['commission'])
            total_commission_by_asset[asset] = total_commission_by_asset.get(asset, 0) + commission
        
        analysis['total_commission_by_asset'] = total_commission_by_asset
        
        # 盈亏分析
        if buy_trades and sell_trades:
            min_qty = min(sum(float(t['qty']) for t in buy_trades), 
                         sum(float(t['qty']) for t in sell_trades))
            profit_per_unit = analysis['sell_stats']['avg_price'] - analysis['buy_stats']['avg_price']
            total_profit = profit_per_unit * min_qty
            profit_percentage = (profit_per_unit / analysis['buy_stats']['avg_price']) * 100
            
            analysis['profit_stats'] = {
                'price_diff': profit_per_unit,
                'total_profit': total_profit,
                'profit_percentage': profit_percentage,
                'min_qty': min_qty
            }
        
        return analysis

# 全局分析器实例
analyzer = MultiAccountTradeAnalyzer()

@app.route('/')
def index():
    """主页 - 配置多账户"""
    return render_template('index.html')

@app.route('/add_account', methods=['POST'])
def add_account():
    """添加账户"""
    try:
        data = request.get_json()
        account_name = data.get('account_name')
        api_key = data.get('api_key')
        secret_key = data.get('secret_key')
        testnet = data.get('testnet', False)
        
        if not account_name or not api_key or not secret_key:
            return jsonify({'success': False, 'message': '请填写完整的账户信息'})
        
        success, message = analyzer.add_account(account_name, api_key, secret_key, testnet)
        
        if success:
            # 保存账户列表到session
            if 'accounts' not in session:
                session['accounts'] = []
            
            session['accounts'].append({
                'name': account_name,
                'testnet': testnet
            })
            session.modified = True
        
        return jsonify({'success': success, 'message': message})
        
    except Exception as e:
        return jsonify({'success': False, 'message': f'添加账户失败: {str(e)}'})

@app.route('/query_trades', methods=['POST'])
def query_trades():
    """查询交易记录"""
    try:
        data = request.get_json()
        symbol = data.get('symbol', 'PNUTUSDT').upper()
        start_date = data.get('start_date')
        end_date = data.get('end_date')
        
        if not start_date or not end_date:
            return jsonify({'success': False, 'message': '请选择查询时间范围'})
        
        if not analyzer.accounts:
            return jsonify({'success': False, 'message': '请先添加至少一个账户'})
        
        trades, account_stats = analyzer.get_trades_from_all_accounts(symbol, start_date, end_date)
        
        # 格式化交易数据用于前端显示
        formatted_trades = []
        for i, trade in enumerate(trades):
            formatted_trades.append({
                'index': i,
                'id': trade['id'],
                'account': trade['account_name'],
                'time': datetime.fromtimestamp(int(trade['time']) / 1000).strftime('%Y-%m-%d %H:%M:%S'),
                'direction': '买入' if trade['isBuyer'] else '卖出',
                'price': float(trade['price']),
                'qty': float(trade['qty']),
                'amount': float(trade['quoteQty']),
                'commission': float(trade['commission']),
                'commission_asset': trade['commissionAsset'],
                'raw_data': trade
            })
        
        # 将数据保存到session
        session['trades'] = trades
        session['symbol'] = symbol
        session.modified = True
        
        return jsonify({
            'success': True,
            'trades': formatted_trades,
            'account_stats': account_stats,
            'total_count': len(trades)
        })
        
    except Exception as e:
        return jsonify({'success': False, 'message': f'查询失败: {str(e)}'})

@app.route('/trades')
def trades_page():
    """交易记录页面"""
    if 'trades' not in session:
        flash('请先查询交易记录', 'error')
        return redirect(url_for('index'))
    
    return render_template('trades.html')

@app.route('/get_trades_data')
def get_trades_data():
    """获取当前session中的交易数据"""
    if 'trades' not in session:
        return jsonify({'success': False, 'message': '没有找到交易数据'})
    
    all_trades = session['trades']
    
    # 格式化交易数据用于前端显示
    formatted_trades = []
    for i, trade in enumerate(all_trades):
        formatted_trades.append({
            'index': i,
            'id': trade['id'],
            'account': trade['account_name'],
            'time': datetime.fromtimestamp(int(trade['time']) / 1000).strftime('%Y-%m-%d %H:%M:%S'),
            'direction': '买入' if trade['isBuyer'] else '卖出',
            'price': float(trade['price']),
            'qty': float(trade['qty']),
            'amount': float(trade['quoteQty']),
            'commission': float(trade['commission']),
            'commission_asset': trade['commissionAsset'],
            'raw_data': trade
        })
    
    return jsonify({
        'success': True,
        'trades': formatted_trades,
        'symbol': session.get('symbol', 'UNKNOWN'),
        'total_count': len(formatted_trades)
    })

@app.route('/analyze_trades', methods=['POST'])
def analyze_trades():
    """分析选中的交易"""
    try:
        data = request.get_json()
        selected_indices = data.get('selected_indices', [])
        
        if not selected_indices:
            return jsonify({'success': False, 'message': '请选择要分析的交易'})
        
        if 'trades' not in session:
            return jsonify({'success': False, 'message': '没有找到交易数据'})
        
        all_trades = session['trades']
        selected_trades = [all_trades[i] for i in selected_indices if i < len(all_trades)]
        
        if not selected_trades:
            return jsonify({'success': False, 'message': '选中的交易无效'})
        
        analysis = analyzer.analyze_trades(selected_trades)
        
        # 保存分析结果到session
        session['analysis'] = analysis
        session['selected_trades'] = selected_trades
        session.modified = True
        
        return jsonify({'success': True, 'analysis': analysis})
        
    except Exception as e:
        return jsonify({'success': False, 'message': f'分析失败: {str(e)}'})

@app.route('/export_csv')
def export_csv():
    """导出分析报告为CSV"""
    try:
        if 'analysis' not in session or 'selected_trades' not in session:
            flash('没有找到分析数据', 'error')
            return redirect(url_for('index'))
        
        analysis = session['analysis']
        selected_trades = session['selected_trades']
        symbol = session.get('symbol', 'UNKNOWN')
        
        # 创建临时文件
        temp_file = tempfile.NamedTemporaryFile(mode='w', delete=False, suffix='.csv', encoding='utf-8-sig')
        
        writer = csv.writer(temp_file)
        
        # 写入报告头部
        writer.writerow(['Binance 多账户交易分析报告'])
        writer.writerow(['生成时间:', datetime.now().strftime('%Y-%m-%d %H:%M:%S')])
        writer.writerow(['交易对:', symbol])
        writer.writerow(['涉及账户:', ', '.join(analysis['accounts'])])
        writer.writerow([''])
        
        # 写入分析摘要
        writer.writerow(['=== 分析摘要 ==='])
        writer.writerow(['总选中交易数:', analysis['total_count']])
        writer.writerow(['买入交易数:', analysis['buy_count']])
        writer.writerow(['卖出交易数:', analysis['sell_count']])
        writer.writerow([''])
        
        # 买入统计
        if 'buy_stats' in analysis:
            buy_stats = analysis['buy_stats']
            writer.writerow(['=== 买入统计 ==='])
            writer.writerow(['平均增持价格:', f"{buy_stats['avg_price']:.6f}"])
            writer.writerow(['总买入数量:', f"{buy_stats['total_qty']:.6f}"])
            writer.writerow(['总买入金额:', f"{buy_stats['total_amount']:.2f}"])
            writer.writerow(['买入手续费:'])
            for asset, commission in buy_stats['commission_by_asset'].items():
                writer.writerow(['', f"{commission:.8f} {asset}"])
            writer.writerow([''])
        
        # 卖出统计
        if 'sell_stats' in analysis:
            sell_stats = analysis['sell_stats']
            writer.writerow(['=== 卖出统计 ==='])
            writer.writerow(['平均减持价格:', f"{sell_stats['avg_price']:.6f}"])
            writer.writerow(['总卖出数量:', f"{sell_stats['total_qty']:.6f}"])
            writer.writerow(['总卖出金额:', f"{sell_stats['total_amount']:.2f}"])
            writer.writerow(['卖出手续费:'])
            for asset, commission in sell_stats['commission_by_asset'].items():
                writer.writerow(['', f"{commission:.8f} {asset}"])
            writer.writerow([''])
        
        # 盈亏分析
        if 'profit_stats' in analysis:
            profit_stats = analysis['profit_stats']
            writer.writerow(['=== 盈亏分析 ==='])
            writer.writerow(['价差:', f"{profit_stats['price_diff']:.6f}"])
            writer.writerow(['基于最小交易量的盈亏:', f"{profit_stats['total_profit']:.2f}"])
            writer.writerow(['盈亏百分比:', f"{profit_stats['profit_percentage']:+.2f}%"])
            writer.writerow(['最小交易量:', f"{profit_stats['min_qty']:.6f}"])
            writer.writerow([''])
        
        # 总手续费统计
        writer.writerow(['=== 总手续费统计 ==='])
        for asset, commission in analysis['total_commission_by_asset'].items():
            writer.writerow([f'总手续费 ({asset}):', f"{commission:.8f}"])
        writer.writerow([''])
        
        # 详细交易记录
        writer.writerow(['=== 选中的交易记录 ==='])
        writer.writerow(['账户', '交易ID', '交易时间', '买卖方向', '价格', '数量', '金额', '手续费', '手续费资产'])
        
        for trade in selected_trades:
            trade_time = datetime.fromtimestamp(int(trade['time']) / 1000).strftime('%Y-%m-%d %H:%M:%S')
            direction = '买入' if trade['isBuyer'] else '卖出'
            
            writer.writerow([
                trade['account_name'],
                trade['id'],
                trade_time,
                direction,
                float(trade['price']),
                float(trade['qty']),
                float(trade['quoteQty']),
                float(trade['commission']),
                trade['commissionAsset']
            ])
        
        temp_file.close()
        
        # 生成文件名
        timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
        filename = f"{symbol}_multi_account_analysis_{timestamp}.csv"
        
        return send_file(temp_file.name, as_attachment=True, download_name=filename, mimetype='text/csv')
        
    except Exception as e:
        flash(f'导出失败: {str(e)}', 'error')
        return redirect(url_for('index'))

@app.route('/clear_accounts', methods=['POST'])
def clear_accounts():
    """清除所有账户"""
    analyzer.accounts.clear()
    session.pop('accounts', None)
    session.pop('trades', None)
    session.pop('analysis', None)
    session.pop('selected_trades', None)
    session.modified = True
    return jsonify({'success': True, 'message': '已清除所有账户'})

# Vercel 要求的应用实例
if __name__ == '__main__':
    app.run(debug=True)
else:
    # Vercel serverless 环境
    app.debug = False 