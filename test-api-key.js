// Quick test to verify Gemini API key works
import { GoogleGenerativeAI } from "@google/generative-ai";

const apiKey = "your_gemini_api_key_here";
const ai = new GoogleGenerativeAI(apiKey);

async function testApiKey() {
  try {
    console.log("Testing Gemini API key...");
    
    const model = ai.getGenerativeModel({ model: "gemini-1.5-flash" });
    const result = await model.generateContent("Say 'Hello, the API key is working!' in a single sentence.");
    const response = await result.response;
    
    console.log("✅ API key works! Response:", response.text());
    return true;
  } catch (error) {
    console.error("❌ API key test failed:", error.message);
    
    if (error.message.includes('API_KEY_INVALID') || error.message.includes('401')) {
      console.error("The API key appears to be invalid. Please check:");
      console.error("1. The key is correct");
      console.error("2. The API is enabled for your Google Cloud project");
      console.error("3. You have proper permissions");
    } else if (error.message.includes('QUOTA_EXCEEDED')) {
      console.error("API quota exceeded. Please check your usage limits.");
    } else if (error.message.includes('RESOURCE_EXHAUSTED')) {
      console.error("Rate limit exceeded. Please wait a moment and try again.");
    }
    
    return false;
  }
}

testApiKey();
