// pages/api/download-image.js
import fetch from 'node-fetch';

export default async function handler(req, res) {
    const { imageUrl } = req.query;
    if (!imageUrl) {
        return res.status(400).json({ error: 'Image URL is required' });
    }

    try {
        const imageResponse = await fetch(imageUrl);
        const imageBuffer = await imageResponse.buffer();
        res.setHeader('Content-Type', 'image/png');
        res.send(imageBuffer);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch image' });
    }
}
