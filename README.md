# Arenjii

A Discord bot for running games using Luke Crane's Burning Wheel RPG system. 
I still work on it occasionally and there are plenty of improvements to be made, if you see something that is missing/broken or have an idea for a feature that you'd like to see feel free to reach out to me. 

## Want to add Arenjii to your Channel?

I have the most up to date version of the bot hosted online.
Click [here](https://discordapp.com/oauth2/authorize?client_id=434471882163748876&scope=bot) for the Discord invite.
You can also get this link by giving the bot the `~invite` command

## How to use Arenjii
Once you have access to a working instance of the bot
Commands to trigger the bot are prefixed with a character set in the config file*.
My version uses `~` or `\`.
Eg: `~callon` or `\b4!`

* you will have to make your own config.json file if you want to run your own version of the bot. See below.

To start out try the `help` command to get a list of all commands the bot recognises. you can get more in-depth information on an individual command by adding it to the end of a `help` command
Eg: `\help roll`

## How can I help?

If you are a developer feel free to FoRK the project (Ha! Burning Wheel pun!) and tinker. Arenjii is written in Javascript.
You can also contact me with questions/suggestions. use the `feedback` command to send me a message.

If you are not a developer, I could always use people dedicated and/or crazy enough to make some of the weirdest rolls possible and try to break the bot, point out where I've gotten the rules wrong and give feedback and suggestions about every aspect of the bot's experience.


## Config.json
create a file named 'config.json' in the project folder and paste the code below into it:
`{
	"token": "__Your Discord Bot Token Here__",
	"prefixes": [ "~", "\\" ],
	"_prefixes": "you can add or remove characters to the line above. Also: delete this line",
}`
