const { Client, GatewayIntentBits, Collection, EmbedBuilder, PermissionsBitField, MessageFlags } = require('discord.js');
const fs = require('fs');
const path = require('path');
const { logCommandUsage } = require('./utils/analytics.js');
const { startPeriodicUpdates } = require('./utils/analyticsvc.js');
require('dotenv').config({ path: './config.env' });

// Create a new client instance
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages
    ]
});

// Make client globally available for logging system
global.client = client;

// Command collection
client.commands = new Collection();

// Load commands
const commandsPath = path.join(__dirname, 'commands');
if (fs.existsSync(commandsPath)) {
    const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));
    
    for (const file of commandFiles) {
        const filePath = path.join(commandsPath, file);
        const command = require(filePath);
        
        if ('data' in command && 'execute' in command) {
            client.commands.set(command.data.name, command);
        }
    }
}

// Load events
const eventsPath = path.join(__dirname, 'events');
if (fs.existsSync(eventsPath)) {
    const eventFiles = fs.readdirSync(eventsPath).filter(file => file.endsWith('.js'));
    
    for (const file of eventFiles) {
        const filePath = path.join(eventsPath, file);
        const event = require(filePath);
        
        if (event.once) {
            client.once(event.name, (...args) => event.execute(...args));
        } else {
            client.on(event.name, (...args) => event.execute(...args));
        }
    }
}

// Bot ready event
client.once('ready', () => {
    console.log(`🚀 4 Dudes Esports Bot is online!`);
    console.log(`Logged in as ${client.user.tag}`);
    console.log(`Serving ${client.guilds.cache.size} guilds`);
    client.user.setActivity('4 Dudes Esports | !help', { type: 'WATCHING' });
    startPeriodicUpdates(client);
});

// Command interaction handler
client.on('interactionCreate', async interaction => {
    if (!interaction.isChatInputCommand()) return;

    const command = client.commands.get(interaction.commandName);
    if (!command) return;

    try {
        // Log command usage for analytics
        logCommandUsage(interaction.guildId, interaction.user.id, interaction.commandName);
        
        await command.execute(interaction);
    } catch (error) {
        console.error(error);
        const errorMessage = 'There was an error while executing this command!';
        
        if (interaction.replied || interaction.deferred) {
            await interaction.followUp({ content: errorMessage, flags: [MessageFlags.Ephemeral] });
        } else {
            await interaction.reply({ content: errorMessage, flags: [MessageFlags.Ephemeral] });
        }
    }
});

// Error handling
client.on('error', error => {
    console.error('Discord client error:', error);
});

process.on('unhandledRejection', error => {
    console.error('Unhandled promise rejection:', error);
});

// Login to Discord
client.login(process.env.DISCORD_TOKEN); 