# E-Commerce Support AI - Backend

Advanced RAG-powered customer support chatbot built with FastAPI, LangChain, and modern AI technologies.

## 🚀 Features

### Core Capabilities
- **Advanced RAG Pipeline**: Semantic search over FAQs, policies, and SOPs
- **Tool Calling**: 5+ specialized tools for e-commerce operations
- **Token Usage Tracking**: Real-time cost monitoring and analytics
- **Dual-Mode Operation**: Supabase (production) or local JSON (demo)
- **Streaming Responses**: Real-time chat with progress indicators
- **User Authentication**: Supabase Auth integration

### Tools Implemented
1. **Order Tracking**: Real-time order status and tracking
2. **Discount Validation**: Verify and apply discount codes
3. **Return Eligibility**: Check return policies and generate labels
4. **Product Search**: Semantic product catalog search
5. **Human Escalation**: Intelligent routing to human agents

### Technical Features
- **Rate Limiting**: Configurable per-minute and per-hour limits
- **Input Validation**: Comprehensive security checks
- **Error Handling**: Graceful degradation and detailed errors
- **Structured Logging**: JSON logs for production monitoring
- **Cost Tracking**: Per-request token usage and cost calculation

## 📋 Prerequisites

- Python 3.10 or higher
- Node.js 18+ (for frontend)
- OpenAI API key
- (Optional) Supabase account
- (Optional) Pinecone account

## 🛠️ Installation

### 1. Clone and Setup

```bash
# Navigate to backend directory
cd ecommerce-ai-backend

# Create virtual environment
python -m venv venv

# Activate virtual environment
# Windows:
venv\Scripts\activate
# macOS/Linux:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt
```

### 2. Configure Environment

```bash
# Copy example env file
cp .env.example .env

# Edit .env and add your API keys
# Required:
OPENAI_API_KEY=your_openai_api_key_here
SECRET_KEY=generate_a_secure_random_key_here

# Optional (for production):
SUPABASE_URL=your_supabase_url
SUPABASE_KEY=your_supabase_anon_key
PINECONE_API_KEY=your_pinecone_key
```

### 3. For Local/Demo Mode

Set these in your `.env`:
```
USE_LOCAL_MODE=True
USE_LOCAL_VECTORS=True
```

The system will use JSON files in `data/fallback/` for all operations.

## 🚀 Running the Server

### Development Mode
```bash
# Run with auto-reload
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### Production Mode
```bash
# Run with Gunicorn
gunicorn app.main:app -w 4 -k uvicorn.workers.UvicornWorker --bind 0.0.0.0:8000
```

Server will be available at `http://localhost:8000`

## 📊 Project Structure

```
ecommerce-ai-backend/
├── app/
│   ├── main.py                    # FastAPI application entry
│   ├── config.py                  # Configuration management
│   │
│   ├── api/
│   │   ├── routes/
│   │   │   ├── chat.py           # Chat endpoints
│   │   │   ├── orders.py         # Order tool endpoints
│   │   │   └── admin.py          # Admin management
│   │   └── dependencies.py       # Shared dependencies
│   │
│   ├── services/
│   │   ├── rag/
│   │   │   ├── vector_store.py   # Vector database management
│   │   │   ├── embeddings.py     # OpenAI embeddings
│   │   │   ├── retriever.py      # RAG retrieval
│   │   │   └── chunking.py       # Document chunking
│   │   │
│   │   ├── langchain/
│   │   │   ├── agent.py          # LangChain agent
│   │   │   ├── prompts.py        # System prompts
│   │   │   └── memory.py         # Conversation memory
│   │   │
│   │   ├── tools/
│   │   │   ├── order_tracker.py
│   │   │   ├── discount_validator.py
│   │   │   ├── return_policy.py
│   │   │   ├── product_search.py
│   │   │   └── escalation.py
│   │   │
│   │   └── database/
│   │       ├── supabase_client.py  # Supabase integration
│   │       └── json_fallback.py    # Local JSON mode
│   │
│   ├── core/
│   │   ├── security.py           # Rate limiting, validation
│   │   ├── logging.py            # Structured logging
│   │   └── errors.py             # Error handlers
│   │
│   ├── models/
│   │   └── schemas.py            # Pydantic models
│   │
│   └── utils/
│       └── helpers.py            # Utility functions
│
├── data/
│   ├── knowledge_base/
│   │   ├── faqs.json            # 15+ FAQs
│   │   ├── policies.json        # Company policies
│   │   ├── sops.json            # Support procedures
│   │   └── product_catalog.json # 25+ products
│   │
│   ├── fallback/
│   │   ├── orders.json          # Mock orders
│   │   └── discount_codes.json  # Mock discounts
│   │
│   └── embeddings/              # Local vector cache
│
├── tests/                       # Pytest tests
├── docs/                        # Documentation
├── requirements.txt
└── .env.example
```

## 🔑 API Endpoints

### Health Check
```http
GET /health
```

### Chat
```http
POST /api/chat
Content-Type: application/json

{
  "message": "Where is my order ORD-123456?",
  "session_id": "optional-session-id",
  "user_email": "customer@example.com",
  "include_sources": true
}
```

