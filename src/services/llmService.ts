import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY as string,
});

export async function analyzeImageWithGPT4V(imageBuffer: Buffer, messageText?: string): Promise<string> {
  const base64Image = imageBuffer.toString('base64');
  
  const prompt = `${messageText ? `Consider this text: "${messageText}". ` : ''}
First identify if this is a meme based on a movie scene, historical photo, or other type of image. Then briefly explain (2-3 sentences):
1. What's in the image (if it's from a movie or historical event, provide the context)
2. What makes it funny or meaningful as a meme
Format:
EN: [your brief analysis]
RU: [russian translation]`;

  const response = await openai.chat.completions.create({
    model: "chatgpt-4o-latest",
    messages: [
      {
        role: "user",
        content: [
          { type: "text", text: prompt },
          {
            type: "image_url",
            image_url: {
              url: `data:image/jpeg;base64,${base64Image}`,
            },
          },
        ],
      },
    ],
    max_tokens: 500,
  });

  return response.choices[0]?.message?.content || "Sorry, I couldn't analyze the image.";
}
