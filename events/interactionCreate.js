const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, PermissionFlagsBits, ChannelType, ModalBuilder, TextInputBuilder, TextInputStyle, MessageFlags, StringSelectMenuBuilder } = require('discord.js');

// Temporary storage for ticket categories (in production, use a proper database)
const ticketCategories = new Map();

module.exports = {
    name: 'interactionCreate',
    async execute(interaction) {
        // Handle button interactions for tickets
        if (interaction.isButton()) {
            const { customId } = interaction;

            switch (customId) {
                case 'create_ticket':
                    await handleCreateTicketButton(interaction);
                    break;
                case 'close_ticket':
                    await handleCloseTicket(interaction);
                    break;
                case 'claim_ticket':
                    await handleClaimTicket(interaction);
                    break;
                case 'transcript_ticket':
                    await handleTranscriptTicket(interaction);
                    break;
                default:
                    break;
            }
        }

        // Handle select menu interactions
        if (interaction.isStringSelectMenu()) {
            if (interaction.customId === 'ticket_category_select') {
                await handleTicketCategorySelect(interaction);
            }
        }

        // Handle modal submissions
        if (interaction.isModalSubmit()) {
            if (interaction.customId === 'ticket_modal') {
                await handleTicketModal(interaction);
            }
        }
    },
};

async function handleCreateTicketButton(interaction) {
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

    // Create select menu for ticket category
    const categorySelect = new StringSelectMenuBuilder()
        .setCustomId('ticket_category_select')
        .setPlaceholder('Select a ticket category')
        .addOptions([
            {
                label: 'Technical Support',
                description: 'Bot issues, server problems, technical difficulties',
                value: 'technical',
                emoji: '🛠️'
            },
            {
                label: 'Game Support',
                description: 'Game-related questions and assistance',
                value: 'game',
                emoji: '🎮'
            },
            {
                label: 'General Support',
                description: 'General questions and information',
                value: 'general',
                emoji: '📋'
            },
            {
                label: 'Report Issue',
                description: 'Report rule violations or problems',
                value: 'report',
                emoji: '🚨'
            },
            {
                label: 'Suggestion',
                description: 'Suggestions for server improvements',
                value: 'suggestion',
                emoji: '💡'
            }
        ]);

    const actionRow = new ActionRowBuilder().addComponents(categorySelect);

    await interaction.reply({
        content: '🎫 **Select a ticket category:**\nChoose the category that best describes your issue:',
        components: [actionRow],
        flags: [MessageFlags.Ephemeral]
    });
}

async function handleTicketCategorySelect(interaction) {
    const selectedCategory = interaction.values[0];
    const user = interaction.user;

    // Store the selected category temporarily
    ticketCategories.set(user.id, selectedCategory);

    // Create modal for ticket description
    const modal = new ModalBuilder()
        .setCustomId('ticket_modal')
        .setTitle('🎫 Create Support Ticket');

    const descriptionInput = new TextInputBuilder()
        .setCustomId('description')
        .setLabel('Describe your issue')
        .setStyle(TextInputStyle.Paragraph)
        .setPlaceholder('Please provide a detailed description of your issue...')
        .setRequired(true)
        .setMaxLength(1000);

    const actionRow = new ActionRowBuilder().addComponents(descriptionInput);
    modal.addComponents(actionRow);

    await interaction.showModal(modal);
}

