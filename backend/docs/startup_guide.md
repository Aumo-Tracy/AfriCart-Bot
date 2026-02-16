# 🚀 Getting Started - Your Backend is Ready!

## ✅ What's Complete

You now have a **fully functional AI-powered customer support backend**!

### Components Built:
1. ✅ **Security Layer** - Validation, rate limiting, error handling
2. ✅ **Database Layer** - Dual-mode (Supabase/JSON) with all queries
3. ✅ **RAG Pipeline** - Document chunking, vector store, retrieval
4. ✅ **5 Tools** - Order tracking, discounts, returns, products, escalation
5. ✅ **LangChain Agent** - Orchestrates tools and RAG
6. ✅ **FastAPI App** - REST API with CORS, middleware, routes
7. ✅ **Test Suite** - Verification script

---

## 📋 Setup Instructions

### Step 1: Install Dependencies

```bash
# Navigate to project
cd ecommerce-ai-backend

# Create virtual environment
python -m venv venv

# Activate it
# Windows:
venv\Scripts\activate
# macOS/Linux:
source venv/bin/activate

# Install packages
pip install -r requirements.txt
```

### Step 2: Configure Environment

```bash
# Copy example env
cp .env.example .env

# Edit .env and set:
OPENAI_API_KEY=your_actual_openai_api_key_here
SECRET_KEY=generate-a-random-secret-key-here

# For local mode (recommended for first test):
USE_LOCAL_MODE=True
USE_LOCAL_VECTORS=True
```

**Generate a secret key:**
```python
python -c "import secrets; print(secrets.token_urlsafe(32))"
```

### Step 3: Test Components

```bash
# Run the test script
python test_setup.py
```

**Expected output:**
```
[1/8] Testing Configuration...
✓ Config loaded
[2/8] Testing Database...
✓ Database connected
[3/8] Testing Order Tool...
✓ Order tool working
... (etc)
```

### Step 4: Initialize Vector Store (One-Time)

```bash
# Run this once to embed the knowledge base
python -c "from app.services.rag.vector_store import initialize_vector_store_if_needed; initialize_vector_store_if_needed()"
```

This will:
- Load all FAQs, policies, SOPs, products
- Create embeddings (OpenAI API call)
- Store in local Chroma database
- Takes ~2-3 minutes

### Step 5: Start the Server

```bash
# Development mode (auto-reload)
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

# Or run directly
python app/main.py
```

**You should see:**
```
INFO:     Uvicorn running on http://0.0.0.0:8000
INFO:     Application startup complete.
Starting ECommerce Support AI
Environment: development
Using local mode: True
Vector store ready
Support agent ready
```

### Step 6: Test the API

**Option 1: Interactive Docs**
- Visit: http://localhost:8000/docs
- Try the `/api/chat` endpoint
- Use the "Try it out" button

**Option 2: cURL**
```bash
curl -X POST "http://localhost:8000/api/chat" \
  -H "Content-Type: application/json" \
  -d '{
    "message": "How long does shipping take?",
    "include_sources": true
  }'
```

**Option 3: Python**
```python
import requests

response = requests.post(
    "http://localhost:8000/api/chat",
    json={
        "message": "Where is my order ORD-123456?",
        "user_email": "john.doe@example.com",
        "include_sources": True
    }
)

print(response.json())
```

---

## 🎯 Test Queries

Try these to see different features:

### 1. RAG (Knowledge Base)
```json
{"message": "What is your return policy?"}
{"message": "How much does shipping cost?"}
{"message": "Do you offer student discounts?"}
```

### 2. Order Tracking Tool
```json
{
  "message": "Track my order ORD-123456",
  "user_email": "john.doe@example.com"
}
```

### 3. Discount Validation Tool
```json
{"message": "Is code SAVE20 valid? My cart is $150"}
```

### 4. Product Search Tool
```json
{"message": "Show me wireless headphones under $100"}
```

### 5. Return Eligibility Tool
```json
{
  "message": "Can I return order ORD-789012?",
  "user_email": "jane.smith@example.com"
}
```

### 6. Complex Multi-Step
```json
{
  "message": "I want to return my smartwatch from order ORD-789012. Is it eligible? Also, do you have any other watches in stock?",
  "user_email": "jane.smith@example.com"
}
```

---

## 🔍 Expected Response Format

```json
{
  "response": "According to our shipping policy, delivery times vary...",
  "session_id": "session_abc123...",
  "sources": [
    {
      "document_name": "FAQ - Shipping",
      "chunk_text": "Shipping times vary by location...",
      "relevance_score": 0.95,
      "metadata": {...}
    }
  ],
  "tool_calls": [
    {
      "tool_name": "track_order",
      "arguments": {"order_id": "ORD-123456", "email": "..."},
      "result": {...},
      "execution_time_ms": 145.2,
      "success": true
    }
  ],
  "token_usage": {
    "prompt_tokens": 450,
    "completion_tokens": 120,
    "total_tokens": 570,
    "estimated_cost_usd": 0.0008,
    "model": "gpt-3.5-turbo"
  },
  "response_time_ms": 1234.5,
  "timestamp": "2025-02-11T..."
}
```

