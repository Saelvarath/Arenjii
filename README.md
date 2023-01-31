# Onnotangu

A Discord bot for rolling (and keeping )dice, L5R 4e style. 

## Want to add the Moon to your Channel?

Onnotangu is still in development; there are still plenty of potential features to add, UX to improve, optimization work, testing to do and there are certainly bugs hiding that need to be squashed.
If that doesn't put you off, then by all means click [here](https://discordapp.com/oauth2/authorize?client_id=468926033165549579&scope=bot) for the Discord invite.

## How can I help?

If you are a developer feel free to download the project and tinker, or contact me with questions/suggestions. Arenjii is written in Javascript.

If you are not a developer, I could always use people dedicated and/or crazy enough to make some of the weirdest rolls possible and try to break the bot, point out where I've gotten the rules wrong and give feedback and suggestions about every aspect of it.



## How to use Arenjii
Once you have access to a working instance of the bot
Commands to trigger the bot are prefixed with a character set in the config file*.
My version uses `~`.
>Eg: `~4k3` or `~help`

To start out try the `help` command to get a list of all commands the bot recognises. you can get more in-depth information on an individual command by adding it to the end of a `help` command
>Eg: `\help roll`

__*__ You will have to make your own config.json file if you want to run your own version of the bot. See below.

## Config.json
create a file named 'config.json' in the project folder and paste the code below into it:
>{  
>	"token": "__Your Discord Bot Token Here__",  
>	"prefix": "~" 
>}  
