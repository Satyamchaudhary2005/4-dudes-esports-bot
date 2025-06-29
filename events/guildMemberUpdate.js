const { EmbedBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');
const { sendLog } = require('../utils/logging.js');

module.exports = {
    name: 'guildMemberUpdate',
    async execute(oldMember, newMember) {
        const analyticsPath = path.join(__dirname, '..', 'data', 'analytics.json');
        
        // Load analytics data
        let analytics = {};
        if (fs.existsSync(analyticsPath)) {
            analytics = JSON.parse(fs.readFileSync(analyticsPath, 'utf8'));
        }

        // Initialize server data if it doesn't exist
        if (!analytics.servers[newMember.guild.id]) {
            analytics.servers[newMember.guild.id] = {
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

        // Check if roles changed
        if (oldMember.roles.cache.size !== newMember.roles.cache.size) {
            analytics.servers[newMember.guild.id].role_changes++;
            
            // Save analytics data
            fs.writeFileSync(analyticsPath, JSON.stringify(analytics, null, 2));

            // Send log to designated channel
            sendLog(newMember.guild.id, 'roles', {
                user_tag: newMember.user.tag,
                role_count: newMember.roles.cache.size
            });
        }
    },
}; 