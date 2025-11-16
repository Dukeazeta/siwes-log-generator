# SwiftLog Environment Configuration Guide

This guide helps you configure the AI SDK providers for your SwiftLog application.

## Required Configuration

At minimum, you need to configure:

```env
# Supabase (Required)
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# At least one AI provider (Groq comes pre-configured)
GROQ_API_KEY=your_groq_api_key
```

## AI SDK Provider Setup

The AI SDK supports multiple providers with automatic fallback. You can configure one or more providers:

### 1. OpenAI (GPT Models)

```env
OPENAI_API_KEY=sk-your-openai-api-key
```

**Setup:**
1. Go to [OpenAI Platform](https://platform.openai.com/api-keys)
2. Create a new API key
3. Add the key to your `.env.local` file

**Models Available:**
- `gpt-4o-mini` (default, cost-effective)
- `gpt-4o` (most capable)
- `gpt-3.5-turbo` (fastest)

### 2. Anthropic (Claude Models)

```env
ANTHROPIC_API_KEY=your-anthropic-api-key
```

**Setup:**
1. Go to [Anthropic Console](https://console.anthropic.com/)
2. Create a new API key
3. Add the key to your `.env.local` file

**Models Available:**
- `claude-3-5-haiku-latest` (default, fast)
- `claude-3-5-sonnet-latest` (capable)

### 3. Google AI (Gemini Models)

```env
GOOGLE_GENERATIVE_AI_API_KEY=your-google-ai-api-key
```

**Setup:**
1. Go to [Google AI Studio](https://aistudio.google.com/app/apikey)
2. Create a new API key
3. Add the key to your `.env.local` file

**Models Available:**
- `gemini-1.5-flash` (default, fast)
- `gemini-1.5-pro` (capable)

### 4. Groq (Already Configured)

```env
GROQ_API_KEY=your-groq-api-key
```

**Models Available:**
- `llama-3.1-8b-instant` (default, very fast)
- `llama-3.1-70b-versatile` (capable)
- `mixtral-8x7b-32768` (versatile)

## OCR Configuration

For the OCR functionality, you'll need Google Vision API:

```env
GOOGLE_VISION_API_KEY=your-google-vision-api-key
```

**Setup:**
1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create a new project or select existing one
3. Enable the [Cloud Vision API](https://console.cloud.google.com/apis/library/vision.googleapis.com)
4. Create credentials (API Key) in the [Credentials page](https://console.cloud.google.com/apis/credentials)
5. Copy the API key to your `.env.local` file

## AI Settings (Optional)

You can customize AI behavior:

```env
# General AI settings
AI_TEMPERATURE=0.5          # 0.0 (deterministic) to 1.0 (creative)
AI_MAX_TOKENS=1200          # Maximum response length
AI_TOP_P=0.95              # Nucleus sampling
AI_TOP_K=20                # Top-k sampling

# OCR-specific AI settings
OCR_AI_TEMPERATURE=0.1      # Lower temperature for OCR accuracy
OCR_AI_MAX_TOKENS=2048      # Higher limit for OCR processing
OCR_AI_MAX_CHARS=15000      # Maximum characters to process
```

## Provider Priority and Fallback

The AI SDK automatically tries providers in this order:

1. **OpenAI** (if configured)
2. **Groq** (if configured, your existing provider)
3. **Google** (if configured)
4. **Anthropic** (if configured)

If a provider fails, it automatically falls back to the next available provider.

## Testing Your Configuration

1. **Start the development server:**
   ```bash
   npm run dev
   ```

2. **Test log generation:**
   - Try generating a logbook entry
   - Check the console for provider usage
   - Verify metadata shows the correct provider

3. **Test OCR processing:**
   - Upload an image of a logbook
   - Check console for AI SDK vs fallback usage

## Troubleshooting

### Common Issues

1. **"AI SDK not available"**
   - Ensure at least one provider API key is set
   - Check that API keys are valid

2. **Provider authentication errors**
   - Verify API key is correct and active
   - Check if the provider has sufficient credits

3. **Fallback to original implementation**
   - This is normal if AI SDK providers are not configured
   - Your existing Groq integration will continue to work

### Debug Mode

Enable debug logging:

```env
DEBUG=true
```

This will show detailed information about which providers are being used and any errors that occur.

## Migration from Original Implementation

Your existing Groq integration continues to work unchanged. The AI SDK integration:

- ✅ **Backward compatible** - existing code still works
- ✅ **Gradual adoption** - AI SDK used when available, falls back to original
- ✅ **Enhanced capabilities** - structured output, better error handling
- ✅ **Multiple providers** - automatic fallback between providers

No immediate changes required - you can add new provider API keys at your own pace.