const { SlashCommandBuilder, Client } = require( 'discord.js' );
const config = require( '../../config.json' );

module.exports = {
	category: 'Utility',
	cooldown: 30,

	data: new SlashCommandBuilder()
		.setName( 'feedback' )
		.setDescription( 'Send a message to the developer.' )
			.addStringOption( option =>
				option
					.setName( 'message' )
					.setDescription( 'Suggestions, critisims, bug reports, or heartfelt thanks.' )
					.setRequired( true )
			 ),

	async execute( interaction )
	{
		const boss = config.boss;
		let msg = '';

		if ( boss == undefined )
		{
			msg += "I can't find the boss..."
		}
		else
		{
			//+ I don't have access to the running client here...
			await interaction.client.users.send( boss, `${interaction.user}: ${interaction.options.getString( 'message' )}` );
			msg += `Message sent. Thank you.`;
		}

		await interaction.reply( {content: msg, ephemeral: true} );
	}
};