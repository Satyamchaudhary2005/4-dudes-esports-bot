const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits, MessageFlags } = require('discord.js');
const { logModerationAction } = require('../utils/analytics.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('ban')
        .setDescription('Ban a user from the server')
        .addUserOption(option =>
            option.setName('user')
                .setDescription('The user to ban')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('reason')
                .setDescription('Reason for banning the user')
                .setRequired(false))
        .addIntegerOption(option =>
            option.setName('delete_messages')
                .setDescription('Number of days of messages to delete (0-7)')
                .setMinValue(0)
                .setMaxValue(7)
                .setRequired(false))
        .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers),

    async execute(interaction) {
        const targetUser = interaction.options.getUser('user');
        const targetMember = interaction.options.getMember('user');
        const reason = interaction.options.getString('reason') || 'No reason provided';
        const deleteMessageDays = interaction.options.getInteger('delete_messages') || 0;

        // Check if the bot can ban the target user
        if (!targetMember.bannable) {
            return interaction.reply({
                content: '❌ I cannot ban this user. They may have higher permissions than me.',
                flags: [MessageFlags.Ephemeral]
            });
        }

        // Check if the user is trying to ban themselves
        if (targetUser.id === interaction.user.id) {
            return interaction.reply({
                content: '❌ You cannot ban yourself!',
                flags: [MessageFlags.Ephemeral]
            });
        }

        // Check if the user is trying to ban the bot
        if (targetUser.id === interaction.client.user.id) {
            return interaction.reply({
                content: '❌ You cannot ban me!',
                flags: [MessageFlags.Ephemeral]
            });
        }

        try {
            await targetMember.ban({ 
                reason: reason,
                deleteMessageDays: deleteMessageDays
            });

            // Log moderation action
            logModerationAction(
                interaction.guildId,
                interaction.user.id,
                targetUser.id,
                'ban',
                reason,
                { delete_message_days: deleteMessageDays }
            );

            const embed = new EmbedBuilder()
                .setColor('#FF0000')
                .setTitle('🔨 User Banned')
                .setDescription(`**${targetUser.tag}** has been banned from the server.`)
                .addFields(
                    { name: '👤 User', value: `${targetUser.tag} (${targetUser.id})`, inline: true },
                    { name: '🛡️ Moderator', value: `${interaction.user.tag}`, inline: true },
                    { name: '📝 Reason', value: reason, inline: false },
                    { name: '🗑️ Messages Deleted', value: `${deleteMessageDays} days`, inline: true }
                )
                .setTimestamp()
                .setFooter({ text: '4 Dudes Esports Moderation' });

            await interaction.reply({ embeds: [embed], flags: [MessageFlags.Ephemeral] });

        } catch (error) {
            console.error('Error banning user:', error);
            await interaction.reply({
                content: '❌ An error occurred while trying to ban the user.',
                flags: [MessageFlags.Ephemeral]
            });
        }
    },
}; 