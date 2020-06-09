const Discord = require( 'discord.js' );
const config = require( './config.json' );

const path = require('path');
const Robot = require("./robot");
//const Enmap = require('enmap');


// Initialize Discord Bot
const client = new Discord.Client(); //- { token: config.token, autorun: true });
const robot = new Robot()

//-client.rollMap = new Enmap(); // non-persistant

client.on( "ready", () => 
{
	console.log( "I am ready!" ); 
});

client.on( 'message', ( message ) =>
{
	robot.processRequest( message );
});

client.login( config.token );

robot.load( path.resolve( __dirname, "commands" ) );