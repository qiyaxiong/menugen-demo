'use client';

import { useState, useRef, useEffect } from 'react';
import { extractTextFromImage, parseMenuText, OCRProvider } from '@/utils/ocr';
import DishCard from '@/components/DishCard';

export default function Home() {
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [extractedText, setExtractedText] = useState<string>('');
  const [dishNames, setDishNames] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [selectedOCR, setSelectedOCR] = useState<OCRProvider>('paddle');
  const [paddleOCRAvailable, setPaddleOCRAvailable] = useState<boolean | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const ocrOptions = [
    { 
      value: 'paddle' as OCRProvider, 
      label: 'PaddleOCR (推荐)', 
      description: '百度开源OCR，中文识别准确率极高',
      requiresServer: true
    },
    { 
      value: 'tesseract' as OCRProvider, 
      label: 'Tesseract.js (本地)', 
      description: '本地OCR，无需额外服务，但准确率较低',
      requiresServer: false
    }
  ];

  // 检查PaddleOCR服务是否可用
  const checkPaddleOCRStatus = async () => {
    // 确保在浏览器环境中运行
    if (typeof window === 'undefined') {
      return false;
    }
    
    // 尝试多个可能的端口
    const ports = [9001, 9002, 9003, 9004, 9005];
    
    for (const port of ports) {
      try {
        const response = await fetch(`http://localhost:${port}/health`);
        const result = await response.json();
        if (result.paddle_ocr_ready) {
          console.log(`PaddleOCR服务在端口${port}上可用`);
          setPaddleOCRAvailable(true);
          // 存储可用的端口以供OCR调用使用
          if (typeof Storage !== 'undefined') {
            localStorage.setItem('paddleOCRPort', port.toString());
          }
          return true;
        }
      } catch (error) {
        console.log(`端口${port}上的PaddleOCR服务不可用:`, error);
        continue;
      }
    }
    
    console.log('所有端口上的PaddleOCR服务都不可用');
    setPaddleOCRAvailable(false);
    if (typeof Storage !== 'undefined') {
      localStorage.removeItem('paddleOCRPort');
    }
    return false;
  };

  // 页面加载时检查PaddleOCR状态
  useEffect(() => {
    checkPaddleOCRStatus();
  }, []);

  const handleImageUpload = async (file: File) => {
    console.log('=== 开始处理上传的图片 ===');
    console.log('文件信息:', {
      name: file.name,
      size: file.size,
      type: file.type
    });
    console.log('选择的OCR服务:', selectedOCR);

    if (!file.type.startsWith('image/')) {
      console.log('错误: 文件类型不是图片');
      setError('Please upload an image file');
      return;
    }

    // 如果选择了PaddleOCR但不可用，自动切换到Tesseract
    if (selectedOCR === 'paddle' && paddleOCRAvailable === false) {
      console.log('PaddleOCR不可用，自动切换到Tesseract.js');
      setSelectedOCR('tesseract');
    }

    // Display uploaded image
    const imageUrl = URL.createObjectURL(file);
    setUploadedImage(imageUrl);
    console.log('图片预览 URL 创建成功:', imageUrl);
    
    // Reset previous state
    setExtractedText('');
    setDishNames([]);
    setError(null);
    setIsProcessing(true);

    try {
      console.log(`开始 ${selectedOCR} OCR 文字识别...`);
      // Extract text using selected OCR service
      const result = await extractTextFromImage(file, selectedOCR);
      console.log('OCR 识别结果:', {
        text: result.text,
        confidence: result.confidence,
        textLength: result.text.length
      });
      
      setExtractedText(result.text);
      
      // Parse dish names from extracted text
      console.log('开始解析菜品名称...');
      const dishes = parseMenuText(result.text);
      console.log('解析出的菜品:', dishes);
      console.log('菜品数量:', dishes.length);
      
      setDishNames(dishes);
      
      if (dishes.length === 0) {
        console.log('警告: 未识别到任何菜品名称');
        setError('No dish names found in the image. Please try a clearer image or switch OCR service.');
      } else {
        console.log('成功识别到菜品，可以开始生成图片');
      }
    } catch (err) {
      console.error('=== OCR 处理错误 ===');
      console.error('错误详情:', err);
      setError(err instanceof Error ? err.message : 'Failed to process image');
    } finally {
      setIsProcessing(false);
      console.log('=== 图片处理流程结束 ===');
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      handleImageUpload(file);
    }
  };

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    const file = event.dataTransfer.files[0];
    if (file) {
      handleImageUpload(file);
    }
  };

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
  };

  const handleGenerateAll = async () => {
    // This would trigger generation for all dishes at once
    // For now, users can click individual cards
    console.log('Generate all dishes:', dishNames);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-6xl font-bold text-gray-900 dark:text-white mb-4">
            MenuGen
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
            Upload a photo of a restaurant menu and watch AI generate beautiful images of each dish
          </p>
        </div>

        {/* OCR Service Selector */}
        <div className="max-w-4xl mx-auto mb-8">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              选择OCR识别服务
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {ocrOptions.map((option) => (
                <div
                  key={option.value}
                  className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                    selectedOCR === option.value
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                      : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
                  } ${
                    option.value === 'paddle' && paddleOCRAvailable === false
                      ? 'opacity-50 cursor-not-allowed'
                      : ''
                  }`}
                  onClick={() => {
                    if (option.value === 'paddle' && paddleOCRAvailable === false) {
                      return;
                    }
                    setSelectedOCR(option.value);
                  }}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center">
                      <input
                        type="radio"
                        checked={selectedOCR === option.value}
                        onChange={() => {
                          if (option.value === 'paddle' && paddleOCRAvailable === false) {
                            return;
                          }
                          setSelectedOCR(option.value);
                        }}
                        disabled={option.value === 'paddle' && paddleOCRAvailable === false}
                        className="mr-2"
                      />
                      <span className="font-medium text-gray-900 dark:text-white">
                        {option.label}
                      </span>
                    </div>
                    {option.value === 'paddle' && (
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        paddleOCRAvailable === null
                          ? 'bg-yellow-100 text-yellow-800'
                          : paddleOCRAvailable
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {paddleOCRAvailable === null
                          ? '检查中'
                          : paddleOCRAvailable
                          ? '可用'
                          : '不可用'
                        }
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {option.description}
                  </p>
                  {option.value === 'paddle' && paddleOCRAvailable === false && (
                    <p className="text-xs text-red-600 dark:text-red-400 mt-2">
                      需要启动PaddleOCR服务器
                    </p>
                  )}
                </div>
              ))}
            </div>
            
            {/* PaddleOCR服务器说明 */}
            {selectedOCR === 'paddle' && paddleOCRAvailable === false && (
              <div className="mt-4 p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                <p className="text-sm text-yellow-800 dark:text-yellow-200 mb-2">
                  <strong>启动PaddleOCR服务器：</strong>
                </p>
                <div className="bg-gray-900 text-green-400 p-3 rounded text-xs font-mono">
                  # 安装依赖<br/>
                  pip install -r requirements_paddle.txt<br/><br/>
                  # 启动服务器<br/>
                  python paddle_ocr_server.py
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Upload Section */}
        <div className="max-w-4xl mx-auto mb-12">
          <div
            className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl p-12 text-center hover:border-blue-500 dark:hover:border-blue-400 transition-colors cursor-pointer"
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onClick={() => fileInputRef.current?.click()}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileSelect}
              className="hidden"
            />
            
            {uploadedImage ? (
              <div className="space-y-4">
                <img
                  src={uploadedImage}
                  alt="Uploaded menu"
                  className="max-h-96 mx-auto rounded-lg shadow-lg"
                />
                <p className="text-gray-600 dark:text-gray-300">
                  Click to upload a different image
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="text-gray-400 dark:text-gray-500">
                  <svg className="w-20 h-20 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                </div>
                <div>
                  <p className="text-xl font-medium text-gray-900 dark:text-white mb-2">
                    Upload a menu image
                  </p>
                  <p className="text-gray-500 dark:text-gray-400">
                    Drag and drop or click to select a photo of a restaurant menu
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Processing Status */}
        {isProcessing && (
          <div className="max-w-4xl mx-auto mb-8">
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg">
              <div className="flex items-center justify-center space-x-3">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                <p className="text-gray-700 dark:text-gray-300">
                  使用 {ocrOptions.find(o => o.value === selectedOCR)?.label} 处理图片并提取菜品名称...
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Error Display */}
        {error && (
          <div className="max-w-4xl mx-auto mb-8">
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-6">
              <div className="flex items-center space-x-3">
                <div className="text-red-500">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                </div>
                <p className="text-red-700 dark:text-red-300">{error}</p>
              </div>
            </div>
          </div>
        )}



        {/* Dish Names Editor */}
        {dishNames.length > 0 && !isProcessing && (
          <div className="max-w-4xl mx-auto mb-8">
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                识别出的菜品名称 (可编辑)
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                您可以编辑下面的菜品名称，每行一个菜品，删除不需要的或添加漏掉的菜品
              </p>
              <textarea
                value={dishNames.join('\n')}
                onChange={(e) => {
                  const newDishes = e.target.value
                    .split('\n')
                    .map(name => name.trim())
                    .filter(name => name.length > 0);
                  setDishNames(newDishes);
                }}
                className="w-full h-48 p-4 border border-gray-300 dark:border-gray-600 rounded-lg 
                          bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white
                          focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                placeholder="每行输入一个菜品名称..."
              />
              <div className="mt-4 flex justify-between items-center">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  共 {dishNames.length} 个菜品
                </p>
                <button
                  onClick={() => {
                    // 重新解析原始文本
                    const dishes = parseMenuText(extractedText);
                    setDishNames(dishes);
                  }}
                  className="px-4 py-2 text-sm bg-gray-500 hover:bg-gray-600 text-white rounded-lg transition-colors"
                >
                  重置为自动识别结果
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Generated Dishes Grid */}
        {dishNames.length > 0 && !isProcessing && (
          <div className="max-w-7xl mx-auto">
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                发现的菜品 ({dishNames.length})
              </h2>
              {dishNames.length > 1 && (
                <button
                  onClick={handleGenerateAll}
                  className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
                >
                  为所有菜品生成图片
                </button>
              )}
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {dishNames.map((dish, index) => (
                <DishCard key={`${dish}-${index}`} dishName={dish} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
