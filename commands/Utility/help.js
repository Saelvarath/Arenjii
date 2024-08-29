const { SlashCommandBuilder, Client } = require( 'discord.js' );

module.exports = {
	category: 'Utility',
	cooldown: 10,

	data: new SlashCommandBuilder()
		.setName( 'help' )
		.setDescription( 'Receive some advice from the developer.' ),

	async execute( interaction )
	{
		let msg = `## Welcome to the new bot!\nYou may have noticed that thing are a bit different, but most of the functionality is the same, just read the descriptions next to the commands and their options and you should be able to figure everything out.\nIf you have any trouble feel free to message either directly or through the \`/feedback\` command.
### Some Advice
- When rolling Its usually okay to include FoRKs and Advantage dice in your Exponent. The exception being when the \`divine_inspiration\` flag is set to true.
- Similarly, unless the \`beginners_luck\`  or \`ob_multiplier\` flags are true it's alright to put your \`disadvantages\` right into \`obstacle\`.
		
### Disclaimer
This bot does __not__ reroll Astrology dice. there is just no official methodology or consensus on how to handle it.

Arenjii is a work in progress and the rules for Burning Wheel are intricate. Many interations are not explicitly clarified and I cannot claim to be an expert in the system.\nKeep an eye out to make sure my interpretation of the rules meets your expectations\nThere are some areas where I recommend extra scrutiny:

- __Rerolls__: Make sure Arenjii honours your well-earned rerolls, particularly if your roll involves astrology or open-ended dice when the pool itself is not open-ended.';
 - __Call-ons__ in particular have undergone some changes recently so double check your numbers
- __Versus Tests__: Conflicts are messy affairs, especially when Obstacle multipliers become involved.
- __Mixed Dice__: open-ended dice in pools that are not open-ended may be excluded from some features or behave oddly.
- __Combat Tools__: \`/range_and_cover\` and \`/duel_of_wits\` are operational but the code is super gross. Keep an eye out for weirdness`;

	/*msg += '***Murder the Gods and topple their thrones!***\nIf they cannot bear the weight of your worship they are undeserving!\nSo test your gods, beat them where they are weakest until they break.\nIf they are worthy they will come back stronger.';
	msg += '\n\nKnown weakenesses of the White God Arenjii are:';
	msg += '\n\t-__Obstacle Multiplication__: Several new verses to the prayer of rolling have been uncovered, invoke them with `ox#`, `ds#` and `bl`.';
	msg += '\n\t-__Rerolls__: The `~fate`, `~callon` and `~grace` mantras are now functional. Make sure Un-Arenjii honours your well earned rerolls.';
	msg += '\n\t-__Versus Tests__: Conflicts are messy affairs, especially when Obstacle multipliers become involved. find a friend, better two, and watch Un-Arenjii squirm!';
	msg += '\n\t-__Mixed Dice__: open-ended dice in pools that are not open-ended may be excluded from some features or behave oddly';
	msg += '\nReach heaven through violence.';*/

		interaction.reply( { content: msg, ephemeral: true } );
	}
};

/*
Notes:
	
	`;
*/