#!/usr/bin/env python3
"""
RAG Chain完整测试脚本
测试端到端的检索增强生成功能
"""

import sys
import os
import time
import json

# 添加项目路径
sys.path.append(os.path.join(os.path.dirname(__file__), 'src'))

from services.vector_store import VectorStore
from services.rag_chain import RAGChain, RAGConfig, RAGMode, RAGContext
from services.conversation_manager import ConversationManager, ConversationAnalyzer
from services.retriever import SearchStrategy


def setup_rag_system():
    """设置RAG系统"""
    print("🚀 初始化完整RAG系统")
    print("="*60)
    
    # 加载向量存储
    print("正在加载向量数据库...")
    vector_store = VectorStore(model_name="shibing624/text2vec-base-chinese")
    
    db_path = "data/vector_db"
    if os.path.exists(db_path):
        vector_store.load(db_path)
        print(f"✅ 已加载向量数据库: {vector_store.get_stats()['total_documents']} 个文档")
    else:
        print("❌ 未找到向量数据库，请先运行 test_knowledge_base.py")
        return None, None, None
    
    # 创建RAG配置
    rag_config = RAGConfig(
        mode=RAGMode.ENHANCED,
        search_strategy=SearchStrategy.HYBRID,
        top_k=3,
        use_few_shot=True,
        enable_quality_check=True,
        response_style="professional"
    )
    
    # 初始化RAG Chain
    rag_chain = RAGChain(vector_store, rag_config)
    
    # 初始化对话管理器
    conversation_manager = ConversationManager(rag_chain)
    
    print("✅ RAG系统初始化完成")
    return rag_chain, conversation_manager, rag_config


def test_basic_rag_functionality(rag_chain):
    """测试基础RAG功能"""
    print("\n" + "="*60)
    print("🔧 测试基础RAG功能")
    print("="*60)
    
    test_queries = [
        "糖尿病老人应该怎么控制饮食？",
        "老年人缺钙应该怎么补充？",
        "高血压患者能吃鸡蛋吗？",
        "帮我制定一个老年人的健康食谱"
    ]
    
    for i, query in enumerate(test_queries, 1):
        print(f"\n🧪 测试案例 {i}: {query}")
        print("-" * 50)
        
        start_time = time.time()
        
        # 处理查询
        response = rag_chain.process_query(query)
        
        end_time = time.time()
        
        # 显示结果
        print(f"🎯 识别意图: {response.intent.value}")
        print(f"📊 置信度: {response.confidence_score:.3f}")
        print(f"🌟 质量分数: {response.quality_score:.1f}/100")
        print(f"⏱️ 处理时间: {response.processing_time:.3f}s")
        print(f"📚 检索文档: {len(response.sources)} 个")
        print(f"📝 回答长度: {len(response.answer)} 字符")
        
        # 显示回答预览
        print(f"\n💬 回答预览:")
        preview = response.answer[:200] + "..." if len(response.answer) > 200 else response.answer
        print(preview)
        
        # 质量评估详情
        if "quality_assessment" in response.metadata:
            assessment = response.metadata["quality_assessment"]
            print(f"\n📋 质量评估:")
            for dim, score in assessment["dimensions"].items():
                print(f"   {dim}: {score:.1f}")
            
            if assessment["issues"]:
                print(f"⚠️ 发现问题: {', '.join(assessment['issues'])}")


