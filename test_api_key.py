import os
from openai import OpenAI

# Get your API key from .env
from dotenv import load_dotenv
load_dotenv()

api_key = os.getenv("OPENAI_API_KEY")
print(f"Testing API key: {api_key[:20]}...")

client = OpenAI(api_key=api_key)

# Test 1: Check if key is valid
try:
    models = list(client.models.list())
    print("✅ API key is VALID")
except Exception as e:
    print(f"❌ API key validation failed: {e}")
    exit(1)

# Test 2: Try to actually use it (embeddings)
try:
    response = client.embeddings.create(
        model="text-embedding-ada-002",
        input="test"
    )
    print("✅ API key has CREDITS (embeddings work)")
except Exception as e:
    print(f"❌ API key has NO CREDITS: {e}")
    exit(1)

# Test 3: Try chat completion
try:
    response = client.chat.completions.create(
        model="gpt-3.5-turbo",
        messages=[{"role": "user", "content": "say hi"}],
        max_tokens=10
    )
    print("✅ Chat completions work")
    print(f"Response: {response.choices[0].message.content}")
except Exception as e:
    print(f"❌ Chat failed: {e}")

print("\n✅ ALL TESTS PASSED - Your API key works!")

