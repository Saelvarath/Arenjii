module.exports = (robot) =>
{
	const prefix = robot.config.printedPrefix;
	let dofTopic = `__Die of Fate__
Function: Rolls a single die.
Form: \`${prefix}dof\` {tags}
Extra Tags:
\t\` +#\` adds \`#\` [1-9] to the result of the roll.
\t\` -#\` subtracts \`#\` [1-9] to the result of the roll.`;

	robot.registerHelpTopic( "dof", dofTopic );
	robot.registerCommand( /dof\s*([-+\d\w \t]+)?/i, `\`${prefix}dof{tags...}\`: __Die of Fate__ Rolls a single die.`, ( message, test ) =>
	{
		let bonus = 0;
		let msg = "";
		
	  // Interpret Flags
		( test[1] || "" ).split(" ").forEach( token =>
		{
			let amount = parseInt(token)
			if (isFinite(amount))
			{
				bonus += Number(token);
			}
		});

	  // Roll
		let DoF = robot.utils.roll();

	  // Output
		msg += `${message.author} rolled a Die of Fate`;
		if ( bonus > 0 )
		{	msg += ` +${bonus}`;	}
		else if ( bonus < 0 ) 
		{	msg += ` ${bonus}`;	}

		msg += `!\n[${DoF + bonus}]`;

		message.channel.send( msg );
	});
}