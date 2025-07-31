import React, { useState } from 'react';

function App() {
  const [prompt, setPrompt] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

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

  // Function to generate image using imagen-3.0-generate-002
  const generateImage = async () => {
    setError('');
    setImageUrl('');
    setLoading(true);

    try {
      const payload = {
        instances: { prompt: prompt },
        parameters: { "sampleCount": 1 }
      };
      const apiKey = ""; // Canvas will automatically provide this at runtime
      const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/imagen-3.0-generate-002:predict?key=${apiKey}`;

      const response = await fetchWithRetry(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const result = await response.json();

      if (result.predictions && result.predictions.length > 0 && result.predictions[0].bytesBase64Encoded) {
        const generatedUrl = `data:image/png;base64,${result.predictions[0].bytesBase64Encoded}`;
        setImageUrl(generatedUrl);
      } else {
        throw new Error('No image data received from the API.');
      }
    } catch (err) {
      console.error('Error generating image:', err);
      setError(`Error generating image: ${err.message || 'Unknown error'}. Please try again.`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center p-4 font-sans"
         style={{ background: 'linear-gradient(135deg, #1a202c 0%, #2d3748 100%)' }}>
      <div className="banner"
           style={{
             backgroundColor: '#9f7aea', // Purple background for the banner
             boxShadow: '0 10px 20px rgba(0, 0, 0, 0.4)',
             borderRadius: '15px',
             width: '100%',
             maxWidth: '700px',
             padding: '20px 0',
             marginBottom: '20px',
             textAlign: 'center',
             minHeight: '100px',
             display: 'flex',
             alignItems: 'center',
             justifyContent: 'center',
             position: 'relative',
             overflow: 'hidden'
           }}>
        <span className="banner-text"
              style={{
                position: 'relative', zIndex: 1, fontSize: '2.5rem', fontWeight: 900,
                letterSpacing: '2px', textTransform: 'uppercase', textShadow: '2px 2px 4px rgba(0,0,0,0.7)',
                color: 'white'
              }}>
          SATURD MEME GENERATOR
        </span>
      </div>

      <div className="container"
           style={{
             backgroundColor: 'rgba(30, 41, 59, 0.9)',
             borderRadius: '20px',
             boxShadow: '0 15px 40px rgba(0, 0, 0, 0.3)',
             padding: '40px',
             textAlign: 'center',
             maxWidth: '650px',
             width: '100%',
             display: 'flex',
             flexDirection: 'column',
             alignItems: 'center',
             border: '1px solid rgba(71, 85, 105, 0.5)',
             color: '#e2e8f0'
           }}>
        <p className="description" style={{ color: '#a0aec0', marginBottom: '2rem', fontSize: '1.1rem' }}>
          Unleash your creativity! Enter your desired meme image description below, then click 'Generate Meme'.
        </p>

        <textarea
          id="promptInput"
          className="prompt-input"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="Example: 'The planet Saturn with its rings, but the planet is a smiling cartoon turd, floating in space with stars in the background. Make it look like a classic internet meme poster.'"
          style={{
            width: '100%', padding: '15px', marginBottom: '25px', border: '1px solid #4a5568',
            borderRadius: '10px', fontSize: '1.05rem', backgroundColor: '#2d3748', color: '#e2e8f0',
            boxShadow: 'inset 0 2px 5px rgba(0,0,0,0.2)', resize: 'vertical', minHeight: '80px',
            transition: 'border-color 0.3s ease, box-shadow 0.3s ease'
          }}
        ></textarea>

        <button
          onClick={generateImage}
          disabled={loading || !prompt.trim()}
          className={`button-primary focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2`}
          style={{
            background: loading || !prompt.trim() ? 'linear-gradient(90deg, #667eea80 0%, #7e5bef80 100%)' : 'linear-gradient(90deg, #667eea 0%, #7e5bef 100%)',
            color: 'white', fontWeight: 'bold', padding: '14px 28px', borderRadius: '10px',
            boxShadow: '0 5px 15px rgba(0, 0, 0, 0.2)', transition: 'all 0.3s ease', transform: 'translateY(0)',
            cursor: loading || !prompt.trim() ? 'not-allowed' : 'pointer'
          }}
        >
          {loading ? 'Generating...' : 'Generate Meme'}
        </button>

        {loading && (
          <div className="loading-spinner" style={{ display: 'block', margin: '25px auto', borderLeftColor: '#667eea' }}></div>
        )}
        {error && (
          <p className="error-message" style={{ color: '#fca5a5', marginTop: '20px', fontSize: '1rem', fontWeight: '500' }}>
            {error}
          </p>
        )}

        {imageUrl && (
          <img
            id="memeImage"
            className="meme-image"
            src={imageUrl}
            alt="Generated Meme"
            style={{
              maxWidth: '100%', height: 'auto', borderRadius: '12px', marginTop: '30px',
              border: '2px solid #667eea', boxShadow: '0 8px 20px rgba(0, 0, 0, 0.2)'
            }}
            onError={(e) => { e.target.onerror = null; e.target.src="https://placehold.co/512x512/E0E0E0/808080?text=Image+Load+Error"; setError('Failed to load generated image. Please try again.'); }}
          />
        )}

        <div className="buy-link-section"
             style={{
               marginTop: '30px', paddingTop: '20px', borderTop: '1px solid rgba(71, 85, 105, 0.3)',
               width: '100%', color: '#a0aec0'
             }}>
          <p className="text-gray-400 mb-4">Like this project? Support us by checking out our token!</p>
          <a href="https://jup.ag/tokens/AxJvMQKoFX1aPU8iSrKVYn8iTNZjrhAQDsDAnBWUjups" target="_blank"
             className="buy-button"
             style={{
               backgroundColor: '#00b0ff', color: 'white', fontWeight: 'bold', padding: '12px 25px',
               borderRadius: '8px', boxShadow: '0 4px 10px rgba(0, 0, 0, 0.2)', transition: 'all 0.3s ease',
               textDecoration: 'none', display: 'inline-block'
             }}>
            Buy Here on Jup.ag
          </a>
        </div>
      </div>

      {/* Tailwind CSS classes for animations and base styles (hidden by React inline styles) */}
      <style>
        {`
        @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }
        .loading-spinner {
            border: 4px solid rgba(255, 255, 255, 0.2);
            border-left-color: #667eea; /* Blue-purple spinner */
            border-radius: 50%;
            width: 40px; /* Slightly larger spinner */
            height: 40px;
            animation: spin 1s linear infinite;
            display: none; /* Controlled by React state */
        }
        `}
      </style>
    </div>
  );
}

export default App;
