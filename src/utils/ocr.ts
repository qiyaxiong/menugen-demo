import { createWorker } from 'tesseract.js';

export interface OCRResult {
  text: string;
  confidence: number;
}

export type OCRProvider = 'paddle' | 'tesseract';

// 图像预处理函数
function preprocessImage(file: File): Promise<File> {
  return new Promise((resolve) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d')!;
    const img = new Image();
    
    img.onload = () => {
      // 设置画布尺寸，增加分辨率
      const scale = 2;
      canvas.width = img.width * scale;
      canvas.height = img.height * scale;
      
      // 应用图像预处理
      ctx.imageSmoothingEnabled = false;
      ctx.scale(scale, scale);
      
      // 绘制原图
      ctx.drawImage(img, 0, 0);
      
      // 应用对比度和亮度调整
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imageData.data;
      
      // 增强对比度
      for (let i = 0; i < data.length; i += 4) {
        // 增加对比度
        data[i] = Math.min(255, Math.max(0, (data[i] - 128) * 1.5 + 128));     // Red
        data[i + 1] = Math.min(255, Math.max(0, (data[i + 1] - 128) * 1.5 + 128)); // Green
        data[i + 2] = Math.min(255, Math.max(0, (data[i + 2] - 128) * 1.5 + 128)); // Blue
      }
      
      ctx.putImageData(imageData, 0, 0);
      
      // 转换为blob
      canvas.toBlob((blob) => {
        if (blob) {
          const processedFile = new File([blob], file.name, { type: 'image/png' });
          resolve(processedFile);
        } else {
          resolve(file);
        }
      }, 'image/png', 0.95);
    };
    
    img.src = URL.createObjectURL(file);
  });
}

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const base64 = (reader.result as string).split(',')[1];
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

// PaddleOCR API调用
async function paddleOCR(imageFile: File): Promise<OCRResult> {
  try {
    console.log('开始PaddleOCR识别...');
    
    // 获取可用的端口（确保在浏览器环境中）
    const savedPort = typeof Storage !== 'undefined' ? localStorage.getItem('paddleOCRPort') : null;
    const ports = savedPort ? [parseInt(savedPort)] : [9001, 9002, 9003, 9004, 9005];
    
    // 转换为base64
    const base64 = await fileToBase64(imageFile);
    
    let response;
    let usedPort;
    
    // 尝试连接到可用的端口
    for (const port of ports) {
      try {
        console.log(`尝试连接到端口 ${port}...`);
        response = await fetch(`http://localhost:${port}/ocr`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ image: base64 })
        });
        
        if (response.ok) {
          usedPort = port;
          if (typeof Storage !== 'undefined') {
            localStorage.setItem('paddleOCRPort', port.toString());
          }
          break;
        }
      } catch (error) {
        console.log(`端口 ${port} 连接失败:`, error);
        continue;
      }
    }
    
    if (!response || !response.ok) {
      throw new Error(`无法连接到PaddleOCR服务，请确保服务器正在运行`);
    }
    
    console.log(`使用端口 ${usedPort} 进行PaddleOCR识别`);
    
    const result = await response.json();
    
    if (result.error) {
      throw new Error(result.error);
    }
    
    console.log('PaddleOCR识别成功:', {
      text: result.text,
      confidence: result.confidence,
      lines: result.lines
    });
    
    return {
      text: result.text,
      confidence: result.confidence
    };
    
  } catch (error) {
    console.error('PaddleOCR识别失败:', error);
    throw error;
  }
}

