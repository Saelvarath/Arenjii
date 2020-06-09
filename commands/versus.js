module.exports = ( robot ) =>
{
	const prefix = robot.config.printedPrefix;

	const vsHelpTopic = `__Versus Test__
Function: Compares rolls. Which rolls are compared depends on how many mentions follow the command.
Form: \`${prefix}versus {Tags...}\` or \`${prefix}vs {Tags...}\`
Extra Tags:
	- \`clear\`: Empties this channel's VS Stack (rolls made with the \`vs\` tag).
	- No Mentions: compares all rolls in this channel's VS stack. Clears the stack if successful.
	- One Mention: Compares mentioned person\'s last roll vs your last roll.
	- Two+ Mentions: Compares the last rolls of every person mentioned.
Notes:
	- The VS Stack is unique to each text channel, rolls made in different places will not be compared.
	- Each person's most recent roll is saved, this is independant of the channel it is made in, including DMs to the bot`;

/*//+ Shade Math
B (B + G + 2) / 2
G (B + W + 3) / 2
G (G + W + 3) / 2
-
W + W = W. 
W + G = G. 
W + B = G.
-
G + G = G.
G + B = B.
-
B + W + G 	= B.
W + G + G 	= G.
W + W + G 	= G.
*/


	robot.registerHelpTopic( "versus", vsHelpTopic );
	robot.registerCommand( /((?:vs)|(?:versus))\s?(clear)?/, `\`${prefix}versus {@user...}\`: __Versus Test__ Pits two or more rolls against eachother.`, ( message, test ) =>
	{
		let msg = '';
		let contenders = [];
		let firstDoS;

		if ( test[1] === "clear")
		{
			robot.rollMap.set( message.channel.id, [] );
			contenders = null;
			msg += 'The VS Stack has been emptied.'
		}
		// No mentions
		else if ( message.mentions.users.keyArray().length === 0 )
		{
			contenders = robot.rollMap.get( message.channel.id );

			if ( contenders !== null && contenders.length > 1 )
			{
				msg += 'Let the games begin!';
				robot.rollMap.set( message.channel.id, [] );
			}
			else
			{
				msg += '\nI need at least 2 rolls in the VS stack (previous rolls in this channel with the `vs` tag) or a @mention of one person to perform a VS test';
			}
		}
		// One mention
		else if ( message.mentions.users.keyArray().length === 1 )
		{
			let contA = robot.rollMap.get( message.author.id );
			let contB = robot.rollMap.get( message.mentions.users.firstKey() );

			if ( contA !== null && contB !== null )
			{
				contenders.push( contA, contB );
				msg += `You VS ${contB.owner.username}`;
			}
			else
			{
				msg += contA === null ? "\nYou haven't made a roll yet." : "";
				msg += contB === null ? `\n${message.mentions.users.array()[0].username} has not made a roll yet.` : "";
			}
		}
		// 2+ mentions
		else
		{
			message.mentions.users.array().forEach( mention =>
			{
				let cont = robot.rollMap.get( mention.id );

				if ( cont !== null ) //+ don't add duplicate mentions. 
				{
					contenders.push( cont );
				}
				else
				{
					msg += `\n${mention.username} hasn't made a roll yet`;
				}
			});

			if ( contenders.length < 2 )
				{	msg += 'Insufficient contestants.';	}
			else if ( contenders.length === 2 )
				{	msg += `${contenders[0].owner.username} VS ${contenders[1].owner.username}`;	}
			else
				{	msg += `A free for all!`;	}
		}

		// Final Calculations
		if ( contenders !== null && contenders.length > 1 )
		{
		//order by degree of success
			contenders.sort( function( a, b ) { return ( ( b.successes + b.astroResult - b.ObAddition ) / b.ObMultiplier - ( a.successes + a.astroResult - a.ObAddition ) / a.ObMultiplier ); } );
			firstDoS = ( contenders[0].successes + contenders[0].astroResult ) / contenders[0].ObMultiplier;
			secondDoS = ( contenders[1].successes + contenders[1].astroResult ) / contenders[1].ObMultiplier;

		// Output
			if ( contenders.length >= 2 )
			{
				//+ let winner = '';

				contenders.forEach( ( contestant, cI, cC ) =>
				{
					//+ highest DoS should not face itself
					contestant.obstacle = cI === 0 ? secondDoS : firstDoS;

					let totalSuc = contestant.successes + contestant.astroResult;
					let totalOb = contestant.obstacle * contestant.ObMultiplier + contestant.ObAddition;
					let totalPool = contestant.exponent + contestant.nonArtha + contestant.astroDice + contestant.helperDice;

					msg += `\n${contestant.reps === 0 ?	contestant.owner : 
														`**${contestant.owner.username} ${contestant.reps}**`} rolled ${totalSuc} against an Ob of ${totalOb}`;

					if ( contestant.ObMultiplier > 1 || contestant.ObAddition > 0 )
					{
						msg +=  ` [${Math.floor( 100 * contestant.obstacle ) / 100}`;
						msg += contestant.ObMultiplier > 1 ? ` * ${contestant.ObMultiplier}` : '';
						msg += contestant.ObAddition !== 0 ? ` + ${contestant.ObAddition}]` : ']';
					}
					
					if ( contestant.beginnersLuck )
					{
						let testDiff = RDC( totalPool, totalOb / 2 );

						if ( testDiff === 'Routine' )
						{
							msg += totalSuc >= totalOb ?	`, passing by ${totalSuc - totalOb} and showing Aptitude for a **new Skill**` :
															`, failing, but advancing towards a **new Skill**`;
						}
						else
						{
							msg += totalSuc >= totalOb ?	`, passing a ${testDiff} test for the **Root Stat** by ${totalSuc - totalOb}` :
															`, failing a ${testDiff} test for the **Root Stat**`;
						}
					}
					else
					{
						msg += totalSuc >= totalOb ?	`, passing a ${RDC( totalPool, totalOb )} test by ${totalSuc - totalOb}` :
														`, failing a ${RDC( totalPool, totalOb )} test`;
					}

					robot.rollMap.set( contestant.owner, contestant )
				});
			}
			else 
			{	msg += '/nYou need two to tango.';	}
		}

		message.channel.send( msg );
	} );
}


/*
In a versus test, Everyone has to roll before anyone knows their base Ob.
Once everyone has rolled, they each announce what degree of success they would have gotten in a graduated test (as if their base Ob was 0, essentially), but without rounding
Then you listen for the maximum degree of success among those you're testing against and take the maximum of those and use it as your base Ob.
Now calculate whether you succeeded or failed as normal (any 2x/4x/8x penalty and any +Ob penalty modifying that possibly-fractional base),
	if you succeeded, how many extra successes you got (at this point, round down).
Anyone who succeeded is eligible to win the versus test.
Whoever had the most extra successes actually does win, and their margin of success (actual extra successes) is the difference.
If you fail you count as having 0 extra successes. If there is a tie, the versus test is tied.
Note that if you fail, but your only opponent succeeds with 0 extra successes, (TODO: this should be verified) the versus test is still a tie.
*/
