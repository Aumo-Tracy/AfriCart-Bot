# E-Commerce Support AI - Architecture

## System Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                         USER / FRONTEND                          │
│                     (Next.js Application)                        │
└────────────────────────────┬────────────────────────────────────┘
                             │ HTTP/REST
                             │ WebSocket (streaming)
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                        FASTAPI BACKEND                           │
├─────────────────────────────────────────────────────────────────┤
│  ┌────────────────┐  ┌──────────────┐  ┌───────────────────┐  │
│  │  Rate Limiter  │  │  Validation  │  │  Authentication   │  │
│  │  (SlowAPI)     │  │  (Pydantic)  │  │  (Supabase Auth)  │  │
│  └────────────────┘  └──────────────┘  └───────────────────┘  │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │               CHAT ENDPOINT (/api/chat)                  │  │
│  │  • Receives user message                                 │  │
│  │  • Validates input                                       │  │
│  │  • Routes to RAG or Tool system                         │  │
│  │  • Streams response back                                │  │
│  └──────────────────────────────────────────────────────────┘  │
└────────────┬────────────────────────┬──────────────────┬────────┘
             │                        │                  │
             ▼                        ▼                  ▼
┌─────────────────────┐  ┌──────────────────┐  ┌──────────────┐
│   RAG PIPELINE      │  │  TOOL SYSTEM     │  │   LANGCHAIN  │
│                     │  │                  │  │    AGENT     │
│ • Vector Store      │  │ • Order Tracker  │  │              │
│ • Embeddings        │  │ • Discount Val.  │  │ • Decides    │
│ • Retrieval         │  │ • Return Check   │  │   RAG vs     │
│ • Context Assembly  │  │ • Product Search │  │   Tool       │
│                     │  │ • Escalation     │  │ • Memory     │
└─────────┬───────────┘  └────────┬─────────┘  └──────┬───────┘
          │                       │                     │
          │                       │                     │
          ▼                       ▼                     ▼
┌──────────────────┐  ┌──────────────────┐  ┌─────────────────┐
│  Vector Database │  │    Data Layer    │  │  OpenAI API     │
│                  │  │                  │  │                 │
│ Production:      │  │ Production:      │  │ • GPT-3.5      │
│ • Pinecone       │  │ • Supabase       │  │ • Embeddings   │
│                  │  │ • PostgreSQL     │  │ • Function     │
│ Development:     │  │                  │  │   Calling      │
│ • Chroma (local) │  │ Development:     │  └─────────────────┘
│                  │  │ • JSON files     │
└──────────────────┘  └──────────────────┘
```

## Request Flow

### 1. Simple FAQ Query
```
User: "How long does shipping take?"
  ↓
[Validation] → Pass
  ↓
[LangChain Agent] → Determines: RAG query
  ↓
[RAG Pipeline]
  → Embed query: "shipping time"
  → Search vector store
  → Retrieve: FAQ_001 (score: 0.95)
  → Assemble context
  ↓
[OpenAI API] → Generate response with context
  ↓
[Response] → "Shipping times vary by location:
              Standard: 3-5 business days..."
  + Sources: [FAQ_001]
  + Tokens: 250 input, 80 output
  + Cost: $0.00032
```

### 2. Order Tracking Request
```
User: "Where is my order ORD-123456?"
       (email: john@example.com)
  ↓
[Validation]
  → Check order_id format: ORD-XXXXXX ✓
  → Check email format: valid ✓
  ↓
[LangChain Agent] → Determines: Tool call needed
  ↓
[Tool: track_order]
  → Function: track_order(order_id, email)
  → Data Layer: Query Supabase/JSON
  → Result: {status: "shipped", tracking: "1Z999..."}
  ↓
[OpenAI API] → Format natural response
  ↓
[Response] → "Your order ORD-123456 is shipped!
              Tracking: 1Z999AA10123456784
              Estimated delivery: Feb 6, 2025"
  + Tool Used: track_order (execution: 145ms)
  + Tokens: 180 input, 65 output
  + Cost: $0.00027
