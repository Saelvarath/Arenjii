const { SlashCommandBuilder } = require( 'discord.js' );
const { stats } = require( '../../diceRoller.js' );

const full = "█";
const half = "▌";

module.exports = {
	category: 'Dice',

	data: new SlashCommandBuilder()
		.setName( 'stats' )
		.setDescription( `don't you trust me?` ),

		async execute( interaction ) {
			let rollCount = stats();

			// console.log( rolls );
			// console.log( rollCount );
			let lines = [];
			let largest = 0;
			rollCount.find( ( num ) => 
			{
				if ( num>largest ) 
					{	largest = num;	}
			} );
			let fullBar = largest / 40
			for ( let index = 1; index < rollCount.length; index++ ) {
				const count = rollCount[index];
				let bar = full.repeat( count / fullBar ) + ( Math.round( count / fullBar - Math.floor( count / fullBar ) ) === 1 ? half : "" );
				// console.log( bar )
				bar = bar.padEnd( 40, " " );
				// console.log( bar )
				lines[index] = `${index} | ${bar} | ${count}`;
				// console.log( lines[index] )
			}
			
			// console.log( lines )
			await interaction.reply( "```\n" +
				"		 Dice Stats\n" +
				lines.join( "\n" ) +
				"\n\n	Total dice rolled: " + rollCount.reduce( ( a, c ) => {	return a + c	} ) + "\n```" ) ;
		},
};