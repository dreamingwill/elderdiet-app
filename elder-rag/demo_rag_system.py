#!/usr/bin/env python3
"""
ElderDiet RAG系统完整演示
展示端到端的智能营养咨询功能
"""

import sys
import os
import time
import json

# 添加项目路径
sys.path.append(os.path.join(os.path.dirname(__file__), 'src'))

from services.vector_store import VectorStore
from services.rag_chain import RAGChain, RAGConfig, RAGMode
from services.conversation_manager import ConversationManager, ConversationAnalyzer
from services.retriever import SearchStrategy


def load_rag_system():
    """加载完整RAG系统"""
    print("🚀 正在启动ElderDiet RAG智能营养咨询系统...")
    print("="*60)
    
    # 加载向量存储
    vector_store = VectorStore(model_name="shibing624/text2vec-base-chinese")
    vector_store.load("data/vector_db")
    
    # 创建最优配置
    rag_config = RAGConfig(
        mode=RAGMode.ENHANCED,
        search_strategy=SearchStrategy.HYBRID,
        top_k=3,
        use_few_shot=True,
        enable_quality_check=True,
        response_style="professional",
        max_response_length=1200
    )
    
    # 初始化系统
    rag_chain = RAGChain(vector_store, rag_config)
    conversation_manager = ConversationManager(rag_chain)
    
    print(f"✅ 系统已就绪，知识库包含 {vector_store.get_stats()['total_documents']} 个专业文档")
    return rag_chain, conversation_manager


def display_system_intro():
    """显示系统介绍"""
    print("\n" + "🌟 ElderDiet RAG 智能营养咨询系统 🌟".center(60))
    print("="*60)
    print("🏥 专业背景：基于权威营养学知识库")
    print("🤖 AI技术：检索增强生成（RAG）+ Chain-of-Thought推理")  
    print("👨‍⚕️ 专家角色：10年经验老年营养师")
    print("💬 对话能力：多轮对话，上下文理解")
    print("🎯 专业领域：老年人营养膳食咨询")
    print("="*60)
    print("\n📋 主要功能：")
    print("  🍎 疾病营养管理 (糖尿病、高血压等)")
    print("  💊 营养素缺乏补充 (钙、维生素等)")
    print("  📅 个性化饮食规划")
    print("  🥗 食物选择指导")
    print("  ⚠️ 饮食注意事项")


def demo_single_query(rag_chain):
    """演示单次查询功能"""
    print("\n" + "="*60)
    print("🔍 单次查询演示")
    print("="*60)
    
    sample_queries = [
        "糖尿病老人应该怎么控制饮食？",
        "老年人缺钙应该怎么补充？", 
        "高血压患者能吃鸡蛋吗？",
        "帮我制定一个老年人的健康食谱"
    ]
    
    print("🎯 精选示例问题：")
    for i, query in enumerate(sample_queries, 1):
        print(f"  {i}. {query}")
    
    while True:
        choice = input(f"\n请选择问题 (1-{len(sample_queries)}) 或输入自定义问题 (输入0退出): ").strip()
        
        if choice == "0":
            break
        
        query = ""
        if choice.isdigit() and 1 <= int(choice) <= len(sample_queries):
            query = sample_queries[int(choice) - 1]
        else:
            query = choice
        
        if not query:
            continue
        
        print(f"\n💬 您的问题: {query}")
        print("🤔 AI营养师正在分析...")
        
        # 处理查询
        start_time = time.time()
        response = rag_chain.process_query(query)
        processing_time = time.time() - start_time
        
        # 显示结果
        print(f"\n🤖 专业营养师回答:")
        print("="*50)
        print(response.answer)
        print("="*50)
        
        # 显示分析信息
        print(f"\n📊 回答分析:")
        print(f"  🎯 识别意图: {response.intent.value}")
        print(f"  📈 置信度: {response.confidence_score:.1%}")
        print(f"  🌟 质量评分: {response.quality_score:.1f}/100")
        print(f"  ⏱️ 处理耗时: {processing_time:.2f}秒")
        print(f"  📚 参考文档: {len(response.sources)} 个")
        
        # 显示数据来源
        if response.sources:
            print(f"\n📖 知识来源:")
            for i, source in enumerate(response.sources[:2], 1):
                print(f"  {i}. {source.title} (相关性: {source.relevance_score:.1%})")
        
        print("\n" + "-"*60)


