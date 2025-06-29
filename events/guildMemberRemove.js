const { EmbedBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');
const { sendLog } = require('../utils/logging.js');
const { updateAnalyticsChannels } = require('../utils/analyticsvc.js');

module.exports = {
    name: 'guildMemberRemove',
    async execute(member) {
        const analyticsPath = path.join(__dirname, '..', 'data', 'analytics.json');
        
        // Load analytics data
        let analytics = {};
        if (fs.existsSync(analyticsPath)) {
            analytics = JSON.parse(fs.readFileSync(analyticsPath, 'utf8'));
        }

        // Initialize server data if it doesn't exist
        if (!analytics.servers[member.guild.id]) {
            analytics.servers[member.guild.id] = {
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
        analytics.servers[member.guild.id].member_leaves++;

        // Update daily stats
        const today = new Date().toISOString().split('T')[0];
        if (!analytics.servers[member.guild.id].daily_stats[today]) {
            analytics.servers[member.guild.id].daily_stats[today] = {
                messages: 0,
                commands: 0,
                moderations: 0,
                joins: 0,
                leaves: 0
            };
        }
        analytics.servers[member.guild.id].daily_stats[today].leaves++;

        // Keep user data for historical purposes but mark as left
        if (analytics.servers[member.guild.id].users[member.id]) {
            analytics.servers[member.guild.id].users[member.id].left_at = new Date().toISOString();
            analytics.servers[member.guild.id].users[member.id].left = true;
        }

        // Save analytics data
        fs.writeFileSync(analyticsPath, JSON.stringify(analytics, null, 2));

        // Send log to designated channel
        sendLog(member.guild.id, 'members', {
            event: 'leave',
            user_tag: member.user.tag,
            user_id: member.id,
            joined_at: analytics.servers[member.guild.id].users[member.id]?.joined_at
        });

        // Update analytics voice channels
        await updateAnalyticsChannels(member.client, member.guild);

        // Send log to logging channel
        const embed = new EmbedBuilder()
            .setColor('#FF6B6B')
            .setTitle('👋 Member Left')
            .setDescription(`${member.user.tag} has left the server`)
            .addFields(
                { name: '👤 User', value: `${member.user} (${member.user.id})`, inline: true },
                { name: '📅 Left At', value: `<t:${Math.floor(Date.now() / 1000)}:F>`, inline: true },
                { name: '🤖 Bot', value: member.user.bot ? 'Yes' : 'No', inline: true },
                { name: '📊 Member Count', value: `${member.guild.memberCount}`, inline: true },
                { name: '⏱️ Time in Server', value: member.joinedTimestamp ? `<t:${Math.floor((Date.now() - member.joinedTimestamp) / 1000)}:R>` : 'Unknown', inline: true }
            )
            .setThumbnail(member.user.displayAvatarURL({ dynamic: true }))
            .setFooter({ text: '4 Dudes Esports Analytics System' })
            .setTimestamp();

        await sendLog(member.guild, embed);
    },
}; 