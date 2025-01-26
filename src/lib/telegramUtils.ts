import { Context, Telegram } from 'telegraf';

// Get whitelisted users from environment variable
export const WHITELISTED_USERS = (process.env.WHITELISTED_USERS || '')
  .split(',')
  .map(id => Number(id.trim()))
  .filter(id => !isNaN(id));

// Middleware to check if user is whitelisted
export const whitelistMiddleware = async (ctx: Context, next: () => Promise<void>) => {
  const userId = ctx.from?.id;
  
  if (!userId || !WHITELISTED_USERS.includes(userId)) {
    await ctx.reply('Sorry, this bot is private and can only be used by authorized users.');
    return;
  }
  
  return next();
};

// Helper function to get image details from message
export const getImageFromMessage = (ctx: Context) => {
  const msg = ctx.message;
  if (!msg) return null;
  
  if ('photo' in msg && msg.photo && msg.photo.length > 0) {
    return msg.photo[msg.photo.length - 1];
  }
  return null;
};

// Helper function to download file from Telegram
export async function getFileBuffer(telegram: Telegram, fileId: string): Promise<Buffer> {
  const file = await telegram.getFile(fileId);
  const filePath = file.file_path;
  if (!filePath) throw new Error('Could not get file path');
  
  const fileUrl = `https://api.telegram.org/file/bot${process.env.BOT_TOKEN}/${filePath}`;
  const response = await fetch(fileUrl);
  const arrayBuffer = await response.arrayBuffer();
  return Buffer.from(arrayBuffer);
}
