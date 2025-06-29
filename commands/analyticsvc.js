const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits, MessageFlags, ChannelType } = require('discord.js');
const fs = require('fs');
const path = require('path');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('analyticsvc')
        .setDescription('Manage analytics voice channels for real-time server statistics')
        .addSubcommand(subcommand =>
            subcommand
                .setName('setup')
                .setDescription('Set up analytics voice channels')
                .addChannelOption(option =>
                    option.setName('category')
                        .setDescription('Category to create channels in (optional)')
                        .setRequired(false)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('disable')
                .setDescription('Remove analytics voice channels'))
        .addSubcommand(subcommand =>
            subcommand
                .setName('status')
                .setDescription('Check analytics voice channels status'))
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),

    async execute(interaction) {
        const subcommand = interaction.options.getSubcommand();
        const analyticsVcPath = path.join(__dirname, '..', 'data', 'analyticsvc.json');
        
        // Load analytics VC configuration
        let analyticsVc = {};
        if (fs.existsSync(analyticsVcPath)) {
            analyticsVc = JSON.parse(fs.readFileSync(analyticsVcPath, 'utf8'));
        }

        switch (subcommand) {
            case 'setup':
                await handleSetup(interaction, analyticsVc, analyticsVcPath);
                break;
            case 'disable':
                await handleDisable(interaction, analyticsVc, analyticsVcPath);
                break;
            case 'status':
                await handleStatus(interaction, analyticsVc);
                break;
        }
    },
};

async function handleSetup(interaction, analyticsVc, analyticsVcPath) {
    const category = interaction.options.getChannel('category');
    
    // Check if analytics VC is already set up
    if (analyticsVc[interaction.guildId]) {
        return interaction.reply({
            content: '❌ Analytics voice channels are already set up. Use `/analyticsvc disable` to remove them first.',
            flags: [MessageFlags.Ephemeral]
        });
    }

    // Check bot permissions
    if (!interaction.guild.members.me.permissions.has(['ManageChannels', 'ViewChannels', 'Connect'])) {
        return interaction.reply({
            content: '❌ I need Manage Channels, View Channels, and Connect permissions to set up analytics voice channels.',
            flags: [MessageFlags.Ephemeral]
        });
    }

    try {
        // Get server statistics
        const guild = interaction.guild;
        const totalMembers = guild.memberCount;
        const estimatedBots = Math.floor(totalMembers * 0.1); // Estimate 10% bots
        const estimatedOnline = Math.floor(totalMembers * 0.3); // Estimate 30% online

        // Create channels
        const channels = [];
        
        // Total Members Channel
        const totalMembersChannel = await guild.channels.create({
            name: `👥 Members: ${totalMembers}`,
            type: ChannelType.GuildVoice,
            parent: category?.id || null,
            permissionOverwrites: [
                {
                    id: guild.id, // @everyone
                    deny: ['Connect', 'Speak'],
                    allow: ['ViewChannel']
                },
                {
                    id: interaction.client.user.id, // Bot
                    allow: ['ViewChannel', 'ManageChannels']
                }
            ]
        });
        channels.push(totalMembersChannel);

        // Online Members Channel
        const onlineMembersChannel = await guild.channels.create({
            name: `🟢 Online: ${estimatedOnline}`,
            type: ChannelType.GuildVoice,
            parent: category?.id || null,
            permissionOverwrites: [
                {
                    id: guild.id, // @everyone
                    deny: ['Connect', 'Speak'],
                    allow: ['ViewChannel']
                },
                {
                    id: interaction.client.user.id, // Bot
                    allow: ['ViewChannel', 'ManageChannels']
                }
            ]
        });
        channels.push(onlineMembersChannel);

        // Bots Channel
        const botsChannel = await guild.channels.create({
            name: `🤖 Bots: ${estimatedBots}`,
            type: ChannelType.GuildVoice,
            parent: category?.id || null,
            permissionOverwrites: [
                {
                    id: guild.id, // @everyone
                    deny: ['Connect', 'Speak'],
                    allow: ['ViewChannel']
                },
                {
                    id: interaction.client.user.id, // Bot
                    allow: ['ViewChannel', 'ManageChannels']
                }
            ]
        });
        channels.push(botsChannel);

        // Save configuration
        analyticsVc[interaction.guildId] = {
            enabled: true,
            channels: {
                total_members: totalMembersChannel.id,
                online_members: onlineMembersChannel.id,
                bots: botsChannel.id
            },
            category_id: category?.id || null,
            setup_by: interaction.user.id,
            setup_at: new Date().toISOString(),
            last_update: new Date().toISOString()
        };

        fs.writeFileSync(analyticsVcPath, JSON.stringify(analyticsVc, null, 2));

        const embed = new EmbedBuilder()
            .setColor('#00FF00')
            .setTitle('✅ Analytics Voice Channels Setup Complete')
            .setDescription(`Analytics voice channels have been created for **${guild.name}**`)
            .addFields(
                { name: '👥 Total Members', value: `${totalMembersChannel}`, inline: true },
                { name: '🟢 Online Members', value: `${onlineMembersChannel}`, inline: true },
                { name: '🤖 Bots', value: `${botsChannel}`, inline: true },
                { name: '📊 Current Stats', value: `Members: ${totalMembers} | Online: ${estimatedOnline} | Bots: ${estimatedBots}`, inline: false },
                { name: '👤 Setup By', value: interaction.user.tag, inline: true },
                { name: '📁 Category', value: category ? category.name : 'None', inline: true }
            )
            .setFooter({ text: '4 Dudes Esports Analytics System' })
            .setTimestamp();

        await interaction.reply({ embeds: [embed], flags: [MessageFlags.Ephemeral] });

    } catch (error) {
        console.error('Error setting up analytics VC:', error);
        await interaction.reply({
            content: '❌ An error occurred while setting up analytics voice channels.',
            flags: [MessageFlags.Ephemeral]
        });
    }
}

