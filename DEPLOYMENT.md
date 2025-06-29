# 🚀 Deploying to Discloud

This guide will help you deploy your 4 Dudes Esports Discord Bot to Discloud hosting service.

## 📋 Prerequisites

1. **Discloud Account** - Sign up at [discloud.app](https://discloud.app)
2. **Discord Bot Token** - From Discord Developer Portal
3. **Discord Client ID** - From Discord Developer Portal
4. **GitHub Account** - For repository hosting

## 🔧 Step-by-Step Deployment

### 1. **Prepare Your Repository**

Make sure your bot code is in a GitHub repository with the following structure:
```
├── index.js
├── package.json
├── discloud.config
├── commands/
├── events/
├── utils/
└── data/
```

### 2. **Environment Variables**

Create a `.env` file in your repository root (or use Discloud's environment variables):
```env
DISCORD_TOKEN=your_bot_token_here
CLIENT_ID=your_client_id_here
```

### 3. **Discloud Configuration**

The `discloud.config` file is already configured:
```env
NAME=4-dudes-esports-bot
ID=4-dudes-esports-bot
RAM=100
VERSION=1.0.0
MAIN=index.js
TYPE=bot
AUTORESTART=true
AUTOUPDATE=true
```

### 4. **Deploy to Discloud**

#### Option A: Via Discloud Dashboard
1. Go to [discloud.app](https://discloud.app)
2. Click "New App"
3. Select "GitHub" as deployment method
4. Connect your GitHub account
5. Select your bot repository
6. Configure environment variables:
   - `DISCORD_TOKEN` = Your bot token
   - `CLIENT_ID` = Your client ID
7. Click "Deploy"

#### Option B: Via Discloud CLI
1. Install Discloud CLI:
   ```bash
   npm install -g @discloud/cli
   ```

2. Login to Discloud:
   ```bash
   discloud login
   ```

3. Deploy your app:
   ```bash
   discloud deploy
   ```

### 5. **Post-Deployment Setup**

After deployment, you need to deploy your slash commands:

1. **Get your bot's application ID** from Discord Developer Portal
2. **Update the deploy-commands.js** with your application ID
3. **Run the command deployment** (you can do this locally or add it to your deployment process)

## 🔧 Configuration Details

### Discloud Configuration (`discloud.config`)
- **NAME**: Your bot's display name
- **ID**: Unique identifier for your app
- **RAM**: Memory allocation (100MB is sufficient for this bot)
- **VERSION**: App version
- **MAIN**: Entry point file
- **TYPE**: Application type (bot)
- **AUTORESTART**: Automatically restart on crashes
- **AUTOUPDATE**: Auto-update from repository

### Environment Variables
- **DISCORD_TOKEN**: Your bot's authentication token
- **CLIENT_ID**: Your Discord application's client ID

## 🚨 Important Notes

### 1. **Command Deployment**
After deploying to Discloud, you need to deploy your slash commands. You can:
- Run `node deploy-commands.js` locally (make sure to update CLIENT_ID)
- Add command deployment to your deployment process
- Use Discord's API directly to register commands

### 2. **File Permissions**
Make sure your bot has proper permissions in Discord servers:
- Send Messages
- Embed Links
- Read Message History
- Manage Channels (for analytics VC)
- Ban Members
- Kick Members
- Moderate Members
- Manage Messages
- View Audit Log

### 3. **Data Persistence**
- Analytics data is stored in JSON files
- Logs are sent to Discord channels
- Consider using a database for production use

### 4. **Monitoring**
- Use Discloud's dashboard to monitor your bot
- Check logs for any errors
- Monitor resource usage

## 🔄 Updates and Maintenance

### Automatic Updates
With `AUTOUPDATE=true`, your bot will automatically update when you push changes to your GitHub repository.

### Manual Updates
You can manually update your bot through the Discloud dashboard or CLI.

### Restarting
- **Automatic**: Bot restarts automatically on crashes
- **Manual**: Use Discloud dashboard or CLI to restart

## 🆘 Troubleshooting

### Common Issues

1. **Bot not responding**
   - Check if bot is online in Discloud dashboard
   - Verify Discord token is correct
   - Check bot permissions in Discord server

2. **Commands not working**
   - Deploy slash commands after bot deployment
   - Check bot permissions
   - Verify CLIENT_ID is correct

3. **Environment variables not working**
   - Check Discloud dashboard environment variables
   - Ensure variable names match your code
   - Restart bot after changing environment variables

### Getting Help
- Check Discloud documentation: [docs.discloud.app](https://docs.discloud.app)
- Join Discloud Discord server
- Check bot logs in Discloud dashboard

## 📊 Performance Monitoring

Monitor your bot's performance through Discloud dashboard:
- **CPU Usage**: Should be low for this bot
- **Memory Usage**: Should stay under allocated RAM
- **Uptime**: Should be 99%+ with auto-restart enabled

---

**Your 4 Dudes Esports Bot is now ready for production deployment! 🎉** 