def demo_conversation_mode(conversation_manager):
    """演示对话模式"""
    print("\n" + "="*60)
    print("💬 智能对话演示")
    print("="*60)
    print("🎯 这是一个多轮对话演示，AI会记住对话历史并提供连贯的建议。")
    print("💡 输入 'quit' 结束对话，'stats' 查看统计，'help' 获取帮助")
    
    # 创建会话
    session_id = conversation_manager.create_session(
        user_id="demo_user",
        user_profile={
            "age": 68,
            "gender": "female", 
            "conditions": ["diabetes", "hypertension"],
            "preferences": ["清淡", "易消化"]
        }
    )
    
    print(f"\n✅ 已创建个性化会话 (会话ID: {session_id[-8:]})")
    print("👵 用户档案: 68岁女性，患有糖尿病和高血压，偏好清淡易消化食物")
    
    turn_count = 0
    
    # 建议对话流程
    print("\n🗣️ 建议对话流程 (可按此顺序询问，也可自由提问):")
    suggested_flow = [
        "我有糖尿病和高血压，日常饮食需要注意什么？",
        "那我早餐应该吃什么比较好？", 
        "除了早餐，能帮我安排一下午餐和晚餐吗？",
        "我还有轻微缺钙，需要额外补充什么吗？",
        "这些建议我老伴也可以参考吗？"
    ]
    
    for i, suggestion in enumerate(suggested_flow, 1):
        print(f"  {i}. {suggestion}")
    
    while True:
        user_input = input(f"\n💬 您的问题 (第{turn_count + 1}轮): ").strip()
        
        if user_input.lower() in ['quit', 'exit', '退出', 'q']:
            print("\n👋 对话结束，感谢使用ElderDiet RAG系统！")
            break
        
        if user_input.lower() == 'stats':
            # 显示会话统计
            session_info = conversation_manager.get_session_info(session_id)
            print(f"\n📊 对话统计:")
            print(f"  ⏱️ 对话时长: {session_info['duration']:.1f}秒")
            print(f"  💬 对话轮次: {session_info['total_turns']}")
            print(f"  🌟 平均质量: {session_info['session_stats']['average_quality_score']:.1f}/100")
            print(f"  🏷️ 讨论话题: {', '.join(session_info['session_stats']['topics_discussed'])}")
            continue
        
        if user_input.lower() == 'help':
            print(f"\n❓ 使用帮助:")
            print("  • 直接输入营养相关问题")
            print("  • 输入 'stats' 查看对话统计")
            print("  • 输入 'quit' 结束对话")
            print("  • AI会记住对话历史，提供连贯建议")
            continue
        
        if not user_input:
            continue
        
        # 处理用户输入
        print("🤔 AI营养师正在结合您的档案和对话历史分析...")
        
        response, session_info = conversation_manager.process_user_input(session_id, user_input)
        
        # 显示回答
        print(f"\n🤖 专业营养师回答:")
        print("="*50)
        print(response)
        print("="*50)
        
        # 显示轮次信息
        print(f"\n📊 本轮分析:")
        print(f"  🎯 意图识别: {session_info.get('intent', 'unknown')}")
        print(f"  🌟 回答质量: {session_info.get('quality_score', 0):.1f}/100")
        print(f"  ⏱️ 处理时间: {session_info.get('processing_time', 0):.2f}秒")
        print(f"  📚 引用文档: {session_info.get('sources_count', 0)} 个")
        
        turn_count += 1
        
        # 每隔几轮提供对话分析
        if turn_count % 3 == 0:
            analyzer = ConversationAnalyzer()
            session_obj = conversation_manager.sessions[session_id]
            analysis = analyzer.analyze_session(session_obj)
            
            print(f"\n🔍 智能分析 (第{turn_count}轮):")
            patterns = analysis['patterns']
            if 'quality_trend' in patterns:
                trend_emoji = {"improving": "📈", "declining": "📉", "stable": "➡️"}
                print(f"  📊 对话质量趋势: {trend_emoji.get(patterns['quality_trend'], '❓')} {patterns['quality_trend']}")
            
            if analysis['recommendations']:
                print(f"  💡 智能建议: {analysis['recommendations'][0]}")


