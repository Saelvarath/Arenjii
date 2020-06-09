module.exports = (robot) =>
{
	const prefix = robot.config.printedPrefix;
	let DicePool = robot.utils.DicePool;
	const roll = robot.utils.roll;

	robot.registerHelpLine( `\`${ prefix }b#{!}\`, \`${ prefix }g#{!}\`, \`${ prefix }w#{!}\` all include \`{tags...}\`. Rolls a pool of \`#\` [0-99] black, grey or white dice respectively.\n\t\tuse \`${ prefix }help roll\` for more info on how to roll.`);
	robot.registerCommand( /([bgw])(\d{1,2})(!)?(.*)?/i, ( message, test ) =>
	{
		// setup
		var currPool = new DicePool();
		currPool.owner = message.author;
		currPool.shade = [ 0, 0, 'w', 'g', 'b' ].indexOf(test[1])
		currPool.exponent = Number( test[2] );
		currPool.isOpenEnded = test[3] === '!';
		let isVS = false;
		let saveRoll = true;

		const testPattern = /(\w{2})(\d{0,2})/ig;

		// read and interpret each token
		let tokens = Array.from( ( test[4] || "" ).matchAll( testPattern ) );

		tokens.forEach( ( token ) =>
		{
			let flag = token[1].toLowerCase();
			if ( flag )
			{
				let amount = parseInt (token[2] );

				switch ( flag )
				{
					case 'ad':  // Advantage dice
						//+ restrict to +2D?
					case 'fk':  // FoRK dice
						//+ use exponent, not number of dice to add?
						currPool.nonArtha += amount;
						break;
					case 'as':  // Astrology
						if ( amount !== 0 && currPool.astroDice === 0)
						{
							currPool.astroDice += amount;
							/*currPool.astroDice++;
							
							if ( amount >= 5 )
							{
								currPool.astroDice++;
							}*/
						}
						break;
					case 'ar':
						currPool.arthaDice += amount;
						break;
					case 'bl':  // Beginner's Luck
						if ( !currPool.beginnersLuck )
						{
							currPool.ObMultiplier *= 2;
							currPool.beginnersLuck = true;
						}
						break;
					case 'bn':  // Boon; Persona Point - +1D-3D to a roll
						if ( currPool.booned < 3 )
						{
							if ( amount + currPool.booned >= 3 )
							{
								currPool.arthaDice = 3;
								currPool.booned = 3;
							}
							else
							{
								currPool.arthaDice += amount;
								currPool.booned += amount;
							}
						}
						break;
					case 'di':  // Divine Inspiration; Deeds Point - doubles base Exponent
						if ( !currPool.inspired )
						{
							currPool.arthaDice += currPool.exponent;
							currPool.inspired = true;
						}
						break;
					case 'ds':  // Disadvantage
						currPool.ObAddition += amount;
						break;
					case 'he':  // Helper dice
						if ( amount > 4 ) // five or more is two dice, FoRKs are 7+ for 2
						{
							currPool.helperPool.push( [0, 0] );
							currPool.helperDice += 2;
						}
						else
						{
							currPool.helperPool.push( [0] );
							currPool.helperDice++;
						}
						currPool.helperExponent.push( amount );
						break;
					case 'ns':  // No save
						saveRoll = false;
						break;
					case 'ob':  // Base obstacle
						currPool.obstacle = amount;
						break;
					case 'oe':
						currPool.openEndedDice += amount;
						break;
					case 'ox':  // Base Obstacle multiplier
						currPool.ObMultiplier *= amount > 0 ? amount : 1;
						break;
					case 'vs':  // this is a VS test
						isVS = true;
						break;
				}
			}
		});

		// Find total dice rolled
		currPool.totalRolled = currPool.exponent + currPool.arthaDice + currPool.nonArtha + currPool.openEndedDice + currPool.astroDice + currPool.helperDice;

		// roll astrology dice
		for ( a = 0; a < currPool.astroDice; a++ )
		{
			let astRoll = roll();
			currPool.astroResult += astRoll >= currPool.shade;
			currPool.astroPool.push( astRoll );

			while ( astRoll === 6 )
			{
				astRoll = roll();
				currPool.astroResult += astRoll >= currPool.shade;
				currPool.astroPool.push( astRoll );
			}
			
			if ( astRoll === 1 )
			{
				astRoll = roll();
				currPool.astroResult -= astRoll < currPool.shade;
				currPool.astroPool.push( astRoll );
			}
		}
		
		// roll Independantly Open-Ended dice
		for ( o = 0; o < currPool.openEndedDice; o++ )
		{
			let openRoll = roll();
			
			if ( openRoll >= currPool.shade ) 
			{	currPool.successes++;	}
			if ( openRoll === 6 ) 
			{	o--;	}
			
			currPool.openEndedPool.push( openRoll );
		}
		
		// roll helper dice
		for ( h = 0; h < currPool.helperPool.length; h++ )
		{
			let helpRoll = [];
			
			for ( h2 = 0; h2 < currPool.helperPool[h].length; h2++ )
			{
				let r = roll();
				currPool.successes += r >= currPool.shade;
				helpRoll.push( r );
				
				while ( currPool.isOpenEnded && r === 6 )
				{
					r = roll();
					currPool.successes += r >= currPool.shade;
					helpRoll.push( r );
				}
			}
			
			currPool.helperPool[h] = helpRoll;
		}
		
		// Roll Exponent dice
		for ( d = 0; d < Number( currPool.exponent ) + Number( currPool.arthaDice ) + Number( currPool.nonArtha ); d++ )
		{
			let r = roll();
			
			if ( r >= currPool.shade ) 
			{	currPool.successes++;	}
			if ( currPool.isOpenEnded && r === 6 ) 
			{	d--;	}
			
			currPool.basePool.push( r );
		}
		
		// VS Test
		if ( isVS )
		{
			saveRoll = false;

			let vsRolls = ( robot.rollMap.get( message.channel.id ) || [] );

			//+gross
			vsRolls.forEach ( (participant) =>
			{
				if ( participant.reps <= currPool.reps )
				{
					currPool.reps++;
				}
			} );

			vsRolls.push( currPool );
			
			robot.rollMap.set( message.channel.id, vsRolls );
			
			message.channel.send( `${currPool.reps === 0 ?	currPool.owner.username : 
															currPool.owner.username + ' ' + currPool.reps} added a roll to the VS pile.` );
		}
		
		// Output
		if ( !isVS )
		{
			message.channel.send( currPool.printPool() );
		}
		
		// Save Roll
		if ( saveRoll )
		{	robot.rollMap.set( message.author.id, currPool );	}
	});

	const rollHelpTopic = `__Roll the Dice__

Function: Rolls a pool of dice

Form: \`~X#{!}\`
	\`X\` Accepts \`b\`, \`g\` or \`w\`. Determines the __Shade__ (Black, Grey or White respectively) of the roll.
	\`#\` The __Base Exponent__ of the Test to be rolled [0-99].
	\`!\` Adding this makes the roll Open-Ended

Extra Tags:
	\`ad#\` Adds \`#\` __Advantage__ dice to the roll.
	\`ar#\` Adds \`#\` __Artha__ dice to the roll.
	\`as#\` FoRK in your __Astrology__. \`#\` = [your Astrology exponent].
	\`bl \` __Beginners' Luck__: Multiplies Base Obstacle by 2, calculates if the test goes towards the ability or the skill
	\`bn#\` spend \`#\` [3 Max] Persona points on a __Boon__, adding \`#\` Artha dice to the roll.
	\`di \` spend a Deeds Point for __Divine Inspiration__, Adding [Base Exponent] Artha dice to the roll.
	\`ds#\` Adds \`#\` __Disadvantage__ to the Base Obstacle.
	\`fk#\` __FoRK__ in \`#\` dice. See \`as\` to FoRK in Astrology.
	\`he#\` add a __Helper with Exponent__ of \`#\` and calculate the difficulty of their test.
	\`ns \` This roll is __Not Saved__ as your previous roll.
	\`ob#\` Set the __Base Obstacle__ of the task to \`#\`.
	\`oe#\` Adds \`#\` dice that are __Open-Ended__ to the roll. (Grief, Hatred, Cloak of Darkness)
	\`ox#\` __Obstacle, Multiplier__: Multiplies the Base Obstacle by \`#\`.
	\`vs \` make a anonymous roll to be used in a __Versus Test__. Hides and doesn't save the results. Trigger the Versus Test with \`${prefix}versus\`.

Notes:
	- Its usually okay to include FoRKs and Advantage dice in your Exponent. The exception being when the \`di\` tag is included.
	- Similarly, unless the \`bl\` or \`ox\` tags are included it's alright to forgo the \`ds\` tag`;

	robot.registerHelpTopic( "roll", rollHelpTopic );

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