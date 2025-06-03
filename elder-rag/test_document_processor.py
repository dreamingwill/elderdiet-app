#!/usr/bin/env python3
"""
文档处理器测试脚本
演示如何处理书籍、PDF等长文档并构建知识库
"""

import sys
import os
import json

# 添加项目路径
sys.path.append(os.path.join(os.path.dirname(__file__), 'src'))

from utils.document_processor import DocumentProcessor
from utils.text_processor import TextProcessor
from services.vector_store import VectorStore

def demo_book_processing():
    """演示书籍内容处理"""
    print("📚 演示：营养学书籍内容处理")
    print("="*50)
    
    # 模拟营养学教材内容
    book_content = """
    第一章 老年人营养基础知识
    
    随着人口老龄化的加剧，老年人的营养健康问题日益受到关注。老年人由于生理机能的衰退，
    对营养素的需求和吸收都发生了变化，需要特殊的营养管理。
    
    1.1 老年人的生理特点
    
    老年人的消化系统功能逐渐减弱，胃酸分泌减少，影响蛋白质和维生素B12的吸收。
    牙齿脱落或咀嚼功能下降，影响食物的充分咀嚼和消化。肾功能下降，对水盐调节能力减弱。
    
    1.2 营养素需求特点
    
    蛋白质需求：老年人蛋白质合成率下降，分解率增加，建议蛋白质摄入量为每公斤体重1.0-1.2克。
    应优先选择生物价高的优质蛋白质，如鱼、禽、蛋、奶、豆类等。
    
    维生素需求：老年人对维生素D、维生素B12、叶酸的需求增加。维生素D有助于钙的吸收，
    预防骨质疏松。维生素B12缺乏可导致巨幼红细胞性贫血。
    
    第二章 常见疾病的营养干预
    
    老年人常患有多种慢性疾病，如糖尿病、高血压、心血管疾病等，需要通过营养干预来控制病情。
    
    2.1 糖尿病的营养管理
    
    糖尿病是老年人常见的代谢性疾病。营养治疗是糖尿病管理的基础，主要原则包括：
    控制总能量摄入，合理分配三大营养素比例，选择血糖指数较低的食物。
    
    推荐食物：燕麦、糙米、全麦面包、新鲜蔬菜、瘦肉、鱼类、豆制品。
    限制食物：精制糖、甜食、含糖饮料、精白米面、高脂肪食物。
    
    2.2 高血压的营养调理
    
    高血压的营养干预主要通过DASH饮食模式，即富含水果、蔬菜、低脂乳制品，
    限制钠盐摄入的饮食模式。建议每日钠摄入量不超过2.3克（相当于食盐6克）。
    
    第三章 营养评估与监测
    
    定期进行营养评估对老年人健康维护至关重要。
    
    3.1 营养状态评估方法
    
    体格测量：包括身高、体重、BMI、腰围、上臂围等指标。
    生化指标：血红蛋白、血清白蛋白、前白蛋白、维生素水平等。
    饮食调查：24小时回顾法、食物频率问卷、饮食记录法等。
    """
    
    # 初始化文档处理器
    processor = DocumentProcessor(chunk_size=300, overlap=30)
    
    # 处理书籍内容
    documents = processor.extract_from_text(book_content, "老年营养学教材")
    
    print(f"✅ 从书籍中提取了 {len(documents)} 个知识条目")
    print("\n📋 处理结果示例:")
    
    for i, doc in enumerate(documents[:3], 1):  # 只显示前3个
        print(f"\n--- 条目 {i} ---")
        print(f"ID: {doc['id']}")
        print(f"标题: {doc['title']}")
        print(f"类别: {doc['category']}")
        print(f"来源: {doc['source']}")
        print(f"章节: {doc['section_id']}, 块: {doc['chunk_id']}")
        print(f"内容: {doc['content'][:100]}...")
    
    return documents

