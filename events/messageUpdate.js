const { EmbedBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');
const { sendLog } = require('../utils/logging.js');

module.exports = {
    name: 'messageUpdate',
    async execute(oldMessage, newMessage) {
        // Ignore bot messages
        if (oldMessage.author.bot) return;

        const analyticsPath = path.join(__dirname, '..', 'data', 'analytics.json');
        
        // Load analytics data
        let analytics = {};
        if (fs.existsSync(analyticsPath)) {
            analytics = JSON.parse(fs.readFileSync(analyticsPath, 'utf8'));
        }

        // Initialize server data if it doesn't exist
        if (!analytics.servers[oldMessage.guildId]) {
            analytics.servers[oldMessage.guildId] = {
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
        analytics.servers[oldMessage.guildId].message_edits++;

        // Save analytics data
        fs.writeFileSync(analyticsPath, JSON.stringify(analytics, null, 2));

        // Send log to designated channel
        sendLog(oldMessage.guildId, 'messages', {
            event: 'edit',
            author_tag: oldMessage.author.tag,
            channel: `<#${oldMessage.channel.id}>`,
            message_url: newMessage.url
        });
    },
}; 