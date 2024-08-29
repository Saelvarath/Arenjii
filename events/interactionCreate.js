const { Events, Collection } = require( 'discord.js' );
const fs = require( 'fs' );

let dateOfLastMessage = new Date();

module.exports = {
	name: Events.InteractionCreate,

	async execute( interaction ) {
	  //autolog
		/*let logMsg = ``;
		
		let nd = new Date();
		if ( dateOfLastMessage.getHours() != nd.getHours() )
		{
			logMsg += `\n - - - - - ${nd.toUTCString()} - - - - -`;
			dateOfLastMessage = nd;
		}

		logMsg +=`\n@${message.author.username},`;
		for ( ln = Math.floor( message.author.username.length / 4 );  ln < 10; ln++ )
			{	logMsg += `\t`;	}
		logMsg += `${message.content}`;

		fs.appendFile( 'logFile.txt', logMsg , function ( err ) {
			if ( err !== null )
			{
				console.log( `File Error -> ${err}` );
				throw err;
			}
		} );/**/

		if ( !interaction.isChatInputCommand() ) 
			return;

		const command = interaction.client.commands.get( interaction.commandName );

		if ( !command ) 
		{
			console.error( `No command matching ${interaction.commandName} was found.` );
			return;
		}

		const { cooldowns } = interaction.client;

		if ( !cooldowns.has( command.data.name ) )
		{
			cooldowns.set( command.data.name, new Collection() );
		}

		const now = Date.now();
		const timestamps = cooldowns.get( command.data.name );
		const defaultCooldownDuration = 0;
		const cooldownAmount = ( command.cooldown ?? defaultCooldownDuration ) * 1_000;

		if ( timestamps.has( interaction.user.id ) )
		{
			const expirationTime = timestamps.get( interaction.user.id ) + cooldownAmount;

			if ( now < expirationTime ) {
				const expiredTimestamp = Math.round( expirationTime / 1_000 );
				return interaction.reply( { content: `Please wait, you are on a cooldown for \`${command.data.name}\`.\n The cooldown ends <t:${expiredTimestamp}:R>.`, ephemeral: true } );
			}
		}/**/

		timestamps.set( interaction.user.id, now );
			setTimeout( () => timestamps.delete( interaction.user.id ), cooldownAmount );

		try {
			await command.execute( interaction );
		} catch ( error ) {
			console.error( error );
			if ( interaction.replied || interaction.deferred ) {
				await interaction.followUp( { content: 'There was an error while executing this command!', ephemeral: true } );
			} else {
				await interaction.reply( { content: 'There was an error while executing this command!', ephemeral: true } );
			}
		}
	},
};