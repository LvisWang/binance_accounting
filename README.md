# 多交易所多账户交易分析工具

🚀 一个强大的加密货币交易数据分析工具，支持 **Binance、OKX 和 Bybit** 三大交易所的多账户管理、交易记录查询和数据分析。

## ✨ 功能特性

* 📊 **多交易所支持** - 支持 Binance、OKX、Bybit 三大主流交易所
* 🏦 **多账户管理** - 同时管理多个交易所的多个账户
* 🔍 **统一查询** - 跨交易所查询和分析交易记录
* 📈 **智能分析** - 自动计算盈亏、手续费统计、平均价格等
* 📁 **数据导出** - 支持 CSV 格式导出分析报告
* 🌐 **现代化界面** - 基于 Next.js 的响应式 Web 界面
* 🔒 **安全第一** - API 密钥仅本地存储，不上传服务器
* 🎯 **实时分析** - 支持选择特定交易进行深度分析

## 🏦 支持的交易所

| 交易所 | 状态 | 特殊说明 |
|--------|------|----------|
| 🟡 **Binance** | ✅ 完全支持 | 需要现货交易读取权限 |
| 🔵 **OKX** | ✅ 完全支持 | 需要 API 密码 (Passphrase) |
| 🟣 **Bybit** | ✅ 完全支持 | 支持统一账户模式 |

## 🛠️ 技术栈

**前端:**
* Next.js 14 (App Router)
* TypeScript
* Tailwind CSS
* Lucide React Icons

**后端:**
* Node.js Runtime
* Crypto API 集成
* 实时数据处理

## 📦 快速开始

### 1. 克隆项目

```bash
git clone https://github.com/LvisWang/binance_accounting.git
cd binance_accounting
```

### 2. 安装依赖

```bash
npm install
# 或者使用 yarn
yarn install
```

### 3. 启动开发服务器

```bash
npm run dev
# 或者使用 yarn
yarn dev
```

### 4. 访问应用

打开浏览器访问 `http://localhost:3000`

## 🔑 API 密钥配置

### Binance API 密钥

1. 登录 [Binance](https://www.binance.com)
2. 进入 **账户管理** > **API 管理**
3. 创建新的 API Key
4. **重要**: 只勾选 **读取** 权限，不要开启交易权限

### OKX API 密钥

1. 登录 [OKX](https://www.okx.com)
2. 进入 **账户** > **API**
3. 创建新的 API Key
4. 设置权限为 **只读**
5. **重要**: 记住 API 密码 (Passphrase)

### Bybit API 密钥

1. 登录 [Bybit](https://www.bybit.com)
2. 进入 **账户与安全** > **API 管理**
3. 创建新的 API Key
4. 权限设置为 **现货交易** > **读取**
5. 建议开启统一账户模式

## 🚀 使用说明

### 1. 添加交易所账户

* 点击 **"添加账户"** 按钮
* 选择交易所（Binance/OKX/Bybit）
* 输入账户名称、API Key 和 Secret Key
* OKX 需要额外输入 API 密码
* 系统会自动测试连接

### 2. 查询交易记录

* 选择要查询的交易所（可选择全部或特定交易所）
* 输入交易对（如 BTCUSDT）
* 设置查询时间范围
* 点击 **"查询交易记录"**

### 3. 分析交易数据

* 在交易记录表格中选择要分析的交易
* 点击 **"分析选中交易"**
* 查看详细的盈亏分析报告
* 支持买入/卖出分别统计

### 4. 导出分析报告

* 分析完成后点击 **"导出 CSV"**
* 报告包含详细的交易统计和盈亏分析
* 自动按时间排序，便于财务记录

## 📊 功能截图

### 账户管理界面
- 支持添加多个交易所账户
- 实时连接状态检测
- 安全的API密钥管理

### 交易查询界面
- 跨交易所统一查询
- 灵活的时间范围选择
- 实时交易数据获取

### 数据分析界面
- 智能盈亏计算
- 手续费统计分析
- 可视化交易记录

## ⚠️ 安全须知

### 🔒 API 权限设置

1. **仅读取权限**: 所有 API Key 只需要读取权限
2. **禁用交易**: 绝不要给 API Key 交易权限
3. **IP 白名单**: 建议设置 IP 白名单限制访问

### 🛡️ 数据安全

1. **本地存储**: API 密钥仅在浏览器本地存储
2. **不上传服务器**: 系统不会上传任何密钥信息
3. **加密传输**: 所有 API 请求都通过 HTTPS 加密

### 🔄 定期维护

1. **定期轮换**: 建议每 3-6 个月更换 API 密钥
2. **权限检查**: 定期检查 API 权限设置
3. **使用记录**: 关注 API 使用记录，发现异常及时处理

## 🐛 常见问题

### 连接问题

**Q: 出现地理限制错误怎么办？**

A: 某些地区可能无法直接访问交易所 API，解决方案：
- 使用 VPN 连接到支持的地区
- 尝试勾选"使用测试网"选项
- 确认本地网络连接正常

**Q: API 密钥验证失败？**

A: 请检查：
- API Key 和 Secret Key 是否正确输入
- API Key 是否有足够的读取权限
- OKX 是否正确输入了 API 密码
- 是否选择了正确的网络环境

### 数据问题

**Q: 查询不到交易数据？**

A: 请确认：
- 选择的时间范围内确实有交易记录
- 交易对名称格式正确（如 BTCUSDT）
- API Key 对应的账户有该交易对的交易历史
- 网络连接稳定

**Q: 不同交易所的数据格式不一致？**

A: 系统会自动将所有交易所的数据转换为统一格式，确保分析的一致性。

## 🎯 路线图

- [x] Binance 集成
- [x] OKX 集成  
- [x] Bybit 集成
- [x] 多账户管理
- [x] 统一数据分析
- [x] CSV 导出功能
- [ ] 更多交易所支持
- [ ] 高级图表分析
- [ ] 实时价格监控
- [ ] 移动端适配

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

### 开发环境设置

```bash
# 克隆项目
git clone https://github.com/LvisWang/binance_accounting.git

# 安装依赖
npm install

# 启动开发服务器
npm run dev
```

## 📄 许可证

MIT License

## 🔗 相关链接

* [Binance API 文档](https://binance-docs.github.io/apidocs/)
* [OKX API 文档](https://www.okx.com/docs-v5/en/)
* [Bybit API 文档](https://bybit-exchange.github.io/docs/v5/intro)
* [Next.js 官方文档](https://nextjs.org/docs)

---

⚠️ **免责声明**: 本工具仅用于个人交易数据分析，不构成投资建议。使用时请确保遵守当地法律法规。数字货币投资有风险，请谨慎决策。 