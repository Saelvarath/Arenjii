module.exports = (robot) => 
{
	const prefix = robot.config.printedPrefix;

	const helpHelptopic = `__Bot Manual__
Function: displays information about Arenjii\'s various uses.
Form: \`${ prefix } help {command}\` or \`${ prefix }h {command}\`. eg. \`${ prefix }help grace\`
Notes: if no commands are specified it will display a brief summary of all of Arenjii\'s commands`;

	robot.registerHelpTopic( helpHelptopic );
	robot.registerCommand(/h(?:elp)?\s*([.\.\-\][]]*)?/i, `\`${prefix}help {command}\`: __Bot Manual__ gives more details about individual commands.`, (message, test) =>
	{
		if ( test[1] )
		{
			let failed = true;
			message.author.send("Unimplemented");

			if (message.channel.type !== "dm") 
			{
				message.reply(`**${message.author.username} has queried the cosmos and it has ${failed? "not ":"" } responded**`);
			}
		}
		else
		{
			if (message.channel.type !== "dm")
			{
				message.channel.send(`**${ message.author.username } has gazed into the vast cosmos**`);
			}

			message.author.send(`All commands are case insensitive so yell if you like. Speak slowly though, add spaces between tags so I can understand you.` +
			`\nCurly braces \`{}\` denote optional features explained in the help text for the individual command.` +
			`\nFor more detail on individual commands use \`${ prefix } help {command}\`. Example: \`${ prefix } help vs\`.\n` +
			`${ Array.from( robot.helpLine ).sort().join('\n\t') }` +
			`\n\nPlease PM Saelvarath#5785 if you find any bugs or have other comments or suggestions!\n\tA note to all using phones or international keyboards: the \`~\` can be replaced by \`\\\` in all commands for less hassle.`);
		}
	});
}