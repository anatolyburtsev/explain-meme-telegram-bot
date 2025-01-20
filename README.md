# Meme Explanation Telegram Bot

A Telegram bot that helps explain memes. Users can forward meme images to the bot, and it provides explanations using AI analysis. The bot is private and only accessible to whitelisted users.

## Tech Stack

- TypeScript
- Next.js
- Telegraf (Telegram Bot Framework)
- Vercel (Hosting)
- OpenAI API (For image analysis)

## Setup

1. Clone the repository
2. Install dependencies:
```bash
npm install
```
3. Create a `.env.local` file with the following variables:
```
BOT_TOKEN=your_telegram_bot_token
OPENAI_API_KEY=your_openai_api_key
WHITELISTED_USERS=123456789,987654321  # Comma-separated list of authorized Telegram user IDs
```

### Getting Your Telegram User ID

To get your Telegram user ID:
1. Start a chat with [@userinfobot](https://t.me/userinfobot) on Telegram
2. The bot will reply with your user ID
3. Add this ID to the `WHITELISTED_USERS` environment variable

## Development

Run the development server:
```bash
npm run dev
```

## Deployment

1. Deploy to Vercel
2. Set up environment variables in Vercel dashboard
3. Set up the Telegram webhook using this command (replace with your bot token):
```bash
curl "https://api.telegram.org/bot<BOT_TOKEN>/setWebhook?url=https://explain-meme-telegram-bot.vercel.app/api/bot"
```

## Testing

Test the webhook endpoints:

1. GET endpoint (webhook verification):
```bash
curl https://explain-meme-telegram-bot.vercel.app/api/bot
```

2. Test with Telegram:
- Find your bot on Telegram (using the username you set with BotFather)
- Send a message to your bot
- The bot should respond accordingly

## Features

- Text message echo (current implementation)
- Meme explanation (coming soon)
- Image processing (coming soon)
- AI-powered analysis (coming soon)

## Contributing

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request
