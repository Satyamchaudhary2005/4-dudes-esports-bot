const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits, MessageFlags } = require('discord.js');
const { logModerationAction } = require('../utils/analytics.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('unban')
        .setDescription('Unban a user from the server')
        .addStringOption(option =>
            option.setName('user_id')
                .setDescription('The ID of the user to unban')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('reason')
                .setDescription('Reason for unbanning the user')
                .setRequired(false))
        .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers),

    async execute(interaction) {
        const userId = interaction.options.getString('user_id');
        const reason = interaction.options.getString('reason') || 'No reason provided';

        // Validate user ID format
        if (!/^\d+$/.test(userId)) {
            return interaction.reply({
                content: '❌ Please provide a valid user ID (numbers only).',
                flags: [MessageFlags.Ephemeral]
            });
        }

        try {
            // Fetch the user to get their information
            const user = await interaction.client.users.fetch(userId);
            
            // Unban the user
            await interaction.guild.members.unban(userId, reason);

            // Log moderation action
            logModerationAction(
                interaction.guildId,
                interaction.user.id,
                userId,
                'unban',
                reason
            );

            const embed = new EmbedBuilder()
                .setColor('#00FF00')
                .setTitle('🔓 User Unbanned')
                .setDescription(`**${user.tag}** has been unbanned from the server.`)
                .addFields(
                    { name: '👤 User', value: `${user.tag} (${user.id})`, inline: true },
                    { name: '🛡️ Moderator', value: `${interaction.user.tag}`, inline: true },
                    { name: '📝 Reason', value: reason, inline: false }
                )
                .setTimestamp()
                .setFooter({ text: '4 Dudes Esports Moderation' });

            await interaction.reply({ embeds: [embed], flags: [MessageFlags.Ephemeral] });

        } catch (error) {
            console.error('Error unbanning user:', error);
            
            if (error.code === 10013) {
                await interaction.reply({
                    content: '❌ User not found or not banned.',
                    flags: [MessageFlags.Ephemeral]
                });
            } else {
                await interaction.reply({
                    content: '❌ An error occurred while trying to unban the user.',
                    flags: [MessageFlags.Ephemeral]
                });
            }
        }
    },
}; 