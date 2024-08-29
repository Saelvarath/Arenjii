const { SlashCommandBuilder } = require( 'discord.js' );
const { rollMap, rollPool} = require( '../../diceRoller.js' );
const dicePool = require( '../../dicePool.js' );

const rollPattern = RegExp( '([bgw])(\\d{1,2})(!?)', 'i' );

module.exports = {
	category: 'Dice',

	data: new SlashCommandBuilder()
		.setName( 'roll' )
		.setDescription( 'roll a pool of dice!' )
		.addStringOption( option => option.setName( 'exponent' )
			.setDescription( 'the base exponent of the roll. [bgw]#!' )
			.setMinLength( 1 )
			.setMaxLength( 4 )
			.setRequired( true )
		 )
		.addIntegerOption( option => option.setName( 'obstacle' )
			.setDescription( 'Obstacle of the test' )
			.setMinValue( 1 )
		 )
		.addIntegerOption( option => option.setName( 'advantage' )
			.setDescription( 'Number of Advantage dice to add to the roll' )
			.setMaxValue( 5 )
			.setMinValue( 1 )
		 )
		.addIntegerOption( option => option.setName( 'disadvantage' )
			.setDescription( 'Amount added to the base Ob of the test.' )
			.setMaxValue( 3 )
			.setMinValue( 1 )
		 )
		.addIntegerOption( option => option.setName( 'forks' )
			.setDescription( 'Dice added through FoRKing skills.' )
			.setMinValue( 1 )
		 )
		.addIntegerOption( option => option.setName( 'fortune' )
			.setDescription( 'Dice added by FoRking in Astrology, Rune Casting or Nature of All Things' )
			.setMaxValue( 4 )
			.setMinValue( 1 )
		 )
		.addBooleanOption( option => option.setName( 'beginners_luck' )
			.setDescription( 'Multiply your Base Obstacle by 2, tells you if the test goes towards the ability or the skill' )
		 )
		.addIntegerOption( option => option.setName( 'helper_1' )
			.setDescription( 'Add a helper with an exponent of # and calculate the difficulty of their test.' )
			.setMinValue( 1 )
			.setMaxValue( 10 )
		 )
		.addIntegerOption( option => option.setName( 'helper_2' )
			.setDescription( 'Add a second helper with an exponent of # and calculate the difficulty of their test.' )
			.setMinValue( 1 )
			.setMaxValue( 10 )
		 )
		.addIntegerOption( option => option.setName( 'helper_3' )
			.setDescription( 'Add a third helper with an exponent of # and calculate the difficulty of their test.' )
			.setMinValue( 1 )
			.setMaxValue( 10 )
		 )
		.addIntegerOption( option => option.setName( 'helper_4' )
			.setDescription( 'Add a fourth helper with an exponent of # and calculate the difficulty of their test.' )
			.setMinValue( 1 )
			.setMaxValue( 10 )
		 )
		.addIntegerOption( option => option.setName( 'helper_5' )
			.setDescription( 'Add a fifth helper with an exponent of # and calculate the difficulty of their test.' )
			.setMinValue( 1 )
			.setMaxValue( 10 )
		 )
		.addIntegerOption( option => option.setName( 'add_artha' )
			.setDescription( 'adds Artha dice to the pool, usually through Greed' )
			.setMinValue( 1 )
		 )
		.addIntegerOption( option => option.setName( 'add_open-ended' )
			.setDescription( 'add open-ended dice, usually through Grief or Hatred' )
			.setMinValue( 1 )
		 )
		.addIntegerOption( option => option.setName( 'boon' )
			.setDescription( 'spend 1-3 Persona points to add artha dice to your roll' )
			.setMaxValue( 3 )
			.setMinValue( 1 )
		 )
		.addBooleanOption( option => option.setName( 'divine_inspiration' )
			.setDescription( 'Use a Deeds point to double your exponent. Be sure to separate you bonuses.' )
		 )
		.addBooleanOption( option => option.setName( 'no_save' )
			.setDescription( 'If set to true this roll will *not* overwrite your previous roll.' )
		 )
		.addIntegerOption( option => option.setName( 'ob_multiplier' )
			.setDescription( 'Amount to multiply the Base Obstacle by.' )
			.setMinValue( 1 )
			.setMaxValue( 6 )
		 )
		.addBooleanOption( option => option.setName( 'vs_test' )
			.setDescription( 'Hide the results of the roll until the `/versus` command is called.' )
		 ),

	async execute( interaction ) 
	{
		let currPool = new dicePool;
		
		const test = interaction.options.getString( 'exponent' ).toLowerCase();

		const base = rollPattern.exec( test ); 

		if ( !base || base[1] < 1 )
		{
			await interaction.reply( {content: "Invalid exponent.\n- `b4`: roll 4 black shaded dice\n- `g10`: roll 10 grey shaded dice\n- `w25`: roll 25 white shaded dice.\n\nadding a bang ( `!` ) to the end ( eg. `b7!` ) makes the roll open-ended", ephemeral: true } );
		}
		else
		{
			currPool.owner = interaction.user.username;
			currPool.owner_id = interaction.user.id;
			currPool.shade = [ 0, 0, 'w', 'g', 'b' ].indexOf( base[1] )
			currPool.exponent_base = Number( base[2] );
			currPool.unified_pool = Number( base[2] );
			currPool.total_rolled = Number( base[2] );
			currPool.isOpenEnded = base[3] === '!';

			let isVS = false;
			let saveRoll = true;

			let opt = interaction.options.data

			//+ have things like Beginners luck and Divine Inspiration change numbers AFTER all tags are read.
			for ( let i in opt )
			{
				const amount = opt[i].value;

				switch ( opt[i].name )
				{
					case 'advantage':  // Advantage dice
						currPool.unified_pool += amount;
						currPool.total_rolled += amount;
						break;

					case 'forks':  // FoRK dice, an exponent of 7+ adds two dice, FoRKs are 5+ for two
						currPool.unified_pool += amount;
						currPool.total_rolled += amount;
						break;

					case 'fortune':  // Astrology, Nature of All Things, Rune Casting
						currPool.fortune_pool += amount;
						currPool.total_rolled += amount;
						break;

					case 'add_artha':	// add Artha dice, usually through an emotional attribute
						currPool.artha_amount += amount;
						currPool.unified_pool += amount;
						currPool.total_rolled += amount;
						break;

					case 'beginners_luck':  // Beginner's Luck
						currPool.ob_multiplier *= 2;
						currPool.isBeginnersLuck = true;
						break;

					case 'boon':  // Boon; Persona Point - +1D-3D to a roll
						currPool.artha_amount += amount;
						currPool.total_rolled += amount;
						currPool.unified_pool += amount;
						break;

					case 'divine_inspiration':  // Divine Inspiration; Deeds Point - doubles base Exponent
						currPool.artha_amount += currPool.exponent_base;
						currPool.total_rolled += currPool.exponent_base;
						currPool.unified_pool += currPool.exponent_base;
						break;

					case 'disadvantage':  // Disadvantage
						currPool.ob_addition += amount;
						break;

					case 'helper_1':  // Helper @ Exponent
					case 'helper_2':
					case 'helper_3':
					case 'helper_4':
					case 'helper_5':

						let h = amount > 4 ? 2 : 1;

						currPool.helper_pool.push( h );
						currPool.total_rolled += h;

						currPool.helper_exponent.push( amount );
						break;

					case 'no_save':  // No save
						saveRoll = amount;
						break;

					case 'obstacle':  // Base obstacle
						currPool.ob_base = amount;
						break;

					case 'add_open-ended':	// Open ended dice
						currPool.open_ended_pool += amount;
						currPool.total_rolled += amount;
						break;

					case 'ob_multiplier':  // Base Obstacle multiplier
						currPool.ob_multiplier *= amount;
						break;

					case 'vs_test':
						isVS = amount;
						break;
				}
			}

			let results = []; 
	
			// roll astrology dice
			results = rollPool( currPool.fortune_pool, currPool.shade, true, true )
			currPool.fortune_gains += results[0];
			currPool.unified_gains += results[0];
			currPool.fortune_pool = results[1];
			
			// roll Independantly Open-Ended dice
			results = rollPool( currPool.open_ended_pool, currPool.shade, true )
			currPool.unified_gains += results[0];
			currPool.open_ended_pool = results[1];

			// roll helper dice
			currPool.helper_pool.slice().forEach( ( helper, hI, hC ) =>
			{
				results = rollPool( helper, currPool.shade, currPool.isOpenEnded )
				currPool.unified_gains += results[0];
				currPool.helper_pool[hI] = results[1];
			} );

			// Roll Exponent dice
			results = rollPool( currPool.unified_pool, currPool.shade, currPool.isOpenEnded )
			currPool.unified_gains += results[0];
			currPool.unified_pool = results[1];
		
			// VS Test
			if ( isVS )
			{
				//+
				saveRoll = false;
	
				let vsRolls = ( rollMap.get( interaction.channel.id ) ?? [] );
	
				//+ gross...
				vsRolls.forEach ( ( participant ) =>
				{
					if ( participant.reps <= currPool.reps )
					{
						currPool.reps++;
					}
				} );
	

				await interaction.channel.send( `${interaction.user.username} sent a roll to this channel's vs stack.` );
				
				vsRolls.push( currPool );
				
				rollMap.set( interaction.channel.id, vsRolls );

				await interaction.reply( { content: currPool.printPool(), ephemeral: true } ) ;
				
				/*message.channel.send( `${currPool.reps === 0 ?	currPool.owner.username : 
																currPool.owner.username + ' ' + currPool.reps} added a roll to the VS pile.` );
				/**/
			}
		  // Output
			else
			{	await interaction.reply( currPool.printPool() ) ;	}
			
			// Save Roll
			if ( saveRoll )
			{	rollMap.set( interaction.user.id, currPool );	}

			
		}
	}
};

	
/*Greed: 
- Aids or hinders Resource tests
- 1Pp: add [1 -> Greed] dice to a roll. Act as Artha Dice.
Grief: 
- 1Dp, add [Grief] dice to a spell/skill song exponent. Independantly Open-Ended.
Hatred: 
- 1/session: may test Hatred in place of any skill or stat if appropriate. Open-Ended.
- 1Dp: add [Hatred] to the roll instead of doubling exponent. Independantly Open-Ended.
Spite:
- 1Dp: add [Spite] dice to a roll.
Corruption: 
- may test Corruption in place of Forte for spell tax
- 1Fp: Corruption Exponent helps skill/stat roll. 
- 1Pp: may test Corruption in place of any skill or stat
- 1Dp: add [Corruption] to the roll instead of doubling exponent.
*/
// Rune Casting, Nature of all things also function like this?