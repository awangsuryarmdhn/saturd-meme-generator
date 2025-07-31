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
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '1rem',
      fontFamily: 'sans-serif',
      background: 'linear-gradient(135deg, #1a202c 0%, #2d3748 100%)', // Dark gradient background
      color: '#e2e8f0' // Light text color
    }}>

      {/* Banner Section */}
      <div style={{
        width: '100%',
        maxWidth: '700px',
        background: 'linear-gradient(90deg, #8b5cf6 0%, #6d28d9 100%)', // Purple to indigo gradient
        padding: '1.5rem',
        borderRadius: '1rem', // Rounded corners
        boxShadow: '0 10px 20px rgba(0, 0, 0, 0.4)', // Stronger shadow
        marginBottom: '2rem',
        textAlign: 'center',
        transform: 'scale(1)',
        transition: 'transform 0.3s ease-in-out', // Hover effect
      }}
      onMouseOver={(e) => e.currentTarget.style.transform = 'scale(1.03)'}
      onMouseOut={(e) => e.currentTarget.style.transform = 'scale(1)'}
      >
        <h1 style={{
          fontSize: '2.5rem', // text-4xl sm:text-5xl
          fontWeight: '800', // font-extrabold
          letterSpacing: '-0.025em', // tracking-tight
          color: 'white',
          textShadow: '0 4px 8px rgba(0,0,0,0.5)' // drop-shadow-lg
        }}>
          SATURD MEME GENERATOR
        </h1>
        <p style={{
          marginTop: '0.5rem',
          color: '#d8b4fe', // purple-200
          fontSize: '1.25rem', // text-lg sm:text-xl
          fontWeight: '500' // font-medium
        }}>Unleash your cosmic humor!</p>
      </div>

      {/* Main Content Container */}
      <div style={{
        width: '100%',
        maxWidth: '650px',
        background: 'rgba(30, 41, 59, 0.95)', // bg-gray-800 with slight transparency
        padding: '2.5rem', // p-8
        borderRadius: '1.25rem', // rounded-2xl
        boxShadow: '0 15px 40px rgba(0, 0, 0, 0.5)', // shadow-2xl
        border: '1px solid #4a5568', // border border-gray-700
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        color: '#e2e8f0' // text-gray-100
      }}>
        <p style={{
          color: '#a0aec0', // text-gray-300
          marginBottom: '1.5rem', // mb-6
          textAlign: 'center',
          fontSize: '1.125rem', // text-lg
          lineHeight: '1.625' // leading-relaxed
        }}>
          Describe the meme image you want to create. Be creative and specific!
        </p>

        <textarea
          style={{
            width: '100%',
            padding: '1rem', // p-4
            marginBottom: '1.5rem', // mb-6
            borderRadius: '0.5rem', // rounded-lg
            background: '#4a5568', // bg-gray-700
            color: '#e2e8f0', // text-gray-100
            placeholderColor: '#a0aec0', // placeholder-gray-400
            border: '1px solid #6b7280', // border border-gray-600
            outline: 'none', // focus:outline-none
            boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.2)',
            resize: 'vertical',
            minHeight: '100px',
            fontSize: '1rem', // text-base
            transition: 'border-color 0.2s ease-in-out, box-shadow 0.2s ease-in-out',
          }}
          onFocus={(e) => {
            e.currentTarget.style.borderColor = '#6366f1'; // focus:ring-indigo-500
            e.currentTarget.style.boxShadow = '0 0 0 3px rgba(99, 102, 241, 0.5)'; // focus:ring-2 focus:ring-indigo-500
          }}
          onBlur={(e) => {
            e.currentTarget.style.borderColor = '#6b7280';
            e.currentTarget.style.boxShadow = 'inset 0 2px 4px rgba(0,0,0,0.2)';
          }}
          rows="4"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="Example: 'A grumpy cat wearing a tiny astronaut helmet, floating next to a planet that looks like a giant, smiling potato, with a galaxy background.'"
        ></textarea>

        <button
          onClick={generateImage}
          disabled={loading || !prompt.trim()}
          style={{
            width: '100%',
            padding: '0.75rem 1.5rem', // py-3 px-6
            borderRadius: '0.75rem', // rounded-xl
            color: 'white',
            fontWeight: 'bold',
            fontSize: '1.125rem', // text-lg
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)', // shadow-lg
            transform: loading || !prompt.trim() ? 'scale(1)' : 'scale(1)',
            transition: 'all 0.2s ease-in-out',
            cursor: loading || !prompt.trim() ? 'not-allowed' : 'pointer',
            background: loading || !prompt.trim()
              ? 'linear-gradient(90deg, #60a5fa 0%, #818cf8 100%)' // blue-400 to indigo-400
              : 'linear-gradient(90deg, #3b82f6 0%, #6366f1 100%)', // blue-600 to indigo-700
            opacity: loading || !prompt.trim() ? 0.7 : 1,
          }}
          onMouseOver={(e) => {
            if (!loading && prompt.trim()) {
              e.currentTarget.style.background = 'linear-gradient(90deg, #2563eb 0%, #4f46e5 100%)'; // hover:from-blue-700 hover:to-indigo-800
            }
          }}
          onMouseOut={(e) => {
            if (!loading && prompt.trim()) {
              e.currentTarget.style.background = 'linear-gradient(90deg, #3b82f6 0%, #6366f1 100%)';
            }
          }}
          onMouseDown={(e) => {
            if (!loading && prompt.trim()) {
              e.currentTarget.style.transform = 'scale(0.98)'; // active:scale-95
            }
          }}
          onMouseUp={(e) => {
            if (!loading && prompt.trim()) {
              e.currentTarget.style.transform = 'scale(1)';
            }
          }}
        >
          {loading ? (
            <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg style={{ animation: 'spin 1s linear infinite', height: '1.25rem', width: '1.25rem', marginRight: '0.75rem', color: 'white' }} viewBox="0 0 24 24">
                <circle style={{ opacity: 0.25 }} cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path style={{ opacity: 0.75 }} fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Generating Meme...
            </span>
          ) : (
            'Generate Meme'
          )}
        </button>

        {error && (
          <div style={{
            marginTop: '1.5rem', // mt-6
            padding: '1rem', // p-4
            background: '#b91c1c', // bg-red-800
            border: '1px solid #dc2626', // border border-red-600
            color: '#fca5a5', // text-red-200
            borderRadius: '0.5rem', // rounded-lg
            fontSize: '0.875rem', // text-sm
            width: '100%',
            textAlign: 'center',
            boxShadow: '0 4px 8px rgba(0,0,0,0.2)' // shadow-md
          }}>
            <p style={{ fontWeight: '600', marginBottom: '0.25rem' }}>Error:</p>
            <p>{error}</p>
            {error.includes("API Key is missing") && (
              <p style={{ marginTop: '0.5rem', fontSize: '0.75rem' }}>
                Please ensure you have set the `REACT_APP_GOOGLE_API_KEY` environment variable in Vercel.
              </p>
            )}
          </div>
        )}

        {imageUrl && (
          <div style={{
            marginTop: '2rem', // mt-8
            width: '100%',
            textAlign: 'center'
          }}>
            <h2 style={{
              fontSize: '1.5rem', // text-2xl
              fontWeight: '600', // font-semibold
              color: '#e2e8f0', // text-gray-100
              marginBottom: '1rem' // mb-4
            }}>Your Generated Meme:</h2>
            <img
              src={imageUrl}
              alt="Generated Meme"
              style={{
                maxWidth: '100%',
                height: 'auto',
                borderRadius: '0.75rem', // rounded-xl
                boxShadow: '0 8px 20px rgba(0, 0, 0, 0.4)', // shadow-xl
                border: '2px solid #6366f1', // border-2 border-indigo-500
                display: 'block', // Ensures it takes full width and centers
                margin: '0 auto'
              }}
              onError={(e) => { e.target.onerror = null; e.target.src="https://placehold.co/512x512/374151/D1D5DB?text=Image+Load+Error"; setError('Failed to load generated image. Please try again.'); }}
            />
          </div>
        )}

        {/* Token Link Section */}
        <div style={{
          marginTop: '2.5rem', // mt-10
          paddingTop: '1.5rem', // pt-6
          borderTop: '1px solid #4a5568', // border-t border-gray-700
          width: '100%',
          textAlign: 'center',
          color: '#a0aec0' // text-gray-400
        }}>
          <p style={{ marginBottom: '1rem', fontSize: '1rem' }}>
            Like this project? Support us by checking out our token!
          </p>
          <a
            href="https://jup.ag/tokens/AxJvMQKoFX1aPU8iSrKVYn8iTNZjrhAQDsDAnBWUjups"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: 'inline-block',
              background: '#22c55e', // bg-green-500
              color: 'white',
              fontWeight: 'bold',
              padding: '0.75rem 2rem', // py-3 px-8
              borderRadius: '0.5rem', // rounded-lg
              boxShadow: '0 4px 10px rgba(0, 0, 0, 0.2)', // shadow-md
              transition: 'all 0.3s ease-in-out',
              textDecoration: 'none',
            }}
            onMouseOver={(e) => e.currentTarget.style.background = '#16a34a'} // hover:bg-green-600
            onMouseOut={(e) => e.currentTarget.style.background = '#22c55e'}
            onMouseDown={(e) => e.currentTarget.style.transform = 'scale(0.98)'} // active:scale-95
            onMouseUp={(e) => e.currentTarget.style.transform = 'scale(1)'}
          >
            Buy Here on Jup.ag
          </a>
        </div>
      </div>
      {/* Keyframe for spinner animation */}
      <style>
        {`
        @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }
        `}
      </style>
    </div>
  );
}

export default App;
