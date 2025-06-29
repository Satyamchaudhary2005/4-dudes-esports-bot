const { EmbedBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');

module.exports = {
    name: 'messageCreate',
    async execute(message) {
        // Ignore bot messages
        if (message.author.bot) return;

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

        // Initialize user data if it doesn't exist
        if (!analytics.servers[message.guildId].users[message.author.id]) {
            analytics.servers[message.guildId].users[message.author.id] = {
                username: message.author.username,
                tag: message.author.tag,
                joined_at: message.member.joinedAt?.toISOString() || new Date().toISOString(),
                message_count: 0,
                command_count: 0,
                last_message: null,
                first_message: new Date().toISOString()
            };
        }

        // Initialize channel data if it doesn't exist
        if (!analytics.servers[message.guildId].channels[message.channel.id]) {
            analytics.servers[message.guildId].channels[message.channel.id] = {
                name: message.channel.name,
                message_count: 0,
                last_message: null
            };
        }

        // Update global stats
        analytics.global_stats.total_messages++;

        // Update server stats
        analytics.servers[message.guildId].total_messages++;

        // Update user stats
        analytics.servers[message.guildId].users[message.author.id].message_count++;
        analytics.servers[message.guildId].users[message.author.id].last_message = new Date().toISOString();

        // Update channel stats
        analytics.servers[message.guildId].channels[message.channel.id].message_count++;
        analytics.servers[message.guildId].channels[message.channel.id].last_message = new Date().toISOString();

        // Update daily stats
        const today = new Date().toISOString().split('T')[0];
        if (!analytics.servers[message.guildId].daily_stats[today]) {
            analytics.servers[message.guildId].daily_stats[today] = {
                messages: 0,
                commands: 0,
                moderations: 0,
                joins: 0,
                leaves: 0
            };
        }
        analytics.servers[message.guildId].daily_stats[today].messages++;

        // Save analytics data
        fs.writeFileSync(analyticsPath, JSON.stringify(analytics, null, 2));
    },
}; 