def demo_system_capabilities(rag_chain):
    """演示系统能力"""
    print("\n" + "="*60)
    print("🛠️ 系统能力展示")
    print("="*60)
    
    capabilities = [
        {
            "name": "🍎 疾病营养管理",
            "query": "糖尿病老人饮食控制要点",
            "description": "专业的疾病营养管理建议"
        },
        {
            "name": "💊 营养素缺乏分析", 
            "query": "老年人缺钙的原因和补充方法",
            "description": "科学的营养素补充方案"
        },
        {
            "name": "📅 个性化食谱规划",
            "query": "高血压老人一日三餐安排",
            "description": "量身定制的饮食计划"
        },
        {
            "name": "🥗 食物安全评估",
            "query": "糖尿病患者能否食用蜂蜜",
            "description": "特定食物的适宜性判断"
        }
    ]
    
    for i, capability in enumerate(capabilities, 1):
        print(f"\n🔬 能力展示 {i}: {capability['name']}")
        print(f"📝 测试查询: {capability['query']}")
        print(f"🎯 能力说明: {capability['description']}")
        print("-" * 50)
        
        # 处理查询
        response = rag_chain.process_query(capability['query'])
        
        # 显示关键指标
        print(f"✅ 处理结果:")
        print(f"  🎯 意图识别: {response.intent.value}")
        print(f"  📊 置信度: {response.confidence_score:.1%}")
        print(f"  🌟 质量分数: {response.quality_score:.1f}/100")
        print(f"  📚 知识引用: {len(response.sources)} 个文档")
        
        # 显示回答摘要
        answer_summary = response.answer[:100] + "..." if len(response.answer) > 100 else response.answer
        print(f"  💬 回答摘要: {answer_summary}")
        
        # 质量维度分析
        if "quality_assessment" in response.metadata:
            assessment = response.metadata["quality_assessment"]
            print(f"  📋 质量维度:")
            dimensions = assessment["dimensions"]
            for dim, score in dimensions.items():
                status = "优秀" if score >= 90 else "良好" if score >= 80 else "一般"
                print(f"    • {dim}: {score:.1f} ({status})")


def demo_advanced_features(rag_chain, conversation_manager):
    """演示高级功能"""
    print("\n" + "="*60)
    print("🚀 高级功能演示")
    print("="*60)
    
    # 1. 不同配置模式对比
    print("⚙️ 1. 不同RAG模式对比")
    print("-" * 30)
    
    test_query = "老年人营养不良怎么改善？"
    modes = [
        (RAGMode.BASIC, "基础模式"),
        (RAGMode.ENHANCED, "增强模式"),
        (RAGMode.EXPERT, "专家模式")
    ]
    
    print(f"📝 测试查询: {test_query}")
    
    for mode, mode_name in modes:
        config = RAGConfig(
            mode=mode,
            use_few_shot=(mode != RAGMode.BASIC),
            enable_quality_check=(mode == RAGMode.EXPERT)
        )
        rag_chain.update_config(config)
        
        response = rag_chain.process_query(test_query)
        print(f"  🔹 {mode_name}: 质量={response.quality_score:.1f}, 长度={len(response.answer)}字符")
    
    # 2. 实时质量监控
    print(f"\n🔍 2. 实时质量监控")
    print("-" * 30)
    
    # 恢复最佳配置
    best_config = RAGConfig(mode=RAGMode.ENHANCED, enable_quality_check=True)
    rag_chain.update_config(best_config)
    
    monitoring_queries = [
        "糖尿病饮食注意事项",
        "老人补钙食物推荐", 
        "高血压降压食谱"
    ]
    
    total_quality = 0
    for query in monitoring_queries:
        response = rag_chain.process_query(query)
        total_quality += response.quality_score
        
        # 质量状态
        if response.quality_score >= 90:
            status = "🟢 优秀"
        elif response.quality_score >= 80:
            status = "🟡 良好"
        else:
            status = "🔴 需改进"
        
        print(f"  📊 {query[:15]}... → {status} ({response.quality_score:.1f}/100)")
    
    avg_quality = total_quality / len(monitoring_queries)
    print(f"  🎯 平均质量: {avg_quality:.1f}/100")
    
    # 3. 性能基准测试
    print(f"\n⚡ 3. 性能基准测试")
    print("-" * 30)
    
    performance_queries = ["老年营养"] * 10
    start_time = time.time()
    
    for query in performance_queries:
        rag_chain.process_query(query)
    
    total_time = time.time() - start_time
    avg_time = total_time / len(performance_queries)
    qps = len(performance_queries) / total_time
    
    print(f"  📊 处理 {len(performance_queries)} 个查询")
    print(f"  ⏱️ 总耗时: {total_time:.2f}秒")
    print(f"  🚀 平均响应时间: {avg_time:.3f}秒")
    print(f"  🎯 QPS (每秒查询数): {qps:.2f}")
    
    # 4. 系统统计总览
    print(f"\n📈 4. 系统统计总览")
    print("-" * 30)
    
    rag_stats = rag_chain.get_stats()
    conv_stats = conversation_manager.get_global_stats()
    
    print(f"  📝 累计处理查询: {rag_stats['total_queries']} 个")
    print(f"  💬 累计管理会话: {conv_stats['total_sessions']} 个")
    print(f"  🎯 系统成功率: {rag_stats['successful_responses']/max(rag_stats['total_queries'], 1)*100:.1f}%")
    print(f"  🌟 系统平均质量: {rag_stats['average_quality_score']:.1f}/100")
    print(f"  ⏱️ 系统平均响应: {rag_stats['average_processing_time']:.3f}秒")