// Tesseract.js 本地OCR（作为备用）
async function tesseractOCR(imageFile: File): Promise<OCRResult> {
  console.log('使用Tesseract.js本地OCR...');
  
  const processedFile = await preprocessImage(imageFile);
  
  // 定义多种OCR配置，针对不同布局
  const configs = [
    {
      name: '单行文本模式',
      langs: ['chi_sim'],
      params: {
        'tessedit_page_seg_mode': '7', // 单行文本
        'tessedit_ocr_engine_mode': '1',
        'tessedit_char_whitelist': '',
        'preserve_interword_spaces': '1',
        'user_defined_dpi': '300',
      }
    },
    {
      name: '单词模式',
      langs: ['chi_sim'],
      params: {
        'tessedit_page_seg_mode': '8', // 单词模式
        'tessedit_ocr_engine_mode': '1',
        'tessedit_char_whitelist': '',
        'preserve_interword_spaces': '1',
        'user_defined_dpi': '300',
      }
    },
    {
      name: '中文优化配置1',
      langs: ['chi_sim'],
      params: {
        'tessedit_page_seg_mode': '1',
        'tessedit_ocr_engine_mode': '1',
        'tessedit_char_whitelist': '',
        'preserve_interword_spaces': '1',
        'user_defined_dpi': '300',
      }
    },
    {
      name: '中文优化配置2', 
      langs: ['chi_sim'],
      params: {
        'tessedit_page_seg_mode': '6',
        'tessedit_ocr_engine_mode': '1',
        'tessedit_char_whitelist': '',
        'preserve_interword_spaces': '1',
        'user_defined_dpi': '200',
      }
    },
    {
      name: '自动模式',
      langs: ['chi_sim'],
      params: {
        'tessedit_page_seg_mode': '3', // 完全自动
        'tessedit_ocr_engine_mode': '1',
        'tessedit_char_whitelist': '',
        'preserve_interword_spaces': '1',
        'user_defined_dpi': '300',
      }
    }
  ];
  
  let bestResult: any = null;
  let bestScore = 0;
  let allResults: any[] = [];
  
  // 尝试每种配置
  for (const config of configs) {
    try {
      console.log(`尝试配置: ${config.name}`);
      const worker = await createWorker(config.langs, undefined, {
        logger: m => console.log(`${config.name}:`, m)
      });
      
      await worker.setParameters(config.params);
      const { data } = await worker.recognize(processedFile);
      await worker.terminate();
      
      // 计算结果质量分数（置信度 + 中文字符数量）
      const chineseCharCount = (data.text.match(/[\u4e00-\u9fff]/g) || []).length;
      const score = data.confidence + (chineseCharCount * 2); // 中文字符权重更高
      
      console.log(`${config.name} - 置信度: ${data.confidence}, 中文字符数: ${chineseCharCount}, 总分: ${score}`);
      console.log(`识别文本: ${data.text}`);
      
      allResults.push({
        config: config.name,
        text: data.text,
        confidence: data.confidence,
        score: score
      });
      
      if (score > bestScore) {
        bestScore = score;
        bestResult = data;
      }
      
    } catch (error) {
      console.error(`配置 ${config.name} 失败:`, error);
    }
  }
  
  // 如果所有结果都不理想，尝试合并多个结果
  if (bestScore < 50) {
    console.log('所有配置得分较低，尝试合并结果...');
    const combinedTexts = allResults
      .filter(r => r.confidence > 30)
      .map(r => r.text)
      .join('\n');
    
    if (combinedTexts.trim()) {
      bestResult = {
        text: combinedTexts,
        confidence: Math.max(...allResults.map(r => r.confidence))
      };
    }
  }
  
  if (!bestResult) {
    throw new Error('OCR识别失败');
  }
  
  const cleanedText = cleanOCRText(bestResult.text);
  console.log('Tesseract最终识别文本:', cleanedText);
  console.log('最终置信度:', bestResult.confidence);
  
  return {
    text: cleanedText,
    confidence: bestResult.confidence
  };
}

export async function extractTextFromImage(
  imageFile: File, 
  provider: OCRProvider = 'paddle'
): Promise<OCRResult> {
  console.log(`开始OCR识别，使用服务: ${provider}`);
  
  try {
    switch (provider) {
      case 'paddle':
        return await paddleOCR(imageFile);
      case 'tesseract':
        return await tesseractOCR(imageFile);
      default:
        throw new Error(`不支持的OCR服务: ${provider}`);
    }
  } catch (error) {
    console.error(`${provider} OCR失败，尝试备用方案:`, error);
    
    // 如果PaddleOCR失败，回退到Tesseract
    if (provider !== 'tesseract') {
      console.log('回退到Tesseract.js...');
      return await tesseractOCR(imageFile);
    }
    
    throw error;
  }
}

function cleanOCRText(text: string): string {
  return text
    // 标准化换行和空格
    .replace(/[\r\n]+/g, '\n')
    .replace(/\s+/g, ' ')
    // 保留中文、英文、数字和常用标点
    .replace(/[^\u4e00-\u9fff\u3000-\u303f\uff00-\uffefa-zA-Z0-9\s\n.,，。、：；]/g, '')
    // 移除价格信息
    .replace(/\d+\s*[元￥]/g, '')
    .replace(/\$\d+/g, '')
    // 修复常见OCR错误
    .replace(/\s+/g, '\n')
    .split('\n')
    .map(line => line.trim())
    .filter(line => line.length > 0)
    .join('\n')
    .trim();
}