```

### 3. Complex Multi-Step Query
```
User: "I want to return my smartwatch from order ORD-789012.
       Do I qualify?"
       (email: jane@example.com)
  ↓
[Validation] → Pass
  ↓
[LangChain Agent] → Multi-step reasoning
  ↓
[Step 1: Tool - track_order]
  → Get order details
  → Result: Delivered Jan 29 (11 days ago)
  → Product: Smart Watch (category: electronics)
  ↓
[Step 2: RAG - Return Policy]
  → Query: "electronics return policy"
  → Retrieved: 14-day window for electronics
  ↓
[Step 3: Tool - check_return_eligibility]
  → Calculate: 11 days < 14 days ✓
  → Result: Eligible
  ↓
[OpenAI API] → Synthesize response
  ↓
[Response] → "Yes, you're eligible! Electronics have
              a 14-day return window, and you're at
              day 11. Here's how to start..."
  + Tools Used: track_order, check_return_eligibility
  + Sources: [Return Policy - Electronics]
  + Tokens: 420 input, 125 output
  + Cost: $0.00049
```

## Component Details

### RAG Pipeline Architecture

```
┌─────────────────────────────────────────────────┐
│           KNOWLEDGE BASE (JSON)                 │
│                                                 │
│  • 15 FAQs    • Policies    • SOPs             │
│  • Products   • Documents                      │
└─────────────┬───────────────────────────────────┘
              │
              ▼
     ┌────────────────────┐
     │   CHUNKING         │
     │                    │
     │ Strategy:          │
     │ • FAQs: Per-item   │
     │ • Policies: 800ch  │
     │ • SOPs: Semantic   │
     │                    │
     │ Metadata:          │
     │ • Category         │
     │ • Priority         │
     │ • Updated date     │
     └─────────┬──────────┘
               │
               ▼
     ┌────────────────────┐
     │   EMBEDDING        │
     │   (OpenAI)         │
     │                    │
     │ Model:             │
     │ text-embedding-    │
     │ 3-small            │
     │                    │
     │ Dimensions: 1536   │
     └─────────┬──────────┘
               │
               ▼
     ┌────────────────────┐
     │  VECTOR STORE      │
     │                    │
     │ Index:             │
     │ • Cosine distance  │
     │ • Metadata filter  │
     │                    │
     │ Storage:           │
     │ • Pinecone (prod)  │
     │ • Chroma (dev)     │
     └─────────┬──────────┘
               │
               ▼
     ┌────────────────────┐
     │   RETRIEVAL        │
     │                    │
     │ • Top-k: 5         │
     │ • Threshold: 0.7   │
     │ • Re-ranking       │
     │ • Deduplication    │
     └────────────────────┘
```

### Tool System Architecture

```
┌──────────────────────────────────────────────────┐
│             LANGCHAIN TOOLS                      │
├──────────────────────────────────────────────────┤
│                                                  │
│  ┌────────────────────────────────────────────┐ │
│  │  @tool                                     │ │
│  │  def track_order(                          │ │
│  │      order_id: str,                        │ │
│  │      email: str                            │ │
│  │  ) -> OrderTrackingResponse:               │ │
│  │      """Track order status"""              │ │
│  │      ...                                   │ │
│  └────────────────────────────────────────────┘ │
│                                                  │
│  Each tool:                                      │
│  • Type-safe inputs (Pydantic)                   │
│  • Docstring for agent reasoning                │
│  • Error handling                                │
│  • Execution time tracking                       │
│  • Result validation                             │
│                                                  │
└─────────────┬────────────────────────────────────┘
              │
              ▼
     ┌────────────────────┐
     │  DATA LAYER        │
     │                    │
     │  Unified Interface │
     │  get_order()       │
     │  validate_code()   │
     │  search_products() │
     │                    │
     │  Implementation:   │
     │  → Supabase Query  │
     │  → JSON Lookup     │
     └────────────────────┘
