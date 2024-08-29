const { SlashCommandBuilder } = require( 'discord.js' );
const { roll } = require( '../../diceRoller.js' )

module.exports = {
	category: 'BossOnly',

	data: new SlashCommandBuilder()
		.setName( 'dump' )
		.setDescription( 'roll a *lot* of dice!' ),

		async execute( interaction ) {
			
			for ( let i = 1; i < 1000000; i++ )
				{	roll();	}
			
			await interaction.reply( `You rolled just, like, a **tonne** of dice` ) ;
		},
};