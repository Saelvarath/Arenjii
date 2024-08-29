const { SlashCommandBuilder } = require( 'discord.js' );
const { rollMap } = require( '../../diceRoller.js' );
const { DoWAction, DoWInterations, DoWOptions } = require( '../../BW_data.js' );

module.exports = {
	category: 'Utility',
	cooldown: 5,

	data: new SlashCommandBuilder()
		.setName( 'duel_of_wits' )
		.setDescription( 'Duel of Wits tool' )
		.addSubcommand( subcommand => subcommand.setName( 'info' )
			.setDescription( 'Displays the mechanics of a Duel of Wits action.' )
			.addIntegerOption( option =>
				option
					.setName( 'action1' )
					.setDescription( 'The DoW action to display.' )
					.addChoices( DoWOptions )
					.setRequired( true )
			 )
		 )
		.addSubcommand( subcommand => subcommand.setName( 'compare' )
			.setDescription( 'Displays how two Duel of Wits actions interact.' )/**/
			.addIntegerOption( option => option.setName( 'action1' )
					.setDescription( 'The first DoW action to compare.' )
					.addChoices( DoWOptions )
					.setRequired( true )
			 )
			.addIntegerOption( option => option.setName( 'action2' )
					.setDescription( 'the second DoW action to compare.' )
					.addChoices( DoWOptions )
					.setRequired( true )
			 )
		 )
		.addSubcommand( subcommand => subcommand.setName( 'script' )
			.setDescription( 'Script a DoW exchange. Used with the /reveal command.' )
			.addIntegerOption( option => option.setName( 'action1' )
					.setDescription( 'the first DoW action to script' )
					.addChoices( DoWOptions )
					.setRequired( true )
			 )
			.addIntegerOption( option => option.setName( 'action2' )
					.setDescription( 'the second DoW action to script' )
					.addChoices( DoWOptions )
					.setRequired( true )
			 )
			.addIntegerOption( option => option.setName( 'action3' )
					.setDescription( 'the third DoW action to script' )
					.addChoices( DoWOptions )
					.setRequired( true )
			 )
	 ),

	async execute( interaction ) {
		//const message = await interaction.fetchReply();
		//console.log( message.interaction );

		const subC = interaction.options.getSubcommand();
		let output = '';

		const act1 = interaction.options.getInteger( 'action1' );
		const act2 = interaction.options.getInteger( 'action2' ) ?? 0;
		const act3 = interaction.options.getInteger( 'action3' ) ?? 0;

		switch ( subC )
		{
			case 'info':
				output += `## ${DoWAction[act1][0]}\n*Tests:*\n\t${DoWAction[act1][1]}`;

				if ( act1.length === 5 )
				{
					output += `\n*Special:*\n\t${DoWAction[act1][4]}`;
				}

				output += `\n*Standard Test Effect:*\n\t${DoWAction[act1][2]}`;
				output += `\n*Versus Test Effect:*\n\t${DoWAction[act1][3]}`;
				break;

			case 'compare':
				output += `The _${DoWAction[act1][0]}_ action `;

				if ( DoWInterations[act1][act2] === 'VS' )
				{	output += `makes a VS test against the victim's roll\n${DoWAction[act1][3]}`;	}
				else if ( DoWInterations[act1][act2] === '-' )
				{	output += `is vulnerable against ${DoWAction[act2][0]} and makes no roll`;	}
				else
				{	output += `rolls a standard test against an Ob of ${DoWInterations[act1][act2]}\n\t${DoWAction[act1][2]}`;	}

				output += `\n\nThe _${DoWAction[act2][0]}_ action `;

				if ( DoWInterations[act2][act1] === 'VS' )
				{	output += `makes a VS test against the victim's roll\n${DoWAction[act2][3]}`;	}
				else if ( DoWInterations[act2][act1] === '-' )
				{	output += `is vulnerable against ${DoWAction[act1][0]} and makes no roll`;	}
				else
				{	output += `rolls a standard test against an Ob of ${DoWInterations[act2][act1]}\n\t${DoWAction[act2][2]}`;	}

				break;

			case 'script':
				rollMap.set( `dow-${interaction.user.id}`, [ act1, act2, act3 ] );
				output += `Your Script has been submitted!`;

				break;
		}
	
		await interaction.reply( output )
	},
};