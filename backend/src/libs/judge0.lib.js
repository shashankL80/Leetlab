import axios from "axios";

export const getJudge0LanguageId = (language) => {
  const languageMap = {
    C: 50,
    CPP: 54,
    GO: 60,
    JAVA: 62,
    JAVASCRIPT: 63,
    PYTHON: 71,
    RUST: 73,
    TYPESCRIPT: 74,
  };

  return languageMap[language.toUpperCase()] || null;
};

export const submitBatch = async (submissions) => {
  // CALLING JUDGE0 ENDPOINT USING AXIOS

  const response = await axios.post(
    `${process.env.JUDGE0_API_URL}/submissions/batch?base64_encoded=false`,
    { submissions }
  );

  const data = response.data || {};

  return data;
};

export const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

export const pollBatchResults = async (tokens) => {
  let retryCount = 0;
  const maxRetries = 10;
  let delay = 1000;

  while (retryCount < maxRetries) {
    try {
      const response = await axios.get(
        `${process.env.JUDGE0_API_URL}/submissions/batch`,
        {
          params: {
            tokens: tokens.join(","),
            base64_encoded: false,
            fields: "token,stdout,stderr,status_id,language_id",
          },
        }
      );
      const results = response?.submissions || [];

      const isAllDone = results.every(
        (r) => r.status.id !== 1 && r.status.id !== 2
      );

      if (isAllDone) return results;

      retryCount++;
      await sleep(1000);
      delay = Math.min(delay * 2, 10000);
      
    } catch (error) {
      console.log("Error while polling results", error);
      break;
    }
  }

  throw new Error("Polling exceed maximum retries");
};