def demo_structured_data_processing():
    """演示结构化数据处理"""
    print("\n" + "="*50)
    print("📊 演示：结构化数据处理（如Excel表格数据）")
    print("="*50)
    
    # 模拟从Excel转换的结构化数据
    structured_data = [
        {
            "name": "糖尿病患者早餐搭配",
            "description": "适合糖尿病患者的早餐搭配方案：燕麦片50g + 低脂牛奶200ml + 鸡蛋1个 + 黄瓜丝50g。总热量约350千卡，碳水化合物占45%，蛋白质占25%，脂肪占30%。",
            "category": "疾病食谱",
            "keywords": ["糖尿病", "早餐", "燕麦", "低脂牛奶"],
            "target_group": "糖尿病患者"
        },
        {
            "name": "高血压降压蔬菜汁",
            "description": "芹菜200g + 胡萝卜100g + 苹果1个，榨汁饮用。芹菜含有丰富的钾离子，有助于降血压。建议每日饮用200-300ml，最好在餐前30分钟饮用。",
            "category": "疾病食谱", 
            "keywords": ["高血压", "芹菜", "降压", "蔬菜汁"],
            "target_group": "高血压患者"
        },
        {
            "name": "老年人补钙食物清单",
            "description": "富含钙质的食物包括：牛奶及奶制品、深绿色蔬菜（如菠菜、小白菜）、豆制品、芝麻、小鱼干、虾皮等。建议老年人每日钙摄入量1000-1200mg。",
            "category": "营养素补充",
            "keywords": ["钙质", "骨质疏松", "牛奶", "豆制品"],
            "target_group": "老年人"
        }
    ]
    
    processor = DocumentProcessor()
    documents = processor.process_structured_data(structured_data, "营养师手册")
    
    print(f"✅ 处理了 {len(documents)} 条结构化数据")
    
    for doc in documents:
        print(f"\n📄 {doc['title']}")
        print(f"   类别: {doc['category']}")
        print(f"   关键词: {doc.get('keywords', 'N/A')}")
        print(f"   内容: {doc['content'][:80]}...")
    
    return documents

def demo_vector_processing(all_documents):
    """演示向量化处理"""
    print("\n" + "="*50)
    print("🧠 演示：文档向量化与检索")
    print("="*50)
    
    # 文本预处理
    text_processor = TextProcessor()
    processed_docs = text_processor.process_documents(all_documents)
    
    print(f"✅ 完成 {len(processed_docs)} 个文档的文本预处理")
    
    # 向量化存储（使用较小模型用于演示）
    print("\n🔄 正在构建向量索引...")
    vector_store = VectorStore(model_name="shibing624/text2vec-base-chinese")
    vector_store.add_documents(processed_docs)
    
    # 测试检索
    print("\n🔍 测试检索功能:")
    test_queries = [
        "老年人蛋白质需要吃多少？",
        "糖尿病人早餐吃什么好？",
        "高血压怎么通过食物降压？"
    ]
    
    for query in test_queries:
        print(f"\n查询: {query}")
        results = vector_store.search(query, top_k=2)
        for i, result in enumerate(results, 1):
            print(f"  {i}. {result['title']} (相似度: {result['similarity_score']:.4f})")
            print(f"     来源: {result.get('source', 'N/A')}")

def demo_practical_workflow():
    """演示实际工作流程"""
    print("\n" + "="*60)
    print("🚀 实际应用工作流程演示")
    print("="*60)
    
    print("""
    📖 实际使用场景：
    
    1. 准备营养学资料（PDF书籍、Word文档、网页内容等）
    2. 使用DocumentProcessor提取和分割内容
    3. 通过TextProcessor进行中文预处理
    4. 用VectorStore构建可检索的知识库
    5. 提供语义检索API服务
    
    💡 建议的数据来源：
    - 《中国居民膳食指南》
    - 营养学专业教材
    - 医学期刊文献
    - 营养师专业手册
    - 权威营养网站内容
    
    📊 数据规模建议：
    - 小型项目: 100-500条知识条目
    - 中型项目: 1000-5000条知识条目  
    - 大型项目: 10000+条知识条目
    """)

def main():
    """主演示函数"""
    print("🏥 ElderDiet RAG 文档处理完整演示")
    print("="*60)
    
    try:
        # 1. 演示书籍内容处理
        book_docs = demo_book_processing()
        
        # 2. 演示结构化数据处理
        structured_docs = demo_structured_data_processing()
        
        # 3. 合并所有文档
        all_documents = book_docs + structured_docs
        
        # 4. 演示向量化处理
        demo_vector_processing(all_documents)
        
        # 5. 实际工作流程说明
        demo_practical_workflow()
        
        print("\n" + "="*60)
        print("🎉 文档处理演示完成！")
        print("📝 现在你知道如何将书籍等资料转换为RAG知识库了")
        print("="*60)
        
    except Exception as e:
        print(f"\n❌ 演示过程中出现错误: {str(e)}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    main() 