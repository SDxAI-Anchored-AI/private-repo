import fs from 'fs';
import path from 'path';

export default async function handler(req: any, res: any) {
  if (req.method === 'POST') {
    const { base64, name } = req.body;

    if (!base64) {
      return res.status(400).json({ message: 'No base64 data sent' });
    }

    try {
      const base64Data = base64[0];
      const imageBuffer = Buffer.from(base64Data, 'base64');
      const imagePath = path.join(process.cwd(), 'assets', 'images', `image-${name}${Date.now()}.png`);
      await fs.promises.writeFile(imagePath, imageBuffer);

      res.status(200).json({ message: 'Image uploaded!', imagePath });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Error uploading image' });
    }
  } else {
    res.status(405).json({ message: 'Only POST requests allowed' });
  }
}

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '4mb', // Set desired value here
    },
  },
};
