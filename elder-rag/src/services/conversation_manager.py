"""
对话管理系统
支持多轮对话、上下文维护、会话状态跟踪
"""

import time
import json
from typing import List, Dict, Any, Optional, Tuple
from dataclasses import dataclass, field
from enum import Enum

from .rag_chain import RAGChain, RAGConfig, RAGContext, RAGResponse


class ConversationState(Enum):
    """对话状态枚举"""
    ACTIVE = "active"        # 活跃状态
    WAITING = "waiting"      # 等待用户输入
    ENDED = "ended"         # 对话结束
    ERROR = "error"         # 错误状态


@dataclass
class ConversationTurn:
    """对话轮次"""
    turn_id: int
    user_input: str
    assistant_response: str
    intent: str
    timestamp: float
    processing_time: float
    quality_score: float
    sources_count: int
    metadata: Dict[str, Any] = field(default_factory=dict)


@dataclass
class ConversationSession:
    """对话会话"""
    session_id: str
    user_id: Optional[str]
    start_time: float
    last_activity: float
    state: ConversationState
    turns: List[ConversationTurn] = field(default_factory=list)
    context: Dict[str, Any] = field(default_factory=dict)
    user_profile: Dict[str, Any] = field(default_factory=dict)
    session_stats: Dict[str, Any] = field(default_factory=dict)


