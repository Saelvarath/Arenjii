const { SlashCommandBuilder } = require( 'discord.js' );
const { rollMap } = require( '../../diceRoller.js' );

module.exports = {
	category: 'Dice',
	cooldown: 10,

	data: new SlashCommandBuilder()
		.setName( 'previous_roll' )
		.setDescription( 'Displays the most up to date version of your most recent roll.' )
		.addUserOption( option => option.setName( 'target' )
			.setDescription( `get someone else's roll.` )
	 ),

	async execute( interaction ) {
		let target = interaction.options.getUser( 'target' ) ?? interaction.user;
		const pr = rollMap.get( target.id );
		let msg = '';

		if ( pr === undefined )
		{	msg += `I got nothin'...`;	}
		else
		{	msg += `${ pr.owner }'s last roll was:\n\n${ pr.printPool() }`;	}

		await interaction.reply( msg );
	}
};