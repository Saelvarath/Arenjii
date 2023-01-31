const { Client, Events, GatewayIntentBits } = require('discord.js');
const config = require( './config.json' );

const fs = require( 'fs' );
const path = require( 'path' );

const Robot = require( './robot' );

// Initialize Bot
const robot = new Robot();

const client = new Client({ 
	intents: [
		GatewayIntentBits.Guilds,
		GatewayIntentBits.GuildMessages,
		GatewayIntentBits.MessageContent,
	] 
});

client.once ( Events.ClientReady, c => { 

	/*fs.appendFile( 'logFile.txt', `\n\n----------Booted up ${dateOfLastMessage.toUTCString()}----------` , function (err) {
		if ( err !== null )
		{
			console.log(`File Error -> ${err}`);
			throw err;
		}
	});*/

	console.log( `${c.user.tag} is ready!\nBot prefix = [ ${config.prefix} ]` ); 
});

client.on( Events.MessageCreate, message =>
{
	dateOfLastMessage = new Date();
	robot.processRequest( message );	
});

client.login( config.token );

robot.load( path.resolve( __dirname, "commands" ) );
robot.load( path.resolve( __dirname, "guides" ) );