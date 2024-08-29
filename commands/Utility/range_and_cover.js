const { SlashCommandBuilder } = require( 'discord.js' );
const { rollMap } = require( '../../diceRoller.js' );
const { RaCActions, RaCOptions } = require( '../../BW_data.js' );

module.exports = {
	category: 'Utility',
	cooldown: 10,

	data: new SlashCommandBuilder()
		.setName( 'range_and_cover' )
		.setDescription( 'Range and Cover tool' )
		.addSubcommand( subcommand =>
			subcommand
			.setName( 'info' )
			.setDescription( 'displays the mechanics of a Range and Cover Maneuver' )
			.addIntegerOption( option =>
				option
					.setName( 'maneuver1' )
					.setDescription( 'the RaC maneuver to display' )
					.addChoices( RaCOptions )
					.setRequired( true )
			 )
		 )
		.addSubcommand( subcommand =>
			subcommand
			.setName( 'compare' )
			.setDescription( 'displays how two Range and Cover maneuvers interact.' )/**/
			.addIntegerOption( option =>
				option
					.setName( 'maneuver1' )
					.setDescription( 'the first RaC maneuver to compare' )
					.addChoices( RaCOptions )
					.setRequired( true )
			 )
			.addIntegerOption( option =>
				option
					.setName( 'maneuver2' )
					.setDescription( 'the second RaC maneuver to compare' )
					.addChoices( RaCOptions )
					.setRequired( true )
			 )
		 ),
		/*.addSubcommand( subcommand =>
			subcommand
			.setName( 'script' )
			.setDescription( 'Script a Range and Cover volley. Used with the /reveal command.' )
			.addIntegerOption( option =>
				option
					.setName( 'maneuver1' )
					.setDescription( 'the first DoW maneuver to script' )
					.addChoices( DoWOptions )
					.setRequired( true )
			 )
			.addIntegerOption( option =>
				option
					.setName( 'maneuver2' )
					.setDescription( 'the second DoW maneuver to script' )
					.addChoices( DoWOptions )
					.setRequired( true )
			 )
			.addIntegerOption( option =>
				option
					.setName( 'maneuver3' )
					.setDescription( 'the third DoW maneuver to script' )
					.addChoices( DoWOptions )
					.setRequired( true )
			 )
	 ),*/

	async execute( interaction ) {
		//const message = await interaction.fetchReply();
		//console.log( message.interaction );

		const subC = interaction.options.getSubcommand();
		let output = '';

		const act1 = interaction.options.getInteger( 'maneuver1' );
		const act2 = interaction.options.getInteger( 'maneuver2' ) ?? 0;
		const act3 = interaction.options.getInteger( 'maneuver3' ) ?? 0;

		switch ( subC )
		{
			case 'info':
				output += `## ${RaCActions[act1][0]}`;
				output += RaCActions[act1][1] !== '-' ? `\n*Tests:*\n\t${RaCActions[act1][1]} ${act1 != 10 ? `+ Range + Position` : ``}${act1 != 4 ? ` + Stride` : ``}.` : ``;

				output += `\n*Effect:*\n\t${RaCActions[act1][4]}`;
				output += RaCActions[act1].length === 6 ? `\n*Special:*\n\t${RaCActions[act1][5]}` : ``;

				break;

			case 'compare':
				output += `**${RaCActions[act1][0]}**\nRoll: `;

				if ( RaCActions[act1][1] !== '-' )
				{
					if ( RaCActions[act1][2] === 'special' )
						{	output += RaCActions[act2][2] !== 'skill' ? 'Perception' : 'Observation';	}
					else
						{	output += RaCActions[act1][1];	}

					output += ` + [${act1 === 10 ? `` : 'Range, Position' }`
					output += `${act1 === 4 || act1 === 10 ? `` : `, `}${act1 === 4 ? `` : `Stride`}]`;
					output += `${ RaCActions[act2][2] === 'skill' && RaCActions[act1][2] === 'stat' ? 'at a __double Ob penalty__' : ''}.`;
				}
				else {	output += `None`;	}

				output += `\n\t${RaCActions[act1][4]}`;
				output += RaCActions[act1].length === 6 ? `\n*Special:*\n\t${RaCActions[act1][5]}` : ``;

				output += `\n\n**${RaCActions[act2][0]}**\nRoll: `

				if ( RaCActions[act2][1] !== '-' )
				{
					if ( RaCActions[act2][2] === 'special' )
						{	output += RaCActions[act1][2] !== 'skill' ? 'Perception' : 'Observation';	}
					else
						{	output += RaCActions[act2][1];	}

					output += ` + [${act2 === 10 ? `` : 'Range, Position' }`
					output += `${act2 === 4 || act2 === 10 ? `` : `, `}${act2 === 4 ? `` : `Stride`}]`;
					output += `${ RaCActions[act1][2] === 'skill' && RaCActions[act2][2] === 'stat' ? 'at a __double Ob penalty__' : ''}.`;
				}
				else {	output += `None`;	}

				output += `\n\t${RaCActions[act2][4]}`;
				output += RaCActions[act2].length === 6 ? `\n*Special:*\n\t${RaCActions[act2][5]}` : ``;

				// TIES
				if ( act1 <= 10 && act2 <= 10 ) //not unrolled hesitate actions
				{
					output += `\n\n__In case of a Tie:__\n\t`;

					if ( RaCActions[act1][0] === RaCActions[act2][0] )
					{	output += `Both sides move, if applicable.`;	}
					else if ( RaCActions[act1][3] === 'hold' || RaCActions[act2][3] === 'hold' )
					{
						//maintain vs advance | withdraw	no change in distance
						if ( act1 === 5 || act2 === 5 )
						{	output += `There is no change in distance`;	}
						//Hold vs advance | withdraw		movement is automatic
						else if ( act1 === 4 || act2 === 4 )
						{	output += `Movement is automatic.`;	}
						//Hesitation actions don't roll so cannot tie.
						else
						{	output += 'Wait... something has gone screwy...';	}
						
						
					}
					else if ( RaCActions[act1][3] != RaCActions[act2][3] )
					{	output += `Neither sides moves.`	}
					else if ( RaCActions[act1][3] === 'advance' && RaCActions[act2][3] === 'advance' )
					{
						/*Close VS Flank,				Close Wins.
						Sneak In VS Close | Charge,		Sneak In Wins. 
						Flank Vs Sneak In | Charge,		Flank wins. 
						Charge Vs Close					Charge wins.*/

						if( act1 === 3 || act2 === 3 ) //flank
						{	output += ` The *${act2 === 1 || act1 === 1 ? `Close` : `Flank`} Maneuver* is favoured`;	}
						else if ( act1 === 7 || act2 === 7 ) //Sneak in
						{	output += ` The *${act2 === 3 || act1 === 3 ? `Flank` : `Sneak In`} Maneuver* is favoured`;	}
						else
						{	output += `The *Charge Maneuver* is favoured`;	}
						output += ` and gets to Advance`
					}
					else if ( RaCActions[act1][3] === 'withdraw' && RaCActions[act2][3] === 'withdraw' )
					{
						/*Withdraw Vs Fall Back				Withdraw wins.
						Sneak Out Vs Withdraw | Retreat,	Sneak Out Wins.
						Fall Back Vs Sneak Out | Retreat,	Fall Back Wins.
						Retreat Vs Withdraw,				Retreat Wins.
						Run Screaming Vs ....????			Unattested*/

						if ( act1 === 10 || act2 === 10 )
						{	output += `**( unattested )** The non-hesitation maneuver is favoured`}
						else if( act1 === 8 || act2 === 8 ) //Sneak out
						{	output += ` The *${act2 === 2 || act1 === 2 ? `Fall Back` : `Sneak Out`} Maneuver* is favoured`;	}
						else if ( act1 === 2 || act2 === 2 ) //Fall Back
						{	output += ` The *${act2 === 9 || act1 === 9 ? `Withdraw` : `Fall Back`} Maneuver* is favoured`;	}
						else
						{	output += `The *Retreat Maneuver* is favoured`;	}
						output += ` and gets to Withdraw`;
					}
				}

				break;

			case 'script':
				rollMap.set( `rac-${interaction.user.id}`, [ act1, act2, act3 ] );
				output += `Your Script has been submitted!`

				break;
		}
	
		await interaction.reply( output )
	},
};