def main():
    """主演示函数"""
    print("🌟 ElderDiet RAG系统 - 完整功能演示")
    print("="*60)
    print("基于AI的老年人智能营养咨询系统")
    print("Retrieval-Augmented Generation + Chain-of-Thought")
    
    try:
        # 加载系统
        rag_chain, conversation_manager = load_rag_system()
        
        # 显示系统介绍
        display_system_intro()
        
        while True:
            print("\n" + "🎛️ 功能菜单".center(60))
            print("="*60)
            print("1. 🔍 单次查询演示 - 体验AI营养师专业回答")
            print("2. 💬 智能对话演示 - 多轮对话，上下文理解")
            print("3. 🛠️ 系统能力展示 - 四大核心功能演示")
            print("4. 🚀 高级功能演示 - 性能监控和质量分析")
            print("5. 📊 系统状态查看 - 运行统计和健康状态")
            print("0. 🚪 退出系统")
            print("="*60)
            
            choice = input("请选择功能 (0-5): ").strip()
            
            if choice == "0":
                print("\n👋 感谢使用ElderDiet RAG系统！")
                print("🌟 愿您和家人身体健康，营养均衡！")
                break
            elif choice == "1":
                demo_single_query(rag_chain)
            elif choice == "2":
                demo_conversation_mode(conversation_manager)
            elif choice == "3":
                demo_system_capabilities(rag_chain)
            elif choice == "4":
                demo_advanced_features(rag_chain, conversation_manager)
            elif choice == "5":
                # 系统状态
                rag_stats = rag_chain.get_stats()
                conv_stats = conversation_manager.get_global_stats()
                
                print(f"\n📊 系统运行状态")
                print("="*40)
                print(f"🟢 系统状态: 正常运行")
                print(f"📝 累计查询: {rag_stats['total_queries']} 个")
                print(f"💬 活跃会话: {conv_stats['total_sessions']} 个")
                print(f"🎯 成功率: {rag_stats['successful_responses']/max(rag_stats['total_queries'], 1)*100:.1f}%")
                print(f"🌟 平均质量: {rag_stats['average_quality_score']:.1f}/100")
                print(f"⏱️ 平均响应时间: {rag_stats['average_processing_time']:.3f}秒")
            else:
                print("❌ 无效选择，请重新输入")
        
    except Exception as e:
        print(f"\n❌ 系统运行出现错误: {str(e)}")
        import traceback
        traceback.print_exc()


if __name__ == "__main__":
    main() 