import { NextResponse } from 'next/server';
import { Telegraf, Context } from 'telegraf';
import OpenAI from 'openai';

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY as string,
});

// Initialize the Telegraf bot
const bot = new Telegraf(process.env.BOT_TOKEN as string);

// Get whitelisted users from environment variable
const WHITELISTED_USERS = (process.env.WHITELISTED_USERS || '')
  .split(',')
  .map(id => Number(id.trim()))
  .filter(id => !isNaN(id));

// Middleware to check if user is whitelisted
bot.use(async (ctx: Context, next) => {
  const userId = ctx.from?.id;
  
  if (!userId || !WHITELISTED_USERS.includes(userId)) {
    await ctx.reply('Sorry, this bot is private and can only be used by authorized users.');
    return;
  }
  
  return next();
});

// Helper function to get image details from message
const getImageFromMessage = (ctx: Context) => {
  const msg = ctx.message;
  if (!msg) return null;
  
  // Check for photo in the message
  if ('photo' in msg && msg.photo && msg.photo.length > 0) {
    // Return the highest resolution photo (last in array)
    return msg.photo[msg.photo.length - 1];
  }
  return null;
};

// Helper function to download file from Telegram
async function getFileBuffer(ctx: Context, fileId: string): Promise<Buffer> {
  const file = await ctx.telegram.getFile(fileId);
  const filePath = file.file_path;
  if (!filePath) throw new Error('Could not get file path');
  
  const fileUrl = `https://api.telegram.org/file/bot${process.env.BOT_TOKEN}/${filePath}`;
  const response = await fetch(fileUrl);
  const arrayBuffer = await response.arrayBuffer();
  return Buffer.from(arrayBuffer);
}

// Helper function to analyze image with GPT-4V
async function analyzeImageWithGPT4V(imageBuffer: Buffer, messageText?: string): Promise<string> {
  try {
    // Convert buffer to base64
    const base64Image = imageBuffer.toString('base64');
    
    // Prepare the prompt
    let prompt = "Please analyze this meme and explain its meaning and humor. ";
    if (messageText) {
      prompt += `Consider this accompanying text as well: "${messageText}"`;
    }

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
  } catch (error) {
    console.error('Error analyzing image:', error);
    throw new Error('Failed to analyze image with GPT-4V');
  }
}

// Handle messages with images
bot.on('message', async (ctx: Context) => {
  try {
    // Get message text if it exists
    const messageText = ctx.message && 'text' in ctx.message ? ctx.message.text : undefined;
    
    // Handle messages with images
    const image = getImageFromMessage(ctx);
    if (image) {
      // Send "analyzing" message
      await ctx.reply('Analyzing your meme...');
      
      // Get image file
      const imageBuffer = await getFileBuffer(ctx, image.file_id);
      
      // Get image analysis
      const analysis = await analyzeImageWithGPT4V(imageBuffer, messageText);
      
      // Send the analysis
      await ctx.reply(analysis);
      
      // Also send the original image details
      const details = `Image details:\nSize: ${image.width}x${image.height} pixels\nFile size: ${image.file_size || 'unknown'} bytes`;
      await ctx.reply(details);
      return;
    }
    
    // Handle text-only messages
    if (messageText) {
      await ctx.reply(messageText);
      return;
    }
    
    // No text or image found
    await ctx.reply('Please send a text message or an image.');
  } catch (error) {
    console.error('Error in message handler:', error);
    try {
      await ctx.reply('Sorry, I encountered an error processing your message.');
    } catch {
      // Silently fail if we can't even send the error message
    }
  }
});

// Webhook handler for POST requests
export async function POST(req: Request) {
  try {
    const body = await req.json();
    await bot.handleUpdate(body);
    return NextResponse.json({ message: 'OK' }, { status: 200 });
  } catch (error) {
    console.error('Error handling update:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}

// Handle GET requests
export async function GET() {
  return NextResponse.json(
    { message: 'This is the bot webhook endpoint.' },
    { status: 200 }
  );
}