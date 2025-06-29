const { EmbedBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');
const { sendLog } = require('../utils/logging.js');

module.exports = {
    name: 'messageDelete',
    async execute(message) {
        // Ignore bot messages
        if (message.author?.bot) return;

        const analyticsPath = path.join(__dirname, '..', 'data', 'analytics.json');
        
        // Load analytics data
        let analytics = {};
        if (fs.existsSync(analyticsPath)) {
            analytics = JSON.parse(fs.readFileSync(analyticsPath, 'utf8'));
        }

        // Initialize server data if it doesn't exist
        if (!analytics.servers[message.guildId]) {
            analytics.servers[message.guildId] = {
                total_messages: 0,
                total_commands: 0,
                total_moderations: 0,
                member_joins: 0,
                member_leaves: 0,
                message_edits: 0,
                message_deletes: 0,
                role_changes: 0,
                users: {},
                channels: {},
                daily_stats: {},
                moderation_logs: []
            };
        }

        // Update server stats
        analytics.servers[message.guildId].message_deletes++;

        // Save analytics data
        fs.writeFileSync(analyticsPath, JSON.stringify(analytics, null, 2));

        // Send log to designated channel
        sendLog(message.guildId, 'messages', {
            event: 'delete',
            author_tag: message.author.tag,
            channel: `<#${message.channel.id}>`,
            content: message.content
        });
    },
}; 