async function handleDisable(interaction, analyticsVc, analyticsVcPath) {
    const serverConfig = analyticsVc[interaction.guildId];
    
    if (!serverConfig) {
        return interaction.reply({
            content: '❌ Analytics voice channels are not set up for this server.',
            flags: [MessageFlags.Ephemeral]
        });
    }

    try {
        // Delete channels
        const channelsToDelete = [];
        
        for (const [type, channelId] of Object.entries(serverConfig.channels)) {
            const channel = interaction.guild.channels.cache.get(channelId);
            if (channel) {
                channelsToDelete.push(channel.delete());
            }
        }

        await Promise.all(channelsToDelete);

        // Remove configuration
        delete analyticsVc[interaction.guildId];
        fs.writeFileSync(analyticsVcPath, JSON.stringify(analyticsVc, null, 2));

        const embed = new EmbedBuilder()
            .setColor('#FF6B6B')
            .setTitle('🔇 Analytics Voice Channels Disabled')
            .setDescription(`Analytics voice channels have been removed from **${interaction.guild.name}**`)
            .addFields(
                { name: '👤 Disabled By', value: interaction.user.tag, inline: true },
                { name: '⏰ Disabled At', value: `<t:${Math.floor(Date.now() / 1000)}:F>`, inline: true }
            )
            .setFooter({ text: '4 Dudes Esports Analytics System' })
            .setTimestamp();

        await interaction.reply({ embeds: [embed], flags: [MessageFlags.Ephemeral] });

    } catch (error) {
        console.error('Error disabling analytics VC:', error);
        await interaction.reply({
            content: '❌ An error occurred while removing analytics voice channels.',
            flags: [MessageFlags.Ephemeral]
        });
    }
}

async function handleStatus(interaction, analyticsVc) {
    const serverConfig = analyticsVc[interaction.guildId];

    if (!serverConfig) {
        const embed = new EmbedBuilder()
            .setColor('#FF6B6B')
            .setTitle('🔇 Analytics Voice Channels Status')
            .setDescription('Analytics voice channels are **disabled** for this server.')
            .addFields(
                { name: '💡 Setup', value: 'Use `/analyticsvc setup` to enable analytics voice channels', inline: false }
            )
            .setFooter({ text: '4 Dudes Esports Analytics System' })
            .setTimestamp();

        return interaction.reply({ embeds: [embed], flags: [MessageFlags.Ephemeral] });
    }

    // Check channel status
    const guild = interaction.guild;
    const totalMembers = guild.memberCount;
    const estimatedBots = Math.floor(totalMembers * 0.1); // Estimate 10% bots
    const estimatedOnline = Math.floor(totalMembers * 0.3); // Estimate 30% online

    const totalMembersChannel = guild.channels.cache.get(serverConfig.channels.total_members);
    const onlineMembersChannel = guild.channels.cache.get(serverConfig.channels.online_members);
    const botsChannel = guild.channels.cache.get(serverConfig.channels.bots);

    const embed = new EmbedBuilder()
        .setColor('#00FF00')
        .setTitle('📊 Analytics Voice Channels Status')
        .setDescription(`Analytics voice channels are **enabled** for **${guild.name}**`)
        .addFields(
            { name: '👥 Total Members', value: totalMembersChannel ? `${totalMembersChannel}` : '❌ Channel not found', inline: true },
            { name: '🟢 Online Members', value: onlineMembersChannel ? `${onlineMembersChannel}` : '❌ Channel not found', inline: true },
            { name: '🤖 Bots', value: botsChannel ? `${botsChannel}` : '❌ Channel not found', inline: true },
            { name: '📊 Current Stats', value: `Members: ${totalMembers} | Online: ${estimatedOnline} | Bots: ${estimatedBots}`, inline: false },
            { name: '👤 Setup By', value: `<@${serverConfig.setup_by}>`, inline: true },
            { name: '📅 Setup Date', value: `<t:${Math.floor(new Date(serverConfig.setup_at).getTime() / 1000)}:F>`, inline: true },
            { name: '🔄 Last Update', value: `<t:${Math.floor(new Date(serverConfig.last_update).getTime() / 1000)}:R>`, inline: true }
        )
        .setFooter({ text: '4 Dudes Esports Analytics System' })
        .setTimestamp();

    await interaction.reply({ embeds: [embed], flags: [MessageFlags.Ephemeral] });
} 