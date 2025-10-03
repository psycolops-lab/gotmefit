
   import type { NextApiRequest, NextApiResponse } from 'next';

   // Simple in-memory cache
   const imageCache = new Map<string, string>();

   type UnsplashResponse = {
     url: string;
   };

   export default async function handler(
     req: NextApiRequest,
     res: NextApiResponse<UnsplashResponse>,
   ) {
     const { query, seed } = req.query;
     const accessKey = process.env.UNSPLASH_ACCESS_KEY;
     const cacheKey = `${query}-${seed}`;

     // Check cache
     if (imageCache.has(cacheKey)) {
       return res.status(200).json({ url: imageCache.get(cacheKey)! });
     }

     try {
       const response = await fetch(
         `https://api.unsplash.com/photos/random?query=${encodeURIComponent(
           query as string,
         )},food&orientation=landscape&client_id=${accessKey}&${seed ? `seed=${encodeURIComponent(seed as string)}` : ''}`,
       );
       if (!response.ok) {
         throw new Error(`Unsplash API responded with status ${response.status}`);
       }
       const data = await response.json();
       const imageUrl =
         data.urls?.regular ||
         'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=300&q=75';
       const optimizedUrl = `${imageUrl}&w=400&h=300&q=75`;

       // Cache the result
       imageCache.set(cacheKey, optimizedUrl);

       res.status(200).json({ url: optimizedUrl });
     } catch (error) {
       console.error('Unsplash API error:', (error as Error).message);
       res.status(500).json({
         url: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=300&q=75',
       });
     }
   }
 