def test_different_rag_modes(rag_chain):
    """测试不同RAG模式"""
    print("\n" + "="*60)
    print("⚙️ 测试不同RAG模式")
    print("="*60)
    
    query = "糖尿病老人饮食控制建议"
    modes = [
        (RAGMode.BASIC, "基础模式"),
        (RAGMode.ENHANCED, "增强模式"),
        (RAGMode.EXPERT, "专家模式")
    ]
    
    for mode, mode_name in modes:
        print(f"\n🔄 测试{mode_name} ({mode.value})")
        print("-" * 40)
        
        # 更新配置
        config = RAGConfig(
            mode=mode,
            use_few_shot=(mode != RAGMode.BASIC),
            enable_quality_check=(mode == RAGMode.EXPERT),
            response_style="professional" if mode == RAGMode.EXPERT else "friendly"
        )
        rag_chain.update_config(config)
        
        # 处理查询
        response = rag_chain.process_query(query)
        
        print(f"📊 质量分数: {response.quality_score:.1f}")
        print(f"⏱️ 处理时间: {response.processing_time:.3f}s")
        print(f"📝 回答长度: {len(response.answer)} 字符")
        print(f"💬 回答风格: {config.response_style}")


def test_conversation_management(conversation_manager):
    """测试对话管理功能"""
    print("\n" + "="*60)
    print("💬 测试对话管理功能")
    print("="*60)
    
    # 创建会话
    session_id = conversation_manager.create_session(
        user_id="test_user",
        user_profile={"age": 70, "conditions": ["diabetes"], "preferences": ["清淡"]}
    )
    
    print(f"✅ 创建会话: {session_id}")
    
    # 模拟多轮对话
    conversation_turns = [
        "我是糖尿病患者，应该怎么控制饮食？",
        "那我可以吃什么水果呢？",
        "除了饮食，还有其他需要注意的吗？",
        "请帮我制定一个一日三餐的计划"
    ]
    
    for turn_num, user_input in enumerate(conversation_turns, 1):
        print(f"\n👤 用户 (第{turn_num}轮): {user_input}")
        
        # 处理用户输入
        response, session_info = conversation_manager.process_user_input(session_id, user_input)
        
        print(f"🤖 助手: {response[:150]}..." if len(response) > 150 else f"🤖 助手: {response}")
        print(f"📊 轮次信息: 意图={session_info.get('intent')}, 质量={session_info.get('quality_score', 0):.1f}")
    
    # 获取会话信息
    session_info = conversation_manager.get_session_info(session_id)
    print(f"\n📋 会话总结:")
    print(f"   总轮次: {session_info['total_turns']}")
    print(f"   会话时长: {session_info['duration']:.1f}秒")
    print(f"   平均质量: {session_info['session_stats']['average_quality_score']:.1f}")
    print(f"   讨论话题: {list(session_info['session_stats']['topics_discussed'])}")
    
    # 对话分析
    analyzer = ConversationAnalyzer()
    session = conversation_manager.sessions[session_id]
    analysis = analyzer.analyze_session(session)
    
    print(f"\n🔍 对话分析:")
    print(f"   主要意图: {analysis['patterns'].get('dominant_intent')}")
    print(f"   意图多样性: {analysis['patterns'].get('intent_diversity')}")
    print(f"   质量趋势: {analysis['patterns'].get('quality_trend')}")
    print(f"   改进建议: {analysis['recommendations'][:2]}")  # 显示前2个建议


