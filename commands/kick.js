const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits, MessageFlags } = require('discord.js');
const { logModerationAction } = require('../utils/analytics.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('kick')
        .setDescription('Kick a user from the server')
        .addUserOption(option =>
            option.setName('user')
                .setDescription('The user to kick')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('reason')
                .setDescription('Reason for kicking the user')
                .setRequired(false))
        .setDefaultMemberPermissions(PermissionFlagsBits.KickMembers),

    async execute(interaction) {
        const targetUser = interaction.options.getUser('user');
        const targetMember = interaction.options.getMember('user');
        const reason = interaction.options.getString('reason') || 'No reason provided';

        // Check if the bot can kick the target user
        if (!targetMember.kickable) {
            return interaction.reply({
                content: '❌ I cannot kick this user. They may have higher permissions than me.',
                flags: [MessageFlags.Ephemeral]
            });
        }

        // Check if the user is trying to kick themselves
        if (targetUser.id === interaction.user.id) {
            return interaction.reply({
                content: '❌ You cannot kick yourself!',
                flags: [MessageFlags.Ephemeral]
            });
        }

        // Check if the user is trying to kick the bot
        if (targetUser.id === interaction.client.user.id) {
            return interaction.reply({
                content: '❌ You cannot kick me!',
                flags: [MessageFlags.Ephemeral]
            });
        }

        try {
            await targetMember.kick(reason);

            // Log moderation action
            logModerationAction(
                interaction.guildId,
                interaction.user.id,
                targetUser.id,
                'kick',
                reason
            );

            const embed = new EmbedBuilder()
                .setColor('#FF6B6B')
                .setTitle('👢 User Kicked')
                .setDescription(`**${targetUser.tag}** has been kicked from the server.`)
                .addFields(
                    { name: '👤 User', value: `${targetUser.tag} (${targetUser.id})`, inline: true },
                    { name: '🛡️ Moderator', value: `${interaction.user.tag}`, inline: true },
                    { name: '📝 Reason', value: reason, inline: false }
                )
                .setTimestamp()
                .setFooter({ text: '4 Dudes Esports Moderation' });

            await interaction.reply({ embeds: [embed], flags: [MessageFlags.Ephemeral] });

        } catch (error) {
            console.error('Error kicking user:', error);
            await interaction.reply({
                content: '❌ An error occurred while trying to kick the user.',
                flags: [MessageFlags.Ephemeral]
            });
        }
    },
}; 