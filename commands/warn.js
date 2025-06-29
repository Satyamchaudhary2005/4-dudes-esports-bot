const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits, MessageFlags } = require('discord.js');
const { logModerationAction } = require('../utils/analytics.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('warn')
        .setDescription('Warn a user for breaking server rules')
        .addUserOption(option =>
            option.setName('user')
                .setDescription('The user to warn')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('reason')
                .setDescription('Reason for the warning')
                .setRequired(true))
        .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers),

    async execute(interaction) {
        const targetUser = interaction.options.getUser('user');
        const targetMember = interaction.options.getMember('user');
        const reason = interaction.options.getString('reason');

        // Check if the user is trying to warn themselves
        if (targetUser.id === interaction.user.id) {
            return interaction.reply({
                content: '❌ You cannot warn yourself!',
                flags: [MessageFlags.Ephemeral]
            });
        }

        // Check if the user is trying to warn the bot
        if (targetUser.id === interaction.client.user.id) {
            return interaction.reply({
                content: '❌ You cannot warn me!',
                flags: [MessageFlags.Ephemeral]
            });
        }

        try {
            // Log moderation action
            logModerationAction(
                interaction.guildId,
                interaction.user.id,
                targetUser.id,
                'warn',
                reason
            );

            const embed = new EmbedBuilder()
                .setColor('#FFD700')
                .setTitle('⚠️ User Warned')
                .setDescription(`**${targetUser.tag}** has been warned.`)
                .addFields(
                    { name: '👤 User', value: `${targetUser.tag} (${targetUser.id})`, inline: true },
                    { name: '🛡️ Moderator', value: `${interaction.user.tag}`, inline: true },
                    { name: '📝 Reason', value: reason, inline: false }
                )
                .setTimestamp()
                .setFooter({ text: '4 Dudes Esports Moderation' });

            await interaction.reply({ embeds: [embed], flags: [MessageFlags.Ephemeral] });

            // Try to DM the user about the warning
            try {
                const dmEmbed = new EmbedBuilder()
                    .setColor('#FFD700')
                    .setTitle('⚠️ Warning Received')
                    .setDescription(`You have been warned in **${interaction.guild.name}**`)
                    .addFields(
                        { name: '🛡️ Moderator', value: `${interaction.user.tag}`, inline: true },
                        { name: '📝 Reason', value: reason, inline: false }
                    )
                    .setTimestamp()
                    .setFooter({ text: '4 Dudes Esports Moderation' });

                await targetUser.send({ embeds: [dmEmbed], flags: [MessageFlags.Ephemeral] });
            } catch (dmError) {
                // If DM fails, it's not critical - just log it
                console.log(`Could not DM warning to ${targetUser.tag}: ${dmError.message}`);
            }

        } catch (error) {
            console.error('Error warning user:', error);
            await interaction.reply({
                content: '❌ An error occurred while trying to warn the user.',
                flags: [MessageFlags.Ephemeral]
            });
        }
    },
}; 