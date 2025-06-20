'use client';

import { useState } from 'react';
import { GeneratedImage, generateDishImage } from '@/utils/genImage';

interface DishCardProps {
  dishName: string;
  initialImage?: GeneratedImage;
}

export default function DishCard({ dishName, initialImage }: DishCardProps) {
  const [image, setImage] = useState<GeneratedImage>(
    initialImage || {
      url: '',
      dishName,
      status: 'pending' as const
    }
  );
  const [isGenerating, setIsGenerating] = useState(false);

  const handleGenerateImage = async () => {
    console.log('=== 开始生成图片 ===');
    console.log('菜品名称:', dishName);
    
    setIsGenerating(true);
    setImage(prev => ({ ...prev, status: 'pending', error: undefined }));

    try {
      console.log('调用 generateDishImage 函数...');
      const result = await generateDishImage(dishName);
      console.log('成功获取图片 URL:', result.imageUrl);
      if (result.usage) {
        console.log('使用情况:', `${result.usage.count}/${result.usage.limit} (剩余: ${result.usage.remaining})`);
      }
      
      setImage({
        url: result.imageUrl,
        dishName,
        status: 'success'
      });
      
      console.log('图片状态更新为成功');
    } catch (error) {
      console.error('=== 图片生成失败 ===');
      console.error('错误详情:', error);
      
      const errorMessage = error instanceof Error ? error.message : 'Failed to generate image';
      console.error('错误消息:', errorMessage);
      
      setImage(prev => ({
        ...prev,
        status: 'error',
        error: errorMessage
      }));
    } finally {
      setIsGenerating(false);
      console.log('=== 图片生成流程结束 ===');
    }
  };

  const handleRetry = () => {
    console.log('重新尝试生成图片:', dishName);
    handleGenerateImage();
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden transition-all duration-300 hover:shadow-xl hover:scale-105">
      <div className="aspect-square relative bg-gray-100 dark:bg-gray-700">
        {isGenerating ? (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600 dark:text-gray-300 text-sm">
                正在生成图片...
              </p>
              <p className="text-gray-500 dark:text-gray-400 text-xs mt-1">
                {dishName}
              </p>
            </div>
          </div>
        ) : image.status === 'success' && image.url ? (
          <img
            src={image.url}
            alt={dishName}
            className="w-full h-full object-cover"
            onError={() => {
              console.error('图片加载失败:', image.url);
              setImage(prev => ({ ...prev, status: 'error', error: 'Image failed to load' }));
            }}
          />
        ) : image.status === 'error' ? (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <div className="text-red-500 mb-2">
                <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <p className="text-gray-600 dark:text-gray-300 text-sm mb-2">
                {image.error || '图片生成失败'}
              </p>
              <p className="text-gray-500 dark:text-gray-400 text-xs mb-3">
                {dishName}
              </p>
              <button
                onClick={handleRetry}
                className="px-3 py-1 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 transition-colors"
                disabled={isGenerating}
              >
                重试
              </button>
            </div>
          </div>
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <button
              onClick={handleGenerateImage}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              生成图片
            </button>
          </div>
        )}
      </div>
      
      <div className="p-4">
        <h3 className="font-semibold text-gray-900 dark:text-white text-lg">
          {dishName}
        </h3>
        {image.status === 'success' && (
          <p className="text-green-600 dark:text-green-400 text-sm mt-1">
            ✓ 生成成功
          </p>
        )}
        {image.status === 'error' && (
          <p className="text-red-600 dark:text-red-400 text-sm mt-1">
            ✗ 生成失败
          </p>
        )}
      </div>
    </div>
  );
} 