# 网络访问问题解决指南

## 当前问题
项目地址 `http://172.28.240.1:3000/` 别人无法访问

## 解决方案

### 1. 检查防火墙设置 🛡️

#### Windows 防火墙
1. 打开"Windows 安全中心"
2. 点击"防火墙和网络保护"
3. 点击"允许应用通过防火墙"
4. 添加端口规则：
   - 端口：3000
   - 协议：TCP
   - 方向：入站

#### 或者临时关闭防火墙测试
```cmd
# 管理员权限运行
netsh advfirewall set allprofiles state off
# 测试完成后记得重新开启
netsh advfirewall set allprofiles state on
```

### 2. 确认网络连接 🌐

确保访问者和您在同一局域网：
- 连接同一WiFi
- 或连接同一路由器

#### 测试网络连通性
```cmd
# 在访问者电脑上测试
ping 172.28.240.1
telnet 172.28.240.1 3000
```

### 3. 使用内网穿透（外网访问）🚀

#### 方案A：ngrok
```bash
# 安装 ngrok
npm install -g ngrok

# 启动内网穿透
ngrok http 3000
```

#### 方案B：frp
```bash
# 下载 frp 客户端
# 配置 frpc.ini
[common]
server_addr = your-server-ip
server_port = 7000

[web]
type = http
local_port = 3000
custom_domains = your-domain.com
```

### 4. 修改开发服务器配置 ⚙️

如果仍有问题，可以尝试修改 package.json：

```json
{
  "scripts": {
    "dev": "nuxt --hostname 0.0.0.0 --port 3000"
  }
}
```

### 5. 检查路由器设置 📡

如果需要外网访问：
1. 登录路由器管理界面
2. 设置端口转发：
   - 内部IP：172.28.240.1
   - 内部端口：3000
   - 外部端口：3000
   - 协议：TCP

## 快速测试步骤

1. **同局域网测试**：
   - 让同事连接同一WiFi
   - 访问 `http://172.28.240.1:3000/`

2. **防火墙测试**：
   - 临时关闭防火墙
   - 再次测试访问

3. **端口测试**：
   ```cmd
   netstat -an | findstr :3000
   ```

## 安全建议 🔒

- 开发环境不建议长期关闭防火墙
- 生产环境使用HTTPS
- 考虑使用VPN进行安全访问
- 定期更新防火墙规则

## 常见错误排查

- **连接超时**：通常是防火墙问题
- **连接拒绝**：服务未启动或端口被占用
- **无法解析**：IP地址错误或网络不通

如果以上方法都无效，请检查：
- 网络管理员是否设置了访问限制
- 是否存在企业级防火墙
- 网络是否使用了VLAN隔离
