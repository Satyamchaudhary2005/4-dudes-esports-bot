const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits, MessageFlags } = require('discord.js');
const { getGuildAnalytics, getGlobalAnalytics } = require('../utils/analytics.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('analytics')
        .setDescription('View server analytics and statistics')
        .addSubcommand(subcommand =>
            subcommand
                .setName('overview')
                .setDescription('Show server overview statistics'))
        .addSubcommand(subcommand =>
            subcommand
                .setName('users')
                .setDescription('Show user activity statistics')
                .addIntegerOption(option =>
                    option.setName('limit')
                        .setDescription('Number of users to show (default: 10)')
                        .setRequired(false)
                        .setMinValue(1)
                        .setMaxValue(25)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('channels')
                .setDescription('Show channel activity statistics')
                .addIntegerOption(option =>
                    option.setName('limit')
                        .setDescription('Number of channels to show (default: 10)')
                        .setRequired(false)
                        .setMinValue(1)
                        .setMaxValue(25)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('moderation')
                .setDescription('Show moderation logs and statistics')
                .addIntegerOption(option =>
                    option.setName('limit')
                        .setDescription('Number of logs to show (default: 10)')
                        .setRequired(false)
                        .setMinValue(1)
                        .setMaxValue(25)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('daily')
                .setDescription('Show daily activity statistics')
                .addIntegerOption(option =>
                    option.setName('days')
                        .setDescription('Number of days to show (default: 7)')
                        .setRequired(false)
                        .setMinValue(1)
                        .setMaxValue(30)))
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),

    async execute(interaction) {
        const subcommand = interaction.options.getSubcommand();
        const guildAnalytics = getGuildAnalytics(interaction.guildId);

        if (!guildAnalytics) {
            return interaction.reply({
                content: '❌ No analytics data available for this server.',
                flags: [MessageFlags.Ephemeral]
            });
        }

        switch (subcommand) {
            case 'overview':
                await handleOverview(interaction, guildAnalytics);
                break;
            case 'users':
                await handleUsers(interaction, guildAnalytics);
                break;
            case 'channels':
                await handleChannels(interaction, guildAnalytics);
                break;
            case 'moderation':
                await handleModeration(interaction, guildAnalytics);
                break;
            case 'daily':
                await handleDaily(interaction, guildAnalytics);
                break;
        }
    },
};

async function handleOverview(interaction, analytics) {
    const guild = interaction.guild;
    const memberCount = guild.memberCount;
    const channelCount = guild.channels.cache.size;
    const roleCount = guild.roles.cache.size;

    // Calculate growth rate (joins - leaves)
    const growthRate = analytics.member_joins - analytics.member_leaves;
    const growthPercentage = analytics.member_joins > 0 ? 
        ((growthRate / analytics.member_joins) * 100).toFixed(1) : 0;

    // Get most active user
    const users = Object.values(analytics.users);
    const mostActiveUser = users.reduce((prev, current) => 
        (prev.message_count > current.message_count) ? prev : current, { message_count: 0 });

    const embed = new EmbedBuilder()
        .setColor('#0099FF')
        .setTitle('📊 Server Analytics Overview')
        .setDescription(`Analytics for **${guild.name}**`)
        .addFields(
            { name: '👥 Members', value: `${memberCount}`, inline: true },
            { name: '📝 Total Messages', value: `${analytics.total_messages.toLocaleString()}`, inline: true },
            { name: '⚡ Total Commands', value: `${analytics.total_commands.toLocaleString()}`, inline: true },
            { name: '🛡️ Total Moderations', value: `${analytics.total_moderations.toLocaleString()}`, inline: true },
            { name: '📈 Member Growth', value: `+${analytics.member_joins} / -${analytics.member_leaves} (${growthPercentage}%)`, inline: true },
            { name: '📊 Channels', value: `${channelCount}`, inline: true },
            { name: '🎭 Roles', value: `${roleCount}`, inline: true },
            { name: '✏️ Message Edits', value: `${analytics.message_edits.toLocaleString()}`, inline: true },
            { name: '🗑️ Message Deletes', value: `${analytics.message_deletes.toLocaleString()}`, inline: true },
            { name: '🔄 Role Changes', value: `${analytics.role_changes.toLocaleString()}`, inline: true },
            { name: '🏆 Most Active User', value: mostActiveUser.username ? `${mostActiveUser.username} (${mostActiveUser.message_count} messages)` : 'No data', inline: true },
            { name: '📅 Server Created', value: `<t:${Math.floor(guild.createdTimestamp / 1000)}:F>`, inline: true }
        )
        .setFooter({ text: '4 Dudes Esports Analytics System' })
        .setTimestamp();

    await interaction.reply({ embeds: [embed] });
}

async function handleUsers(interaction, analytics) {
    const limit = interaction.options.getInteger('limit') || 10;
    const users = Object.values(analytics.users)
        .filter(user => !user.left) // Exclude users who left
        .sort((a, b) => b.message_count - a.message_count)
        .slice(0, limit);

    if (users.length === 0) {
        return interaction.reply({
            content: '❌ No user activity data available.',
            flags: [MessageFlags.Ephemeral]
        });
    }

    const embed = new EmbedBuilder()
        .setColor('#0099FF')
        .setTitle('👥 Top Active Users')
        .setDescription(`Most active users in **${interaction.guild.name}**`);

    for (let i = 0; i < users.length; i++) {
        const user = users[i];
        const userMention = `<@${Object.keys(analytics.users).find(key => analytics.users[key] === user)}>`;
        
        embed.addFields({
            name: `#${i + 1} ${user.username}`,
            value: `**Messages:** ${user.message_count.toLocaleString()}\n**Commands:** ${user.command_count.toLocaleString()}\n**User:** ${userMention}\n**Joined:** <t:${Math.floor(new Date(user.joined_at).getTime() / 1000)}:R>`,
            inline: true
        });
    }

    embed.setFooter({ text: `Showing top ${users.length} users • 4 Dudes Esports Analytics` });
    await interaction.reply({ embeds: [embed] });
}

async function handleChannels(interaction, analytics) {
    const limit = interaction.options.getInteger('limit') || 10;
    const channels = Object.values(analytics.channels)
        .sort((a, b) => b.message_count - a.message_count)
        .slice(0, limit);

    if (channels.length === 0) {
        return interaction.reply({
            content: '❌ No channel activity data available.',
            flags: [MessageFlags.Ephemeral]
        });
    }

    const embed = new EmbedBuilder()
        .setColor('#0099FF')
        .setTitle('📝 Most Active Channels')
        .setDescription(`Most active channels in **${interaction.guild.name}**`);

    for (let i = 0; i < channels.length; i++) {
        const channel = channels[i];
        const channelMention = `<#${Object.keys(analytics.channels).find(key => analytics.channels[key] === channel)}>`;
        
        embed.addFields({
            name: `#${i + 1} ${channel.name}`,
            value: `**Messages:** ${channel.message_count.toLocaleString()}\n**Channel:** ${channelMention}`,
            inline: true
        });
    }

    embed.setFooter({ text: `Showing top ${channels.length} channels • 4 Dudes Esports Analytics` });
    await interaction.reply({ embeds: [embed] });
}

async function handleModeration(interaction, analytics) {
    const limit = interaction.options.getInteger('limit') || 10;
    const logs = analytics.moderation_logs
        .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
        .slice(0, limit);

    if (logs.length === 0) {
        return interaction.reply({
            content: '❌ No moderation logs available.',
            flags: [MessageFlags.Ephemeral]
        });
    }

    const embed = new EmbedBuilder()
        .setColor('#FF6B6B')
        .setTitle('🛡️ Recent Moderation Logs')
        .setDescription(`Recent moderation actions in **${interaction.guild.name}**`);

    for (const log of logs) {
        const moderator = `<@${log.moderator_id}>`;
        const target = `<@${log.target_id}>`;
        const timestamp = `<t:${Math.floor(new Date(log.timestamp).getTime() / 1000)}:R>`;
        
        embed.addFields({
            name: `${getActionEmoji(log.action)} ${log.action.toUpperCase()}`,
            value: `**Moderator:** ${moderator}\n**Target:** ${target}\n**Reason:** ${log.reason}\n**Time:** ${timestamp}`,
            inline: false
        });
    }

    embed.setFooter({ text: `Showing ${logs.length} recent logs • 4 Dudes Esports Analytics` });
    await interaction.reply({ embeds: [embed] });
}

async function handleDaily(interaction, analytics) {
    const days = interaction.options.getInteger('days') || 7;
    const dailyStats = Object.entries(analytics.daily_stats)
        .sort((a, b) => new Date(b[0]) - new Date(a[0]))
        .slice(0, days);

    if (dailyStats.length === 0) {
        return interaction.reply({
            content: '❌ No daily statistics available.',
            flags: [MessageFlags.Ephemeral]
        });
    }

    const embed = new EmbedBuilder()
        .setColor('#0099FF')
        .setTitle('📅 Daily Activity Statistics')
        .setDescription(`Last ${dailyStats.length} days in **${interaction.guild.name}**`);

    for (const [date, stats] of dailyStats) {
        const formattedDate = new Date(date).toLocaleDateString('en-US', { 
            month: 'short', 
            day: 'numeric' 
        });
        
        embed.addFields({
            name: `${formattedDate}`,
            value: `**Messages:** ${stats.messages.toLocaleString()}\n**Commands:** ${stats.commands.toLocaleString()}\n**Moderations:** ${stats.moderations.toLocaleString()}\n**Joins:** ${stats.joins}\n**Leaves:** ${stats.leaves}`,
            inline: true
        });
    }

    embed.setFooter({ text: `Showing ${dailyStats.length} days • 4 Dudes Esports Analytics` });
    await interaction.reply({ embeds: [embed] });
}

function getActionEmoji(action) {
    const emojis = {
        'ban': '🔨',
        'kick': '👢',
        'timeout': '⏰',
        'warn': '⚠️',
        'unban': '🔓',
        'clear': '🧹',
        'automod': '🤖'
    };
    return emojis[action] || '🛡️';
} 