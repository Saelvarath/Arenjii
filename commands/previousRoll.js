module.exports = ( robot ) =>
{
	const prefix = robot.config.printedPrefix;

	robot.registerHelpTopic( 'previous', `__Display Previous Roll__\nFunction: Displays your previous roll or that of the mentioned user, including all changes made to it afterwards such as with \`${prefix}callon\`, \`${prefix}fate\` and \`${prefix}vs\`\nForm: \`${prefix}pr\` or \`${prefix}prev\` optional: \`@user\`. eg \`${prefix}prev @Un-Arenjii#4939\`` );

	robot.registerCommand( /(?:pr(?:ev(?:ious)?)?)/i, `\`${prefix}prev {@user}\`: __Previous Roll__: displays the previous roll.`, (message , test ) =>
	{
		//let pr = null;
		let pr = new robot.utils.DicePool;

		if ( message.mentions.users.keyArray().length == 1 )
		{
			robot.rollMap.get( message.mentions.users.firstKey() );
		}
		else
		{	pr = robot.rollMap.get( message.author.id );	}

		let msg = pr === undefined ?	`I got nothin'...` : 
										`${ pr.owner.username }'s last roll was:\n${ pr.printPool() }`;

		message.channel.send( msg );
	});
}

/*
msg += '\n`~pr {@user}`: See `~prev`';
msg += '\n`';

case 'pr':
case 'prev':
	msg += '\n;
	break;
*/