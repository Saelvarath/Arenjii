module.exports = (robot) =>
{
	const prefix = robot.config.prefix;
	let DicePool = robot.utils.DicePool;
	const roll = robot.utils.roll;

	robot.registerHelpLine( `\`${prefix}#k#\`: __Roll Dice__ - Will roll a pool of dice and keep a portion of them [# = 0-99]. see \`${prefix}help roll\` for more.`);
	robot.registerCommand( /([0-9]{1,2})k([0-9]{1,2})(\.|!)?(.*)?/i, ( message, syll ) =>
	{																		  //Syll = [#]k[#][.!*][...words...]

		//setup
		var currPool = new DicePool( Number.parseInt( syll[1] ), Number.parseInt( syll[2] ) );

		if ( syll[3] === '!' )			{	currPool.emphasis = true;	}
		else if ( syll[3] === '.' )		{	currPool.explodeOn = 11;	}

		currPool.owner = message.author;
		let wordy = true;

		//read and interpret each token
		const tagPattern = /([A-Z\+_-]+)([0-9]{0,2})/ig;
		let tokens = Array.from( ( syll[4] || "" ).matchAll( tagPattern ) );
		
		//-syll[4].trim().split(/\s+/g); //
		tokens.forEach( token =>
		{
			switch ( token[1].toLowerCase() )
			{
				/*/case 'ns':
				case 'no_save':
					saveRoll = false;
					break;
				//case 'tr':
				case 'test_roll':
					isTestRoll = true;
					break;*/
				//case 'em':
				case 'emphasis':
					currPool.emphasis = true;
					break;
				case 'keeplow':
					currPool.keepHigh = false;
					break
				//case 'ma':
				case 'mastery':
					currPool.explodeOn = currPool.explodeOn === 11 ? 11 : 9;
					break;
				//case 'ns':
				case 'no_show':
					wordy = false;
					break;
				//case 'un':
				case 'unskilled':
					currPool.explodeOn = currPool.explodeOn === 9 ? 9 : 11;
					break;
				case '+':
					currPool.bonus += Number.parseInt( token[2] );
					break;
				case '-':
					currPool.bonus -= Number.parseInt( token[2] );
					break;
				case 'tn':
					currPool.TN = Number.parseInt( token[2] );
					break;
				case 'raise':
					currPool.raises = Number.parseInt( token[2] );
					break;
			}
		});
		

	  //Rule of 10
		while ( currPool.rolledDice > 10 )
		{
			if ( currPool.rolledDice >= 10 && currPool.keptDice >= 10 )
			{
				currPool.bonus += ( currPool.rolledDice + currPool.keptDice - 20 ) * 2
				currPool.rolledDice = 10;
				currPool.keptDice = 10;
			}
			else if ( currPool.rolledDice == 11 && currPool.keptDice < 10 )
			{
				currPool.rolledDice = 10;
			}
			else if ( currPool.keptDice < 10 )
			{
				currPool.rolledDice -= 2;
				currPool.keptDice += 1;
			}
		}

	  //Roll the dice
		for (let r = 0; r < currPool.rolledDice; r++)
			{	currPool.pool.push( roll( currPool.explodeOn, currPool.emphasis ) );	}

		currPool.keepHigh ? currPool.pool.sort( function ( a, b ) { return b-a } ) : currPool.pool.sort( function ( a, b ) { return a-b } );

		for ( let k = 0; k < currPool.keptDice; k++ )
			{	currPool.kept += currPool.pool[k];	}

		message.channel.send( currPool.printPool( wordy ) );


	  //Save Roll
		/*if ( saveRoll )
		{
			//-client.rollMap.set( message.channel.id, currPool ); //is there any reason to save this?
			client.rollMap.set( message.author.id, currPool );
		}

		if ( isTestRoll )
		{
			testRoll = currPool;
			testRoll.owner = 'Test';
			msg = `Sure thing, Boss!\n${msg}\nThis is now the Versus Test Roll`;
		}*/
	});

	const rollHelpTopic = `__Roll the Dice__
Function: Rolls a pool of dice. Obeys the rule of 10.
Form: \`${prefix}xKy{!|.} {Extra Tags}\`
\t\`x\` a number from 0 to 99, how many dice are rolled.
\t\`y\` a number from 0 to 99, how many dice are kept.
\t\`!\` *optional*; adding this causes natural 1's to be rerolled once.
\t\`.\` *optional*; adding this prevents dice from exploding.
Extra Tags:
\t\`-#\` subtract # from the roll's result.
\t\`+#\` add # to the roll's result.
\t\`emphasis\` causes natural 1's to be rerolled once.
\t\`mastery\` makes dice explode on 9s.
\t\`raise#\` calls # raises on the roll, increasing the TN.
\t\`unskilled\` prevents dice from exploding.`;

//\t\`no_show\` only display the final result of the roll.
//\t\`tn#\` sets the Target Number for the roll.

	robot.registerHelpTopic( /roll/i, rollHelpTopic );
};
