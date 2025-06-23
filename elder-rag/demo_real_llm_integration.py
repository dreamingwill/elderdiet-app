#!/usr/bin/env python3
"""
ElderDiet RAG系统 - 真实大模型集成演示
支持钱多多平台API，提供完整的智能营养咨询功能
"""

import sys
import os
import time
import json
from typing import Dict, Any, Optional, List

# 添加项目路径
sys.path.append(os.path.join(os.path.dirname(__file__), 'src'))

from services.vector_store import VectorStore
from services.rag_chain import RAGChain, RAGConfig, RAGMode, RAGContext
from services.conversation_manager import ConversationManager
from services.retriever import SearchStrategy


class QianDuoDuoLLMDemo:
    """钱多多平台LLM演示系统"""
    
    def __init__(self):
        self.rag_chain = None
        self.conversation_manager = None
        self.api_key = None
        self.available_models = {
            "gpt-4o": {
                "name": "GPT-4o",
                "description": "最新模型，性能最强，推荐使用",
                "cost": "~$0.01-0.03/次",
                "speed": "中等"
            },
            "gpt-4": {
                "name": "GPT-4", 
                "description": "高质量回答，较慢",
                "cost": "~$0.05-0.15/次",
                "speed": "较慢"
            },
            "gpt-3.5-turbo": {
                "name": "GPT-3.5 Turbo",
                "description": "经济实惠，快速响应",
                "cost": "~$0.005-0.01/次", 
                "speed": "快速"
            }
        }
        
    def check_api_setup(self) -> bool:
        """检查API设置"""
        print("🔍 检查钱多多平台API设置...")
        
        # 检查环境变量
        self.api_key = os.getenv("QIANDUODUO_API_KEY")
        
        if not self.api_key:
            print("❌ 未找到API Key")
            print("\n📋 设置步骤：")
            print("1. 在终端运行: export QIANDUODUO_API_KEY='your-api-key'")
            print("2. 或者临时设置: QIANDUODUO_API_KEY='your-key' python demo_real_llm_integration.py")
            print("3. 或者永久设置: echo 'export QIANDUODUO_API_KEY=\"your-key\"' >> ~/.bashrc")
            return False
        
        # 检查openai库
        try:
            import openai
            print("✅ OpenAI库已安装")
        except ImportError:
            print("❌ OpenAI库未安装")
            print("请运行: pip install openai")
            return False
        
        print(f"✅ API Key已配置 (****{self.api_key[-8:]})")
        return True
    
    def initialize_system(self, model_name: str = "gpt-4o") -> bool:
        """初始化RAG系统"""
        try:
            print("🚀 正在初始化ElderDiet RAG系统 (真实LLM模式)...")
            print("="*60)
            
            # 加载向量存储
            print("📚 加载知识库...")
            vector_store = VectorStore(model_name="shibing624/text2vec-base-chinese")
            vector_store.load("data/vector_db")
            
            # 配置真实LLM
            rag_config = RAGConfig(
                mode=RAGMode.ENHANCED,
                search_strategy=SearchStrategy.HYBRID,
                top_k=3,
                use_few_shot=True,
                enable_quality_check=True,
                response_style="professional",
                max_response_length=1200,
                
                # 真实LLM配置
                use_real_llm=True,
                llm_provider="openai",
                llm_model=model_name,
                llm_api_key=self.api_key,
                llm_base_url="https://api2.aigcbest.top/v1"  # 钱多多API地址
            )
            
            # 初始化系统
            self.rag_chain = RAGChain(vector_store, rag_config)
            self.conversation_manager = ConversationManager(self.rag_chain)
            
            print(f"✅ 系统初始化完成！")
            print(f"🤖 使用模型: {self.available_models[model_name]['name']}")
            print(f"📊 知识库文档: {vector_store.get_stats()['total_documents']} 个")
            print(f"🔗 API地址: https://api2.aigcbest.top/v1")
            
            return True
            
        except Exception as e:
            print(f"❌ 系统初始化失败: {str(e)}")
            return False
    
    def display_main_menu(self):
        """显示主菜单"""
        print("\n" + "🌟 ElderDiet RAG - 真实LLM集成演示 🌟".center(60))
        print("="*60)
        print("🤖 当前模式: 真实大模型API调用")
        print("🏥 专业领域: 老年人营养膳食咨询")
        print("💡 技术架构: RAG + Chain-of-Thought + Few-shot")
        print("="*60)
        
        print("\n📋 功能菜单:")
        print("  1. 🎯 单次智能咨询")
        print("  2. 💬 多轮对话咨询") 
        print("  3. 🔧 模型性能测试")
        print("  4. 📊 系统状态监控")
        print("  5. 🚀 交互式LLM测试")
        print("  0. 🚪 退出系统")
    
    def demo_single_consultation(self):
        """演示单次智能咨询"""
        print("\n" + "="*60)
        print("🎯 单次智能咨询演示")
        print("="*60)
        print("💡 这里会调用真实的大模型API，生成个性化的营养建议")
        
        sample_queries = [
            "我是78岁老人，有糖尿病和高血压，应该怎么控制饮食？",
            "老年人缺钙严重，除了喝牛奶还有什么补钙方法？",
            "心血管疾病患者的饮食禁忌有哪些？",
            "帮我制定一个适合80岁老人的一周健康食谱",
            "老年人营养不良的症状和改善方法是什么？"
        ]
        
        print("🎯 推荐咨询问题：")
        for i, query in enumerate(sample_queries, 1):
            print(f"  {i}. {query}")
        
        while True:
            choice = input(f"\n请选择问题 (1-{len(sample_queries)}) 或输入自定义问题 (0退出): ").strip()
            
            if choice == "0":
                break
            
            query = ""
            if choice.isdigit() and 1 <= int(choice) <= len(sample_queries):
                query = sample_queries[int(choice) - 1]
            else:
                query = choice
            
            if not query:
                continue
            
            # 处理咨询
            self._process_single_query(query)
    
    def _process_single_query(self, query: str):
        """处理单次查询"""
        print(f"\n💬 您的咨询: {query}")
        print("🤔 AI营养师正在调用大模型分析...")
        print("⏳ 请稍候，真实API调用需要几秒钟...")
        
        start_time = time.time()
        
        try:
            # 调用RAG系统 (会使用真实LLM)
            response = self.rag_chain.process_query(query)
            processing_time = time.time() - start_time
            
            # 显示结果
            print(f"\n🤖 专业营养师回答 (由{self.rag_chain.config.llm_model}生成):")
            print("="*50)
            print(response.answer)
            print("="*50)
            
            # 显示详细分析
            print(f"\n📊 回答分析:")
            print(f"  🎯 识别意图: {response.intent.value}")
            print(f"  📈 置信度: {response.confidence_score:.1%}")
            print(f"  🌟 质量评分: {response.quality_score:.1f}/100")
            print(f"  ⏱️ API调用耗时: {processing_time:.2f}秒")
            print(f"  📚 参考文档: {len(response.sources)} 个")
            print(f"  🤖 使用模型: {self.rag_chain.config.llm_model}")
            
            # 显示知识来源
            if response.sources:
                print(f"\n📖 知识来源:")
                for i, source in enumerate(response.sources[:3], 1):
                    print(f"  {i}. {source.title} (相关性: {source.relevance_score:.1%})")
            
            # 成本估算
            model_info = self.available_models.get(self.rag_chain.config.llm_model, {})
            if model_info.get("cost"):
                print(f"\n💰 预估成本: {model_info['cost']}")
            
        except Exception as e:
            print(f"❌ 查询处理失败: {str(e)}")
            print("🔄 建议检查网络连接和API Key设置")
        
        print("\n" + "-"*60)
    
    def demo_conversation_mode(self):
        """演示多轮对话模式"""
        print("\n" + "="*60)
        print("💬 多轮智能对话演示")
        print("="*60)
        print("🎯 这是真实LLM驱动的多轮对话，AI会记住对话历史")
        print("💡 输入 'quit' 结束对话，'stats' 查看统计")
        
        # 创建会话
        session_id = self.conversation_manager.create_session(
            user_id="llm_demo_user",
            user_profile={
                "age": 72,
                "gender": "male",
                "conditions": ["diabetes", "hypertension", "high_cholesterol"],
                "preferences": ["清淡", "低盐", "易消化"]
            }
        )
        
        print(f"\n✅ 已创建个性化会话")
        print("👴 用户档案: 72岁男性，患有糖尿病、高血压、高血脂")
        
        turn_count = 0
        total_cost = 0.0
        
        while True:
            user_input = input(f"\n💬 您的问题 (第{turn_count + 1}轮): ").strip()
            
            if user_input.lower() in ['quit', 'exit', '退出', 'q']:
                print(f"\n👋 对话结束！")
                print(f"📊 总计 {turn_count} 轮对话")
                print(f"💰 预估总成本: ${total_cost:.3f}")
                break
            
            if user_input.lower() == 'stats':
                session_info = self.conversation_manager.get_session_info(session_id)
                print(f"\n📊 对话统计:")
                print(f"  ⏱️ 对话时长: {session_info['duration']:.1f}秒")
                print(f"  💬 对话轮次: {session_info['total_turns']}")
                print(f"  🌟 平均质量: {session_info['session_stats']['average_quality_score']:.1f}/100")
                print(f"  💰 预估成本: ${total_cost:.3f}")
                continue
            
            if not user_input:
                continue
            
            print("🤔 AI营养师正在调用大模型分析...")
            print("⏳ 结合对话历史生成个性化回答...")
            
            try:
                start_time = time.time()
                response, session_info = self.conversation_manager.process_user_input(session_id, user_input)
                processing_time = time.time() - start_time
                
                # 显示回答
                print(f"\n🤖 AI营养师回答:")
                print("="*50)
                print(response)  # response 是字符串，不是对象
                print("="*50)
                
                print(f"\n📊 本轮分析:")
                print(f"  🌟 质量评分: {session_info.get('quality_score', 0):.1f}/100")
                print(f"  ⏱️ 处理耗时: {session_info.get('processing_time', processing_time):.2f}秒")
                print(f"  🤖 使用模型: {self.rag_chain.config.llm_model}")
                print(f"  🎯 识别意图: {session_info.get('intent', 'unknown')}")
                print(f"  📈 置信度: {session_info.get('confidence', 0):.1%}")
                
                turn_count += 1
                # 估算成本 (粗略估算)
                estimated_cost = 0.02 if "gpt-4" in self.rag_chain.config.llm_model else 0.008
                total_cost += estimated_cost
                
            except Exception as e:
                print(f"❌ 对话处理失败: {str(e)}")
    
    def demo_model_performance(self):
        """演示模型性能测试"""
        print("\n" + "="*60)
        print("🔧 模型性能测试")
        print("="*60)
        
        test_queries = [
            "糖尿病老人饮食控制要点",
            "老年人补钙的最佳方法", 
            "高血压患者饮食禁忌"
        ]
        
        print("🎯 将使用以下测试问题评估模型性能:")
        for i, query in enumerate(test_queries, 1):
            print(f"  {i}. {query}")
        
        if input("\n是否开始性能测试？(y/n): ").lower() != 'y':
            return
        
        results = []
        total_time = 0
        
        for i, query in enumerate(test_queries, 1):
            print(f"\n🧪 测试 {i}/{len(test_queries)}: {query}")
            print("⏳ 调用API中...")
            
            try:
                start_time = time.time()
                response = self.rag_chain.process_query(query)
                processing_time = time.time() - start_time
                total_time += processing_time
                
                results.append({
                    "query": query,
                    "quality_score": response.quality_score,
                    "confidence_score": response.confidence_score,
                    "processing_time": processing_time,
                    "answer_length": len(response.answer)
                })
                
                print(f"✅ 完成 - 质量: {response.quality_score:.1f}, 耗时: {processing_time:.2f}s")
                
            except Exception as e:
                print(f"❌ 测试失败: {str(e)}")
                results.append({
                    "query": query,
                    "error": str(e)
                })
        
        # 显示性能报告
        print(f"\n📊 性能测试报告")
        print("="*50)
        print(f"🤖 测试模型: {self.rag_chain.config.llm_model}")
        print(f"📈 成功率: {len([r for r in results if 'error' not in r])}/{len(results)}")
        
        successful_results = [r for r in results if 'error' not in r]
        if successful_results:
            avg_quality = sum(r['quality_score'] for r in successful_results) / len(successful_results)
            avg_time = sum(r['processing_time'] for r in successful_results) / len(successful_results)
            avg_length = sum(r['answer_length'] for r in successful_results) / len(successful_results)
            
            print(f"🌟 平均质量: {avg_quality:.1f}/100")
            print(f"⏱️ 平均耗时: {avg_time:.2f}秒")
            print(f"📝 平均长度: {avg_length:.0f}字符")
            print(f"💰 预估总成本: ${total_time * 0.01:.3f}")
    
    def demo_system_monitoring(self):
        """演示系统状态监控"""
        print("\n" + "="*60)
        print("📊 系统状态监控")
        print("="*60)
        
        # RAG系统统计
        rag_stats = self.rag_chain.get_stats()
        print("🔗 RAG系统状态:")
        print(f"  📈 处理查询总数: {rag_stats['total_queries']}")
        print(f"  ✅ 成功响应数: {rag_stats['successful_responses']}")
        print(f"  📊 成功率: {rag_stats['successful_responses']/max(rag_stats['total_queries'], 1)*100:.1f}%")
        print(f"  🌟 平均质量分数: {rag_stats['average_quality_score']:.1f}/100")
        print(f"  ⏱️ 平均处理时间: {rag_stats['average_processing_time']:.2f}秒")
        
        # LLM配置信息
        config = self.rag_chain.config
        print(f"\n🤖 LLM配置信息:")
        print(f"  🏷️ 提供商: {config.llm_provider}")
        print(f"  🤖 模型: {config.llm_model}")
        print(f"  🔗 API地址: {config.llm_base_url}")
        print(f"  📏 最大长度: {config.max_response_length}")
        print(f"  🎨 回答风格: {config.response_style}")
        
        # 知识库信息
        vector_stats = self.rag_chain.vector_store.get_stats()
        print(f"\n📚 知识库状态:")
        print(f"  📄 文档总数: {vector_stats['total_documents']}")
        print(f"  🔢 向量维度: {vector_stats['vector_dimension']}")
        print(f"  🏷️ 文档类别: {', '.join(vector_stats['categories'])}")
        
        # API连接测试
        print(f"\n🔍 API连接测试:")
        try:
            test_response = self.rag_chain.process_query("测试连接")
            print("✅ API连接正常")
            print(f"📈 测试响应质量: {test_response.quality_score:.1f}/100")
        except Exception as e:
            print(f"❌ API连接异常: {str(e)}")
    
    def demo_interactive_llm_test(self):
        """交互式LLM测试"""
        print("\n" + "="*60)
        print("🚀 交互式LLM测试")
        print("="*60)
        print("💡 这是一个自由测试环境，您可以测试不同的问题和参数")
        
        # 选择模型
        print("\n🤖 可用模型:")
        models = list(self.available_models.keys())
        for i, model_key in enumerate(models, 1):
            model = self.available_models[model_key]
            print(f"  {i}. {model['name']} - {model['description']}")
            print(f"     💰 成本: {model['cost']}, ⚡ 速度: {model['speed']}")
        
        while True:
            try:
                choice = input(f"\n选择模型 (1-{len(models)}) 或回车使用当前模型: ").strip()
                if choice == "":
                    break
                elif choice.isdigit() and 1 <= int(choice) <= len(models):
                    selected_model = models[int(choice) - 1]
                    # 更新配置
                    new_config = self.rag_chain.config
                    new_config.llm_model = selected_model
                    self.rag_chain.update_config(new_config)
                    print(f"✅ 已切换到 {self.available_models[selected_model]['name']}")
                    break
                else:
                    print("❌ 无效选择，请重新输入")
            except ValueError:
                print("❌ 请输入数字")
        
        print(f"\n🤖 当前使用模型: {self.available_models[self.rag_chain.config.llm_model]['name']}")
        print("💡 输入 'quit' 退出测试，'help' 查看帮助")
        
        while True:
            query = input("\n🧪 测试问题: ").strip()
            
            if query.lower() in ['quit', 'exit', 'q']:
                break
            
            if query.lower() == 'help':
                print("\n❓ 测试帮助:")
                print("  • 直接输入问题进行测试")
                print("  • 可以测试各种营养相关问题")
                print("  • 系统会显示详细的分析结果")
                print("  • 输入 'quit' 退出测试")
                continue
            
            if not query:
                continue
            
            # 处理测试查询
            self._process_single_query(query)
    
    def run(self):
        """运行演示程序"""
        print("🌟 ElderDiet RAG - 真实大模型集成演示 🌟")
        print("="*60)
        
        # 检查API设置
        if not self.check_api_setup():
            print("\n❌ API设置检查失败，请先配置钱多多平台API Key")
            return
        
        # 选择模型
        print("\n🤖 选择LLM模型:")
        models = list(self.available_models.keys())
        for i, model_key in enumerate(models, 1):
            model = self.available_models[model_key]
            print(f"  {i}. {model['name']} - {model['description']}")
        
        while True:
            try:
                choice = input(f"\n请选择模型 (1-{len(models)}) [默认: 1]: ").strip()
                if choice == "":
                    choice = "1"
                
                if choice.isdigit() and 1 <= int(choice) <= len(models):
                    selected_model = models[int(choice) - 1]
                    break
                else:
                    print("❌ 无效选择，请重新输入")
            except ValueError:
                print("❌ 请输入数字")
        
        # 初始化系统
        if not self.initialize_system(selected_model):
            print("❌ 系统初始化失败")
            return
        
        # 主循环
        while True:
            self.display_main_menu()
            
            choice = input("\n请选择功能 (0-5): ").strip()
            
            if choice == "0":
                print("\n👋 感谢使用ElderDiet RAG系统！")
                break
            elif choice == "1":
                self.demo_single_consultation()
            elif choice == "2":
                self.demo_conversation_mode()
            elif choice == "3":
                self.demo_model_performance()
            elif choice == "4":
                self.demo_system_monitoring()
            elif choice == "5":
                self.demo_interactive_llm_test()
            else:
                print("❌ 无效选择，请重新输入")


def main():
    """主函数"""
    try:
        demo = QianDuoDuoLLMDemo()
        demo.run()
    except KeyboardInterrupt:
        print("\n\n👋 程序被用户中断，再见！")
    except Exception as e:
        print(f"\n❌ 程序运行出错: {str(e)}")
        print("🔧 建议检查环境配置和网络连接")


if __name__ == "__main__":
    main()