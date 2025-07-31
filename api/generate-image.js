// api/generate-image.js
// Pastikan file ini berada di dalam folder 'api' di root repositori Anda.

import fetch from 'node-fetch'; // Vercel's Node.js runtime mendukung fetch
import FormData from 'form-data'; // Diperlukan untuk mengirim data form-data

export default async function handler(req, res) {
    // Pastikan ini adalah permintaan POST
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Metode Tidak Diizinkan' });
    }

    // Ambil data dari body permintaan frontend
    const { prompt, width, height } = req.body;

    if (!prompt) {
        return res.status(400).json({ error: 'Prompt diperlukan.' });
    }

    // Ambil kunci API dari variabel lingkungan Vercel
    // Anda HARUS mengatur variabel lingkungan ini di pengaturan proyek Vercel Anda.
    // Contoh: DEEPAI_API_KEY = "YOUR_ACTUAL_DEEPAI_API_KEY"
    const deepaiApiKey = process.env.DEEPAI_API_KEY;

    if (!deepaiApiKey) {
        return res.status(500).json({ error: 'Kunci API DeepAI tidak dikonfigurasi di server.' });
    }

    const apiUrl = "https://api.deepai.org/api/text2img";
    const payload = new FormData();
    payload.append('text', prompt);
    payload.append('width', width);
    payload.append('height', height);
    // DeepAI juga mendukung 'grid_size' (1-4) untuk menghasilkan beberapa gambar
    // payload.append('grid_size', 1); // Jika Anda ingin hanya 1 gambar

    try {
        const deepaiResponse = await fetch(apiUrl, {
            method: 'POST',
            headers: {
                'api-key': deepaiApiKey, // Kunci API rahasia digunakan di sini
            },
            body: payload,
        });

        if (!deepaiResponse.ok) {
            const errorData = await deepaiResponse.json();
            console.error('DeepAI API error response:', errorData);
            throw new Error(`Kesalahan API DeepAI: ${deepaiResponse.status} - ${errorData.err || deepaiResponse.statusText}`);
        }

        const deepaiResult = await deepaiResponse.json();

        if (deepaiResult.output_url) {
            // Kirim URL gambar kembali ke frontend
            res.status(200).json({ imageUrl: deepaiResult.output_url });
        } else {
            console.error('DeepAI did not return an output_url:', deepaiResult);
            res.status(500).json({ error: 'DeepAI tidak mengembalikan URL gambar.' });
        }

    } catch (error) {
        console.error('Kesalahan fungsi serverless:', error);
        res.status(500).json({ error: `Kesalahan server internal: ${error.message}` });
    }
}
