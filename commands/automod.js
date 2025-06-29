const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits, MessageFlags } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('automod')
        .setDescription('Configure auto-moderation settings')
        .addSubcommand(subcommand =>
            subcommand
                .setName('setup')
                .setDescription('Setup auto-moderation system')
                .addChannelOption(option =>
                    option.setName('log_channel')
                        .setDescription('Channel for auto-moderation logs')
                        .setRequired(false))
                .addIntegerOption(option =>
                    option.setName('spam_threshold')
                        .setDescription('Number of messages in 10 seconds to trigger spam detection (3-10)')
                        .setMinValue(3)
                        .setMaxValue(10)
                        .setRequired(false))
                .addIntegerOption(option =>
                    option.setName('caps_threshold')
                        .setDescription('Percentage of caps to trigger detection (70-100)')
                        .setMinValue(70)
                        .setMaxValue(100)
                        .setRequired(false))
                .addIntegerOption(option =>
                    option.setName('link_cooldown')
                        .setDescription('Cooldown between links in seconds (30-300)')
                        .setMinValue(30)
                        .setMaxValue(300)
                        .setRequired(false)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('status')
                .setDescription('Show current auto-moderation settings'))
        .addSubcommand(subcommand =>
            subcommand
                .setName('toggle')
                .setDescription('Toggle auto-moderation features')
                .addStringOption(option =>
                    option.setName('feature')
                        .setDescription('Feature to toggle')
                        .setRequired(true)
                        .addChoices(
                            { name: 'Spam Detection', value: 'spam' },
                            { name: 'Caps Detection', value: 'caps' },
                            { name: 'Link Filtering', value: 'links' },
                            { name: 'Word Filtering', value: 'words' },
                            { name: 'Mention Spam', value: 'mentions' }
                        )))
        .addSubcommand(subcommand =>
            subcommand
                .setName('words')
                .setDescription('Manage filtered words')
                .addStringOption(option =>
                    option.setName('action')
                        .setDescription('Action to perform')
                        .setRequired(true)
                        .addChoices(
                            { name: 'Add Word', value: 'add' },
                            { name: 'Remove Word', value: 'remove' },
                            { name: 'List Words', value: 'list' }
                        ))
                .addStringOption(option =>
                    option.setName('word')
                        .setDescription('Word to add/remove')
                        .setRequired(false)))
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),

    async execute(interaction) {
        const subcommand = interaction.options.getSubcommand();
        const fs = require('fs');
        const path = require('path');
        
        // Ensure automod config directory exists
        const configDir = path.join(__dirname, '..', 'data');
        if (!fs.existsSync(configDir)) {
            fs.mkdirSync(configDir, { recursive: true });
        }
        
        const configPath = path.join(configDir, 'automod.json');
        
        // Load existing config or create default
        let config = {};
        if (fs.existsSync(configPath)) {
            config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
        }
        
        // Initialize guild config if it doesn't exist
        if (!config[interaction.guildId]) {
            config[interaction.guildId] = {
                enabled: {
                    spam: true,
                    caps: true,
                    links: true,
                    words: true,
                    mentions: true
                },
                settings: {
                    spamThreshold: 5,
                    capsThreshold: 80,
                    linkCooldown: 60,
                    mentionLimit: 5,
                    logChannel: null
                },
                filteredWords: [],
                userWarnings: {}
            };
        }

        switch (subcommand) {
            case 'setup':
                await handleSetup(interaction, config, configPath);
                break;
            case 'status':
                await handleStatus(interaction, config);
                break;
            case 'toggle':
                await handleToggle(interaction, config, configPath);
                break;
            case 'words':
                await handleWords(interaction, config, configPath);
                break;
        }
    },
};

async function handleSetup(interaction, config, configPath) {
    const logChannel = interaction.options.getChannel('log_channel');
    const spamThreshold = interaction.options.getInteger('spam_threshold');
    const capsThreshold = interaction.options.getInteger('caps_threshold');
    const linkCooldown = interaction.options.getInteger('link_cooldown');

    const guildConfig = config[interaction.guildId];

    if (logChannel) {
        guildConfig.settings.logChannel = logChannel.id;
    }
    if (spamThreshold) {
        guildConfig.settings.spamThreshold = spamThreshold;
    }
    if (capsThreshold) {
        guildConfig.settings.capsThreshold = capsThreshold;
    }
    if (linkCooldown) {
        guildConfig.settings.linkCooldown = linkCooldown;
    }

    // Save config
    const fs = require('fs');
    fs.writeFileSync(configPath, JSON.stringify(config, null, 2));

    const embed = new EmbedBuilder()
        .setColor('#00FF00')
        .setTitle('✅ Auto-Moderation Setup Complete')
        .setDescription('Auto-moderation has been configured successfully!')
        .addFields(
            { name: '📝 Log Channel', value: logChannel ? `<#${logChannel.id}>` : 'Not set', inline: true },
            { name: '🚨 Spam Threshold', value: `${guildConfig.settings.spamThreshold} messages/10s`, inline: true },
            { name: '📢 Caps Threshold', value: `${guildConfig.settings.capsThreshold}%`, inline: true },
            { name: '🔗 Link Cooldown', value: `${guildConfig.settings.linkCooldown} seconds`, inline: true },
            { name: '📋 Filtered Words', value: `${guildConfig.filteredWords.length} words`, inline: true }
        )
        .setFooter({ text: '4 Dudes Esports Auto-Moderation' });

    await interaction.reply({ embeds: [embed], flags: [MessageFlags.Ephemeral] });
}

