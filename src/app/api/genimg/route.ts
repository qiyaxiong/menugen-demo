import { NextRequest, NextResponse } from 'next/server';
import { OpenAI } from 'openai';
import { createImagePrompt } from '@/utils/genImage';

// 延迟初始化豆包客户端，避免启动时错误
function createClient() {
  if (!process.env.ARK_API_KEY) {
    throw new Error('ARK_API_KEY environment variable is not set');
  }
  
  return new OpenAI({
    // 火山引擎方舟推理接入点地址
    baseURL: "https://ark.cn-beijing.volces.com/api/v3",
    // 明确指定 API Key 从 ARK_API_KEY 环境变量获取
    apiKey: process.env.ARK_API_KEY,
  });
}

export async function POST(request: NextRequest) {
  try {
    console.log('=== 图片生成 API 开始 ===');
    
    const { dishName } = await request.json();
    console.log('接收到的菜品名称:', dishName);

    if (!dishName) {
      console.log('错误: 缺少菜品名称');
      return NextResponse.json(
        { error: 'Dish name is required' },
        { status: 400 }
      );
    }

    if (!process.env.ARK_API_KEY) {
      console.log('错误: ARK API 密钥未配置');
      console.log('环境变量 ARK_API_KEY:', process.env.ARK_API_KEY ? '已设置' : '未设置');
      return NextResponse.json(
        { error: 'ARK API key not configured. Please check your environment variables.' },
        { status: 500 }
      );
    }

    // 创建详细的美食摄影提示词
    const prompt = createImagePrompt(dishName);

    console.log(`正在为菜品生成图片: ${dishName}`);
    console.log(`使用的提示词: ${prompt}`);
    console.log('API 密钥前缀:', process.env.ARK_API_KEY?.substring(0, 8) + '...');

    // 创建豆包客户端并生成图片
    const client = createClient();
    const response = await client.images.generate({
      // 指定豆包的生图模型
      model: "doubao-seedream-3-0-t2i-250415",
      prompt: prompt,
      size: "1024x1024",
      response_format: "url"
    });

    console.log('豆包 API 响应:', response);

    const imageUrl = response.data?.[0]?.url;

    if (!imageUrl) {
      console.log('错误: 豆包返回的响应中没有图片 URL');
      console.log('完整响应:', JSON.stringify(response, null, 2));
      throw new Error('No image URL returned from Doubao API');
    }

    console.log('成功生成图片 URL:', imageUrl);
    console.log('=== 图片生成 API 完成 ===');

    return NextResponse.json({ imageUrl });

  } catch (error) {
    console.error('=== 图片生成错误 ===');
    console.error('错误详情:', error);
    
    if (error instanceof Error) {
      console.error('错误消息:', error.message);
      console.error('错误堆栈:', error.stack);
    }
    
    // 返回适当的错误信息
    const errorMessage = error instanceof Error 
      ? error.message 
      : 'Failed to generate image';
    
    console.error('返回给前端的错误消息:', errorMessage);
    
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
} 