class ConversationManager:
    """对话管理器"""
    
    def __init__(self, rag_chain: RAGChain):
        """
        初始化对话管理器
        
        Args:
            rag_chain: RAG链实例
        """
        self.rag_chain = rag_chain
        self.sessions: Dict[str, ConversationSession] = {}
        self.session_timeout = 1800  # 30分钟会话超时
        
        # 统计信息
        self.global_stats = {
            "total_sessions": 0,
            "total_turns": 0,
            "average_turns_per_session": 0.0,
            "average_session_duration": 0.0,
            "average_quality_score": 0.0
        }
    
    def create_session(
        self, 
        user_id: Optional[str] = None,
        user_profile: Optional[Dict[str, Any]] = None
    ) -> str:
        """
        创建新的对话会话
        
        Args:
            user_id: 用户ID
            user_profile: 用户档案
            
        Returns:
            会话ID
        """
        session_id = f"session_{int(time.time())}_{len(self.sessions)}"
        
        session = ConversationSession(
            session_id=session_id,
            user_id=user_id,
            start_time=time.time(),
            last_activity=time.time(),
            state=ConversationState.ACTIVE,
            user_profile=user_profile or {}
        )
        
        # 初始化会话统计
        session.session_stats = {
            "total_turns": 0,
            "total_processing_time": 0.0,
            "average_quality_score": 0.0,
            "topics_discussed": set(),
            "intents_used": set()
        }
        
        self.sessions[session_id] = session
        self.global_stats["total_sessions"] += 1
        
        return session_id
    
    def process_user_input(
        self,
        session_id: str,
        user_input: str
    ) -> Tuple[str, Dict[str, Any]]:
        """
        处理用户输入
        
        Args:
            session_id: 会话ID
            user_input: 用户输入
            
        Returns:
            (助手回答, 会话信息)
        """
        # 检查会话是否存在
        if session_id not in self.sessions:
            return "会话不存在，请重新开始对话。", {}
        
        session = self.sessions[session_id]
        
        # 检查会话状态
        if session.state != ConversationState.ACTIVE:
            return "会话已结束，请重新开始对话。", {}
        
        # 检查会话超时
        if time.time() - session.last_activity > self.session_timeout:
            session.state = ConversationState.ENDED
            return "会话已超时，请重新开始对话。", {}
        
        try:
            # 构建RAG上下文
            rag_context = RAGContext(
                user_query=user_input,
                session_id=session_id,
                conversation_history=self._get_conversation_history(session),
                user_profile=session.user_profile,
                metadata=session.context
            )
            
            # 调用RAG处理
            rag_response = self.rag_chain.process_query(user_input, rag_context)
            
            # 创建对话轮次
            turn = ConversationTurn(
                turn_id=len(session.turns) + 1,
                user_input=user_input,
                assistant_response=rag_response.answer,
                intent=rag_response.intent.value,
                timestamp=time.time(),
                processing_time=rag_response.processing_time,
                quality_score=rag_response.quality_score,
                sources_count=len(rag_response.sources),
                metadata={
                    "confidence_score": rag_response.confidence_score,
                    "prompt_length": len(rag_response.prompt_used),
                    "response_length": len(rag_response.answer)
                }
            )
            
            # 添加到会话
            session.turns.append(turn)
            session.last_activity = time.time()
            
            # 更新会话上下文
            self._update_session_context(session, user_input, rag_response)
            
            # 更新统计
            self._update_session_stats(session, turn)
            self._update_global_stats()
            
            # 准备返回信息
            session_info = {
                "session_id": session_id,
                "turn_id": turn.turn_id,
                "intent": rag_response.intent.value,
                "confidence": rag_response.confidence_score,
                "quality_score": rag_response.quality_score,
                "processing_time": rag_response.processing_time,
                "sources_count": len(rag_response.sources),
                "session_turns": len(session.turns)
            }
            
            return rag_response.answer, session_info
            
        except Exception as e:
            # 错误处理
            error_turn = ConversationTurn(
                turn_id=len(session.turns) + 1,
                user_input=user_input,
                assistant_response=f"抱歉，处理您的问题时出现错误：{str(e)}",
                intent="error",
                timestamp=time.time(),
                processing_time=0.0,
                quality_score=0.0,
                sources_count=0,
                metadata={"error": str(e)}
            )
            
            session.turns.append(error_turn)
            session.state = ConversationState.ERROR
            
            return error_turn.assistant_response, {"error": str(e)}
    
    def get_session_info(self, session_id: str) -> Optional[Dict[str, Any]]:
        """获取会话信息"""
        if session_id not in self.sessions:
            return None
        
        session = self.sessions[session_id]
        
        return {
            "session_id": session.session_id,
            "user_id": session.user_id,
            "state": session.state.value,
            "start_time": session.start_time,
            "last_activity": session.last_activity,
            "duration": session.last_activity - session.start_time,
            "total_turns": len(session.turns),
            "session_stats": session.session_stats,
            "recent_turns": [
                {
                    "turn_id": turn.turn_id,
                    "user_input": turn.user_input[:100] + "..." if len(turn.user_input) > 100 else turn.user_input,
                    "intent": turn.intent,
                    "quality_score": turn.quality_score
                }
                for turn in session.turns[-5:]  # 最近5轮
            ]
        }
    
    def get_conversation_history(
        self, 
        session_id: str, 
        max_turns: int = 10
    ) -> List[Dict[str, Any]]:
        """获取对话历史"""
        if session_id not in self.sessions:
            return []
        
        session = self.sessions[session_id]
        recent_turns = session.turns[-max_turns:] if max_turns > 0 else session.turns
        
        history = []
        for turn in recent_turns:
            history.append({
                "turn_id": turn.turn_id,
                "user": turn.user_input,
                "assistant": turn.assistant_response,
                "intent": turn.intent,
                "timestamp": turn.timestamp,
                "quality_score": turn.quality_score
            })
        
        return history
    
    def end_session(self, session_id: str) -> bool:
        """结束会话"""
        if session_id not in self.sessions:
            return False
        
        session = self.sessions[session_id]
        session.state = ConversationState.ENDED
        session.last_activity = time.time()
        
        return True
    
    def cleanup_expired_sessions(self):
        """清理过期会话"""
        current_time = time.time()
        expired_sessions = []
        
        for session_id, session in self.sessions.items():
            if current_time - session.last_activity > self.session_timeout:
                expired_sessions.append(session_id)
        
        for session_id in expired_sessions:
            self.sessions[session_id].state = ConversationState.ENDED
        
        return len(expired_sessions)
    
    def get_global_stats(self) -> Dict[str, Any]:
        """获取全局统计信息"""
        return self.global_stats.copy()
    
    def _get_conversation_history(self, session: ConversationSession) -> List[Dict[str, Any]]:
        """获取对话历史用于RAG上下文"""
        history = []
        
        # 获取最近的几轮对话
        recent_turns = session.turns[-3:] if len(session.turns) > 3 else session.turns
        
        for turn in recent_turns:
            history.append({
                "user": turn.user_input,
                "assistant": turn.assistant_response,
                "intent": turn.intent
            })
        
        return history
    
    def _update_session_context(
        self, 
        session: ConversationSession, 
        user_input: str, 
        rag_response: RAGResponse
    ):
        """更新会话上下文"""
        # 更新讨论的主题
        topics = session.session_stats["topics_discussed"]
        if "糖尿病" in user_input or "糖尿病" in rag_response.answer:
            topics.add("糖尿病")
        if "高血压" in user_input or "高血压" in rag_response.answer:
            topics.add("高血压")
        if "缺钙" in user_input or "钙" in rag_response.answer:
            topics.add("补钙")
        if "食谱" in user_input or "饮食计划" in user_input:
            topics.add("饮食规划")
        
        # 更新使用的意图
        session.session_stats["intents_used"].add(rag_response.intent.value)
        
        # 更新上下文信息
        session.context["last_intent"] = rag_response.intent.value
        session.context["last_topics"] = list(topics)
        session.context["last_quality_score"] = rag_response.quality_score
    
    def _update_session_stats(self, session: ConversationSession, turn: ConversationTurn):
        """更新会话统计"""
        stats = session.session_stats
        
        stats["total_turns"] += 1
        stats["total_processing_time"] += turn.processing_time
        
        # 更新平均质量分数
        if stats["total_turns"] == 1:
            stats["average_quality_score"] = turn.quality_score
        else:
            total_quality = stats["average_quality_score"] * (stats["total_turns"] - 1)
            stats["average_quality_score"] = (total_quality + turn.quality_score) / stats["total_turns"]
    
    def _update_global_stats(self):
        """更新全局统计"""
        total_turns = sum(len(session.turns) for session in self.sessions.values())
        self.global_stats["total_turns"] = total_turns
        
        if self.global_stats["total_sessions"] > 0:
            self.global_stats["average_turns_per_session"] = total_turns / self.global_stats["total_sessions"]
        
        # 计算平均会话时长
        active_sessions = [s for s in self.sessions.values() if len(s.turns) > 0]
        if active_sessions:
            total_duration = sum(s.last_activity - s.start_time for s in active_sessions)
            self.global_stats["average_session_duration"] = total_duration / len(active_sessions)
        
        # 计算平均质量分数
        all_turns = []
        for session in self.sessions.values():
            all_turns.extend(session.turns)
        
        if all_turns:
            total_quality = sum(turn.quality_score for turn in all_turns if turn.quality_score > 0)
            valid_turns = len([turn for turn in all_turns if turn.quality_score > 0])
            if valid_turns > 0:
                self.global_stats["average_quality_score"] = total_quality / valid_turns


