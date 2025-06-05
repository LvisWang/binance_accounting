# Binance 多账户交易分析网站

这是一个基于 Flask 的网站应用，用于分析多个 Binance 账户的交易记录。支持多账户统一查询、交易选择分析和生成详细的 CSV 报告。

## 功能特点

- 🏦 **多账户支持**: 可以添加多个 Binance 账户进行统一管理
- 📊 **交易查询**: 按时间范围和交易对查询所有账户的交易记录
- 🔍 **交易分析**: 选择特定交易进行深度分析
- 💰 **盈亏计算**: 自动计算买入/卖出平均价格和盈亏情况
- 📄 **报告导出**: 生成详细的 CSV 分析报告
- 🎨 **现代界面**: 美观的响应式网页界面

## 环境要求

- Python 3.7+
- 有效的 Binance API 密钥
- 稳定的网络连接

## 本地运行

### 1. 安装依赖

```bash
pip install -r requirements.txt
```

### 2. 配置 API 密钥

方法一：编辑 `config.py` 文件（默认配置）
```python
API_KEY = "你的API密钥"
SECRET_KEY = "你的SECRET密钥"
```

方法二：在网站界面中动态添加账户（推荐）

### 3. 启动网站

```bash
python run.py
```

或者直接运行：

```bash
python app.py
```

### 4. 访问网站

在浏览器中打开：http://localhost:8080

## 云端部署

### 🌐 Vercel 部署（推荐）

本项目已适配 Vercel serverless 部署，可以免费托管在云端供他人使用。

#### 快速部署步骤：

1. **Fork 项目到您的 GitHub**
2. **访问 [vercel.com](https://vercel.com) 并登录**
3. **点击 "New Project" 选择您的仓库**
4. **直接点击 "Deploy"（无需额外配置）**
5. **部署完成！获得公网访问地址**

#### 详细部署指南：
请查看 [DEPLOYMENT.md](./DEPLOYMENT.md) 获取完整的部署说明。

#### 在线演示：
- 🔗 **演示地址**: [即将提供]
- 📖 **部署教程**: [DEPLOYMENT.md](./DEPLOYMENT.md)

### ☁️ 其他云平台

本项目也可以部署到：
- **Railway**: Python 应用友好
- **Heroku**: 经典的 PaaS 平台
- **PythonAnywhere**: Python 专用托管
- **自有服务器**: 使用 gunicorn + nginx

## 使用步骤

### 第一步：添加账户
1. 在主页填写账户信息
2. 输入账户名称、API Key 和 Secret Key
3. 选择是否使用测试网
4. 点击"添加账户"

### 第二步：查询交易
1. 设置查询参数（交易对、时间范围）
2. 点击"查询交易记录"
3. 查看查询结果统计

### 第三步：分析交易
1. 在交易记录页面选择要分析的交易
2. 可以使用全选、清除选择等快捷操作
3. 点击"分析选中交易"查看分析结果

### 第四步：导出报告
1. 分析完成后点击"导出 CSV 报告"
2. 下载包含详细分析数据的 CSV 文件

## API 权限要求

您的 Binance API 密钥需要以下权限：
- ✅ 现货交易读取权限
- ❌ 不需要交易权限
- ❌ 不需要提现权限

## 安全提示

- 🔒 API 密钥仅在内存中临时存储，不会保存到文件
- 🌐 建议在本地环境使用，避免在公共网络中暴露API密钥
- 🛡️ 可以在 Binance 设置中限制 API 的 IP 访问范围
- ⚠️ 定期检查和更换 API 密钥
- ☁️ 云端部署版本每次访问都需要重新输入 API 密钥

## 文件说明

- `app.py` - Flask 主应用文件
- `api/app.py` - Vercel 部署版本
- `binance_exporter.py` - Binance API 交互模块
- `config.py` - 配置文件
- `run.py` - 本地启动脚本
- `vercel.json` - Vercel 部署配置
- `requirements.txt` - 依赖包列表
- `templates/` - HTML 模板文件
  - `base.html` - 基础模板
  - `index.html` - 主页模板
  - `trades.html` - 交易记录页面模板
- `DEPLOYMENT.md` - 详细部署指南

## 技术栈

- **后端**: Flask (Python)
- **前端**: Bootstrap 5 + JavaScript
- **API**: Binance REST API
- **样式**: Bootstrap Icons
- **部署**: Vercel Serverless

## 常见问题

**Q: API 连接失败怎么办？**
A: 请检查：
1. API 密钥是否正确
2. 是否启用了现货交易权限
3. IP 是否在白名单中
4. 网络连接是否正常

**Q: 查询不到交易记录？**
A: 请确认：
1. 时间范围是否正确
2. 交易对名称是否正确（如 BTCUSDT）
3. 该时间段内是否确实有交易

**Q: 分析结果不准确？**
A: 分析基于选中的交易记录，请确保：
1. 选择了正确的交易记录
2. 买入和卖出交易都包含在分析范围内

**Q: 云端版本安全吗？**
A: 
1. API 密钥不会被保存，仅在当前会话中有效
2. 所有通信通过 HTTPS 加密
3. 建议设置 Binance API 的 IP 访问限制

## 贡献与反馈

欢迎提交 Issue 和 Pull Request 来改进这个项目！

## 开发者

如需自定义或扩展功能，请参考代码注释和Flask文档。

---

⚡ **本地使用**: 运行 `python run.py` 并访问 http://localhost:8080  
🌐 **云端访问**: 部署到 Vercel 后获得公网地址，随时随地使用  
📚 **部署指南**: 查看 [DEPLOYMENT.md](./DEPLOYMENT.md) 了解详细部署步骤