async function handleTicketModal(interaction) {
    // Get the category from the temporary storage
    const category = ticketCategories.get(interaction.user.id) || 'general'; // Fallback to general
    const description = interaction.fields.getTextInputValue('description');
    const user = interaction.user;

    // Clean up the temporary storage
    ticketCategories.delete(user.id);

    // Validate category
    const validCategories = ['technical', 'game', 'general', 'report', 'suggestion'];
    if (!validCategories.includes(category)) {
        return interaction.reply({
            content: '❌ Invalid category. Please try creating a ticket again.',
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
}

async function handleCloseTicket(interaction) {
    const channel = interaction.channel;
    const member = interaction.member;

    // Check if user has permission to close tickets
    const hasPermission = (member && member.permissions.has(PermissionFlagsBits.ManageChannels)) ||
                         channel.topic?.includes(interaction.user.id) ||
                         channel.name.includes(interaction.user.username.toLowerCase().replace(/[^a-z0-9]/g, ''));

    if (!hasPermission) {
        return interaction.reply({
            content: '❌ You do not have permission to close this ticket.',
            flags: [MessageFlags.Ephemeral]
        });
    }

    const confirmEmbed = new EmbedBuilder()
        .setColor('#FF6B6B')
        .setTitle('🔒 Ticket Closing')
        .setDescription('This ticket will be closed in 10 seconds.')
        .addFields(
            { name: '👤 Closed By', value: interaction.user.tag, inline: true },
            { name: '⏰ Closing Time', value: '<t:' + Math.floor((Date.now() + 10000) / 1000) + ':R>', inline: true }
        )
        .setFooter({ text: '4 Dudes Esports Support System' });

    await interaction.reply({ embeds: [confirmEmbed] });

    // Disable all buttons
    const disabledRow = new ActionRowBuilder()
        .addComponents(
            new ButtonBuilder()
                .setCustomId('close_ticket')
                .setLabel('🔒 Closing...')
                .setStyle(ButtonStyle.Danger)
                .setDisabled(true),
            new ButtonBuilder()
                .setCustomId('claim_ticket')
                .setLabel('✋ Claim Ticket')
                .setStyle(ButtonStyle.Primary)
                .setDisabled(true),
            new ButtonBuilder()
                .setCustomId('transcript_ticket')
                .setLabel('📄 Save Transcript')
                .setStyle(ButtonStyle.Secondary)
                .setDisabled(true)
        );

    // Update the original message with disabled buttons
    const messages = await channel.messages.fetch({ limit: 10 });
    const ticketMessage = messages.find(msg => 
        msg.embeds.length > 0 && 
        msg.embeds[0].title?.includes('Support Ticket') &&
        msg.components.length > 0
    );

    if (ticketMessage) {
        await ticketMessage.edit({ components: [disabledRow] });
    }

    // Close the channel after 10 seconds
    setTimeout(async () => {
        try {
            await channel.delete();
        } catch (error) {
            console.error('Error deleting ticket channel:', error);
        }
    }, 10000);
}

async function handleClaimTicket(interaction) {
    const channel = interaction.channel;
    const member = interaction.member;

    // Check if user has moderator permissions
    if (!member || !member.permissions.has(PermissionFlagsBits.ModerateMembers)) {
        return interaction.reply({
            content: '❌ You need moderator permissions to claim tickets.',
            flags: [MessageFlags.Ephemeral]
        });
    }

    // Check if ticket is already claimed
    const messages = await channel.messages.fetch({ limit: 10 });
    const claimedMessage = messages.find(msg => 
        msg.embeds.length > 0 && 
        msg.embeds[0].title?.includes('Ticket Claimed')
    );

    if (claimedMessage) {
        return interaction.reply({
            content: '❌ This ticket has already been claimed.',
            flags: [MessageFlags.Ephemeral]
        });
    }

    const claimEmbed = new EmbedBuilder()
        .setColor('#FFD700')
        .setTitle('✋ Ticket Claimed')
        .setDescription(`This ticket is now being handled by ${interaction.user}`)
        .addFields(
            { name: '👤 Claimed By', value: interaction.user.tag, inline: true },
            { name: '📅 Claimed At', value: `<t:${Math.floor(Date.now() / 1000)}:F>`, inline: true }
        )
        .setFooter({ text: '4 Dudes Esports Support System' })
        .setTimestamp();

    await interaction.reply({ embeds: [claimEmbed] });

    // Update the original ticket message to show it's claimed
    const ticketMessage = messages.find(msg => 
        msg.embeds.length > 0 && 
        msg.embeds[0].title?.includes('Support Ticket') &&
        msg.components.length > 0
    );

    if (ticketMessage) {
        const originalEmbed = ticketMessage.embeds[0];
        const updatedEmbed = EmbedBuilder.from(originalEmbed)
            .setColor('#FFD700')
            .addFields({ name: '✋ Claimed By', value: interaction.user.tag, inline: true });

        await ticketMessage.edit({ embeds: [updatedEmbed] });
    }
}

async function handleTranscriptTicket(interaction) {
    const channel = interaction.channel;
    const member = interaction.member;

    // Check if user has permission
    const hasPermission = (member && member.permissions.has(PermissionFlagsBits.ManageChannels)) ||
                         channel.topic?.includes(interaction.user.id) ||
                         channel.name.includes(interaction.user.username.toLowerCase().replace(/[^a-z0-9]/g, ''));

    if (!hasPermission) {
        return interaction.reply({
            content: '❌ You do not have permission to save this transcript.',
            flags: [MessageFlags.Ephemeral]
        });
    }

    await interaction.deferReply({ flags: [MessageFlags.Ephemeral] });

    try {
        // Fetch all messages in the channel
        const messages = await channel.messages.fetch({ limit: 100 });
        const sortedMessages = messages.sort((a, b) => a.createdTimestamp - b.createdTimestamp);

        // Create transcript content
        let transcript = `# Ticket Transcript - ${channel.name}\n`;
        transcript += `**Created:** ${new Date().toLocaleString()}\n`;
        transcript += `**Channel:** ${channel.name}\n\n`;
        transcript += `---\n\n`;

        sortedMessages.forEach(msg => {
            const timestamp = new Date(msg.createdTimestamp).toLocaleString();
            transcript += `**[${timestamp}] ${msg.author.tag}:** ${msg.content}\n\n`;
        });

        // Create transcript file
        const buffer = Buffer.from(transcript, 'utf-8');
        const attachment = {
            attachment: buffer,
            name: `transcript-${channel.name}-${Date.now()}.txt`
        };

        const transcriptEmbed = new EmbedBuilder()
            .setColor('#00FF00')
            .setTitle('📄 Transcript Saved')
            .setDescription('The ticket transcript has been saved successfully.')
            .addFields(
                { name: '📁 File Name', value: attachment.name, inline: true },
                { name: '📊 Messages', value: sortedMessages.size.toString(), inline: true }
            )
            .setFooter({ text: '4 Dudes Esports Support System' });

        await interaction.editReply({ 
            embeds: [transcriptEmbed], 
            files: [attachment],
            flags: [MessageFlags.Ephemeral] 
        });

    } catch (error) {
        console.error('Error creating transcript:', error);
        await interaction.editReply({
            content: '❌ An error occurred while creating the transcript.',
            flags: [MessageFlags.Ephemeral]
        });
    }
} 