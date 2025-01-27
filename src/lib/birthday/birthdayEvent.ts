import generateBirthdayMessage from '../../helpers/generate/birthdayMessage';
import generateEmbed from '../../helpers/generate/embed';
import { getConfig, logAll } from '../../helpers/provide/config';
import { ARROW_RIGHT, GIFT, IMG_CAKE, NEWS } from '../../helpers/provide/environment';
const lib = require('lib')({ token: process.env.STDLIB_SECRET_TOKEN });

//TODO: Correct Types, cleanup code

export default async function birthdayEvent(guild_id: string, birthday_child_id: string, isTest: boolean) {
	console.log('BirthdayEvent starts');
	console.log('BIRTHDAYCHILD: ', birthday_child_id);

	let config = await getConfig(guild_id);
	const { ANNOUNCEMENT_CHANNEL, BIRTHDAY_ROLE, BIRTHDAY_PING_ROLE, ANNOUNCEMENT_MESSAGE, PREMIUM } = config;
	await logAll(config);

	if (BIRTHDAY_ROLE) {
		await addCurrentBirthdayChildRole(birthday_child_id, BIRTHDAY_ROLE, guild_id, isTest);
	}

	if (ANNOUNCEMENT_CHANNEL) {
		let description;
		if (PREMIUM) {
			let m = await generateBirthdayMessage(ANNOUNCEMENT_MESSAGE, birthday_child_id, guild_id);
			description = m.message;
		} else {
			//default message
			description = `${ARROW_RIGHT} Today is a Special Day!
            ${GIFT} Please wish <@${birthday_child_id}> a Happy Birthday!`;
		}
		let embed = {
			title: `${NEWS} Birthday Announcement!`,
			description: description,
			thumbnail_url: IMG_CAKE
		};
		let content = BIRTHDAY_PING_ROLE !== null ? `<@&${BIRTHDAY_PING_ROLE}>` : ``;
		let birthdayEmbed = await generateEmbed(embed);

		await sendBirthdayAnnouncement(content, ANNOUNCEMENT_CHANNEL, birthdayEmbed);
	}
	console.log('sends ends');
	return true;
}

/**
 * Add the  specified birthday role to the user specified, in the specified guild
 * @param {string} user_id - The id of the user to add the role to
 * @param {string} role_id - The id of the role to add to the user
 * @param {string} guild_id - The id of the guild the user and role belong to
 * @param {boolean} isTest - Whether or not the role is being added for testing purposes
 * @returns {Promise<void>}
 */
async function addCurrentBirthdayChildRole(user_id: string, role_id: any, guild_id: string, isTest: boolean) {
	try {
		await lib.discord.guilds['@release'].members.roles.update({
			role_id: role_id,
			user_id: user_id,
			guild_id: guild_id
		});
		console.log(`BIRTHDAY ROLE ADDED TO BDAY CHILD`);
		await scheduleRoleRemoval(user_id, role_id, guild_id, isTest);
	} catch (error) {
		console.warn(`COULND'T ADD THE BIRTHDAY ROLE TO THE BIRTHDAY CHILD`);
		console.log('USERID: ', user_id);
		console.log('GUILDID: ', guild_id);
	}
}

/**
 * Schedules the removal of a role for a user in a given guild.
 * @param user_id - The id of the user to remove the role from.
 * @param role_id - The id of the role to be removed.
 * @param guild_id - The id of the guild where the role removal should take place.
 * @param isTest - If true, the role will be removed after 1 minute. Otherwise, it will be removed after 1440 minutes (1 day).
 */
async function scheduleRoleRemoval(user_id: string, role_id: any, guild_id: string, isTest: boolean = false) {
	try {
		//https://docs.cronhooks.io/#introduction
		let time = isTest ? 1 : 1440; //1 minute or 1440 minutes (1 day)
		let req = await lib.meiraba.utils['@3.1.0'].timer.set({
			token: `${process.env.MEIRABA_TOKEN}`,
			time: time,
			endpoint_url: `https://birthday-bot.chillihero.autocode.gg/automate/removeRole/`,
			payload: {
				user_id: user_id,
				role_id: role_id,
				guild_id: guild_id
			}
		});
		console.log(`Scheduled ${isTest ? 'Test ' : ''}Birthday Role removal: `, req);
	} catch (error) {
		console.warn(`something went wrong while trying to schedule a ${isTest ? 'test ' : ''}birtday removal!`);
		console.log('USERID: ', user_id);
		console.log('ROLEID: ', role_id);
		console.log('GUILDID: ', guild_id);
		console.warn(error);
	}
	return;
}

/**
 * Sends birthday announcement to the specified channel with the given content and embed
 * @param {string} content - The message content for the birthday announcement
 * @param {string} channel_id - The id of the channel to send the announcement to
 * @param {Object} birthdayEmbed - The embed object to include in the message
 * @returns {Promise<Message>} Returns the sent message object, or undefined if an error occurs
 */
async function sendBirthdayAnnouncement(content: string, channel_id: string, birthdayEmbed: object) {
	try {
		let message = await lib.discord.channels[channel_id].messages.create({
			content: `${content}`,
			embeds: [birthdayEmbed]
		});
		console.log(`Sent Birthday Announcement`);
		return message;
	} catch (error: any) {
		console.warn(`COULND'T SEND THE BIRTHDAY ANNOUNCEMENT FOR THE BIRTHDAY CHILD\n`, error);
		//Send error message to log channel
		if (error.message.includes('Missing Access')) {
			//send Log to user
		}
		return;
	}
}
