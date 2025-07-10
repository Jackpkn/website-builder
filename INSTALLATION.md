# 🚀 Installation Guide - LangChain Website Builder SaaS

## Quick Start

### 1. **Install Dependencies**
```bash
# Install all packages including LangChain
npm install

# Or with pnpm
pnpm install
```

### 2. **Environment Setup**
Create a `.env.local` file:
```env
# AI Services
GROQ_API_KEY=your_groq_api_key_here
OPENAI_API_KEY=your_openai_api_key_here

# Database (Optional for now)
DATABASE_URL="postgresql://user:password@localhost:5432/website_builder"
REDIS_URL="redis://localhost:6379"

# Authentication (Phase 2)
NEXTAUTH_SECRET="your-secret-key-here"
NEXTAUTH_URL="http://localhost:3000"

# Payments (Phase 3)
STRIPE_SECRET_KEY="sk_test_..."
STRIPE_PUBLISHABLE_KEY="pk_test_..."

# Vector Database (Phase 5)
PINECONE_API_KEY="your-pinecone-key"
PINECONE_ENVIRONMENT="gcp-starter"

# Monitoring (Optional)
SENTRY_DSN="your-sentry-dsn"
```

### 3. **Get API Keys**

#### **Groq API Key**
1. Go to [console.groq.com](https://console.groq.com)
2. Sign up and create an account
3. Navigate to API Keys section
4. Create a new API key
5. Copy to your `.env.local`

#### **OpenAI API Key**
1. Go to [platform.openai.com](https://platform.openai.com)
2. Sign up or log in
3. Navigate to API Keys
4. Create a new API key
5. Copy to your `.env.local`

### 4. **Run Development Server**
```bash
npm run dev
```

Visit `http://localhost:3000` to see your enhanced website builder!

## 🏗️ Architecture Overview

### **Current Implementation (Phase 1)**
- ✅ **LangChain Integration** - Multi-step AI workflow
- ✅ **Enhanced API** - Rate limiting and caching
- ✅ **Improved UI** - Loading states and better UX
- ✅ **Streaming Responses** - Real-time code generation

### **What's Working Now**
1. **Multi-step Generation**: Planning → Generation → Refinement
2. **Rate Limiting**: Prevents abuse and tracks usage
3. **Caching**: Redis-based caching for performance
4. **Enhanced UI**: Loading states and better user experience
5. **Analytics**: Basic usage tracking and monitoring

### **Next Steps (Phase 2-5)**
- 🔄 **User Management** - Authentication and profiles
- 📋 **Subscription System** - Stripe integration
- 📊 **Analytics Dashboard** - Usage insights
- 🚀 **Advanced Features** - Vector DB, API access

## 🔧 Development Commands

```bash
# Development
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Lint code
npm run lint
```

## 📁 Project Structure

```
src/
├── app/
│   ├── api/
│   │   └── generate/
│   │       └── route.ts          # Enhanced LangChain API
│   │   └── id/
│   │       └── page.tsx              # Editor page
│   └── page.tsx                  # Landing page
├── components/
│   └── ui/
│       └── home/
│           ├── Hero.tsx          # Enhanced with loading
│           └── Navbar.tsx
└── lib/
    └── langchain/
        ├── config.ts             # LangChain configuration
        └── website-generator.ts  # Main generator class
```

## 🚀 Deployment

### **Vercel Deployment**
1. Push your code to GitHub
2. Connect to Vercel
3. Add environment variables in Vercel dashboard
4. Deploy automatically

### **Environment Variables for Production**
```env
# Required for basic functionality
GROQ_API_KEY=your_production_groq_key
OPENAI_API_KEY=your_production_openai_key

# Optional for enhanced features
REDIS_URL=your_production_redis_url
DATABASE_URL=your_production_database_url
```

## 💡 Usage Examples

### **Basic Website Generation**
```typescript
// The enhanced API now supports:
POST /api/generate
{
  "prompt": "Create a modern portfolio website for a photographer",
  "userId": "user123", // Optional
  "plan": "free"       // Optional
}
```

### **Rate Limiting**
- **Free**: 10 requests/hour
- **Pro**: 100 requests/hour  
- **Enterprise**: 1000 requests/hour

### **Multi-step Process**
1. **Planning**: AI analyzes requirements
2. **Generation**: Creates initial code
3. **Refinement**: Improves and optimizes
4. **Caching**: Stores for future use

## 🔍 Monitoring & Analytics

### **Current Tracking**
- ✅ Generation success/failure rates
- ✅ User prompt patterns
- ✅ Response times and performance
- ✅ Rate limit usage

### **Future Analytics (Phase 4)**
- 📊 User behavior dashboard
- 📈 Revenue metrics
- 🔍 Popular prompt analysis
- 📱 Performance monitoring

## 🛠️ Troubleshooting

### **Common Issues**

#### **1. LangChain Import Errors**
```bash
# Make sure all packages are installed
pnpm install @langchain/core @langchain/groq @langchain/openai
```

#### **2. API Key Issues**
```bash
# Check your .env.local file
cat .env.local

# Verify keys are working
curl -H "Authorization: Bearer YOUR_GROQ_KEY" \
     https://api.groq.com/openai/v1/models
```

#### **3. Redis Connection Issues**
```bash
# For local development, install Redis
# macOS
brew install redis
brew services start redis

# Ubuntu
sudo apt-get install redis-server
sudo systemctl start redis
```

### **Debug Mode**
```bash
# Enable debug logging
DEBUG=* npm run dev
```

## 🎯 Next Steps

### **Immediate (This Week)**
1. ✅ Test the enhanced generation
2. ✅ Verify rate limiting works
3. ✅ Check caching performance
4. ✅ Monitor error rates

### **Short Term (Next 2 Weeks)**
1. 🔄 Add user authentication
2. 📋 Implement subscription system
3. 📊 Create analytics dashboard
4. 🚀 Deploy to production

### **Long Term (Next Month)**
1. 🧠 Add vector database for prompt optimization
2. 🔧 Create API access for developers
3. 🎨 Add advanced AI features
4. 💼 Enterprise features and white-labeling

## 📞 Support

If you encounter any issues:
1. Check the troubleshooting section above
2. Review the console logs for errors
3. Verify all environment variables are set
4. Ensure all dependencies are installed

The enhanced LangChain integration provides a solid foundation for your SaaS platform with room for significant growth and feature expansion! 