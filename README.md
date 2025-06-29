# 4 Dudes Esports Discord Bot

A comprehensive Discord bot designed for server management, analytics, moderation, and community engagement. Built with Discord.js v14 and Node.js.

## 🚀 Features

### 📊 **Analytics System**
- **Real-time server statistics** with voice channel displays
- **Comprehensive analytics tracking** including messages, commands, moderation actions
- **Daily statistics** and historical data
- **User activity tracking** and engagement metrics
- **Channel usage analytics**

### 🛡️ **Moderation Tools**
- **Ban/Unban** users with reason logging
- **Kick** users from the server
- **Timeout** users with customizable duration
- **Warning system** with persistent records
- **Auto-moderation** features
- **Clear messages** in bulk

### 📝 **Logging System**
- **Comprehensive activity logging** to designated channels
- **Member join/leave tracking**
- **Message edit/delete logging**
- **Role change monitoring**
- **Moderation action logging**

### 🎫 **Ticket System**
- **Support ticket creation** and management
- **Ticket panel setup** for easy access
- **Automatic ticket categorization**
- **Staff assignment capabilities**

### 📈 **Analytics Voice Channels**
- **Real-time server statistics** displayed in voice channel names
- **Automatic updates** when member counts change
- **Locked channels** for viewing only
- **Periodic updates** every 5 minutes

## 📋 Commands

### 🔧 **Setup Commands**
| Command | Description | Permission Required |
|---------|-------------|-------------------|
| `/logging setup <channel>` | Set up logging channel | Manage Guild |
| `/logging disable` | Disable logging system | Manage Guild |
| `/logging status` | Check logging status | Manage Guild |
| `/analyticsvc setup [category]` | Set up analytics voice channels | Manage Guild |
| `/analyticsvc disable` | Remove analytics voice channels | Manage Guild |
| `/analyticsvc status` | Check analytics VC status | Manage Guild |

### 🛡️ **Moderation Commands**
| Command | Description | Permission Required |
|---------|-------------|-------------------|
| `/ban <user> [reason]` | Ban a user from the server | Ban Members |
| `/unban <userid>` | Unban a user by ID | Ban Members |
| `/kick <user> [reason]` | Kick a user from the server | Kick Members |
| `/timeout <user> <duration> [reason]` | Timeout a user | Moderate Members |
| `/warn <user> <reason>` | Warn a user | Moderate Members |
| `/clear <amount>` | Clear messages in bulk | Manage Messages |

### 📊 **Analytics Commands**
| Command | Description | Permission Required |
|---------|-------------|-------------------|
| `/analytics overview` | View server overview statistics | View Audit Log |
| `/analytics users` | View user activity statistics | View Audit Log |
| `/analytics channels` | View channel usage statistics | View Audit Log |
| `/analytics moderation` | View moderation logs | View Audit Log |
| `/analytics daily` | View daily statistics | View Audit Log |

### 🎫 **Ticket Commands**
| Command | Description | Permission Required |
|---------|-------------|-------------------|
| `/ticket create [reason]` | Create a support ticket | Send Messages |
| `/ticketpanel setup` | Set up ticket creation panel | Manage Guild |

### ❓ **Help Commands**
| Command | Description | Permission Required |
|---------|-------------|-------------------|
| `/help` | Display help information | None |

## 🛠️ Installation & Setup

### Prerequisites
- Node.js 16.9.0 or higher
- npm or yarn package manager
- Discord Bot Token
- Discord Application with bot permissions

### 1. **Clone the Repository**
```bash
git clone <repository-url>
cd discord-bot
```

### 2. **Install Dependencies**
```bash
npm install
```

### 3. **Environment Configuration**
Create a `config.env` file in the root directory:
```env
DISCORD_TOKEN=your_bot_token_here
CLIENT_ID=your_client_id_here
```

### 4. **Bot Permissions**
Ensure your bot has the following permissions:
- **Send Messages**
- **Embed Links**
- **Read Message History**
- **Manage Channels** (for analytics VC)
- **Ban Members**
- **Kick Members**
- **Moderate Members**
- **Manage Messages**
- **View Audit Log**

