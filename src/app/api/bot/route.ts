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

// Echo bot logic using modern filter approach
bot.on('message', async (ctx: Context) => {
  try {
    if (ctx.message && 'text' in ctx.message) {
      await ctx.reply(ctx.message.text);
    }
  } catch (error) {
    console.error('Error in message handler:', error);
    // Attempt to notify about the error if possible
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
    // Telegraf handles the incoming update from Telegram
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