class ConversationAnalyzer:
    """对话分析器"""
    
    def __init__(self):
        pass
    
    def analyze_session(self, session: ConversationSession) -> Dict[str, Any]:
        """分析单个会话"""
        if not session.turns:
            return {"error": "会话无有效轮次"}
        
        analysis = {
            "session_summary": {},
            "turn_analysis": [],
            "patterns": {},
            "recommendations": []
        }
        
        # 会话摘要
        analysis["session_summary"] = {
            "total_turns": len(session.turns),
            "duration": session.last_activity - session.start_time,
            "average_quality": session.session_stats.get("average_quality_score", 0),
            "topics_discussed": list(session.session_stats.get("topics_discussed", set())),
            "intents_used": list(session.session_stats.get("intents_used", set()))
        }
        
        # 轮次分析
        for turn in session.turns:
            turn_analysis = {
                "turn_id": turn.turn_id,
                "intent": turn.intent,
                "quality_score": turn.quality_score,
                "processing_time": turn.processing_time,
                "input_length": len(turn.user_input),
                "response_length": len(turn.assistant_response),
                "sources_used": turn.sources_count
            }
            analysis["turn_analysis"].append(turn_analysis)
        
        # 模式识别
        analysis["patterns"] = self._identify_patterns(session)
        
        # 生成建议
        analysis["recommendations"] = self._generate_recommendations(session, analysis)
        
        return analysis
    
    def _identify_patterns(self, session: ConversationSession) -> Dict[str, Any]:
        """识别对话模式"""
        patterns = {}
        
        if not session.turns:
            return patterns
        
        # 质量趋势
        quality_scores = [turn.quality_score for turn in session.turns if turn.quality_score > 0]
        if len(quality_scores) > 1:
            if quality_scores[-1] > quality_scores[0]:
                patterns["quality_trend"] = "improving"
            elif quality_scores[-1] < quality_scores[0]:
                patterns["quality_trend"] = "declining"
            else:
                patterns["quality_trend"] = "stable"
        
        # 意图模式
        intents = [turn.intent for turn in session.turns]
        intent_counts = {}
        for intent in intents:
            intent_counts[intent] = intent_counts.get(intent, 0) + 1
        
        patterns["dominant_intent"] = max(intent_counts, key=intent_counts.get) if intent_counts else None
        patterns["intent_diversity"] = len(intent_counts)
        
        # 响应时间模式
        processing_times = [turn.processing_time for turn in session.turns]
        patterns["average_processing_time"] = sum(processing_times) / len(processing_times) if processing_times else 0
        
        return patterns
    
    def _generate_recommendations(
        self, 
        session: ConversationSession, 
        analysis: Dict[str, Any]
    ) -> List[str]:
        """生成改进建议"""
        recommendations = []
        
        # 基于质量分数的建议
        avg_quality = analysis["session_summary"]["average_quality"]
        if avg_quality < 70:
            recommendations.append("建议提高回答质量，增加更多具体的营养建议")
        
        # 基于意图多样性的建议
        intent_diversity = analysis["patterns"].get("intent_diversity", 0)
        if intent_diversity < 2:
            recommendations.append("用户查询范围较窄，可主动引导扩展相关营养话题")
        
        # 基于处理时间的建议
        avg_time = analysis["patterns"].get("average_processing_time", 0)
        if avg_time > 2.0:
            recommendations.append("处理时间较长，建议优化检索和生成效率")
        
        # 基于会话长度的建议
        total_turns = analysis["session_summary"]["total_turns"]
        if total_turns < 3:
            recommendations.append("会话较短，可主动询问用户是否需要更多相关建议")
        elif total_turns > 15:
            recommendations.append("会话较长，建议总结要点并询问是否需要具体的行动计划")
        
        return recommendations 