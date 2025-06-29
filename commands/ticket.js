const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits, ChannelType, ActionRowBuilder, ButtonBuilder, ButtonStyle, ModalBuilder, TextInputBuilder, TextInputStyle, MessageFlags } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('ticket')
        .setDescription('Create a support ticket')
        .addStringOption(option =>
            option.setName('category')
                .setDescription('Select the category for your ticket')
                .setRequired(true)
                .addChoices(
                    { name: '🛠️ Technical Support', value: 'technical' },
                    { name: '🎮 Game Support', value: 'game' },
                    { name: '📋 General Support', value: 'general' },
                    { name: '🚨 Report Issue', value: 'report' },
                    { name: '💡 Suggestion', value: 'suggestion' }
                ))
        .addStringOption(option =>
            option.setName('description')
                .setDescription('Brief description of your issue')
                .setRequired(true)
                .setMaxLength(1000)),

    async execute(interaction) {
        const category = interaction.options.getString('category');
        const description = interaction.options.getString('description');
        const user = interaction.user;

        // Check if user already has an open ticket
        const existingTicket = interaction.guild.channels.cache.find(
            channel => channel.name === `ticket-${user.username.toLowerCase().replace(/[^a-z0-9]/g, '')}`
        );

        if (existingTicket) {
            return interaction.reply({
                content: `❌ You already have an open ticket: ${existingTicket}`,
                flags: [MessageFlags.Ephemeral]
            });
        }

        try {
            // Create ticket channel
            const ticketChannel = await interaction.guild.channels.create({
                name: `ticket-${user.username.toLowerCase().replace(/[^a-z0-9]/g, '')}`,
                type: ChannelType.GuildText,
                parent: interaction.channel.parent, // Same category as command channel
                permissionOverwrites: [
                    {
                        id: interaction.guild.id, // @everyone role
                        deny: [PermissionFlagsBits.ViewChannel]
                    },
                    {
                        id: user.id, // Ticket creator
                        allow: [
                            PermissionFlagsBits.ViewChannel,
                            PermissionFlagsBits.SendMessages,
                            PermissionFlagsBits.ReadMessageHistory
                        ]
                    },
                    {
                        id: interaction.client.user.id, // Bot
                        allow: [
                            PermissionFlagsBits.ViewChannel,
                            PermissionFlagsBits.SendMessages,
                            PermissionFlagsBits.ManageChannels,
                            PermissionFlagsBits.ReadMessageHistory
                        ]
                    }
                ]
            });

            // Add moderator role permissions if it exists
            const modRole = interaction.guild.roles.cache.find(role => 
                role.name.toLowerCase().includes('mod') || 
                role.name.toLowerCase().includes('admin') ||
                role.permissions.has(PermissionFlagsBits.ModerateMembers)
            );

            if (modRole) {
                await ticketChannel.permissionOverwrites.create(modRole, {
                    ViewChannel: true,
                    SendMessages: true,
                    ReadMessageHistory: true,
                    ManageMessages: true
                });
            }

            // Create ticket embed
            const categoryEmojis = {
                'technical': '🛠️',
                'game': '🎮',
                'general': '📋',
                'report': '🚨',
                'suggestion': '💡'
            };

            const categoryNames = {
                'technical': 'Technical Support',
                'game': 'Game Support',
                'general': 'General Support',
                'report': 'Report Issue',
                'suggestion': 'Suggestion'
            };

            const ticketEmbed = new EmbedBuilder()
                .setColor('#0099FF')
                .setTitle(`${categoryEmojis[category]} Support Ticket`)
                .setDescription(`Welcome to your support ticket, ${user}!`)
                .addFields(
                    { name: '👤 Created By', value: `${user.tag}`, inline: true },
                    { name: '📂 Category', value: categoryNames[category], inline: true },
                    { name: '📅 Created', value: `<t:${Math.floor(Date.now() / 1000)}:F>`, inline: true },
                    { name: '📝 Description', value: description, inline: false }
                )
                .setFooter({ text: '4 Dudes Esports Support System' })
                .setTimestamp();

            // Create action buttons
            const actionRow = new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder()
                        .setCustomId('close_ticket')
                        .setLabel('🔒 Close Ticket')
                        .setStyle(ButtonStyle.Danger),
                    new ButtonBuilder()
                        .setCustomId('claim_ticket')
                        .setLabel('✋ Claim Ticket')
                        .setStyle(ButtonStyle.Primary),
                    new ButtonBuilder()
                        .setCustomId('transcript_ticket')
                        .setLabel('📄 Save Transcript')
                        .setStyle(ButtonStyle.Secondary)
                );

            await ticketChannel.send({ embeds: [ticketEmbed], components: [actionRow] });

            // Send confirmation to user
            const confirmEmbed = new EmbedBuilder()
                .setColor('#00FF00')
                .setTitle('✅ Ticket Created Successfully!')
                .setDescription(`Your ticket has been created: ${ticketChannel}`)
                .addFields(
                    { name: '📂 Category', value: categoryNames[category], inline: true },
                    { name: '⏰ Response Time', value: 'Usually within 24 hours', inline: true }
                )
                .setFooter({ text: 'Please be patient while our team assists you' });

            await interaction.reply({ embeds: [confirmEmbed], flags: [MessageFlags.Ephemeral] });

        } catch (error) {
            console.error('Error creating ticket:', error);
            await interaction.reply({
                content: '❌ An error occurred while creating your ticket. Please try again.',
                flags: [MessageFlags.Ephemeral]
            });
        }
    },
}; 