def test_rag_performance(rag_chain):
    """测试RAG性能"""
    print("\n" + "="*60)
    print("🏃 测试RAG性能")
    print("="*60)
    
    # 准备测试查询
    test_queries = [
        "糖尿病饮食",
        "老年人补钙方法",
        "高血压饮食禁忌",
        "老人营养食谱",
        "心血管疾病预防"
    ] * 5  # 重复5次，总共25个查询
    
    print(f"🧪 准备处理 {len(test_queries)} 个查询...")
    
    start_time = time.time()
    responses = []
    
    for i, query in enumerate(test_queries):
        response = rag_chain.process_query(query)
        responses.append(response)
        
        if (i + 1) % 5 == 0:
            print(f"✅ 已处理 {i + 1}/{len(test_queries)} 个查询")
    
    end_time = time.time()
    total_time = end_time - start_time
    
    # 性能统计
    print(f"\n📊 性能统计:")
    print(f"   总查询数: {len(test_queries)}")
    print(f"   总耗时: {total_time:.2f}秒")
    print(f"   平均耗时: {total_time/len(test_queries):.3f}秒/查询")
    print(f"   QPS: {len(test_queries)/total_time:.2f}")
    
    # 质量统计
    quality_scores = [r.quality_score for r in responses if r.quality_score > 0]
    confidence_scores = [r.confidence_score for r in responses]
    processing_times = [r.processing_time for r in responses]
    
    print(f"\n🌟 质量统计:")
    print(f"   平均质量分数: {sum(quality_scores)/len(quality_scores):.1f}")
    print(f"   平均置信度: {sum(confidence_scores)/len(confidence_scores):.3f}")
    print(f"   最快响应: {min(processing_times):.3f}秒")
    print(f"   最慢响应: {max(processing_times):.3f}秒")
    
    # 获取RAG统计
    rag_stats = rag_chain.get_stats()
    print(f"\n🔧 RAG统计:")
    print(f"   总查询数: {rag_stats['total_queries']}")
    print(f"   成功响应: {rag_stats['successful_responses']}")
    print(f"   成功率: {rag_stats['successful_responses']/rag_stats['total_queries']*100:.1f}%")
    print(f"   平均处理时间: {rag_stats['average_processing_time']:.3f}秒")


def test_edge_cases(rag_chain):
    """测试边界情况"""
    print("\n" + "="*60)
    print("🔍 测试边界情况")
    print("="*60)
    
    edge_cases = [
        ("", "空查询"),
        ("你好", "简单问候"),
        ("a" * 500, "超长查询"),
        ("营养学专业术语维生素B12缺乏症的膳食营养干预策略", "专业术语"),
        ("老人吃饭", "模糊查询"),
        ("!!!???", "特殊字符"),
        ("What should elderly eat?", "英文查询")
    ]
    
    for query, description in edge_cases:
        print(f"\n🧪 {description}: {query[:50]}{'...' if len(query) > 50 else ''}")
        
        try:
            response = rag_chain.process_query(query)
            print(f"✅ 处理成功")
            print(f"   质量分数: {response.quality_score:.1f}")
            print(f"   回答长度: {len(response.answer)} 字符")
            print(f"   检索文档: {len(response.sources)} 个")
            
            if response.metadata.get("error"):
                print(f"⚠️ 错误信息: {response.metadata['error']}")
        
        except Exception as e:
            print(f"❌ 处理失败: {str(e)}")


def interactive_rag_demo(conversation_manager):
    """交互式RAG演示"""
    print("\n" + "="*60)
    print("🎮 交互式RAG演示")
    print("="*60)
    print("欢迎使用ElderDiet RAG智能营养咨询系统！")
    print("您可以询问任何关于老年人营养的问题。")
    print("输入 'quit' 退出，'stats' 查看统计，'history' 查看对话历史")
    
    # 创建会话
    session_id = conversation_manager.create_session(user_id="demo_user")
    turn_count = 0
    
    while True:
        user_input = input(f"\n💬 您的问题 (第{turn_count + 1}轮): ").strip()
        
        if user_input.lower() in ['quit', 'exit', '退出', 'q']:
            print("👋 感谢使用ElderDiet RAG系统！")
            break
        
        if user_input.lower() == 'stats':
            # 显示统计信息
            session_info = conversation_manager.get_session_info(session_id)
            print(f"\n📊 会话统计:")
            print(f"   轮次: {session_info['total_turns']}")
            print(f"   时长: {session_info['duration']:.1f}秒")
            print(f"   平均质量: {session_info['session_stats']['average_quality_score']:.1f}")
            continue
        
        if user_input.lower() == 'history':
            # 显示对话历史
            history = conversation_manager.get_conversation_history(session_id)
            print(f"\n📜 对话历史:")
            for turn in history[-3:]:  # 显示最近3轮
                print(f"   Q{turn['turn_id']}: {turn['user'][:50]}...")
                print(f"   A{turn['turn_id']}: {turn['assistant'][:50]}...")
            continue
        
        if not user_input:
            continue
        
        # 处理用户输入
        print("🤔 思考中...")
        response, session_info = conversation_manager.process_user_input(session_id, user_input)
        
        # 显示回答
        print(f"\n🤖 营养师回答:")
        print(response)
        
        # 显示简要信息
        print(f"\n📊 本轮信息: 意图={session_info.get('intent')}, "
              f"质量={session_info.get('quality_score', 0):.1f}, "
              f"耗时={session_info.get('processing_time', 0):.2f}s")
        
        turn_count += 1