### Direct Tool Calls (for testing)
```http
POST /api/orders/track
POST /api/discounts/validate
POST /api/returns/check
POST /api/products/search
```

## 📝 Knowledge Base

### FAQs (15 entries)
Categories: shipping, returns, payment, orders, account, discounts, products, support

### Policies
- Return Policy (30-day window, category-specific rules)
- Shipping Policy (multiple methods, international)
- Privacy Policy (GDPR/CCPA compliant)
- Price Match Policy
- Gift Card Policy

### SOPs
- Customer Support Procedures
- Order Inquiry Handling
- Lost Package Procedure
- Damaged Item Procedure
- Return Processing
- Refund Processing
- Escalation Guidelines

## 🎯 RAG Implementation

### Chunking Strategy
- **FAQs**: One chunk per Q&A pair
- **Policies**: Semantic chunking (500-1000 tokens, 100 overlap)
- **SOPs**: Procedure-based chunking
- **Metadata**: Categories, tags, priorities, dates

### Vector Store Options
1. **Pinecone** (Production): Cloud-hosted, scalable
2. **Chroma** (Local): File-based, good for development

### Retrieval
- Top-K similarity search (default k=5)
- Metadata filtering by category
- Re-ranking by relevance score
- Source attribution for citations

## 🛠️ Tool Calling

### Implementation
All tools are LangChain-compatible functions with:
- Type-safe inputs (Pydantic validation)
- Error handling and fallbacks
- Execution time tracking
- Result visualization support

### Example: Order Tracking
```python
from app.services.tools.order_tracker import track_order

result = track_order(
    order_id="ORD-123456",
    email="customer@example.com"
)
# Returns: OrderTrackingResponse with status, tracking, etc.
```

## 💰 Token Usage & Cost Tracking

Every request tracks:
- Input tokens (prompt + context)
- Output tokens (completion)
- Total cost in USD
- Model used

Costs calculated using GPT-3.5-turbo pricing:
- Input: $0.50 per 1M tokens
- Output: $1.50 per 1M tokens

## 🔒 Security Features

### Rate Limiting
```python
# Per-minute: 10 requests
# Per-hour: 100 requests
```

### Input Validation
- Email format validation
- Order ID format (ORD-XXXXXX)
- SQL injection prevention
- XSS protection
- Query length limits

### Authentication (Optional)
Supabase Auth integration for:
- User identification
- Personalized responses
- Order history access

## 📊 Logging

### Structured JSON Logs
```json
{
  "timestamp": "2025-02-09T10:30:00Z",
  "level": "INFO",
  "message": "Tool execution completed",
  "tool_name": "track_order",
  "execution_time_ms": 145.2,
  "session_id": "abc123",
  "success": true
}
```

### Log Categories
- `usage`: API calls, token usage
- `error`: Exceptions and failures
- `security`: Rate limits, validation failures
- `performance`: Response times, bottlenecks

## 🧪 Testing

```bash
# Run all tests
pytest

# With coverage
pytest --cov=app --cov-report=html

# Specific test file
pytest tests/test_rag.py -v
```

## 🚀 Deployment

### Railway / Render
```bash
# Procfile
web: gunicorn app.main:app -w 4 -k uvicorn.workers.UvicornWorker --bind 0.0.0.0:$PORT
```

### Environment Variables
Set in platform dashboard:
- `OPENAI_API_KEY`
- `SECRET_KEY`
- `ENVIRONMENT=production`
- `USE_LOCAL_MODE=False`
- `SUPABASE_URL` (if using Supabase)
- `SUPABASE_KEY`

## 📈 Optional Features Implemented

### Medium Complexity
1. ✅ **User Authentication**: Supabase Auth integration
2. ✅ **Token Cost Tracking**: Real-time usage monitoring
3. ✅ **Tool Visualization**: Structured data for frontend charts

### Hard Complexity
4. ✅ **Cloud Deployment**: Railway/Render configuration ready

## 🤝 Integration with Frontend

Backend expects frontend at:
- Development: `http://localhost:3000`
- Production: Configure in `ALLOWED_ORIGINS`

CORS is configured for these origins.

## 📖 Next Steps

1. **Initialize Vector Store**: Run embedding script
2. **Test Endpoints**: Use Postman/curl
3. **Connect Frontend**: Next.js integration
4. **Monitor Logs**: Check for errors
5. **Optimize Performance**: Tune chunk sizes, top-k

## 🐛 Troubleshooting

### "OpenAI API key not found"
- Check `.env` file exists
- Verify `OPENAI_API_KEY` is set
- Restart server after changes

### "No module named 'app'"
- Ensure you're in project root
- Activate virtual environment
- Install dependencies: `pip install -r requirements.txt`

### Vector store issues
- Start with `USE_LOCAL_VECTORS=True`
- Check `data/embeddings/` directory exists
- Run embedding initialization script

## 📄 License

MIT License - See LICENSE file

## 👥 Contributors

Tracy Aumo - Portfolio Project

---

**Status**: Backend Core ✅ | RAG Implementation 🚧 | Tools 🚧 | Frontend Integration ⏳