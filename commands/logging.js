const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits, MessageFlags } = require('discord.js');
const fs = require('fs');
const path = require('path');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('logging')
        .setDescription('Manage logging channels for server activity')
        .addSubcommand(subcommand =>
            subcommand
                .setName('setup')
                .setDescription('Set up a logging channel')
                .addChannelOption(option =>
                    option.setName('channel')
                        .setDescription('Channel to send logs to')
                        .setRequired(true))
                .addStringOption(option =>
                    option.setName('types')
                        .setDescription('Types of logs to send (comma-separated)')
                        .setRequired(false)
                        .addChoices(
                            { name: 'All Logs', value: 'all' },
                            { name: 'Moderation Only', value: 'moderation' },
                            { name: 'Member Activity', value: 'members' },
                            { name: 'Message Activity', value: 'messages' }
                        )))
        .addSubcommand(subcommand =>
            subcommand
                .setName('disable')
                .setDescription('Disable logging for this server'))
        .addSubcommand(subcommand =>
            subcommand
                .setName('status')
                .setDescription('Check current logging status'))
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),

    async execute(interaction) {
        const subcommand = interaction.options.getSubcommand();
        const loggingPath = path.join(__dirname, '..', 'data', 'logging.json');
        
        // Load logging configuration
        let logging = {};
        if (fs.existsSync(loggingPath)) {
            logging = JSON.parse(fs.readFileSync(loggingPath, 'utf8'));
        }

        switch (subcommand) {
            case 'setup':
                await handleSetup(interaction, logging, loggingPath);
                break;
            case 'disable':
                await handleDisable(interaction, logging, loggingPath);
                break;
            case 'status':
                await handleStatus(interaction, logging);
                break;
        }
    },
};

async function handleSetup(interaction, logging, loggingPath) {
    const channel = interaction.options.getChannel('channel');
    const types = interaction.options.getString('types') || 'all';

    // Validate channel type
    if (channel.type !== 0) { // 0 = text channel
        return interaction.reply({
            content: '❌ Please select a text channel for logging.',
            flags: [MessageFlags.Ephemeral]
        });
    }

    // Check bot permissions in the channel
    if (!channel.permissionsFor(interaction.client.user).has(['SendMessages', 'EmbedLinks'])) {
        return interaction.reply({
            content: '❌ I need Send Messages and Embed Links permissions in the selected channel.',
            flags: [MessageFlags.Ephemeral]
        });
    }

    // Save logging configuration
    logging.servers[interaction.guildId] = {
        channel_id: channel.id,
        channel_name: channel.name,
        types: types,
        enabled: true,
        setup_by: interaction.user.id,
        setup_at: new Date().toISOString()
    };

    fs.writeFileSync(loggingPath, JSON.stringify(logging, null, 2));

    const embed = new EmbedBuilder()
        .setColor('#00FF00')
        .setTitle('✅ Logging Setup Complete')
        .setDescription(`Logging has been configured for **${interaction.guild.name}**`)
        .addFields(
            { name: '📝 Log Channel', value: `${channel}`, inline: true },
            { name: '📊 Log Types', value: types === 'all' ? 'All Activity' : types, inline: true },
            { name: '👤 Setup By', value: interaction.user.tag, inline: true }
        )
        .setFooter({ text: '4 Dudes Esports Logging System' })
        .setTimestamp();

    await interaction.reply({ embeds: [embed], flags: [MessageFlags.Ephemeral] });

    // Send test message to log channel
    const testEmbed = new EmbedBuilder()
        .setColor('#0099FF')
        .setTitle('🔧 Logging System Activated')
        .setDescription('This channel will now receive server activity logs.')
        .addFields(
            { name: '📝 Log Types', value: types === 'all' ? 'All Activity' : types, inline: true },
            { name: '👤 Setup By', value: interaction.user.tag, inline: true }
        )
        .setFooter({ text: '4 Dudes Esports Logging System' })
        .setTimestamp();

    await channel.send({ embeds: [testEmbed] });
}

async function handleDisable(interaction, logging, loggingPath) {
    if (!logging.servers[interaction.guildId]) {
        return interaction.reply({
            content: '❌ Logging is not currently enabled for this server.',
            flags: [MessageFlags.Ephemeral]
        });
    }

    // Remove logging configuration
    delete logging.servers[interaction.guildId];
    fs.writeFileSync(loggingPath, JSON.stringify(logging, null, 2));

    const embed = new EmbedBuilder()
        .setColor('#FF6B6B')
        .setTitle('🔇 Logging Disabled')
        .setDescription(`Logging has been disabled for **${interaction.guild.name}**`)
        .addFields(
            { name: '👤 Disabled By', value: interaction.user.tag, inline: true },
            { name: '⏰ Disabled At', value: `<t:${Math.floor(Date.now() / 1000)}:F>`, inline: true }
        )
        .setFooter({ text: '4 Dudes Esports Logging System' })
        .setTimestamp();

    await interaction.reply({ embeds: [embed], flags: [MessageFlags.Ephemeral] });
}

async function handleStatus(interaction, logging) {
    const serverLogging = logging.servers[interaction.guildId];

    if (!serverLogging) {
        const embed = new EmbedBuilder()
            .setColor('#FF6B6B')
            .setTitle('🔇 Logging Status')
            .setDescription('Logging is **disabled** for this server.')
            .addFields(
                { name: '💡 Setup', value: 'Use `/logging setup` to enable logging', inline: false }
            )
            .setFooter({ text: '4 Dudes Esports Logging System' })
            .setTimestamp();

        return interaction.reply({ embeds: [embed], flags: [MessageFlags.Ephemeral] });
    }

    const channel = interaction.guild.channels.cache.get(serverLogging.channel_id);
    const status = serverLogging.enabled ? '✅ Enabled' : '❌ Disabled';

    const embed = new EmbedBuilder()
        .setColor('#00FF00')
        .setTitle('📊 Logging Status')
        .setDescription(`Logging is **${status}** for this server.`)
        .addFields(
            { name: '📝 Log Channel', value: channel ? `${channel}` : '❌ Channel not found', inline: true },
            { name: '📊 Log Types', value: serverLogging.types === 'all' ? 'All Activity' : serverLogging.types, inline: true },
            { name: '👤 Setup By', value: `<@${serverLogging.setup_by}>`, inline: true },
            { name: '📅 Setup Date', value: `<t:${Math.floor(new Date(serverLogging.setup_at).getTime() / 1000)}:F>`, inline: true }
        )
        .setFooter({ text: '4 Dudes Esports Logging System' })
        .setTimestamp();

    await interaction.reply({ embeds: [embed], flags: [MessageFlags.Ephemeral] });
} 