### 5. **Deploy Commands**
```bash
node deploy-commands.js
```

### 6. **Start the Bot**
```bash
npm start
```

## 📁 Project Structure

```
Discord bot/
├── commands/           # Slash command files
│   ├── analytics.js    # Analytics commands
│   ├── analyticsvc.js  # Analytics voice channels
│   ├── ban.js         # Ban command
│   ├── clear.js       # Clear messages
│   ├── help.js        # Help command
│   ├── kick.js        # Kick command
│   ├── logging.js     # Logging setup
│   ├── ticket.js      # Ticket system
│   ├── timeout.js     # Timeout command
│   ├── unban.js       # Unban command
│   └── warn.js        # Warning system
├── events/            # Event handlers
│   ├── guildMemberAdd.js    # Member join events
│   ├── guildMemberRemove.js # Member leave events
│   ├── interactionCreate.js # Command interactions
│   ├── messageCreate.js     # Message events
│   ├── messageDelete.js     # Message deletion
│   └── messageUpdate.js     # Message edits
├── utils/             # Utility functions
│   ├── analytics.js   # Analytics utilities
│   ├── analyticsvc.js # Analytics VC utilities
│   └── logging.js     # Logging utilities
├── data/              # Data storage
│   ├── analytics.json # Analytics data
│   ├── logging.json   # Logging configuration
│   └── analyticsvc.json # Analytics VC config
├── index.js           # Main bot file
├── deploy-commands.js # Command deployment
├── package.json       # Dependencies
└── README.md         # This file
```

## 🔧 Configuration

### Analytics Voice Channels
The bot creates three voice channels that display real-time server statistics:
- **👥 Members: [count]** - Total member count
- **🟢 Online: [count]** - Estimated online members (30% of total)
- **🤖 Bots: [count]** - Estimated bot count (10% of total)

**Note:** Due to Discord API limitations, online and bot counts are estimated percentages since the bot doesn't use privileged intents.

### Logging System
- Logs are sent to a designated channel set up via `/logging setup`
- Includes member activity, moderation actions, and server events
- Rich embeds with detailed information and timestamps

### Analytics Tracking
- **Message statistics** - Total messages, edits, deletions
- **Command usage** - Which commands are used most
- **Moderation actions** - Bans, kicks, timeouts, warnings
- **User activity** - Join/leave times, message counts
- **Daily statistics** - Daily summaries of all activities

## 🚨 Troubleshooting

### Common Issues

**1. "Used disallowed intents" Error**
- The bot is configured to work without privileged intents
- If you see this error, ensure no other code is requesting privileged intents

**2. Commands Not Working**
- Ensure commands are deployed: `node deploy-commands.js`
- Check bot permissions in the server
- Verify the bot token is correct

**3. Analytics Voice Channels Not Updating**
- Check bot has "Manage Channels" permission
- Ensure channels weren't manually deleted
- Use `/analyticsvc status` to check configuration

**4. Logging Not Working**
- Use `/logging setup` to configure logging channel
- Ensure bot has "Send Messages" and "Embed Links" permissions
- Check the designated channel still exists

### Bot Permissions Checklist
- [ ] Send Messages
- [ ] Embed Links
- [ ] Read Message History
- [ ] Manage Channels
- [ ] Ban Members
- [ ] Kick Members
- [ ] Moderate Members
- [ ] Manage Messages
- [ ] View Audit Log

## 🔄 Updates & Maintenance

### Periodic Updates
- Analytics voice channels update every 5 minutes
- Daily statistics are automatically generated
- Log files are maintained automatically

### Data Management
- Analytics data is stored in JSON files
- Logs are sent to Discord channels (not stored locally)
- Configuration files are automatically created

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

For support and questions:
- Check the troubleshooting section above
- Review bot permissions and configuration
- Ensure all dependencies are installed
- Verify Discord API status

---

**4 Dudes Esports Bot** - Built with ❤️ for Discord communities 