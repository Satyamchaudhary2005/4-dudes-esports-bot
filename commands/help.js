const { SlashCommandBuilder, EmbedBuilder, MessageFlags } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('help')
        .setDescription('Show all available moderation and support commands'),

    async execute(interaction) {
        const embed = new EmbedBuilder()
            .setColor('#0099FF')
            .setTitle('🛡️ 4 Dudes Esports - Bot Commands')
            .setDescription('Here are all the available commands:')
            .addFields(
                {
                    name: '🎫 **Support System**',
                    value: 'Ticket creation and management commands',
                    inline: false
                },
                {
                    name: '🎫 `/ticket`',
                    value: 'Create a support ticket with category and description\n**Permissions:** None required',
                    inline: false
                },
                {
                    name: '📋 `/ticketpanel`',
                    value: 'Create a ticket creation panel (Moderators only)\n**Permissions:** Manage Channels',
                    inline: false
                },
                {
                    name: '🏆 **Tournament System**',
                    value: 'Tournament and scrim management',
                    inline: false
                },
                {
                    name: '🏆 `/tournament`',
                    value: 'Create and manage tournaments/scrims\n**Permissions:** Manage Guild',
                    inline: false
                },
                {
                    name: '🛡️ **Moderation Commands**',
                    value: 'Server moderation and management',
                    inline: false
                },
                {
                    name: '👢 `/kick`',
                    value: 'Kick a user from the server\n**Permissions:** Kick Members',
                    inline: false
                },
                {
                    name: '🔨 `/ban`',
                    value: 'Ban a user from the server\n**Permissions:** Ban Members',
                    inline: false
                },
                {
                    name: '🔓 `/unban`',
                    value: 'Unban a user from the server\n**Permissions:** Ban Members',
                    inline: false
                },
                {
                    name: '⏰ `/timeout`',
                    value: 'Timeout (mute) a user for a specified duration\n**Permissions:** Moderate Members',
                    inline: false
                },
                {
                    name: '⚠️ `/warn`',
                    value: 'Warn a user for breaking server rules\n**Permissions:** Moderate Members',
                    inline: false
                },
                {
                    name: '🧹 `/clear`',
                    value: 'Clear a specified number of messages from the channel\n**Permissions:** Manage Messages',
                    inline: false
                },
                {
                    name: '🛡️ `/automod`',
                    value: 'Configure auto-moderation settings\n**Permissions:** Manage Guild',
                    inline: false
                },
                {
                    name: '❓ `/help`',
                    value: 'Show this help message\n**Permissions:** None required',
                    inline: false
                }
            )
            .addFields(
                {
                    name: '📋 **Ticket System Features**',
                    value: '• **5 Categories:** Technical, Game, General, Report, Suggestion\n• **Button Interface:** Easy ticket creation with panels\n• **Auto-Permissions:** Moderators automatically get access\n• **Ticket Management:** Claim, close, and save transcripts\n• **One Ticket Limit:** Users can only have one open ticket',
                    inline: false
                },
                {
                    name: '🏆 **Tournament System Features**',
                    value: '• **Battle Royale Support:** PUBG, Fortnite, Apex, Warzone\n• **Team Registration:** With mention validation\n• **Multiple Formats:** Solo, Duo, Squad\n• **Auto-Confirmation:** Teams posted to designated channels\n• **Event Management:** Create, list, info, delete',
                    inline: false
                },
                {
                    name: '📋 **Usage Notes**',
                    value: '• All commands require appropriate permissions\n• Timeouts can be up to 28 days (40320 minutes)\n• Message clearing is limited to messages under 14 days old\n• Warnings will be sent to users via DM when possible\n• Tickets are automatically organized by category\n• Tournament registration requires exact mention count',
                    inline: false
                }
            )
            .setTimestamp()
            .setFooter({ text: '4 Dudes Esports Bot - Support & Moderation' });

        await interaction.reply({ embeds: [embed], flags: [MessageFlags.Ephemeral] });
    },
}; 