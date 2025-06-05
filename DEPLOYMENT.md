# Vercel 部署指南

## 🚀 快速部署

### 1. 准备代码
确保您的项目包含以下文件：
- `vercel.json` - Vercel 配置文件
- `api/app.py` - Flask 应用
- `api/binance_exporter.py` - Binance API 模块
- `api/config.py` - 配置文件
- `api/requirements.txt` - Python 依赖
- `templates/` - HTML 模板文件夹
- `static/` - 静态文件文件夹（如果有）

### 2. 部署到 Vercel

#### 方法一：通过 GitHub（推荐）

1. **上传到 GitHub**
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git remote add origin <your-github-repo-url>
   git push -u origin main
   ```

2. **连接 Vercel**
   - 访问 [vercel.com](https://vercel.com)
   - 登录并点击 "New Project"
   - 选择您的 GitHub 仓库
   - 点击 "Deploy"

#### 方法二：通过 Vercel CLI

1. **安装 Vercel CLI**
   ```bash
   npm install -g vercel
   ```

2. **登录并部署**
   ```bash
   vercel login
   vercel --prod
   ```

### 3. 环境变量设置

在 Vercel 项目设置中添加以下环境变量：

- `SECRET_KEY` - Flask 应用密钥（设置一个随机字符串）

### 4. 域名配置

部署完成后，Vercel 会提供一个 `.vercel.app` 域名。您也可以：

1. 在项目设置中添加自定义域名
2. 配置 DNS 记录指向 Vercel

## ⚠️ 安全注意事项

### 重要提醒
- ✅ 用户的 API 密钥仅在内存中存储，不会持久化
- ✅ 每次访问都需要重新输入 API 密钥
- ✅ Session 数据仅在当前会话中有效
- ⚠️  不要在代码中硬编码真实的 API 密钥

### 生产环境建议
1. **设置强密钥**：在 Vercel 环境变量中设置复杂的 `SECRET_KEY`
2. **HTTPS 强制**：Vercel 默认启用 HTTPS
3. **域名限制**：考虑设置访问域名白名单
4. **监控日志**：定期检查 Vercel 函数日志

## 🔧 故障排除

### 常见问题

**Q: 部署失败 "Module not found"**
A: 检查 `api/requirements.txt` 是否包含所有依赖包

**Q: 模板找不到**
A: 确保 `templates/` 目录在项目根目录，且 Flask 配置正确

**Q: API 请求超时**
A: Vercel 免费版有 10 秒执行时间限制，考虑优化查询逻辑

**Q: Session 数据丢失**
A: Vercel 是无状态的，Session 数据存储在客户端 Cookie 中

### 调试技巧

1. **查看日志**
   ```bash
   vercel logs <deployment-url>
   ```

2. **本地测试**
   ```bash
   vercel dev
   ```

## 📊 性能优化

### Vercel 限制
- **执行时间**：免费版 10 秒，Pro 版 60 秒
- **内存**：1024 MB
- **请求大小**：6 MB

### 优化建议
1. **分批查询**：大量交易记录分批获取
2. **缓存优化**：使用 Session 缓存查询结果
3. **异步处理**：考虑使用队列处理长时间任务

## 🌍 访问地址

部署成功后，您的网站将可以通过以下地址访问：
- `https://your-project-name.vercel.app`
- 或您配置的自定义域名

## 📝 更新部署

### 自动部署
连接 GitHub 后，每次推送代码都会自动触发部署

### 手动部署
```bash
vercel --prod
```

## 🎯 下一步

1. **分享链接**：将部署地址分享给需要使用的人
2. **监控使用**：在 Vercel 控制台查看访问统计
3. **收集反馈**：根据用户反馈优化功能

---

🎉 **恭喜！您的 Binance 多账户交易分析工具已成功部署到云端！** 