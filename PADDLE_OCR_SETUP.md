# PaddleOCR 集成说明

MenuGen 现在支持使用 PaddleOCR 进行更准确的中文菜单识别！

## 什么是 PaddleOCR？

PaddleOCR 是百度开源的 OCR 工具包，具有以下优势：
- **高准确率**：对中文识别准确率远超 Tesseract.js
- **支持多语言**：支持中英文混合识别
- **方向检测**：自动检测文字方向
- **轻量化模型**：CPU 即可运行，速度快

## 快速启动

### Windows 用户
双击运行 `start_paddle_ocr.bat` 文件即可自动安装依赖并启动服务器。

### 手动安装步骤

1. **确保 Python 环境**
   ```bash
   python --version  # 需要 Python 3.7+
   ```

2. **安装依赖**
   ```bash
   pip install -r requirements_paddle.txt
   ```

3. **启动 PaddleOCR 服务器**
   ```bash
   python paddle_ocr_server.py
   ```

4. **验证服务**
   - 服务器启动后会在 http://localhost:8000 运行
   - 在浏览器中访问页面，应该能看到 PaddleOCR 状态为"可用"

## 使用方法

1. 启动 PaddleOCR 服务器（见上述步骤）
2. 在 MenuGen 网页中选择 "PaddleOCR (推荐)" 
3. 上传菜单图片，享受更准确的识别效果！

## 故障排除

### PaddleOCR 显示"不可用"
- 确保 PaddleOCR 服务器正在运行
- 检查端口 8000 是否被占用
- 查看控制台错误信息

### 依赖安装失败
```bash
# 升级 pip
pip install --upgrade pip

# 如果网络问题，使用国内镜像
pip install -r requirements_paddle.txt -i https://pypi.tuna.tsinghua.edu.cn/simple/
```

### 内存不足
PaddleOCR 可能需要较多内存，建议：
- 关闭其他程序释放内存
- 如果仍有问题，可以回退使用 Tesseract.js

## 性能对比

| OCR 服务 | 中文准确率 | 处理速度 | 资源占用 | 部署复杂度 |
|----------|------------|----------|----------|------------|
| PaddleOCR | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐ |
| Tesseract.js | ⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ |

推荐使用 PaddleOCR 获得最佳的中文菜单识别效果！ 