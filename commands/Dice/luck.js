const { SlashCommandBuilder } = require( 'discord.js' );
const diceRoller = require( '../../diceRoller.js' );

module.exports = {
	category: 'Dice',

	data: new SlashCommandBuilder()
		.setName( 'luck' )
		.setDescription( 'Spend a Fate point to make a roll Open-Ended or reroll 1 traitor die. Once per roll.' )
		.addIntegerOption( option => 
			option.setName( 'anthology' )
				.setDescription( 'Anthology variant: 1 Fate rerolls a single 6.' )
				.setMinValue( 1 )
	 ),

	async execute( interaction ) {
		//+ if roll is not open ended but contains asto or independant open dice force choice?
		//+ figure out how astro dice work in this scenario
		//+ figure out how to handle pools with both open and non-open ended dice

		let prevPool = diceRoller.rollMap.get( interaction.user.id );
		let anthology = interaction.options.getInteger( 'anthology' ) ?? false;
		let msg = '';

		if ( prevPool !== null && !prevPool.isFated )
		{
			// Roll is Open-Ended
			if ( prevPool.isOpenEnded )
			{
				let traitor = 0;
				let traitorType = '';
				let reroll = 0;

				//? check for a negatively expoded die in Astrology pool first?
				/**
				* Luck— A player may spend a fate point to make the dice of a single roll open—ended ( 6s rerolled as new dice for additional successes ).
				* If the roll is already open-ended —Steel, Faith, Sorcery— then the player may reroll a single traitor ( which is not open—ended ).
				* Luck is purchased after the dice have been rolled.
				*/

				/**
				* the Astrology FORK die is different from other FORKS: The die is open-ended.
				* But unlike standard open—ended dice, it open-ends both ways. 
				* 6s are rerolled as per the normal open—end rules, but 1s are open-ended as well. 
				* If a 1 is rolled, reroll the die.
				* If the second roll is a failure, then a success is subtracted from the result.
				*/

				/** Certain rolls in Burning Wheel are described as “open—ended.”
				 * This means that any 6s rolled allow the player to pick up another die.
				 * If you hit your difficulty number or higher, it's a success.
				 * If you don't meet your difficulty number, the die is a traitor. 
				 * If you roll a 6, it counts as a success and you get to roll another die!
			 */

				// check exponent/Artha/FoRK/Advantage Pool
				prevPool.unified_pool.forEach( ( die, index, collection ) =>
				{
					if ( traitor === 0 && die < prevPool.shade )
					{
						traitor = die;
						reroll = diceRoller.roll();
						collection[index] = reroll;
						traitorType = 'Basic';
					}
				} );

				// check Helper Pool
				prevPool.helper_pool.forEach( helper =>
				{
					helper.forEach( ( die, index, collection ) =>
					{
						if ( traitor === 0 && die < prevPool.shade )
						{
							traitor = die;
							reroll = diceRoller.roll();
							collection[index] = reroll;
							traitorType = 'Helper';
						}
					} );
				} );

				// no die to reroll
				if ( traitor === 0 )
				{
					msg += 'Why would you spend Artha on a perfectly good roll?'
					if ( prevPool.fortune_pool.length !== 0 || prevPool.open_ended_pool.length !== 0 )
					{
						msg += "\n\nI don't know how to deal with a pool is already partially Open-Ended so those dice are ignored.";
					}
				}
				// die rerolled
				else
				{
					prevPool.isFated = true;
					msg += reroll >= prevPool.shade ? `Traitorous ${traitorType} die converted!\n${traitor} --> ${reroll}\nthat's +1 success for a total of ${++prevPool.unified_gains}` : `Your dice are commited to treachery.\nI rerolled a ${traitor} from your ${traitorType} dice but it doubled down became a ${reroll}`;


				}
			}
			// Roll is not Open-Ended and is using the Anthology variant
			else if ( anthology )
			{
				let values = diceRoller.anth_luck( anthology, prevPool.unified_pool, prevPool.shade );

				anthology = values[0];
				prevPool.open_ended_pool = prevPool.open_ended_pool.concat( values[1] );
				prevPool.unified_gains += values[3];

				prevPool.helper_pool.slice().forEach( ( helper, dI, dC ) =>
				{
					values = diceRoller.anth_luck( anthology, helper, prevPool.shade );

					anthology = values[0];
					prevPool.open_ended_pool = prevPool.open_ended_pool.concat( values[1] );
					prevPool.unified_gains += values[3];
				} );

				msg += prevPool.printPool();
				msg += anthology > 0 ? `\n\n**You spent ${anthology} more Fate than you needed to.**` : '';

			}
			// Roll is not Open-Ended and is using the base rules
			else
			{
				let results = [];

				// check unified Pool ( 1Dim Array of Base Exponent, FoRKs, Artha Dice, Advantage Dice ) 
				results = diceRoller.luck( prevPool.unified_pool, prevPool.shade );
				prevPool.unified_gains += results[0];
				prevPool.unified_pool = results[1]

				// check Helper Pool ( 2Dim Array )
				prevPool.helper_pool.slice().forEach( ( helper, hI, hC ) =>
				{	
					results = diceRoller.luck( helper, prevPool.shade );
					prevPool.unified_gains += results[0];
					prevPool.helper_pool[hI] = results[1];
				} );

				prevPool.fated = true;
				prevPool.isOpenEnded = true;

				msg += `## reroll results:\n\n${prevPool.printPool()}`;

				//+ make this work.
				if ( prevPool.fortune_pool.length !== 0 || prevPool.open_ended_pool.length !== 0 )
				{
					msg += "\n\nI don't know how to deal with a pool is already partially Open-Ended so those dice are ignored.";
				}
			}			

			diceRoller.rollMap.set( prevPool.owner_id, prevPool );
		}
		// Fate point already spent
		else
		{	msg += "No Previous roll or you've already spent a Fate point on that roll";	}

		await interaction.reply( msg );
	}
};