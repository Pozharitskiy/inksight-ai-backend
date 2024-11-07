const { OpenAI } = require("openai");

function levenshteinDistance(a, b) {
  const matrix = [];

  for (let i = 0; i <= b.length; i++) {
    matrix[i] = [i];
  }
  for (let j = 0; j <= a.length; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1, // substitution
          matrix[i][j - 1] + 1, // insertion
          matrix[i - 1][j] + 1 // deletion
        );
      }
    }
  }

  return matrix[b.length][a.length];
}

function cosineSimilarity(a, b) {
  const nGrams = (str, n = 2) => {
    const ngrams = new Set();
    for (let i = 0; i < str.length - n + 1; i++) {
      ngrams.add(str.slice(i, i + n));
    }
    return ngrams;
  };

  const ngramsA = nGrams(a);
  const ngramsB = nGrams(b);

  const intersectionSize = [...ngramsA].filter((x) => ngramsB.has(x)).length;
  const denominator = Math.sqrt(ngramsA.size) * Math.sqrt(ngramsB.size);

  return denominator ? intersectionSize / denominator : 0;
}

async function getSynonymsFromChatGPT(word) {
  const openai = new OpenAI({
    apiKey: process.env.GPT_API_KEY,
  });

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content:
            "You are a helpful assistant that provides synonyms for words.",
        },
        {
          role: "user",
          content: `Please give me a list of 10 synonyms for the word "${word}". Without any text decorators, just one sentence of words divided by comma`,
        },
      ],
      max_tokens: 50,
      temperature: 0.5,
    });

    // Parse response to extract synonyms
    const synonymsText = response.choices[0].message.content.trim();
    const synonymsArray = synonymsText.split(",").map((syn) => syn.trim());
    console.log("synonyms: ", synonymsArray);
    return synonymsArray;
  } catch (error) {
    console.error("Error fetching synonyms:", error);
    return []; // Return an empty array if there's an error
  }
}

// Main search function
async function searchInterpretationNew(data, searchQuery) {
  if (!searchQuery?.length) {
    return null;
  }

  let bestMatch = null;
  let bestName = null;
  let highestScore = 0;

  const searchQueryNormalized = searchQuery.toLowerCase().trim();

  // Get synonyms from ChatGPT for broader matching
  const synonyms = await getSynonymsFromChatGPT(searchQueryNormalized);
  const termsToSearch = [searchQueryNormalized, ...synonyms];

  // Search across each term (original and synonyms)
  for (let term of termsToSearch) {
    for (let row of data) {
      const targetWord = row["Tatoo (eng)"]
        ?.replace(" (w)", "")
        .toLowerCase()
        .trim();

      if (!targetWord) continue;

      // Word length filter: Skip if length difference is too big
      if (Math.abs(term.length - targetWord.length) > 2) continue;

      // Calculate Levenshtein similarity
      const levenshteinDist = levenshteinDistance(term, targetWord);
      const maxLen = Math.max(term.length, targetWord.length);
      const similarityScore = 1 - levenshteinDist / maxLen;

      // Levenshtein threshold: Skip if similarity is too low
      if (similarityScore < 0.8) continue;

      // Calculate cosine similarity
      const cosineSimScore = cosineSimilarity(term, targetWord);

      // Combine scores with optional weighting
      const combinedScore = 0.6 * similarityScore + 0.4 * cosineSimScore;

      // Track the best match across all terms
      if (combinedScore > highestScore) {
        highestScore = combinedScore;
        bestMatch = row["Output Interpretation"];
        bestName = row["Tatoo (eng)"];
      }
    }
  }

  // If the highest score is less than 0.8, return the original search query
  if (highestScore < 0.8) {
    console.log(
      `No good match found. The highest score from db - ${highestScore} Returning original search query:`,
      searchQuery
    );
    return searchQuery;
  }

  console.log("Highest Score", highestScore, "targetWord: ", bestName);
  return bestMatch;
}

module.exports = { searchInterpretationNew };
