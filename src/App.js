import React, { useState } from 'react';

function App() {
  const [prompt, setPrompt] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Get API key from environment variable (for Vercel deployment)
  // In a Create React App setup, environment variables must start with REACT_APP_
  const GOOGLE_API_KEY = process.env.REACT_APP_GOOGLE_API_KEY;

  // Exponential backoff retry function for API calls
  const fetchWithRetry = async (url, options, retries = 3, delay = 1000) => {
    try {
      const response = await fetch(url, options);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`API Error: ${response.status} - ${errorData.error?.message || response.statusText}`);
      }
      return response;
    } catch (err) {
      if (retries > 0) {
        console.warn(`Retrying in ${delay / 1000} seconds... (${retries} retries left)`);
        await new Promise(res => setTimeout(res, delay));
        return fetchWithRetry(url, options, retries - 1, delay * 2);
      } else {
        throw err;
      }
    }
  };

  // Function to generate image using gemini-2.0-flash-preview-image-generation
  const generateImage = async () => {
    if (!GOOGLE_API_KEY) {
      setError('API Key is missing. Please set REACT_APP_GOOGLE_API_KEY in your Vercel environment variables.');
      return;
    }

    setError('');
    setImageUrl('');
    setLoading(true);

    try {
      const payload = {
        contents: [{
            parts: [{ text: prompt }]
        }],
        generationConfig: {
            responseModalities: ['TEXT', 'IMAGE']
        },
      };
      const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-preview-image-generation:generateContent?key=${GOOGLE_API_KEY}`;

      const response = await fetchWithRetry(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const result = await response.json();

      const base64Data = result?.candidates?.[0]?.content?.parts?.find(p => p.inlineData)?.inlineData?.data;

      if (base64Data) {
        const generatedUrl = `data:image/png;base64,${base64Data}`;
        setImageUrl(generatedUrl);
      } else {
        throw new Error('No image data received from the API.');
      }
    } catch (err) {
      console.error('Error generating image:', err);
      setError(`Error generating image: ${err.message || 'Unknown error'}. Please ensure your API Key is valid and try again.`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 font-sans bg-gradient-to-br from-gray-900 to-gray-800 text-gray-100">

      {/* Banner Section */}
      <div className="w-full max-w-2xl bg-gradient-to-r from-purple-600 to-indigo-700 p-6 rounded-2xl shadow-xl mb-8 text-center transform hover:scale-105 transition-transform duration-300">
        <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-white drop-shadow-lg">
          SATURD MEME GENERATOR
        </h1>
        <p className="mt-2 text-purple-200 text-lg sm:text-xl font-medium">Unleash your cosmic humor!</p>
      </div>

      {/* Main Content Container */}
      <div className="w-full max-w-2xl bg-gray-800 p-8 rounded-2xl shadow-2xl border border-gray-700 flex flex-col items-center">
        <p className="text-gray-300 mb-6 text-center text-lg leading-relaxed">
          Describe the meme image you want to create. Be creative and specific!
        </p>

        <textarea
          className="w-full p-4 mb-6 rounded-lg bg-gray-700 text-gray-100 placeholder-gray-400 border border-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition duration-200 text-base resize-y min-h-[100px]"
          rows="4"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="Example: 'A grumpy cat wearing a tiny astronaut helmet, floating next to a planet that looks like a giant, smiling potato, with a galaxy background.'"
        ></textarea>

        <button
          onClick={generateImage}
          disabled={loading || !prompt.trim()}
          className={`w-full py-3 px-6 rounded-xl text-white font-bold text-lg shadow-lg transform active:scale-95 transition-all duration-200
            ${loading || !prompt.trim()
              ? 'bg-gradient-to-r from-blue-400 to-indigo-400 cursor-not-allowed opacity-70'
              : 'bg-gradient-to-r from-blue-600 to-indigo-700 hover:from-blue-700 hover:to-indigo-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-gray-800'
            }`}
        >
          {loading ? (
            <span className="flex items-center justify-center">
              <svg className="animate-spin h-5 w-5 mr-3 text-white" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Generating Meme...
            </span>
          ) : (
            'Generate Meme'
          )}
        </button>

        {error && (
          <div className="mt-6 p-4 bg-red-800 border border-red-600 text-red-200 rounded-lg text-sm w-full text-center shadow-md">
            <p className="font-semibold mb-1">Error:</p>
            <p>{error}</p>
            {error.includes("API Key is missing") && (
              <p className="mt-2 text-xs">
                Please ensure you have set the `REACT_APP_GOOGLE_API_KEY` environment variable in Vercel.
              </p>
            )}
          </div>
        )}

        {imageUrl && (
          <div className="mt-8 w-full text-center">
            <h2 className="text-2xl font-semibold text-gray-100 mb-4">Your Generated Meme:</h2>
            <img
              src={imageUrl}
              alt="Generated Meme"
              className="max-w-full h-auto rounded-xl shadow-xl border-2 border-indigo-500 mx-auto"
              onError={(e) => { e.target.onerror = null; e.target.src="https://placehold.co/512x512/374151/D1D5DB?text=Image+Load+Error"; setError('Failed to load generated image. Please try again.'); }}
            />
          </div>
        )}

        {/* Token Link Section */}
        <div className="mt-10 pt-6 border-t border-gray-700 w-full text-center">
          <p className="text-gray-400 mb-4 text-base">
            Like this project? Support us by checking out our token!
          </p>
          <a
            href="https://jup.ag/tokens/AxJvMQKoFX1aPU8iSrKVYn8iTNZjrhAQDsDAnBWUjups"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block bg-green-500 hover:bg-green-600 text-white font-bold py-3 px-8 rounded-lg shadow-md transition duration-300 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 focus:ring-offset-gray-800"
          >
            Buy Here on Jup.ag
          </a>
        </div>
      </div>
    </div>
  );
}

export default App;