---

## 📊 API Endpoints

### Main Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/` | Root endpoint |
| GET | `/health` | System health check |
| GET | `/docs` | Interactive API docs |
| POST | `/api/chat` | Main chat endpoint |
| POST | `/api/chat/clear-session` | Clear session history |
| GET | `/api/chat/history/{session_id}` | Get chat history |

### Sample Data Available

**Orders you can track:**
- ORD-123456 (john.doe@example.com) - Shipped
- ORD-789012 (jane.smith@example.com) - Delivered
- ORD-345678 (bob.wilson@example.com) - Processing
- ORD-901234 (alice.johnson@example.com) - Pending
- ORD-567890 (mike.brown@example.com) - Cancelled

**Discount codes to test:**
- WELCOME10 - 10% off, $25 min
- SAVE20 - 20% off, $100 min
- FREESHIP - Free shipping
- STUDENT15 - 15% student discount
- VALENTINE25 - 25% off (active until Feb 14)

---

## 🐛 Troubleshooting

### "ModuleNotFoundError: No module named 'app'"
```bash
# Make sure you're in project root
cd ecommerce-ai-backend
# And venv is activated
```

### "OpenAI API key not found"
```bash
# Check .env file exists
ls -la .env
# Verify OPENAI_API_KEY is set
cat .env | grep OPENAI_API_KEY
```

### "Vector store not initialized"
```bash
# Run initialization
python -c "from app.services.rag.vector_store import initialize_vector_store_if_needed; initialize_vector_store_if_needed()"
```

### Database errors
```bash
# Verify JSON files exist
ls data/fallback/
ls data/knowledge_base/
```

### Rate limit errors
```bash
# Check your OpenAI account has credits
# Or increase rate limits in .env:
RATE_LIMIT_PER_MINUTE=20
```

---

## 🔧 Configuration Options

### Environment Variables

**Required:**
- `OPENAI_API_KEY` - Your OpenAI API key
- `SECRET_KEY` - Random secret for sessions

**Optional:**
- `ENVIRONMENT` - development/production (default: development)
- `USE_LOCAL_MODE` - True/False (default: True)
- `USE_LOCAL_VECTORS` - True/False (default: True)
- `OPENAI_MODEL` - Model name (default: gpt-3.5-turbo)
- `MAX_TOKENS` - Max response tokens (default: 500)
- `TEMPERATURE` - LLM temperature (default: 0.7)
- `SIMILARITY_TOP_K` - RAG results count (default: 5)

### Switching to Production Mode

```bash
# In .env:
ENVIRONMENT=production
USE_LOCAL_MODE=False
USE_LOCAL_VECTORS=False

# Add Supabase credentials:
SUPABASE_URL=your_supabase_url
SUPABASE_KEY=your_supabase_key

# Add Pinecone credentials:
PINECONE_API_KEY=your_pinecone_key
PINECONE_ENVIRONMENT=your_environment
PINECONE_INDEX_NAME=ecommerce-support
```

---

## 📈 Monitoring

### View Logs
```bash
# Logs are printed to console in development
# In production, they're JSON-formatted for log aggregators

# Sample log entry:
{
  "timestamp": "2025-02-11T10:30:00Z",
  "level": "INFO",
  "message": "Chat completed",
  "session_id": "abc123",
  "response_time_ms": 1234,
  "tokens": 570,
  "cost_usd": 0.0008
}
```

### Health Check
```bash
curl http://localhost:8000/health
```

Returns:
```json
{
  "status": "healthy",
  "version": "1.0.0",
  "components": {
    "openai": true,
    "database": true,
    "vector_store": true
  },
  "uptime_seconds": 3600.5
}
```

---

## 🎓 Next Steps

1. **Test thoroughly** - Try all the sample queries above
2. **Review responses** - Check quality of RAG retrieval
3. **Tune prompts** - Edit `app/services/langchain/prompts.py`
4. **Add more data** - Expand knowledge base JSON files
5. **Build frontend** - Connect Next.js app to this API
6. **Deploy** - Railway, Render, or AWS

---

## 💡 Tips

- **Session IDs**: Maintain conversation context across multiple messages
- **User Emails**: Required for order-related queries
- **Sources**: Include sources to show transparency
- **Token Usage**: Monitor costs with the usage tracking
- **Rate Limits**: Default is 10/minute, adjustable in .env

---

## 🚀 You're Ready!

Your backend is **fully functional**. Start the server and try it out!

```bash
uvicorn app.main:app --reload
```

Visit http://localhost:8000/docs and start chatting! 🎉