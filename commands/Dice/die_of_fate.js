const { SlashCommandBuilder } = require( 'discord.js' );
const { roll } = require( '../../diceRoller.js' )

module.exports = {
	category: 'Dice',

	data: new SlashCommandBuilder()
		.setName( 'die_of_fate' )
		.setDescription( 'roll a Die of Fate!' )
			.addIntegerOption( option =>
				option
					.setName( 'minus' )
					.setDescription( 'Subtract # from the result of the roll' )
					.setMaxValue( 9 )
					.setMinValue( 1 )
			 )
			.addIntegerOption( option =>
				option
					.setName( 'plus' )
					.setDescription( 'Add # to the result of the roll' )
					.setMaxValue( 9 )
					.setMinValue( 1 )
			 ),


	async execute( interaction ) {
		let result =  roll();

		const plus = interaction.options.getInteger( 'plus' ) ?? 0;
		const minus = interaction.options.getInteger( 'minus' ) ?? 0;
		
		await interaction.reply( `You rolled ${ 1 + result }, for a total of ${ 1 + result + plus - minus }!` ) ;
	}
};