export function parseMenuText(text: string): string[] {
  console.log('原始OCR文本:', text);
  
  const lines = text
    .split(/[\n\r]+/)
    .map(line => line.trim())
    .filter(line => line.length > 0);
  
  console.log('分割后的行:', lines);
  
  // 常见菜品关键词
  const dishKeywords = [
    // 烹饪方法
    '炒', '炸', '煮', '蒸', '烤', '炖', '焖', '煎', '烧', '爆', '拌', '凉', '红烧', '清炒', '干煸', '水煮',
    // 食材
    '肉', '鱼', '虾', '蟹', '鸡', '鸭', '猪', '牛', '羊', '豆腐', '茄子', '土豆', '白菜', '菠菜', '韭菜', 
    '黄瓜', '萝卜', '冬瓜', '南瓜', '丝瓜', '苦瓜', '青椒', '辣椒', '西红柿', '豆角', '芹菜', '洋葱',
    '蘑菇', '木耳', '银耳', '海带', '紫菜', '莲藕', '山药', '胡萝卜', '花菜', '西兰花', '生菜', '油菜',
    // 特色词汇
    '片', '丝', '块', '条', '丁', '段', '粒', '球', '卷', '包', '饺', '面', '粉', '汤', '粥', '饭',
    '酱', '醋', '糖', '盐', '香', '辣', '麻', '酸', '甜', '鲜', '嫩', '脆', '滑', '软'
  ];
  
  // 处理每一行，提取菜品名称
  const extractedDishes: string[] = [];
  
  for (const line of lines) {
    // 跳过过短或过长的行
    if (line.length < 2 || line.length > 30) continue;
    
    // 尝试从包含价格的行中提取菜品名
    // 匹配格式：菜品名 数字元/条|个|份|斤等
    const pricePattern = /^(.+?)\s*\d+\s*[元￥]\s*[\/|]\s*[条个份斤只盘碗杯]?/;
    const priceMatch = line.match(pricePattern);
    
    if (priceMatch) {
      const dishName = priceMatch[1].trim();
      if (dishName.length >= 2 && dishName.length <= 12) {
        extractedDishes.push(dishName);
        console.log(`从价格行提取菜品: "${dishName}" (原文: "${line}")`);
        continue;
      }
    }
    
    // 尝试按空格分割，寻找菜品名
    const parts = line.split(/\s+/);
    for (const part of parts) {
      if (part.length >= 2 && part.length <= 12) {
        const chineseCharCount = (part.match(/[\u4e00-\u9fff]/g) || []).length;
        const digitCount = (part.match(/\d/g) || []).length;
        
        // 必须主要由中文组成
        if (chineseCharCount >= 2 && chineseCharCount >= part.length * 0.7 && digitCount <= 1) {
          // 检查是否包含菜品关键词或是合理的中文词汇
          const hasKeyword = dishKeywords.some(keyword => part.includes(keyword));
          const isPureChineseName = chineseCharCount === part.length && part.length >= 3;
          
          if (hasKeyword || isPureChineseName) {
            extractedDishes.push(part);
            console.log(`提取菜品: "${part}" (来源: "${line}")`);
          }
        }
      }
    }
    
    // 如果上述方法都没有提取到，尝试整行作为菜品名
    const chineseCharCount = (line.match(/[\u4e00-\u9fff]/g) || []).length;
    const digitCount = (line.match(/\d/g) || []).length;
    
    if (chineseCharCount >= 2 && 
        chineseCharCount >= line.length * 0.7 && 
        digitCount <= 1 &&
        line.length >= 2 && 
        line.length <= 12) {
      
      // 跳过菜单分类标题和无意义词汇
      const invalidPatterns = [
        '菜单', '开胃菜', '前菜', '主菜', '甜品', '饮料', '汤类', '特色菜',
        '招牌菜', '今日特色', '厨师推荐', '素食', '荤菜', '面食', '价格',
        '元', '人元', '二二', '三三', '四四', '五五', '六六', '七七', '八八', '九九',
        '一一', '零零', '００', '１１', '２２', '３３'
      ];
      
      const isInvalid = invalidPatterns.some(pattern => line.includes(pattern));
      const isRepeated = /^(.)\1+$/.test(line);
      
      if (!isInvalid && !isRepeated) {
        const hasKeyword = dishKeywords.some(keyword => line.includes(keyword));
        const isPureChineseName = chineseCharCount === line.length && line.length >= 3;
        
        if (hasKeyword || isPureChineseName) {
          extractedDishes.push(line);
          console.log(`整行作为菜品: "${line}"`);
        }
      }
    }
  }
  
  // 去重并返回
  const uniqueDishes = [...new Set(extractedDishes)];
  console.log('过滤后的菜品名:', uniqueDishes);
  
  return uniqueDishes;
} 