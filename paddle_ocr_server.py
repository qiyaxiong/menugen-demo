#!/usr/bin/env python3
# -*- coding: utf-8 -*-

from flask import Flask, request, jsonify
from flask_cors import CORS
import base64
import io
import numpy as np
from PIL import Image
import logging

# 设置日志
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = Flask(__name__)
CORS(app)  # 允许跨域请求

# 全局变量存储OCR实例
ocr = None


def init_paddle_ocr():
    """初始化PaddleOCR"""
    global ocr
    try:
        from paddleocr import PaddleOCR

        # 初始化PaddleOCR（适配新版API）
        try:
            # 尝试使用新版参数
            ocr = PaddleOCR(
                use_angle_cls=True,  # 使用角度分类器
                lang='ch'            # 中文
            )
        except Exception as e:
            logger.warning(f"使用新版参数初始化失败，尝试旧版参数: {e}")
            # 如果新版参数失败，使用更简单的初始化
            try:
                ocr = PaddleOCR(lang='ch')
            except Exception as e2:
                logger.error(f"PaddleOCR 初始化失败: {e2}")
                raise e2
        logger.info("PaddleOCR 初始化成功")
        return True
    except ImportError as e:
        logger.error(f"PaddleOCR 未安装，请运行: pip install paddlepaddle paddleocr -i https://pypi.tuna.tsinghua.edu.cn/simple") 
        return False
    except Exception as e:
        logger.error(f"PaddleOCR 初始化失败: {e}")
        return False


def base64_to_image(base64_string):
    """将base64字符串转换为PIL Image"""
    try:
        # 解码base64
        image_data = base64.b64decode(base64_string)
        # 转换为PIL Image
        image = Image.open(io.BytesIO(image_data))
        # 转换为RGB格式（如果是RGBA）
        if image.mode != 'RGB':
            image = image.convert('RGB')
        # 转换为numpy数组
        image_array = np.array(image)
        return image_array
    except Exception as e:
        logger.error(f"图片转换失败: {e}")
        return None


@app.route('/health', methods=['GET'])
def health_check():
    """健康检查接口"""
    return jsonify({
        'status': 'ok',
        'paddle_ocr_ready': ocr is not None
    })


@app.route('/test', methods=['GET'])
def test():
    """测试接口"""
    return jsonify({
        'message': 'PaddleOCR 服务运行正常',
        'paddle_ocr_ready': ocr is not None
    })


