export const config = Object.freeze({

  // Setup initial page: this may not be exactly the page under test
  // Authentication and CAPTCHA solving have to be done manually
  initialPage: "",

  pageAgent: {
    baseURL: process.env.BASE_URL,
    model: process.env.LLM_MODEL,
    apiKey: process.env.API_KEY,
    language: "en-US",
  },

  // Retry in case of LLM failure
  LLMfailureRetries: 5,

  // Generate E2E test based on page agent interactions [experimental]
  generateE2E: true,
});