const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits, MessageFlags } = require('discord.js');
const { logModerationAction } = require('../utils/analytics.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('timeout')
        .setDescription('Timeout (mute) a user for a specified duration')
        .addUserOption(option =>
            option.setName('user')
                .setDescription('The user to timeout')
                .setRequired(true))
        .addIntegerOption(option =>
            option.setName('duration')
                .setDescription('Duration in minutes (max 40320 = 28 days)')
                .setMinValue(1)
                .setMaxValue(40320)
                .setRequired(true))
        .addStringOption(option =>
            option.setName('reason')
                .setDescription('Reason for the timeout')
                .setRequired(false))
        .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers),

    async execute(interaction) {
        const targetUser = interaction.options.getUser('user');
        const targetMember = interaction.options.getMember('user');
        const duration = interaction.options.getInteger('duration');
        const reason = interaction.options.getString('reason') || 'No reason provided';

        // Check if the bot can timeout the target user
        if (!targetMember.moderatable) {
            return interaction.reply({
                content: '❌ I cannot timeout this user. They may have higher permissions than me.',
                flags: [MessageFlags.Ephemeral]
            });
        }

        // Check if the user is trying to timeout themselves
        if (targetUser.id === interaction.user.id) {
            return interaction.reply({
                content: '❌ You cannot timeout yourself!',
                flags: [MessageFlags.Ephemeral]
            });
        }

        // Check if the user is trying to timeout the bot
        if (targetUser.id === interaction.client.user.id) {
            return interaction.reply({
                content: '❌ You cannot timeout me!',
                flags: [MessageFlags.Ephemeral]
            });
        }

        // Convert minutes to milliseconds
        const durationMs = duration * 60 * 1000;

        try {
            await targetMember.timeout(durationMs, reason);

            // Log moderation action
            logModerationAction(
                interaction.guildId,
                interaction.user.id,
                targetUser.id,
                'timeout',
                reason,
                { duration_minutes: duration }
            );

            const embed = new EmbedBuilder()
                .setColor('#FFA500')
                .setTitle('⏰ User Timed Out')
                .setDescription(`**${targetUser.tag}** has been timed out.`)
                .addFields(
                    { name: '👤 User', value: `${targetUser.tag} (${targetUser.id})`, inline: true },
                    { name: '🛡️ Moderator', value: `${interaction.user.tag}`, inline: true },
                    { name: '⏱️ Duration', value: `${duration} minutes`, inline: true },
                    { name: '📝 Reason', value: reason, inline: false }
                )
                .setTimestamp()
                .setFooter({ text: '4 Dudes Esports Moderation' });

            await interaction.reply({ embeds: [embed], flags: [MessageFlags.Ephemeral] });

        } catch (error) {
            console.error('Error timing out user:', error);
            await interaction.reply({
                content: '❌ An error occurred while trying to timeout the user.',
                flags: [MessageFlags.Ephemeral]
            });
        }
    },
}; 