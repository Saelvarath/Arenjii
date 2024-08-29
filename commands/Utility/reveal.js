const { SlashCommandBuilder, EmbedBuilder, VoiceRegion } = require( 'discord.js' );
const { RDC, rollMap } = require( '../../diceRoller.js' );
const bw_data = require( '../../BW_data.js' );

module.exports = {
	category: 'Utility',
	cooldown: 5,

	data: new SlashCommandBuilder()
		.setName( 'reveal' )
		.setDescription( 'reveal scripted actions' )

		.addSubcommand( subcommand =>	subcommand.setName( 'dow' )
			.setDescription( `reveal scripted Duel of Wits actions` )
			.addUserOption( option => 	option.setName( 'opponent1' )
				.setDescription( 'Who will be involved?' )
				.setRequired( true )
			 )
			.addUserOption( option => 	option.setName( 'opponent2' )
				.setDescription( 'Who will be involved?' )
			 )
			.addUserOption( option => 	option.setName( 'opponent3' )
				.setDescription( 'Who will be involved?' )
			 )
			.addUserOption( option => 	option.setName( 'opponent4' )
				.setDescription( 'Who will be involved?' )
			 )
			.addIntegerOption( option => 	option.setName( 'volley' )
				.setDescription( 'show only a specific volley' )
				.setMinValue( 1 )
				.setMaxValue( 3 )
			 )
		 )
		.addSubcommand( subcommand =>	subcommand.setName( 'rac' )
			.setDescription( `reveal scripted Range and Cover maneuvers` )
			.addUserOption( option => 	option.setName( 'opponent1' )
				.setDescription( 'Who will be involved?' )
				.setRequired( true )
			 )
			.addUserOption( option => 	option.setName( 'opponent2' )
				.setDescription( 'Who will be involved?' )
			 )
			.addUserOption( option => 	option.setName( 'opponent3' )
				.setDescription( 'Who will be involved?' )
			 )
			.addUserOption( option => 	option.setName( 'opponent4' )
				.setDescription( 'Who will be involved?' )
			 )
			.addIntegerOption( option => option.setName( 'volley' )
				.setDescription( 'show only a specific volley' )
				.setMinValue( 1 )
				.setMaxValue( 3 )
			 )
		 )
		.addSubcommand( subcommand =>	subcommand.setName( 'fight' )
			.setDescription( `reveal scripted Fight! techniques` )
			.addUserOption( option => 	option.setName( 'opponent1' )
				.setDescription( 'Who will be involved?' )
				.setRequired( true )
			 )
			.addUserOption( option => 	option.setName( 'opponent2' )
				.setDescription( 'Who will be involved?' )
			 )
			.addUserOption( option => 	option.setName( 'opponent3' )
				.setDescription( 'Who will be involved?' )
			 )
			.addUserOption( option => 	option.setName( 'opponent4' )
				.setDescription( 'Who will be involved?' )
			 )
			.addIntegerOption( option => option.setName( 'volley' )
			.setDescription( 'show only a specific volley' )
			.setMinValue( 1 )
			.setMaxValue( 3 )
		 )
		 ),

	async execute( interaction ) 
	{
		/*rollMap.set( `dow-149249254383288320`, [ 5, 2, 1 ] ); // - boss
		rollMap.set( `dow-439480608943636481`, [ 0, 0, 0 ] );//- testbot
		//rollMap.set( `dow-468926033165549579`, [ 4, 4, 4 ] );//- onotangu

		rollMap.set( `rac-149249254383288320`, [ 7, 1, 0 ] ); //- boss
		rollMap.set( `rac-439480608943636481`, [ 10, 13, 12 ] );//- testbot
		//rollMap.set( `rac-468926033165549579`, [ 9, 8, 8 ] );//- onotangu*/

		const subC = interaction.options.getSubcommand();
		let msg = ``;
		let contestType = '';
		const volley = interaction.options.getInteger( 'volley' ) ?? -1;
		let actions = [];
		let names = [];
		let colour = 0;
		let scriptEmbed = []

		for ( i = 1; i < 5; i++ )
		{
			let contestant = interaction.options.getUser( `opponent${i}` );

			if ( contestant )
			{
				if ( rollMap.has( `${subC}-${contestant.id}` ) )
				{	
					actions.push( rollMap.get( `${subC}-${contestant.id}` ) );
					names.push( contestant.username );
				}
				else
				{	msg += `\n${contestant.username} has not submitted a ${subC} script.`; }
			}
		}

		if ( actions.length < 2 && rollMap.has( `${subC}-${interaction.user.id}` ) )
		{
			actions.unshift( rollMap.get( `${subC}-${interaction.user.id}` ) );
			names.unshift( interaction.user.username );
		}
		else
		{	msg += `\nYou have not submitted your ${subC} script.`	}

		if ( actions.length < 2 )
		{
			msg += `\n\nI don't have enough scripts to continue...`;
			await interaction.reply( msg );
		}
		else
		{
			switch ( subC )
			{
				case 'dow':
					contestType = `Duel of Wits`;
					colour = 39129;

					for ( i = 1; i < 4; i++ )
					{
						if ( volley === -1 || volley == i )
						{
							scriptEmbed.push( new EmbedBuilder() );
							scriptEmbed[ scriptEmbed.length - 1 ] 
								.setTitle( `Volley ${i}` )
								.setAuthor( { name: contestType } )
								.setColor( colour );

							for ( act in actions )
							{
								scriptEmbed[ scriptEmbed.length - 1 ].addFields( { name: names[act], value: `Ob: todo`, inline: true} );
							}

							scriptEmbed[ scriptEmbed.length - 1 ].addFields( { name: ' ', value: ' ', inline: false } );

							for ( act of actions )
							{
								scriptEmbed[ scriptEmbed.length - 1 ].addFields( { name: `__${bw_data.DoWAction[act[i-1]][0]}__`, value: `one day I'll put information about the action in here`, inline: true} );
							}
						}
					}

				break;

				case 'fight':
					contestType = `Fight!`;
					colour = 15879747;
					
					break;

				case 'rac':
					contestType = `Range and Cover`;
					colour = 35406;

					for ( i = 1; i < 4; i++ )
						{
							if ( volley === -1 || volley == i )
							{
								scriptEmbed.push( new EmbedBuilder() );
								scriptEmbed[ scriptEmbed.length - 1 ] 
									.setTitle( `Volley ${i}` )
									.setAuthor( { name: contestType } )
									.setColor( colour );
	
								for ( act in actions )
								{
									scriptEmbed[ scriptEmbed.length - 1 ].addFields( { name: names[act], value: `Ob: todo`, inline: true} );
								}
	
								scriptEmbed[ scriptEmbed.length - 1 ].addFields( { name: ' ', value: ' ', inline: false } );
	
								for ( act of actions )
								{
									scriptEmbed[ scriptEmbed.length - 1 ].addFields( { name: `__${bw_data.RaCActions[act[i-1]][0]}__`, value: `one day I'll put information about the action in here`, inline: true} );
								}
							}
						}
					break;
			}

			await interaction.reply( { embeds: scriptEmbed } );
		}
	}
}