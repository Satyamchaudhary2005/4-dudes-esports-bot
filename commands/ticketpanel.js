const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits, ActionRowBuilder, ButtonBuilder, ButtonStyle, MessageFlags } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('ticketpanel')
        .setDescription('Create a ticket creation panel (Moderators only)')
        .addStringOption(option =>
            option.setName('title')
                .setDescription('Title for the ticket panel')
                .setRequired(false))
        .addStringOption(option =>
            option.setName('description')
                .setDescription('Description for the ticket panel')
                .setRequired(false))
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels),

    async execute(interaction) {
        const title = interaction.options.getString('title') || '🎫 Support Ticket System';
        const description = interaction.options.getString('description') || 
            'Welcome to the 4 Dudes Esports Support System!\n\n' +
            'Click the button below to create a support ticket. Our team will assist you as soon as possible.\n\n' +
            '**Available Categories:**\n' +
            '🛠️ **Technical Support** - Bot issues, server problems\n' +
            '🎮 **Game Support** - Game-related questions\n' +
            '📋 **General Support** - General questions\n' +
            '🚨 **Report Issue** - Report rule violations\n' +
            '💡 **Suggestion** - Server improvements\n\n' +
            '**Response Time:** Usually within 24 hours';

        const panelEmbed = new EmbedBuilder()
            .setColor('#0099FF')
            .setTitle(title)
            .setDescription(description)
            .addFields(
                { name: '📋 Guidelines', value: '• Be patient and respectful\n• Provide clear information\n• One ticket per issue', inline: false },
                { name: '⏰ Response Time', value: 'Usually within 24 hours', inline: true },
                { name: '👥 Support Team', value: 'Moderators & Admins', inline: true }
            )
            .setFooter({ text: '4 Dudes Esports Support System' })
            .setTimestamp();

        const actionRow = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('create_ticket')
                    .setLabel('🎫 Create Ticket')
                    .setStyle(ButtonStyle.Primary)
                    .setEmoji('🎫')
            );

        await interaction.reply({ 
            content: '✅ Ticket panel created successfully!',
            flags: [MessageFlags.Ephemeral]
        });

        await interaction.channel.send({ 
            embeds: [panelEmbed],
            components: [actionRow] 
        });
    },
}; 