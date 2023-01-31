module.exports = (robot) => 
{
	const prefix = robot.config.prefix;

	const helpHelptopic = `__Instruction Manual__
Function: displays information about Onnotangu\'s various blessings.
Form: \`${prefix}help\` or \`${prefix}help {cmd}\`
\t\`{cmd}\` *optional* the name of another valid prayer to Onnotangu.
Notes: Will list available blessings along with a brief summary if an individual prayer is not specified`

	robot.registerHelpTopic( /h(?:elp)?/i, helpHelptopic );
	robot.registerCommand(/h(?:elp)?\s*([a-z]*)?/i, `\`${prefix}help {prayer}\`: __Manual__ - displays detailed information about other prayers';`, (message, test) =>
	{
		if ( test[1] )
		{
			let found;
			
			for ( entry of robot.helpTopic.entries() )
			{
				if ( !found && entry[0].test( test[1] ) )
				{
					found = entry[0];
				}
			}
			
			if (message.channel.type !== "dm") 
			{	message.channel.send(`**${message.author} has consulted the kami and they have ${ !found ? "not " : "" }responded**`);	}

			if ( found )
			{	
				message.author.send( robot.helpTopic.get( found ) );
			}
		}
		else
		{
			if (message.channel.type !== "dm")
			{
				message.channel.send(`**${message.author} has gazed into the vast cosmos**`);
			}

			message.author.send(`I am Onnotangu, the Lord Moon. My whims shall determine your fate!
All prayers are case insensitive so yell if you wish. Speak slowly though, add spaces between tags so I can understand you.
Curly braces \`{}\` denote optional features explained in the help text for the individual prayer.
For more detail on individual prayers use \`${prefix}help {prayer}\`. Example: \`${prefix}help roll\`.
${ Array.from( robot.helpLine ).sort().join('\n\t') }`);
		}
	});
}