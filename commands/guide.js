module.exports = (robot) =>
{
    const prefix = robot.config.prefix;

	let guideTopic = `__Mechanic Manual__
Function: gives helpful information about various L5R Mechanics.
Form: \`${prefix}guide\` or \`${prefix}guide {query}\`
	\`{query}\` *optional* the name of a mechanic you are having touble remembering
Notes: will display a list of available queries if none is specified.`;

	robot.registerHelpTopic( /g(?:uide)?/i, guideTopic );
	robot.registerCommand( /g(?:uide)?\s(.*)?/i, `\`${robot.config.prefix}guide {query}\`: __Mechanics Manual__ a helpful guide to various L5R Mechanics.`, ( message, test ) =>
	{
		let query = test[1];
		query.toLowerCase();
		let found = robot.guideMap.has( query );

		if ( found )
		{			
			/*if (message.channel.type !== "dm") 
				{	message.channel.send(`**${message.author} has consulted the kami and they have ${ !found ? "not " : "" }responded**`);	}*/

			if ( found )
			{	
				message.channel.send( `**${query}**\n${robot.guideMap.get( query )}` );
			}
		}
		else
		{
			/*if (message.channel.type !== "dm")
				{	message.channel.send(`**${message.author} has gazed into the vast cosmos**`);	}*/

			message.author.send(`**__List of available guides__**\n\t${ Array.from( robot.guideMap.keys() ).sort().join('\n\t') }`);
		}
	});
}