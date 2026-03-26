"""
LangChain Agent - Direct LLM approach (no agent framework)
"""
import time
import os
import json
from dotenv import load_dotenv
load_dotenv()
from typing import List, Dict, Any, Optional
from datetime import datetime
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain.schema import HumanMessage, SystemMessage, AIMessage
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
            model="gemini-2.0-flash",
            google_api_key=os.getenv("GOOGLE_API_KEY"),
            temperature=settings.TEMPERATURE,
            convert_system_message_to_human=True
        )
        self.retriever = get_rag_retriever()
        self.tools = ALL_TOOLS
        self.tool_map = {tool.name: tool for tool in self.tools}
        self.memories: Dict[str, List] = {}
        logger.info(f"Agent initialized with {len(self.tools)} tools")

    def _get_or_create_memory(self, session_id: str) -> List:
        if session_id not in self.memories:
            self.memories[session_id] = []
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
            history = self._get_or_create_memory(session_id)
            use_rag = self._should_use_rag(message)

            context_text = ""
            sources = []
            if use_rag:
                logger.info("Using RAG retrieval for context")
                try:
                    context_text, sources = self.retriever.smart_retrieve(message)
                except Exception as e:
                    logger.warning(f"RAG retrieval failed: {e}")

            # Build tools description
            tools_desc = "\n".join([f"- {t.name}: {t.description}" for t in self.tools])

            # Build system prompt
            system_content = f"""{SYSTEM_PROMPT}

You have access to these tools:
{tools_desc}

If you need to use a tool, respond with EXACTLY this format:
TOOL_CALL: tool_name
INPUT: {{"key": "value"}}

Otherwise just respond normally to the user.
"""
            if context_text:
                system_content += f"\n\nRELEVANT CONTEXT:\n{context_text}"
            if user_email:
                system_content += f"\n\nUser email: {user_email}"

            # Build messages
            messages = [SystemMessage(content=system_content)]
            for h in history[-10:]:  # last 10 messages
                if h["role"] == "user":
                    messages.append(HumanMessage(content=h["content"]))
                else:
                    messages.append(AIMessage(content=h["content"]))
            messages.append(HumanMessage(content=message))

            # Call LLM directly
            logger.info("Calling Gemini LLM...")
            response = await self.llm.ainvoke(messages)
            response_text = response.content
            logger.info(f"LLM response received: {response_text[:100]}...")

            # Check if tool call needed
            tool_calls = []
            if "TOOL_CALL:" in response_text:
                try:
                    lines = response_text.strip().split("\n")
                    tool_name = None
                    tool_input = {}
                    for i, line in enumerate(lines):
                        if line.startswith("TOOL_CALL:"):
                            tool_name = line.replace("TOOL_CALL:", "").strip()
                        elif line.startswith("INPUT:"):
                            input_str = line.replace("INPUT:", "").strip()
                            tool_input = json.loads(input_str)

                    if tool_name and tool_name in self.tool_map:
                        logger.info(f"Executing tool: {tool_name}")
                        tool = self.tool_map[tool_name]
                        tool_result = tool.run(tool_input)
                        tool_calls.append(ToolCall(
                            tool_name=tool_name,
                            arguments=tool_input,
                            result=str(tool_result),
                            execution_time_ms=0,
                            success=True
                        ))

                        # Get final response with tool result
                        messages.append(AIMessage(content=response_text))
                        messages.append(HumanMessage(content=f"Tool result: {tool_result}"))
                        final_response = await self.llm.ainvoke(messages)
                        response_text = final_response.content
                except Exception as e:
                    logger.warning(f"Tool execution failed: {e}")

            # Update memory
            history.append({"role": "user", "content": message})
            history.append({"role": "assistant", "content": response_text})

            # Calculate metrics
            response_time_ms = (time.time() - start_time) * 1000
            prompt_tokens = len(system_content + message) // 4
            completion_tokens = len(response_text) // 4
            total_tokens = prompt_tokens + completion_tokens

            token_usage = TokenUsage(
                prompt_tokens=prompt_tokens,
                completion_tokens=completion_tokens,
                total_tokens=total_tokens,
                estimated_cost_usd=0.0,
                model="gemini-2.0-flash"
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
        return self.memories[session_id]


_agent_instance = None

def get_support_agent() -> SupportAgent:
    global _agent_instance
    if _agent_instance is None:
        _agent_instance = SupportAgent()
    return _agent_instance

__all__ = ['SupportAgent', 'get_support_agent']