@app.route('/ocr', methods=['POST'])
def paddle_ocr_api():
    """PaddleOCR识别接口"""
    try:
        if ocr is None:
            return jsonify({'error': 'PaddleOCR 未初始化'}), 500

        # 获取请求数据
        data = request.get_json()
        if not data or 'image' not in data:
            return jsonify({'error': '缺少图片数据'}), 400

        base64_image = data['image']
        logger.info("开始处理OCR请求")

        # 转换图片格式
        image_array = base64_to_image(base64_image)
        if image_array is None:
            return jsonify({'error': '图片格式错误'}), 400

        # 执行OCR识别
        logger.info("开始PaddleOCR识别...")
        # 使用新的 predict 方法（适配新版 PaddleOCR API）
        try:
            result = ocr.predict(image_array)
        except AttributeError:
            # 如果是旧版本 PaddleOCR，回退到 ocr 方法（不使用 cls 参数）
            try:
                result = ocr.ocr(image_array)
            except Exception:
                # 最后尝试使用 cls 参数（兼容更老的版本）
                result = ocr.ocr(image_array, cls=True)

        # 处理识别结果
        texts = []
        confidence_scores = []
        
        logger.info(f"OCR原始结果类型: {type(result)}")
        
        # 处理新版PaddleOCR的返回格式
        if isinstance(result, dict):
            logger.info("检测到新版PaddleOCR字典格式")
            
            # 新版PaddleOCR返回字典格式
            if 'rec_texts' in result and 'rec_scores' in result:
                rec_texts = result.get('rec_texts', [])
                rec_scores = result.get('rec_scores', [])
                
                logger.info(f"找到 {len(rec_texts)} 个识别文字")
                logger.info(f"识别文字: {rec_texts}")
                logger.info(f"置信度分数: {rec_scores}")
                
                for i, (text, score) in enumerate(zip(rec_texts, rec_scores)):
                    if text and str(text).strip():
                        texts.append(str(text))
                        confidence_scores.append(float(score))
                        logger.info(f"添加文字 {i}: '{text}', 置信度: {score}")
            else:
                logger.warning("未找到 rec_texts 或 rec_scores 字段")
                logger.info(f"可用字段: {list(result.keys())}")
                
        elif isinstance(result, (list, tuple)) and len(result) > 0:
            logger.info("检测到旧版PaddleOCR数组格式")
            # 旧版PaddleOCR返回嵌套数组格式
            for line_idx, line in enumerate(result):
                if line:  # 确保line不为空
                    logger.info(f"处理第 {line_idx} 行: {line}")
                    for item_idx, item in enumerate(line):
                        try:
                            logger.info(f"处理第 {line_idx} 行第 {item_idx} 项: {item}")
                            
                            # 检查item结构
                            if not isinstance(item, (list, tuple)) or len(item) < 2:
                                logger.warning(f"跳过无效项: {item}")
                                continue
                            
                            # 获取文字和置信度信息
                            text_info = item[1]
                            if not isinstance(text_info, (list, tuple)) or len(text_info) < 2:
                                logger.warning(f"跳过无效文字信息: {text_info}")
                                continue
                                
                            text = str(text_info[0])  # 识别的文字
                            confidence = float(text_info[1])  # 置信度
                            
                            if text.strip():  # 只添加非空文字
                                texts.append(text)
                                confidence_scores.append(confidence)
                                logger.info(f"添加文字: '{text}', 置信度: {confidence}")
                            
                        except (IndexError, TypeError, ValueError) as e:
                            logger.warning(f"处理第 {line_idx} 行第 {item_idx} 项时出错: {e}")
                            logger.warning(f"问题项内容: {item}")
                            continue
        else:
            logger.warning(f"未知的OCR结果格式: {type(result)}")
            logger.info(f"结果内容: {result}")

        # 合并所有文本
        combined_text = '\n'.join(texts) if texts else ""
        avg_confidence = sum(confidence_scores) / len(confidence_scores) if confidence_scores else 0

        logger.info(f"PaddleOCR识别完成，识别到 {len(texts)} 行文字")
        logger.info(f"平均置信度: {avg_confidence:.2f}")
        logger.info(f"合并后的文本: '{combined_text}'")

        # 如果没有识别到任何文字，返回提示信息
        if not texts:
            logger.warning("未识别到任何文字")
            return jsonify({
                'text': '',
                'confidence': 0,
                'lines': 0,
                'details': [],
                'warning': '未识别到任何文字，请尝试上传更清晰的图片'
            })

        return jsonify({
            'text': combined_text,
            'confidence': float(avg_confidence * 100),  # 转换为百分比
            'lines': len(texts),
            'details': [
                {
                    'text': text,
                    'confidence': float(conf * 100)
                }
                for text, conf in zip(texts, confidence_scores)
            ]
        })

    except Exception as e:
        logger.error(f"OCR处理错误: {e}")
        return jsonify({'error': f'OCR处理失败: {str(e)}'}), 500


if __name__ == '__main__':
    logger.info("启动 PaddleOCR 服务器...")

    # 初始化PaddleOCR
    if init_paddle_ocr():
        logger.info("PaddleOCR 服务器准备就绪")
        
        # 尝试多个高端口号
        ports_to_try = [9001, 9002, 9003, 9004, 9005]
        
        for port in ports_to_try:
            try:
                logger.info(f"尝试启动服务器在端口 {port}...")
                app.run(host='127.0.0.1', port=port, debug=False)
                break  # 如果成功启动，跳出循环
            except OSError as e:
                logger.warning(f"端口 {port} 不可用: {e}")
                if port == ports_to_try[-1]:  # 如果是最后一个端口
                    logger.error("所有尝试的端口都不可用，请检查系统端口使用情况")
                    exit(1)
                continue
    else:
        logger.error("PaddleOCR 初始化失败，服务器无法启动")
        print("\n请安装必要的依赖:")
        print("pip install paddlepaddle paddleocr flask flask-cors pillow")
        exit(1)