# 币安多账户交易分析工具

🚀 一个强大的币安交易数据分析工具，支持多账户管理、交易记录查询和数据分析。

## ✨ 功能特性

- 📊 **多账户支持** - 同时管理多个币安账户
- 🔍 **交易查询** - 按时间范围和交易对查询历史交易
- 📈 **数据分析** - 自动计算盈亏、手续费统计等
- 📁 **数据导出** - 支持 CSV 和 JSON 格式导出
- 🌐 **双版本支持** - Web 版本和 Python 命令行版本
- 🔒 **安全保护** - API 密钥本地存储，不上传服务器

## 🛠️ 技术栈

**Web 版本:**
- Next.js 14
- TypeScript
- Tailwind CSS
- Lucide React Icons

**Python 版本:**
- Python 3.7+
- Flask
- Requests
- Pandas

## 📦 安装说明

### Web 版本（推荐）

1. **克隆项目**
```bash
git clone https://github.com/LvisWang/binance_accounting.git
cd binance_accounting
```

2. **安装依赖**
```bash
npm install
# 或者使用 yarn
yarn install
```

3. **启动开发服务器**
```bash
npm run dev
# 或者使用 yarn
yarn dev
```

4. **访问应用**
打开浏览器访问 `http://localhost:3000`

### Python 版本

1. **安装 Python 依赖**
```bash
pip install -r requirements.txt
```

2. **配置 API 密钥**
```bash
cp config.py.template config.py
# 编辑 config.py 文件，添加你的 API 密钥
```

3. **运行应用**
```bash
# Web 界面版本
python app.py

# 命令行版本
python run.py
```

## 🔑 API 密钥配置

### 获取 Binance API 密钥

1. 登录 [Binance](https://www.binance.com/)
2. 进入 **账户管理** > **API 管理**
3. 创建新的 API Key
4. **重要**: 只需要 **读取** 权限，不要开启交易权限

### 配置密钥

**Web 版本**: 在界面上直接添加账户信息

**Python 版本**: 编辑 `config.py` 文件
```python
API_KEY = "your_api_key_here"
SECRET_KEY = "your_secret_key_here"
```

## 🚀 使用说明

### Web 版本使用

1. **添加账户**
   - 点击"添加账户"按钮
   - 输入账户名称、API Key 和 Secret Key
   - 测试连接成功后保存

2. **查询交易**
   - 选择账户和交易对
   - 设置查询时间范围
   - 点击"查询交易"

3. **分析数据**
   - 选择要分析的交易记录
   - 查看买入/卖出统计
   - 查看盈亏分析

4. **导出数据**
   - 点击"导出 CSV"或"导出 JSON"
   - 数据将自动下载到本地

### Python 版本使用

```bash
# 查询最近30天的 BTCUSDT 交易
python run.py

# 查询指定交易对和时间范围
python binance_exporter.py --symbol ETHUSDT --days 7

# 导出为 CSV 格式
python binance_exporter.py --format csv
```

## 📁 项目结构

```
binance_accounting/
├── src/                    # Next.js 源代码
│   ├── app/               # App Router 页面
│   ├── components/        # React 组件
│   ├── lib/              # 工具库
│   └── types/            # TypeScript 类型定义
├── public/               # 静态资源
├── python/               # Python 版本代码
│   ├── app.py           # Flask Web 应用
│   ├── run.py           # 命令行入口
│   └── binance_exporter.py # 核心逻辑
├── config.py.template   # 配置文件模板
└── README.md           # 使用说明
```

## ⚠️ 注意事项

### 安全建议

1. **API 权限**: 只给 API Key 读取权限，切勿开启交易权限
2. **密钥保护**: 不要在公共场所或代码中暴露 API 密钥
3. **定期轮换**: 定期更换 API 密钥以保证安全
4. **网络环境**: 确保在安全的网络环境中使用

### 使用限制

1. **频率限制**: Binance API 有请求频率限制，请避免过于频繁的查询
2. **数据范围**: 单次查询建议不超过90天的数据
3. **网络要求**: 需要稳定的网络连接访问 Binance API

## 🐛 常见问题

### 连接问题

**Q: 出现 CORS 错误怎么办？**
A: 这是浏览器安全限制，建议使用本地版本或配置浏览器 CORS 扩展

**Q: 出现 451 地理限制错误？**
A: 某些地区可能无法直接访问 Binance API，建议：
- 使用 VPN
- 使用本地版本
- 尝试测试网模式

**Q: API 密钥验证失败？**
A: 请检查：
- API Key 和 Secret Key 是否正确
- API Key 是否有查询权限
- 是否选择了正确的网络（主网/测试网）

### 数据问题

**Q: 查询不到交易数据？**
A: 请确认：
- 选择的时间范围内确实有交易
- 交易对名称是否正确
- API Key 对应的账户是否有该交易对的交易记录

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

## 📄 许可证

MIT License

## 🔗 相关链接

- [Binance API 文档](https://binance-docs.github.io/apidocs/)
- [Next.js 官方文档](https://nextjs.org/docs)

---

⚠️ **免责声明**: 本工具仅用于个人交易数据分析，不构成投资建议。使用时请确保遵守当地法律法规。 