const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits, MessageFlags } = require('discord.js');
const { logModerationAction } = require('../utils/analytics.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('clear')
        .setDescription('Clear a specified number of messages from the channel')
        .addIntegerOption(option =>
            option.setName('amount')
                .setDescription('Number of messages to delete (1-100)')
                .setMinValue(1)
                .setMaxValue(100)
                .setRequired(true))
        .addUserOption(option =>
            option.setName('user')
                .setDescription('Only delete messages from this user')
                .setRequired(false))
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages),

    async execute(interaction) {
        const amount = interaction.options.getInteger('amount');
        const targetUser = interaction.options.getUser('user');

        // Defer the reply since bulk delete might take time
        await interaction.deferReply({ flags: [MessageFlags.Ephemeral] });

        try {
            let messages;
            
            if (targetUser) {
                // Fetch messages from the specific user
                messages = await interaction.channel.messages.fetch({ limit: 100 });
                messages = messages.filter(msg => msg.author.id === targetUser.id).first(amount);
            } else {
                // Fetch recent messages
                messages = await interaction.channel.messages.fetch({ limit: amount });
            }

            // Filter out messages older than 14 days (Discord limitation)
            const messagesToDelete = messages.filter(msg => {
                const messageAge = Date.now() - msg.createdTimestamp;
                return messageAge < 14 * 24 * 60 * 60 * 1000; // 14 days in milliseconds
            });

            if (messagesToDelete.size === 0) {
                return interaction.editReply({
                    content: '❌ No messages found to delete (messages must be less than 14 days old).',
                    flags: [MessageFlags.Ephemeral]
                });
            }

            // Delete the messages
            await interaction.channel.bulkDelete(messagesToDelete, true);

            // Log moderation action
            logModerationAction(
                interaction.guildId,
                interaction.user.id,
                targetUser ? targetUser.id : 'all_users',
                'clear',
                `Cleared ${messagesToDelete.size} messages`,
                { 
                    amount_requested: amount,
                    amount_deleted: messagesToDelete.size,
                    channel_id: interaction.channel.id,
                    channel_name: interaction.channel.name,
                    target_user: targetUser ? targetUser.id : null
                }
            );

            const embed = new EmbedBuilder()
                .setColor('#00FF00')
                .setTitle('🧹 Messages Cleared')
                .setDescription(`Successfully deleted **${messagesToDelete.size}** messages.`)
                .addFields(
                    { name: '📊 Requested', value: `${amount} messages`, inline: true },
                    { name: '🗑️ Deleted', value: `${messagesToDelete.size} messages`, inline: true },
                    { name: '👤 Filter', value: targetUser ? `From ${targetUser.tag}` : 'All users', inline: true }
                )
                .setTimestamp()
                .setFooter({ text: '4 Dudes Esports Moderation' });

            await interaction.editReply({ embeds: [embed], flags: [MessageFlags.Ephemeral] });

        } catch (error) {
            console.error('Error clearing messages:', error);
            
            if (error.code === 50034) {
                await interaction.editReply({
                    content: '❌ Cannot delete messages older than 14 days.',
                    flags: [MessageFlags.Ephemeral]
                });
            } else {
                await interaction.editReply({
                    content: '❌ An error occurred while trying to clear messages.',
                    flags: [MessageFlags.Ephemeral]
                });
            }
        }
    },
}; 