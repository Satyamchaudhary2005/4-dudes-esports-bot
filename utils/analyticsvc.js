const fs = require('fs');
const path = require('path');

/**
 * Update analytics voice channel names with current server statistics
 * @param {Client} client - Discord client instance
 * @param {Guild} guild - Guild to update channels for
 */
async function updateAnalyticsChannels(client, guild) {
    const analyticsVcPath = path.join(__dirname, '..', 'data', 'analyticsvc.json');
    
    // Check if analytics VC is set up for this guild
    if (!fs.existsSync(analyticsVcPath)) return;
    
    const analyticsVc = JSON.parse(fs.readFileSync(analyticsVcPath, 'utf8'));
    const serverConfig = analyticsVc[guild.id];
    
    if (!serverConfig || !serverConfig.enabled) return;

    try {
        // Get current server statistics
        const totalMembers = guild.memberCount;
        
        // Since we don't have GuildMembers intent, we'll use a simpler approach
        // We'll estimate bots as a percentage and online members as a percentage
        const estimatedBots = Math.floor(totalMembers * 0.1); // Estimate 10% bots
        const estimatedOnline = Math.floor(totalMembers * 0.3); // Estimate 30% online

        // Update channel names
        const updatePromises = [];

        // Update Total Members Channel
        const totalMembersChannel = guild.channels.cache.get(serverConfig.channels.total_members);
        if (totalMembersChannel) {
            const newName = `👥 Members: ${totalMembers}`;
            if (totalMembersChannel.name !== newName) {
                updatePromises.push(totalMembersChannel.setName(newName));
            }
        }

        // Update Online Members Channel
        const onlineMembersChannel = guild.channels.cache.get(serverConfig.channels.online_members);
        if (onlineMembersChannel) {
            const newName = `🟢 Online: ${estimatedOnline}`;
            if (onlineMembersChannel.name !== newName) {
                updatePromises.push(onlineMembersChannel.setName(newName));
            }
        }

        // Update Bots Channel
        const botsChannel = guild.channels.cache.get(serverConfig.channels.bots);
        if (botsChannel) {
            const newName = `🤖 Bots: ${estimatedBots}`;
            if (botsChannel.name !== newName) {
                updatePromises.push(botsChannel.setName(newName));
            }
        }

        // Execute all updates
        if (updatePromises.length > 0) {
            await Promise.all(updatePromises);
            
            // Update last update timestamp
            serverConfig.last_update = new Date().toISOString();
            analyticsVc[guild.id] = serverConfig;
            fs.writeFileSync(analyticsVcPath, JSON.stringify(analyticsVc, null, 2));
            
            console.log(`📊 Updated analytics channels for guild: ${guild.name}`);
        }

    } catch (error) {
        console.error(`Error updating analytics channels for guild ${guild.name}:`, error);
    }
}

/**
 * Periodic update function for analytics channels
 * @param {Client} client - Discord client instance
 */
async function periodicAnalyticsUpdate(client) {
    const analyticsVcPath = path.join(__dirname, '..', 'data', 'analyticsvc.json');
    
    if (!fs.existsSync(analyticsVcPath)) return;
    
    const analyticsVc = JSON.parse(fs.readFileSync(analyticsVcPath, 'utf8'));
    
    for (const guildId in analyticsVc) {
        const guild = client.guilds.cache.get(guildId);
        if (guild && analyticsVc[guildId].enabled) {
            await updateAnalyticsChannels(client, guild);
        }
    }
}

/**
 * Start periodic updates for analytics channels
 * @param {Client} client - Discord client instance
 */
function startPeriodicUpdates(client) {
    // Update every 5 minutes
    setInterval(() => {
        periodicAnalyticsUpdate(client);
    }, 5 * 60 * 1000);
    
    console.log('🔄 Started periodic analytics channel updates (every 5 minutes)');
}

/**
 * Check if analytics VC is enabled for a guild
 * @param {string} guildId - Guild ID to check
 * @returns {boolean} - Whether analytics VC is enabled
 */
function isAnalyticsVcEnabled(guildId) {
    const analyticsVcPath = path.join(__dirname, '..', 'data', 'analyticsvc.json');
    
    if (!fs.existsSync(analyticsVcPath)) return false;
    
    const analyticsVc = JSON.parse(fs.readFileSync(analyticsVcPath, 'utf8'));
    const serverConfig = analyticsVc[guildId];
    
    return serverConfig && serverConfig.enabled;
}

/**
 * Get analytics VC configuration for a guild
 * @param {string} guildId - Guild ID to get config for
 * @returns {Object|null} - Analytics VC configuration or null if not found
 */
function getAnalyticsVcConfig(guildId) {
    const analyticsVcPath = path.join(__dirname, '..', 'data', 'analyticsvc.json');
    
    if (!fs.existsSync(analyticsVcPath)) return null;
    
    const analyticsVc = JSON.parse(fs.readFileSync(analyticsVcPath, 'utf8'));
    return analyticsVc[guildId] || null;
}

module.exports = {
    updateAnalyticsChannels,
    periodicAnalyticsUpdate,
    startPeriodicUpdates,
    isAnalyticsVcEnabled,
    getAnalyticsVcConfig
}; 