```

### LangChain Agent Flow

```
┌────────────────────────────────────────────┐
│         USER MESSAGE                       │
└──────────────┬─────────────────────────────┘
               │
               ▼
     ┌─────────────────────┐
     │  AGENT ROUTER       │
     │                     │
     │  Reasoning:         │
     │  • Is this a fact   │
     │    question? → RAG  │
     │  • Does it need     │
     │    data? → Tool     │
     │  • Need both?       │
     │    → Sequential     │
     └──────┬──────────────┘
            │
     ┌──────┴──────┐
     │             │
     ▼             ▼
┌─────────┐   ┌──────────┐
│   RAG   │   │  TOOLS   │
└────┬────┘   └─────┬────┘
     │              │
     └──────┬───────┘
            │
            ▼
    ┌───────────────┐
    │  SYNTHESIS    │
    │               │
    │  Combine:     │
    │  • Retrieved  │
    │    context    │
    │  • Tool       │
    │    results    │
    │  • Previous   │
    │    messages   │
    └───────┬───────┘
            │
            ▼
    ┌───────────────┐
    │  GENERATION   │
    │  (OpenAI)     │
    └───────┬───────┘
            │
            ▼
    ┌───────────────┐
    │   RESPONSE    │
    └───────────────┘
```

## Data Models

### Core Entities

```python
# Message Flow
User Message
  → ChatRequest (validated)
    → LangChain Processing
      → RAG Context / Tool Results
        → ChatResponse (with metadata)

# Order Entity
Order:
  - order_number: str (ORD-XXXXXX)
  - customer_email: EmailStr
  - status: OrderStatus enum
  - items: List[OrderItem]
  - total: float
  - tracking_number: Optional[str]
  - created_at: datetime
  - status_history: List[StatusEvent]

# Tool Result
ToolCall:
  - tool_name: str
  - arguments: Dict
  - result: Any (type-specific)
  - execution_time_ms: float
  - success: bool
  - error: Optional[str]

# Token Tracking
TokenUsage:
  - prompt_tokens: int
  - completion_tokens: int
  - total_tokens: int
  - estimated_cost_usd: float
  - model: str
```

## Security Layers

```
1. Input Validation (Pydantic)
   ├─ Type checking
   ├─ Format validation (email, order_id)
   ├─ Length limits
   └─ Sanitization (XSS, SQL injection)

2. Rate Limiting (SlowAPI)
   ├─ Per-minute: 10 requests
   ├─ Per-hour: 100 requests
   └─ By IP address

3. Authentication (Optional - Supabase)
   ├─ JWT validation
   ├─ User identification
   └─ Session management

4. Authorization
   ├─ Email verification for orders
   ├─ Order ownership check
   └─ Admin-only endpoints

5. Error Handling
   ├─ No sensitive data in errors
   ├─ Structured error responses
   └─ Logging without PII
```

## Performance Optimizations

### Caching Strategy
```
1. Vector Store Cache
   • Pre-compute embeddings
   • Local cache for dev

2. Response Cache (Future)
   • Cache common FAQs
   • TTL: 1 hour
   • Invalidation on updates

3. Database Query Optimization
   • Index on order_number, email
   • Connection pooling
   • Query result caching
```

### Scaling Considerations
```
Horizontal Scaling:
• Stateless API design
• External session storage
• Load balancer ready

Vertical Scaling:
• Async operations (FastAPI)
• Batch embedding
• Connection pooling

Monitoring:
• Response time tracking
• Token usage monitoring
• Error rate alerts
```

## Deployment Architecture

```
Production Setup:

┌──────────────┐
│  Load Bal.   │  (Railway/Render)
└───────┬──────┘
        │
   ┌────┴────┐
   │         │
   ▼         ▼
┌──────┐ ┌──────┐
│ API  │ │ API  │  (Multiple instances)
│ Pod 1│ │ Pod 2│
└───┬──┘ └───┬──┘
    │        │
    └────┬───┘
         │
    ┌────┴────┐
    │         │
    ▼         ▼
┌─────────┐ ┌──────────┐
│Supabase │ │ Pinecone │
│(Postgres│ │ (Vectors)│
│   +     │ │          │
│  Auth)  │ │          │
└─────────┘ └──────────┘
```

---

**Document Version**: 1.0
**Last Updated**: 2025-02-09