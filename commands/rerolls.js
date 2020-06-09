module.exports = ( robot ) =>
{
	const prefix = robot.config.printedPrefix;
	const roll = robot.utils.roll;

	robot.registerHelpTopic( "grace", `__Saving Grace, Deeds Point__\nFunction: Rerolls all Traitor Dice in your previous roll. Usable once per roll.\nForm: \`${prefix}grace\`` );
	robot.registerHelpTopic( "luck", `__Luck, Fate point__\nFunction: Rerolls all 6s in your previous roll if it wasn\'t open-ended or one traitor die if it was. Usable once per roll.\n\nForm: \`${prefix}fate\` or \`${prefix}luck\`` );
	robot.registerHelpTopic( 'callon', `__Call-On Trait__\nFunction: Rerolls all traitor dice in your previous roll. Usable once per roll.\nForm: \`${prefix}co\` or \`${prefix}callon\`` );

	// Luck; Fate point, retroactively make a roll Open-Ended or reroll one die
	//+ figure out how to handle pools with both open and non-open ended dice
		//+ if roll is not open ended but contains asto or independant open dice force choice?


	//robot.registerHelpLine( `\`${prefix}fate\`: an alias for \`${prefix}luck\`.` );

	let luckHelpLine = `\`${prefix}luck\`: __Luck, Fate point__ Rerolls all 6s in the previous roll if it wasn't open-ended or one traitor die if it was.`;
	robot.registerCommand( /((?:fate)|(?:luck))/i, luckHelpLine, ( message, test ) =>
	{
		// Luck; Fate point, retroactively make a roll Open-Ended or reroll one die
		//+ if roll is not open ended but contains asto or independant open dice force choice 
		//+ figure out how astro dice work in this scenario
		//+ figure out how to handle pools with both open and non-open ended dice 

		let msg = '';
		let prevPool = robot.rollMap.get( message.author.id );

		if ( prevPool !== undefined && !prevPool.fated )
		{
			// Roll is Open-Ended
			if ( prevPool.isOpenEnded )
			{
				let traitor = 0;
				let traitorType = '';
				let reroll = 0;

				//? check for a negatively expoded die in Astrology pool first?
				/* Luck— A player may spend a fate point to make the dice of a single roll open—ended (6s rerolled as new dice for additional successes).
				 * If the roll is already open-ended —Steel, Faith, Sorcery— then the player may reroll a single traitor (which is not open—ended).
				 * Luck is purchased after the dice have been rolled.*/

				/* the Astrology FORK die is different from other FORKS: The die is open-ended.
				 * But unlike standard open—ended dice, it open-ends both ways. 
				 * 6s are rerolled as per the normal open—end rules, but 1s are open-ended as well.
				 * If a 1 is rolled, reroll the die.
				 * If the second roll is a failure, then a success is subtracted from the result.*/

				/* This means that any 6s rolled allow the player to pick up another die.
				 * If you hit your difficulty munber or higher, it's a success.
				 * If you don't meet your difficulty number, the die is a traitor. 
				 * If you roll a 6, it counts as a success and you get to roll another die!*/

				// check exponent/Artha/FoRK/Advantage Pool
				prevPool.basePool.forEach( ( die, index, collection ) =>
				{
					if ( traitor === 0 && die < prevPool.shade )
					{
						traitor = die;
						reroll = roll();
						collection[index] = reroll;
						traitorType = 'Exponent';
					}
				});

				// check Helper Pool
				prevPool.helperPool.forEach( helper =>
				{
					helper.forEach( ( die, index, collection ) =>
					{
						if ( traitor === 0 && die < prevPool.shade )
						{
							traitor = die;
							reroll = roll();
							collection[index] = reroll;
							traitorType = 'Helper';
						}
					});
				});

				// no die to reroll
				if ( traitor === 0 )
				{
					msg += 'Why would you spend Artha on a perfectly good roll?'
				}
				// die rerolled
				else
				{
					prevPool.fated = true;
					msg += reroll >= prevPool.shade ?	`Traitorous ${traitorType} die converted!\n${traitor} => ${reroll}\nthat's +1 success for a total of ${++prevPool.successes}` :
														`Well, you tried...\nI rerolled a ${traitor} from your ${traitorType} dice but only got at ${reroll}`;
				}
			}
			// Roll Not Open-Ended
			else
			{
				let rerollBase = [];
				let rerollHelp = [];
				let newRoll = 0;

				// check exponent Pool (1Dim Array)
				prevPool.basePool.slice().forEach( ( die, dI, dC ) =>
				{
					if ( die === 6 )
					{
						newRoll = roll();
						while ( newRoll === 6 )
						{
							rerollBase.push( newRoll );
							prevPool.successes += newRoll >= prevPool.shade;
							prevPool.basePool.splice( dI + rerollBase.length, 0, newRoll );
							newRoll = roll();
						}
						rerollBase.push( newRoll );
						prevPool.successes += newRoll >= prevPool.shade;
						prevPool.basePool.splice( dI + rerollBase.length, 0, newRoll );
					}
				});

				// check Helper Pool (2Dim Array)
				prevPool.helperPool.slice().forEach( ( helper, hI, hC ) =>
				{
					rerollHelp.push( [] );

					helper.slice().forEach( ( die, dI, dC ) =>
					{
						if ( die === 6 )
						{
							newRoll = roll();

							while ( newRoll === 6 )
							{
								rerollHelp[hI].push( newRoll );
								prevPool.successes += newRoll >= prevPool.shade;
								prevPool.helperPool[hI].splice( dI + rerollHelp[hI].length, 0, newRoll );
								newRoll = roll();
							}
							rerollHelp[hI].push( newRoll );
							prevPool.successes += newRoll >= prevPool.shade;
							prevPool.helperPool[hI].splice( dI + rerollHelp[hI].length, 0, newRoll );
						}
					});
				});

				prevPool.fated = true;
				prevPool.isOpenEnded = true;

				msg += `**reroll results:**\n${prevPool.printPool()}`;

				if ( prevPool.astroDice !== 0 || prevPool.openEndedDice !== 0 )
				{
					//+ make this work.
					msg += "\n\nI don't know how to deal with a pool is already partially Open-Ended so those dice are ignored.";
				}
			}

			message.channel.send( msg );
			robot.rollMap.set( message.author.id, prevPool );
		}
	});

	robot.registerHelpLine( `\`${ prefix }grace\`: __Saving Grace, Deeds Point__ Rerolls all traitor dice, tracked separately from Call-on.` );
	robot.registerHelpLine( `\`${ prefix }callon\`: __Call On Trait__ rerolls all traitor dice. Tracked separatetly from Saving Grace.` );
	robot.registerCommand( /(c(?:allon|o)|grace)/, ( message, test ) =>
	{
		let msg = '';
		const isCallon = test[1].toLowerCase() === 'c';
		let prevPool = robot.rollMap.get( message.author.id );
		
		if ( !prevPool )
		{	message.channel.send('You need to make a roll first'); return;	}
		else if ( prevPool.calledOn && isCallon )
		{	message.channel.send('You have already used a Call-on trait for this roll.'); return;	}
		else if ( prevPool.graced && !isCallon )
		{	message.channel.send(`You already had a Saving Grace.`); return;	}

		let prevShade = prevPool.shade;
		let result = 0;

		// Check Astrology pool
		let astroTally = 0;
		for ( a = 0; newRoll = [], prevPool.astroPool[a] != null; a += newRoll.length ? newRoll.length : 1 )
		{
			
			if ( prevPool.astroPool[a] < prevShade )
			{
				result = roll();
				newRoll.push( result ); 
				astroTally += result >= prevShade;
				
				// explode 6s
				while ( result === 6 )
				{
					result = roll();
					newRoll.push( result ); 
					astroTally += result >= prevShade;
				}
				
				// reroll 1s
				if ( result === 1 )
				{
					result = roll();
					newRoll.push( result ); 
					astroTally -= result <= prevShade;
				}
				
				if ( prevPool.astroPool[a] === 1 )
				{
					astroTally += prevPool.astroPool[ a + 1 ] < prevShade;
					prevPool.astroPool.splice( a, 2, ...newRoll);
				}
				else
				{	prevPool.astroPool.splice( a, 1, ...newRoll );	}
			}
			
		}

		prevPool.astroResult += astroTally;

		// Check independant Open pool (1Dim Array)
		prevPool.openEndedPool.slice().forEach( ( ioe, iI, iC ) =>
		{
			let newRoll = [];
			
			if ( ioe < prevShade )
			{
				result = roll();
				newRoll.push( result );
				expoTally += result >= prevShade;
				while ( prevPool.isOpenEnded && result === 6 )
				{
					result = roll();
					newRoll.push( result );
					expoTally += result >= prevShade;
				}
				prevPool.openEndedPool.splice( iI, 1, ...newRoll );
			}
		});

		let expoTally = 0;
		// Check exponent Pool (1Dim Array)
		prevPool.basePool.slice().forEach( ( die, dI, dC ) =>
		{
			let newRoll = [];
			
			if ( die < prevShade )
			{
				result = roll();
				newRoll.push( result );
				expoTally += result >= prevShade;
				while ( prevPool.isOpenEnded && result === 6 )
				{
					result = roll();
					newRoll.push( result );
					expoTally += result >= prevShade;
				}
				prevPool.basePool.splice( dI, 1, ...newRoll );
			}
		});

		// Check Helper pool (2Dim Array)
		prevPool.helperPool.slice().forEach( ( helper, hI, hC ) =>
		{
			helper.forEach( ( hDie, dII, dC ) =>
			{
				let newRoll = [];
				
				if ( hDie < prevShade )
				{
					result = roll();
					newRoll.push( result );
					expoTally += result >= prevShade;
					while ( prevPool.isOpenEnded && result === 6 )
					{
						result = roll();
						newRoll.push( result );
						expoTally += result >= prevShade;
					}
					prevPool.helperPool[hI].splice( dII, 1, ...newRoll );
				}
			});
		});

		// output
		if ( result === 0 )
		{
			msg += 'There was nothing to reroll...'
		}
		else
		{
			if ( test ) //callon
			{	prevPool.calledOn = true;	}
			else //grace
			{	prevPool.graced = true;	}
			
			prevPool.successes += expoTally;
			robot.rollMap.set( message.author.id, prevPool );
			msg += `your rerolls net you ${astroTally + expoTally} successes.\n${prevPool.printPool()}`;

		}

		message.channel.send( msg );
	});
};