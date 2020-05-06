module.exports = (robot) =>
{
	const prefix = robot.config.prefix;

	const diffHelpTopic = `__Difficulty Calculator__
Function: Returns if a test is Routine, Difficult or Challenging.
Form: \`${ prefix }diff X Y\` or \`${ prefix }difficulty X Y\` or \`${ prefix }rdc X Y\`
	- \`X\` is the number of dice rolled.
	- \`Y\` is the Obstacle of the test.`;

	robot.registerHelpTopic( diffHelpTopic );
	robot.registerCommand(/(?:diff(?:iculty)?|rdc)\s*(?:([+-]?\d+)\s([+-]?\d+))?/i, `\`${ prefix }difficulty X Y\`: __Difficulty Calculator__ Returns if a roll of \`X\` dice against an Ob of \`Y\` is Routine, Difficult or Challenging.`, (message, test) =>
	{
		if ( test[1] === undefined || test[2] === undefined )
		{
			message.channel.send( 'I need 2 numbers to compare. first, the number of dice rolled; second the Obstacle of the test.' );
			return;
		}
		const d = parseInt( test[1] );
		const o = parseInt( test[2] );
		// improper argument types
		if ( isNaN( o ) || isNaN( d ) )
		{
			message.channel.send( 'those are not valid numbers.' );
			return;
		}
		// array index out of bounds prevention
		if ( d > 29 ) //+routineTest.length )
		{
			message.channel.send( "Whoa there friend... That's an awful lot of dice you're slinging there...\n What do you think you are playing? Shadowrun? *Exalted?*" );
		}
		// negative dice rolled or Negative Ob
		else if ( o <= 0 || d < 0 )
		{
			message.channel.send( undefined, { embed: { image: { url: 'https://qph.fs.quoracdn.net/main-qimg-527daeca7d4b6d4ef11607e548f576dd-c' } } } );
		}
		// proper input
		else if ( o > 0 )
		{
			message.channel.send(`${ d }D rolled Versus an Ob of ${ o }?\nWhy, that would be a ${ robot.utils.RDC( d, o ) } test!`);
		}
	})
}


	
