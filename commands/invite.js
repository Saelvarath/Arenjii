module.exports = ( robot ) =>
{
	robot.registerHelpTopic( "invite", `__Invite Arenjii to your Server__\nFunction: hands out the link that allows you to add this bot to your own game.\n\nForm: \`${robot.config.prefix}invite\`` );
	robot.registerCommand( /(?:invite)/, `\`${robot.config.prefix}invite\` __Invite Arenjii__ Receive the link that will allow you to add the bot to your server.`, ( message, test ) =>
	{
		const inviteEmbed = 
		{
			"title": "Invite Arenjii to your Discord server",
			"description": "Click [Here](https://discordapp.com/oauth2/authorize?client_id=434471882163748876&scope=bot) to get the Wheel turning.",
			"color": 14951424,
			"thumbnail": 
			{
				"url": "https://upload.wikimedia.org/wikipedia/commons/1/1d/Rotating_Konarka_chaka.gif"
			}
		};

		message.author.send( { embed: inviteEmbed} );
		if ( message.channel.type !== "dm" )
		{	message.channel.send( `**${message.author.username} has queried the cosmos.**` );	}
	} );

}