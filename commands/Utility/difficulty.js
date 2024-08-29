//+ add Ob addition/multiplication?

const { SlashCommandBuilder } = require( 'discord.js' );
const { RDC } = require( '../../diceRoller.js' )

module.exports = {
	category: 'Utility',

	data: new SlashCommandBuilder()
		.setName( 'difficulty' )
		.setDescription( 'Returns if a test is Routine, Difficult or Challenging.' )
			.addIntegerOption( option =>
				option
					.setName( 'pool' )
					.setDescription( 'How many total non-artha dice did you roll?' )
					.setMinValue( 1 )
					.setRequired( true )
			 )
			.addIntegerOption( option =>
				option
					.setName( 'ob' )
					.setDescription( 'What was the Obstacle of the test?' )
					.setMinValue( 1 )
                    .setRequired( true )
			 ),


	async execute( interaction ) {

        const pool = interaction.options.getInteger( 'pool' ) ?? 0;
		const ob = interaction.options.getInteger( 'ob' ) ?? 0;
		
		await interaction.reply( `${ pool }D rolled Versus an Ob of ${ ob }?\nWhy, that would be a ${ RDC( pool, ob ) } test!` ) ;
	}
};