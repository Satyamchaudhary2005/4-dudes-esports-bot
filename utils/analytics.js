const fs = require('fs');
const path = require('path');
const { sendLog } = require('./logging.js');

/**
 * Log a moderation action to analytics
 * @param {string} guildId - The guild ID
 * @param {string} moderatorId - The moderator's user ID
 * @param {string} targetId - The target user's ID
 * @param {string} action - The moderation action (ban, kick, timeout, warn, etc.)
 * @param {string} reason - The reason for the action
 * @param {Object} additionalData - Any additional data to store
 */
function logModerationAction(guildId, moderatorId, targetId, action, reason, additionalData = {}) {
    const analyticsPath = path.join(__dirname, '..', 'data', 'analytics.json');
    
    // Load analytics data
    let analytics = {};
    if (fs.existsSync(analyticsPath)) {
        analytics = JSON.parse(fs.readFileSync(analyticsPath, 'utf8'));
    }

    // Initialize server data if it doesn't exist
    if (!analytics.servers[guildId]) {
        analytics.servers[guildId] = {
            total_messages: 0,
            total_commands: 0,
            total_moderations: 0,
            member_joins: 0,
            member_leaves: 0,
            message_edits: 0,
            message_deletes: 0,
            role_changes: 0,
            users: {},
            channels: {},
            daily_stats: {},
            moderation_logs: []
        };
    }

    // Create moderation log entry
    const logEntry = {
        id: `mod-${Date.now()}`,
        timestamp: new Date().toISOString(),
        moderator_id: moderatorId,
        target_id: targetId,
        action: action,
        reason: reason,
        ...additionalData
    };

    // Add to moderation logs
    analytics.servers[guildId].moderation_logs.push(logEntry);

    // Update server stats
    analytics.servers[guildId].total_moderations++;
    analytics.global_stats.total_moderations++;

    // Update daily stats
    const today = new Date().toISOString().split('T')[0];
    if (!analytics.servers[guildId].daily_stats[today]) {
        analytics.servers[guildId].daily_stats[today] = {
            messages: 0,
            commands: 0,
            moderations: 0,
            joins: 0,
            leaves: 0
        };
    }
    analytics.servers[guildId].daily_stats[today].moderations++;

    // Save analytics data
    fs.writeFileSync(analyticsPath, JSON.stringify(analytics, null, 2));

    // Send log to designated channel
    const guild = global.client?.guilds.cache.get(guildId);
    if (guild) {
        const moderator = guild.members.cache.get(moderatorId);
        const target = guild.members.cache.get(targetId) || { user: { tag: 'Unknown User' } };
        
        sendLog(guildId, 'moderation', {
            action: action,
            target_tag: target.user.tag,
            target_id: targetId,
            moderator_tag: moderator ? moderator.user.tag : 'Unknown Moderator',
            reason: reason,
            ...additionalData
        });
    }
}

/**
 * Log command usage to analytics
 * @param {string} guildId - The guild ID
 * @param {string} userId - The user's ID
 * @param {string} commandName - The command name
 */
function logCommandUsage(guildId, userId, commandName) {
    const analyticsPath = path.join(__dirname, '..', 'data', 'analytics.json');
    
    // Load analytics data
    let analytics = {};
    if (fs.existsSync(analyticsPath)) {
        analytics = JSON.parse(fs.readFileSync(analyticsPath, 'utf8'));
    }

    // Initialize server data if it doesn't exist
    if (!analytics.servers[guildId]) {
        analytics.servers[guildId] = {
            total_messages: 0,
            total_commands: 0,
            total_moderations: 0,
            member_joins: 0,
            member_leaves: 0,
            message_edits: 0,
            message_deletes: 0,
            role_changes: 0,
            users: {},
            channels: {},
            daily_stats: {},
            moderation_logs: []
        };
    }

    // Update server stats
    analytics.servers[guildId].total_commands++;
    analytics.global_stats.total_commands++;

    // Update user stats
    if (analytics.servers[guildId].users[userId]) {
        analytics.servers[guildId].users[userId].command_count++;
    }

    // Update daily stats
    const today = new Date().toISOString().split('T')[0];
    if (!analytics.servers[guildId].daily_stats[today]) {
        analytics.servers[guildId].daily_stats[today] = {
            messages: 0,
            commands: 0,
            moderations: 0,
            joins: 0,
            leaves: 0
        };
    }
    analytics.servers[guildId].daily_stats[today].commands++;

    // Save analytics data
    fs.writeFileSync(analyticsPath, JSON.stringify(analytics, null, 2));
}

/**
 * Get analytics data for a guild
 * @param {string} guildId - The guild ID
 * @returns {Object} The analytics data for the guild
 */
function getGuildAnalytics(guildId) {
    const analyticsPath = path.join(__dirname, '..', 'data', 'analytics.json');
    
    if (!fs.existsSync(analyticsPath)) {
        return null;
    }

    const analytics = JSON.parse(fs.readFileSync(analyticsPath, 'utf8'));
    return analytics.servers[guildId] || null;
}

/**
 * Get global analytics data
 * @returns {Object} The global analytics data
 */
function getGlobalAnalytics() {
    const analyticsPath = path.join(__dirname, '..', 'data', 'analytics.json');
    
    if (!fs.existsSync(analyticsPath)) {
        return null;
    }

    const analytics = JSON.parse(fs.readFileSync(analyticsPath, 'utf8'));
    return analytics.global_stats || null;
}

module.exports = {
    logModerationAction,
    logCommandUsage,
    getGuildAnalytics,
    getGlobalAnalytics
}; 