async function handleStatus(interaction, config) {
    const guildConfig = config[interaction.guildId];
    const logChannel = guildConfig.settings.logChannel ? 
        `<#${guildConfig.settings.logChannel}>` : 'Not set';

    const embed = new EmbedBuilder()
        .setColor('#0099FF')
        .setTitle('🛡️ Auto-Moderation Status')
        .setDescription('Current auto-moderation configuration:')
        .addFields(
            { 
                name: '🚨 Spam Detection', 
                value: `${guildConfig.enabled.spam ? '✅ Enabled' : '❌ Disabled'} (${guildConfig.settings.spamThreshold} msgs/10s)`, 
                inline: true 
            },
            { 
                name: '📢 Caps Detection', 
                value: `${guildConfig.enabled.caps ? '✅ Enabled' : '❌ Disabled'} (${guildConfig.settings.capsThreshold}%)`, 
                inline: true 
            },
            { 
                name: '🔗 Link Filtering', 
                value: `${guildConfig.enabled.links ? '✅ Enabled' : '❌ Disabled'} (${guildConfig.settings.linkCooldown}s cooldown)`, 
                inline: true 
            },
            { 
                name: '🚫 Word Filtering', 
                value: `${guildConfig.enabled.words ? '✅ Enabled' : '❌ Disabled'} (${guildConfig.filteredWords.length} words)`, 
                inline: true 
            },
            { 
                name: '👥 Mention Spam', 
                value: `${guildConfig.enabled.mentions ? '✅ Enabled' : '❌ Disabled'} (${guildConfig.settings.mentionLimit} mentions)`, 
                inline: true 
            },
            { 
                name: '📝 Log Channel', 
                value: logChannel, 
                inline: true 
            }
        )
        .setFooter({ text: '4 Dudes Esports Auto-Moderation' });

    await interaction.reply({ embeds: [embed], flags: [MessageFlags.Ephemeral] });
}

async function handleToggle(interaction, config, configPath) {
    const feature = interaction.options.getString('feature');
    const guildConfig = config[interaction.guildId];

    guildConfig.enabled[feature] = !guildConfig.enabled[feature];

    // Save config
    const fs = require('fs');
    fs.writeFileSync(configPath, JSON.stringify(config, null, 2));

    const featureNames = {
        spam: 'Spam Detection',
        caps: 'Caps Detection',
        links: 'Link Filtering',
        words: 'Word Filtering',
        mentions: 'Mention Spam'
    };

    const embed = new EmbedBuilder()
        .setColor(guildConfig.enabled[feature] ? '#00FF00' : '#FF0000')
        .setTitle(`${guildConfig.enabled[feature] ? '✅ Enabled' : '❌ Disabled'} ${featureNames[feature]}`)
        .setDescription(`${featureNames[feature]} has been ${guildConfig.enabled[feature] ? 'enabled' : 'disabled'}.`)
        .setFooter({ text: '4 Dudes Esports Auto-Moderation' });

    await interaction.reply({ embeds: [embed], flags: [MessageFlags.Ephemeral] });
}

async function handleWords(interaction, config, configPath) {
    const action = interaction.options.getString('action');
    const word = interaction.options.getString('word');
    const guildConfig = config[interaction.guildId];

    switch (action) {
        case 'add':
            if (!word) {
                return interaction.reply({
                    content: '❌ Please provide a word to add.',
                    flags: [MessageFlags.Ephemeral]
                });
            }
            
            if (guildConfig.filteredWords.includes(word.toLowerCase())) {
                return interaction.reply({
                    content: '❌ This word is already filtered.',
                    flags: [MessageFlags.Ephemeral]
                });
            }
            
            guildConfig.filteredWords.push(word.toLowerCase());
            
            const addEmbed = new EmbedBuilder()
                .setColor('#00FF00')
                .setTitle('✅ Word Added to Filter')
                .setDescription(`"${word}" has been added to the filtered words list.`)
                .setFooter({ text: '4 Dudes Esports Auto-Moderation' });
            
            await interaction.reply({ embeds: [addEmbed], flags: [MessageFlags.Ephemeral] });
            break;

        case 'remove':
            if (!word) {
                return interaction.reply({
                    content: '❌ Please provide a word to remove.',
                    flags: [MessageFlags.Ephemeral]
                });
            }
            
            const index = guildConfig.filteredWords.indexOf(word.toLowerCase());
            if (index === -1) {
                return interaction.reply({
                    content: '❌ This word is not in the filtered list.',
                    flags: [MessageFlags.Ephemeral]
                });
            }
            
            guildConfig.filteredWords.splice(index, 1);
            
            const removeEmbed = new EmbedBuilder()
                .setColor('#FF6B6B')
                .setTitle('✅ Word Removed from Filter')
                .setDescription(`"${word}" has been removed from the filtered words list.`)
                .setFooter({ text: '4 Dudes Esports Auto-Moderation' });
            
            await interaction.reply({ embeds: [removeEmbed], flags: [MessageFlags.Ephemeral] });
            break;

        case 'list':
            const wordList = guildConfig.filteredWords.length > 0 ? 
                guildConfig.filteredWords.join(', ') : 'No words filtered';
            
            const listEmbed = new EmbedBuilder()
                .setColor('#0099FF')
                .setTitle('📋 Filtered Words List')
                .setDescription(wordList)
                .addFields(
                    { name: '📊 Total Words', value: guildConfig.filteredWords.length.toString(), inline: true }
                )
                .setFooter({ text: '4 Dudes Esports Auto-Moderation' });
            
            await interaction.reply({ embeds: [listEmbed], flags: [MessageFlags.Ephemeral] });
            break;
    }

    // Save config
    const fs = require('fs');
    fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
} 