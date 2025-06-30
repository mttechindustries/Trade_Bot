# AI Model Upgrade - Hugging Face Integration

## Overview

This implementation replaces the Google Gemini AI model with Hugging Face's powerful models for financial analysis. The service is designed to work with the Hugging Face Inference API, providing high-quality AI analysis without requiring local model deployment (perfect for machines with 8GB RAM).

## Key Features

- Uses **Mistral-7B-Instruct-v0.2** - A powerful instruction-tuned model great for financial analysis
- Cloud-based solution - No heavy local resources required
- Maintains the same interface as the original Gemini service
- Enhanced prompts optimized for financial analysis
- Robust error handling for API calls

## How it Works

The `aiModelService.ts` replaces `geminiService.ts` with a Hugging Face Inference API implementation that:

1. Connects to Hugging Face's API endpoints
2. Uses carefully crafted prompts optimized for the Mistral model
3. Handles response parsing and error conditions
4. Maintains the exact same function signatures for drop-in replacement

## Setup Instructions

### 1. Get a Hugging Face API Token

1. Create a Hugging Face account at https://huggingface.co/
2. Go to your profile settings → Access Tokens
3. Create a new token with "read" access

### 2. Configure the Environment

Create a `.env` file in your project root with:

```
VITE_HUGGINGFACE_API_KEY=your_hugging_face_token_here
```

### 3. Implementation

The replacement is complete and requires no additional code changes. The system will automatically use Hugging Face models for:

- Market sentiment analysis
- Trade explanations
- Backtest simulations
- Market opportunity identification

## Model Options

The service is configured to use:

- **Default Model**: `mistralai/Mistral-7B-Instruct-v0.2` - Great general-purpose model for financial analysis
- **Financial Model**: `yiyanghkust/finbert-tone` - Specialized for financial sentiment (future optimization)

## Benefits Over Gemini

1. **Better Financial Reasoning**: Mistral models have demonstrated strong financial analysis capabilities
2. **Free Tier Available**: Hugging Face offers free inference API usage (with rate limits)
3. **Open Source**: Based on open-source models with active community support
4. **Customizable**: Can be fine-tuned for specific financial tasks if needed in the future

## Troubleshooting

If you encounter issues:

1. **Check API Key**: Ensure your Hugging Face API token is valid and properly set in the .env file
2. **Rate Limits**: Free tier has usage limits; consider upgrading or implementing caching
3. **Response Format**: If model outputs are inconsistent, adjust the prompts in `aiModelService.ts`

## Further Optimizations

Future enhancements could include:

1. Implement response caching to reduce API calls
2. Add adaptive model selection based on task complexity
3. Fine-tune a specialized model for trading analysis
4. Explore open-source quantitative finance models
