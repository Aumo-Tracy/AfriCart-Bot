"""
LangChain Agent - Gemini Compatible
"""
import time
import os
from dotenv import load_dotenv
load_dotenv()
from typing import List, Dict, Any, Optional
from datetime import datetime
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain.agents import AgentExecutor
from langchain.agents.structured_chat.base import create_structured_chat_agent
from langchain.memory import ConversationBufferMemory
from langchain.prompts import ChatPromptTemplate, MessagesPlaceholder
from langchain.schema import HumanMessage
from app.config import settings
from app.core.logging import get_logger, usage_logger
from app.core.errors import OpenAIException
from app.services.rag.retriever import get_rag_retriever
from app.services.tools import ALL_TOOLS
from app.services.langchain.prompts import SYSTEM_PROMPT
from app.models.schemas import ChatResponse, TokenUsage, ToolCall

logger = get_logger(__name__)


class SupportAgent:
    def __init__(self):
        logger.info("Initializing SupportAgent...")
        self.llm = ChatGoogleGenerativeAI(
            model="gemini-1.5-pro",
            google_api_key=os.getenv("GOOGLE_API_KEY"),
            temperature=settings.TEMPERATURE,
            convert_system_message_to_human=True
        )
        self.retriever = get_rag_retriever()
        self.tools = ALL_TOOLS
        self.memories: Dict[str, ConversationBufferMemory] = {}
        logger.info(f"Agent initialized with {len(self.tools)} tools")

    def _get_or_create_memory(self, session_id: str) -> ConversationBufferMemory:
        if session_id not in self.memories:
            self.memories[session_id] = ConversationBufferMemory(
                memory_key="chat_history",
                return_messages=True,
                output_key="output"
            )
            logger.info(f"Created new memory for session: {session_id}")
        return self.memories[session_id]

    def _should_use_rag(self, message: str) -> bool:
        rag_keywords = [
            'policy', 'return', 'refund', 'shipping', 'delivery',
            'how', 'what', 'when', 'where', 'why', 'can i', 'do you',
            'long does', 'much does', 'cost', 'time', 'days'
        ]
        message_lower = message.lower()
        data_lookup_keywords = ['order', 'track', 'discount', 'code', 'product']
        if any(keyword in message_lower for keyword in data_lookup_keywords):
            if not any(keyword in message_lower for keyword in ['how', 'what', 'policy', 'can i']):
                return False
        return any(keyword in message_lower for keyword in rag_keywords)

    async def chat(
        self,
        message: str,
        session_id: str,
        user_email: Optional[str] = None,
        include_sources: bool = True
    ) -> ChatResponse:
        start_time = time.time()
        try:
            logger.info(f"Processing message", extra={"session_id": session_id})
            memory = self._get_or_create_memory(session_id)
            use_rag = self._should_use_rag(message)

            context_text = ""
            sources = []
            if use_rag:
                logger.info("Using RAG retrieval for context")
                try:
                    context_text, sources = self.retriever.smart_retrieve(message)
                except Exception as e:
                    logger.warning(f"RAG retrieval failed: {e}")

            system_content = SYSTEM_PROMPT
            if context_text:
                system_content += f"\n\nRELEVANT CONTEXT:\n{context_text}"
            if user_email:
                system_content += f"\n\nUser email: {user_email}"

            tools_str = "\n".join([f"{t.name}: {t.description}" for t in self.tools])
            tool_names_str = ", ".join([t.name for t in self.tools])

            prompt = ChatPromptTemplate.from_messages([
                ("system", system_content + "\n\nYou have access to the following tools:\n\n{tools}\n\nTo use a tool, respond with:\n```json\n{{\"action\": \"tool_name\", \"action_input\": {{\"key\": \"value\"}}}}\n```\nTo give a final answer:\n```json\n{{\"action\": \"Final Answer\", \"action_input\": \"your response\"}}\n```"),
                MessagesPlaceholder(variable_name="chat_history", optional=True),
                ("human", "{input}"),
                MessagesPlaceholder(variable_name="agent_scratchpad"),
            ]).partial(tools=tools_str, tool_names=tool_names_str)

            agent = create_structured_chat_agent(
                llm=self.llm,
                tools=self.tools,
                prompt=prompt
            )

            agent_executor = AgentExecutor(
                agent=agent,
                tools=self.tools,
                memory=memory,
                verbose=True,
                handle_parsing_errors=True,
                max_iterations=5,
                return_intermediate_steps=True
            )

            result = await agent_executor.ainvoke({"input": message})
            response_text = result.get("output", "I apologize, but I'm having trouble processing your request.")

            tool_calls = []
            if "intermediate_steps" in result:
                for step in result["intermediate_steps"]:
                    if len(step) >= 2:
                        action, observation = step[0], step[1]
                        tool_calls.append(ToolCall(
                            tool_name=action.tool,
                            arguments=action.tool_input if hasattr(action, 'tool_input') else {},
                            result=str(observation),
                            execution_time_ms=0,
                            success=True
                        ))

            response_time_ms = (time.time() - start_time) * 1000
            prompt_tokens = len(system_content + message) // 4
            completion_tokens = len(response_text) // 4
            total_tokens = prompt_tokens + completion_tokens

            token_usage = TokenUsage(
                prompt_tokens=prompt_tokens,
                completion_tokens=completion_tokens,
                total_tokens=total_tokens,
                estimated_cost_usd=0.0,
                model="gemini-1.5-pro"
            )

            usage_logger.info("Chat completed", extra={
                "session_id": session_id,
                "response_time_ms": response_time_ms,
                "tokens": total_tokens,
                "tools_used": len(tool_calls)
            })

            return ChatResponse(
                response=response_text,
                session_id=session_id,
                sources=sources if include_sources and sources else None,
                tool_calls=tool_calls if tool_calls else None,
                token_usage=token_usage,
                response_time_ms=response_time_ms
            )

        except Exception as e:
            logger.error(f"Error in chat processing: {e}", exc_info=True)
            raise OpenAIException(
                f"Failed to process message: {str(e)}",
                detail="The AI service encountered an error. Please try again."
            )

    def clear_session(self, session_id: str):
        if session_id in self.memories:
            del self.memories[session_id]
            logger.info(f"Cleared memory for session: {session_id}")

    def get_session_history(self, session_id: str) -> List:
        if session_id not in self.memories:
            return []
        memory = self.memories[session_id]
        messages = []
        for msg in memory.chat_memory.messages:
            messages.append({
                "role": "user" if isinstance(msg, HumanMessage) else "assistant",
                "content": msg.content,
                "timestamp": datetime.utcnow().isoformat()
            })
        return messages


_agent_instance = None

def get_support_agent() -> SupportAgent:
    global _agent_instance
    if _agent_instance is None:
        _agent_instance = SupportAgent()
    return _agent_instance

__all__ = ['SupportAgent', 'get_support_agent']