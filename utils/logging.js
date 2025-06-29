const { EmbedBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');

/**
 * Send a log message to the designated log channel
 * @param {string} guildId - The guild ID
 * @param {string} type - Type of log (moderation, members, messages)
 * @param {Object} data - Log data
 */
async function sendLog(guildId, type, data) {
    const loggingPath = path.join(__dirname, '..', 'data', 'logging.json');
    
    // Check if logging is enabled for this server
    if (!fs.existsSync(loggingPath)) return;
    
    const logging = JSON.parse(fs.readFileSync(loggingPath, 'utf8'));
    const serverLogging = logging.servers[guildId];
    
    if (!serverLogging || !serverLogging.enabled) return;
    
    // Check if this type of log should be sent
    if (serverLogging.types !== 'all' && serverLogging.types !== type) return;
    
    // Get the log channel
    const guild = global.client?.guilds.cache.get(guildId);
    if (!guild) return;
    
    const channel = guild.channels.cache.get(serverLogging.channel_id);
    if (!channel) return;
    
    // Create embed based on log type
    const embed = createLogEmbed(type, data);
    
    try {
        await channel.send({ embeds: [embed] });
    } catch (error) {
        console.error('Error sending log to channel:', error);
    }
}

/**
 * Create an embed for different types of logs
 * @param {string} type - Type of log
 * @param {Object} data - Log data
 * @returns {EmbedBuilder} The embed
 */
function createLogEmbed(type, data) {
    const embed = new EmbedBuilder()
        .setTimestamp()
        .setFooter({ text: '4 Dudes Esports Logging System' });

    switch (type) {
        case 'moderation':
            embed
                .setColor(getModerationColor(data.action))
                .setTitle(`${getModerationEmoji(data.action)} ${data.action.toUpperCase()}`)
                .setDescription(`**${data.target_tag}** has been ${data.action}${data.action === 'unban' ? '' : 'ned'}`)
                .addFields(
                    { name: '👤 Target', value: `${data.target_tag} (${data.target_id})`, inline: true },
                    { name: '🛡️ Moderator', value: `${data.moderator_tag}`, inline: true },
                    { name: '📝 Reason', value: data.reason || 'No reason provided', inline: false }
                );
            
            // Add additional fields for specific actions
            if (data.duration_minutes) {
                embed.addFields({ name: '⏱️ Duration', value: `${data.duration_minutes} minutes`, inline: true });
            }
            if (data.delete_message_days) {
                embed.addFields({ name: '🗑️ Messages Deleted', value: `${data.delete_message_days} days`, inline: true });
            }
            if (data.amount_deleted) {
                embed.addFields(
                    { name: '📊 Messages Cleared', value: `${data.amount_deleted} messages`, inline: true },
                    { name: '📝 Channel', value: `<#${data.channel_id}>`, inline: true }
                );
            }
            break;

        case 'members':
            if (data.event === 'join') {
                embed
                    .setColor('#00FF00')
                    .setTitle('👋 Member Joined')
                    .setDescription(`**${data.user_tag}** has joined the server`)
                    .addFields(
                        { name: '👤 User', value: `${data.user_tag} (${data.user_id})`, inline: true },
                        { name: '📅 Account Created', value: `<t:${Math.floor(new Date(data.user_created_at).getTime() / 1000)}:R>`, inline: true }
                    );
            } else if (data.event === 'leave') {
                embed
                    .setColor('#FF6B6B')
                    .setTitle('👋 Member Left')
                    .setDescription(`**${data.user_tag}** has left the server`)
                    .addFields(
                        { name: '👤 User', value: `${data.user_tag} (${data.user_id})`, inline: true },
                        { name: '📅 Joined At', value: data.joined_at ? `<t:${Math.floor(new Date(data.joined_at).getTime() / 1000)}:R>` : 'Unknown', inline: true }
                    );
            }
            break;

        case 'messages':
            if (data.event === 'edit') {
                embed
                    .setColor('#FFA500')
                    .setTitle('✏️ Message Edited')
                    .setDescription(`A message was edited in ${data.channel}`)
                    .addFields(
                        { name: '👤 Author', value: `${data.author_tag}`, inline: true },
                        { name: '📝 Channel', value: data.channel, inline: true },
                        { name: '🔗 Message Link', value: data.message_url || 'No link available', inline: false }
                    );
            } else if (data.event === 'delete') {
                embed
                    .setColor('#FF0000')
                    .setTitle('🗑️ Message Deleted')
                    .setDescription(`A message was deleted from ${data.channel}`)
                    .addFields(
                        { name: '👤 Author', value: `${data.author_tag}`, inline: true },
                        { name: '📝 Channel', value: data.channel, inline: true },
                        { name: '📝 Content', value: data.content ? data.content.substring(0, 1000) + (data.content.length > 1000 ? '...' : '') : 'No content available', inline: false }
                    );
            }
            break;

        case 'roles':
            embed
                .setColor('#9B59B6')
                .setTitle('🔄 Role Updated')
                .setDescription(`Roles were updated for **${data.user_tag}**`)
                .addFields(
                    { name: '👤 User', value: `${data.user_tag}`, inline: true },
                    { name: '📊 Role Count', value: `${data.role_count} roles`, inline: true }
                );
            break;
    }

    return embed;
}

/**
 * Get color for moderation actions
 * @param {string} action - Moderation action
 * @returns {string} Color hex code
 */
function getModerationColor(action) {
    const colors = {
        'ban': '#FF0000',
        'kick': '#FF6B6B',
        'timeout': '#FFA500',
        'warn': '#FFD700',
        'unban': '#00FF00',
        'clear': '#00FF00',
        'automod': '#FF69B4'
    };
    return colors[action] || '#0099FF';
}

/**
 * Get emoji for moderation actions
 * @param {string} action - Moderation action
 * @returns {string} Emoji
 */
function getModerationEmoji(action) {
    const emojis = {
        'ban': '🔨',
        'kick': '👢',
        'timeout': '⏰',
        'warn': '⚠️',
        'unban': '🔓',
        'clear': '🧹',
        'automod': '🤖'
    };
    return emojis[action] || '🛡️';
}

module.exports = {
    sendLog
}; 