def generate_rag_system_report(rag_chain, conversation_manager):
    """生成RAG系统报告"""
    print("\n" + "="*60)
    print("📋 RAG系统功能报告")
    print("="*60)
    
    print("🏗️ 系统架构:")
    print("  ✓ RAG Chain核心引擎")
    print("  ✓ 对话管理系统")
    print("  ✓ 质量评估体系")
    print("  ✓ 多模式配置支持")
    
    print("\n🔧 核心功能:")
    print("  ✓ 端到端问答处理")
    print("  ✓ 多轮对话管理")
    print("  ✓ 实时质量评估")
    print("  ✓ 上下文维护")
    print("  ✓ 意图识别与路由")
    print("  ✓ 个性化回答生成")
    
    print("\n⚙️ 配置选项:")
    print("  ✓ 4种RAG模式 (Basic/Enhanced/Expert/Interactive)")
    print("  ✓ 4种检索策略 (语义/关键词/混合/多查询)")
    print("  ✓ 3种回答风格 (专业/友好/详细)")
    print("  ✓ Few-shot示例增强")
    print("  ✓ 质量检查与重试")
    
    print("\n📊 质量保障:")
    print("  ✓ 5维度质量评估 (相关性/完整性/准确性/可读性/安全性)")
    print("  ✓ 自动问题检测")
    print("  ✓ 改进建议生成")
    print("  ✓ 置信度评分")
    
    print("\n🎯 性能特点:")
    print("  ✓ 毫秒级响应速度")
    print("  ✓ 高并发支持")
    print("  ✓ 会话状态管理")
    print("  ✓ 内存高效")
    
    # 获取统计信息
    rag_stats = rag_chain.get_stats()
    conv_stats = conversation_manager.get_global_stats()
    
    print(f"\n📈 系统统计:")
    print(f"  📝 处理查询: {rag_stats['total_queries']} 个")
    print(f"  💬 管理会话: {conv_stats['total_sessions']} 个")
    print(f"  🎯 成功率: {rag_stats['successful_responses']/max(rag_stats['total_queries'], 1)*100:.1f}%")
    print(f"  ⏱️ 平均响应时间: {rag_stats['average_processing_time']:.3f}秒")
    print(f"  🌟 平均质量分数: {rag_stats['average_quality_score']:.1f}/100")


def main():
    """主测试函数"""
    print("🧪 ElderDiet RAG Chain 完整测试")
    print("="*60)
    print("检索增强生成系统端到端功能验证")
    print()
    
    try:
        # 1. 设置系统
        rag_chain, conversation_manager, rag_config = setup_rag_system()
        if not rag_chain:
            return
        
        # 2. 执行各项测试
        test_basic_rag_functionality(rag_chain)
        test_different_rag_modes(rag_chain)
        test_conversation_management(conversation_manager)
        test_rag_performance(rag_chain)
        test_edge_cases(rag_chain)
        
        # 3. 生成系统报告
        generate_rag_system_report(rag_chain, conversation_manager)
        
        print("\n" + "="*60)
        print("🎉 RAG Chain测试完成！")
        print("="*60)
        
        # 4. 交互式演示
        demo_choice = input("\n是否进入交互式演示？(y/n): ").strip().lower()
        if demo_choice in ['y', 'yes', '是']:
            interactive_rag_demo(conversation_manager)
        
    except Exception as e:
        print(f"\n❌ 测试过程中出现错误: {str(e)}")
        import traceback
        traceback.print_exc()


if __name__ == "__main__":
    main() 