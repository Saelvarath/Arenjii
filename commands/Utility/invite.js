const { SlashCommandBuilder, EmbedBuilder } = require( 'discord.js' );

module.exports = {
	category: 'utility',
	cooldown: 30,

	data: new SlashCommandBuilder()
		.setName( 'invite' )
		.setDescription( 'Get the link to add Arenjii to your server!' ),

	async execute( interaction ) {
		const inviteEmbed = new EmbedBuilder()
			.setTitle( "Invite Arenjii to your Discord server" )
			.setDescription( "Click [Here]( https://discordapp.com/oauth2/authorize?client_id=434471882163748876&scope=bot ) to get the Wheel turning." )
			.setColor( 14951424 )
			.setThumbnail( "https://upload.wikimedia.org/wikipedia/commons/1/1d/Rotating_Konarka_chaka.gif" );

			await interaction.reply( { embeds: [inviteEmbed] } );
	}
};