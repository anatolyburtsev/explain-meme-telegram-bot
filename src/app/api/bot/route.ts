import { Telegraf, Context } from 'telegraf';
import { NextResponse } from 'next/server';
import { 
  whitelistMiddleware,
  getImageFromMessage,
  getFileBuffer
} from '../../../lib/telegramUtils';
import { analyzeImageWithGPT4V } from '../../../services/llmService';
import { bufferToBase64 } from '../../../utils/imageUtils';

// Initialize the Telegraf bot
const bot = new Telegraf(process.env.BOT_TOKEN as string);

// Apply whitelist middleware
bot.use(whitelistMiddleware);

// Handle messages with images
bot.on('message', async (ctx: Context) => {
  try {
    // Get message text if it exists
    const messageText = ctx.message && 'text' in ctx.message ? ctx.message.text : undefined;
    
    // Handle messages with images
    const image = getImageFromMessage(ctx);
    if (image) {
      // Get image file
      const imageBuffer = await getFileBuffer(ctx, image.file_id);
      
      // Get image analysis
      const analysis = await analyzeImageWithGPT4V(imageBuffer, messageText);
      
      // Send the analysis
      await ctx.reply(analysis);
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
