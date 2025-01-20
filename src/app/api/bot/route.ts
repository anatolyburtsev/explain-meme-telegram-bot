import { NextResponse } from 'next/server';
import { Telegraf, Context } from 'telegraf';

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

// Handle messages with images
bot.on('message', async (ctx: Context) => {
  try {
    // Handle text messages
    if (ctx.message && 'text' in ctx.message) {
      await ctx.reply(ctx.message.text);
      return;
    }

    // Handle messages with images
    const image = getImageFromMessage(ctx);
    if (image) {
      const response = `Image details:\nFile ID: ${image.file_id}\nSize: ${image.width}x${image.height} pixels\nFile size: ${image.file_size || 'unknown'} bytes`;
      await ctx.reply(response);
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