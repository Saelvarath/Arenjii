const { SlashCommandBuilder } = require( 'discord.js' );
const diceRoller = require( '../../diceRoller.js' );

module.exports = {
	category: 'Dice',

	data: new SlashCommandBuilder()
		.setName( 'grace' )
		.setDescription( 'Spend a Deeds point to reroll all traitor dice! Usable once per roll.' )
	,

	async execute( interaction ) 
	{
		let msg = '';
		let prevPool = diceRoller.rollMap.get( interaction.user.id );

		if ( !prevPool )
			{	msg += 'You need to actually make a roll first.';	 }
		else if ( prevPool.isGraced )
			{	msg += `You've already had a Saving Grace.`;	}
		else
		{
			msg += '### Rerolling all Traitors!';

			let prevShade = prevPool.shade;
			let astroTally = 0;
			let expoTally = 0;

			let result = [];
			//let newPool = [];

			// Check Astrology pool ( 1D Array )
			/*for ( astI = 0; prevPool.astroPool[astI] != null; astI++ )
			{
				let prevFace = prevPool.astroPool[astI];
				if ( prevFace < prevShade )
				{
					result = diceRoller.roll();
					newPool.push( result ); 
					astroTally += result >= prevShade;

					//ignore the die after a 1 and remove negative success
					if ( prevFace === 1 && prevPool.astroPool[ ++astI ] < prevShade )
						{	astroTally += 1;	} 

					// explode 6s
					while ( result === 6 )
					{
						result = diceRoller.roll();
						newPool.push( result ); 
						astroTally += result >= prevShade;
					}

					// reroll 1s
					if ( result === 1 )
					{
						result = diceRoller.roll();
						newPool.push( result ); 
						astroTally -= result < prevShade;
					}

				} else { newPool.push( prevFace ) }
			}

			prevPool.astroResult += astroTally;
			prevPool.astroPool = newPool;*/
			

			// Check independant Open pool ( 1D Array )
			result = diceRoller.reroll_traitors( prevPool.open_ended_pool, prevShade, true )
			expoTally += result[0]
			prevPool.open_ended_pool = result[1];

			// Check exponent Pool ( 1D Array )
			result = diceRoller.reroll_traitors( prevPool.unified_pool, prevShade, prevPool.isOpenEnded )
			expoTally += result[0]
			prevPool.unified_pool = result[1];


			// Check Helper pool ( 2D Array )
			prevPool.helper_pool.slice().forEach( ( helper, hI, hC ) =>
			{
				result = diceRoller.reroll_traitors( helper, prevShade, prevPool.isOpenEnded )
				expoTally += result[0];
				prevPool.helper_pool[hI] = result[1];
			} );

			// output
			if ( result === 0 )
			{
				msg += 'There was nothing to reroll...'
			}
			else
			{
				prevPool.isGraced = true;
				
				prevPool.unified_gains += expoTally;
				diceRoller.rollMap.set( interaction.user.id, prevPool );
				msg += `\n**Your rerolls net you ${astroTally + expoTally} successes.\n${prevPool.printPool()}**`;
			}
		}

		await interaction.reply( msg );
    }
};