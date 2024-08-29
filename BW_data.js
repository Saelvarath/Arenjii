const DoWAction = [ 
	[ "Avoid the Topic",
		"Will",
		"-",
		"successes are subtracted from the opposition's successes, reducing it's effectiveness.\n\tActions that have their successes reduced to zero fail and their effects are canceled.",
		"Avoid never suffers a double obstacle penalty for stat versus skill.", ],	// Avoid
	[ "Dismiss Opponent", 
		"Coarse Persuasion, Command, Intimidation, Oratory, Religious Diatribe, Rhetoric, Stentorious Debate, Ugly Truth", 
		"Each success subtracts from the victim's Body of Argument.",
		"Subtract the margin of success from the victim's Body of Argument.\n\tAgainst the Dismiss action the winner subtracts ALL successes instead.",
		"Dismiss adds +2D to the character's skill.\n\tIf a Dismiss action fails to win the duel, it's user must change their next volley to a hesitate action." ],	// Dismiss
	[ "Feint",
		"Extortion, Falsehood, Interrogation, Persuasion, Poisonous Platitudes, Religious Diatribe, Rhetoric, Soothing Platitudes, Seduction", 
		"Each success subtracts from the victim's Body of Argument.",
		"The margin of success is subtracted from the victims Body of Argument." ],	// Feint
	[ "Incite Emotion",
		"Coarse Persuasion, Command, Extortion, Falsehood, Intimidation, Seduction, Ugly Truth",
		"If successful: the victim must pass a Steel test or hesitate next volley.\n\tIf failed: The margin of failure is added as advantage dice to the victim's next test.",
		"If successful: the victim must pass a Steel test or hesitate next volley.\n\tIf failed: The margin of failure is added as advantage dice to the victim's next test." ],	// Incite
	[ "Obfuscate",
		"Falsehood, Oratory, Poisonous Platitudes, Rhetoric, Religious Diatribe, Soothing Platitudes, Stentorious Debate, Suasion, Ugly Truth",
		"-",
		"On a tie the victim loses their current action.\n\tIf Obfusticate exceeds it's Ob, then the victim also suffers +1 Ob to their next action.\n\tIf Obfuscate fails the victim gains +1D to their next action." ],	// Obfuscate
	[ "Make a Point",
		"Coarse Persuasion, Interrogation, Oratory, Persuasion, Poisonous Platitudes, Rhetoric, Stentorious Debate",
		"Successes are subtracted from the victim's Body of Argument.",
		"Subtracted the margin of success from the victim's Body of Argument." ],	// Point
	[ "Rebuttal",
		"Extortion, Interrogation, Oratory, Persuasion, Poisonous Platitudes, Rhetoric, Stentorious Debate, Suasion",
		"-",
		"Successes on attack dice are subtracted from your victim's Body of Argument.\n\tSuccesses from the defense roll are subtracted from the victim's successes.",
		"Before you victim rolls: divide your dice between attack and defense. Each pool must have at least one die in it.\n\tAny penalties to the action are applied to both pools but bonuses to the action only apply to one."],
	[ "Hesitate", // Stand and Drool, Run Screaming, Swoon, 
		"-",
		"The character is not actively participating in the Duel of Wits and is vulnerable.", 
		"The chacter can take no other action for now. Better luck with that Steel test next time!" ],
	[ "Special", //spell casting, praying, singing, howling, etc. 
		"Varies", 
		"The character performs some action not covered in the Duel of Wits rules",
		"The character is too busy to actively participate in the Duel of Wits and is vulnerable. I hope it's worth it!"]
];

const DoWInterations = [
  //avoid	dimiss	feint	incite	obfusc	point	rebutt	hesit	other
	[ '-',	'-',	'-',	'VS',	'VS',	'VS',	'-',	'-',	'-' ],		// Avoid
	[  1,	 1,		 1,		 1,		'VS',	 1,		'VS',	 1,		 1 ],		// Dismiss
	[ '-',	'-',	'VS',	'VS',	'VS',	'-',	1,		 1,		 1 ],		// Feint
	[ 'VS',	"Will",	'VS',	"Will",	'VS',	"Will",	"Will", "Will", "Will" ],	// Incite
	[ 'VS',	'VS',	'VS',	'VS',	'VS',	'VS',	'VS',	 1,		 1 ],		// Obfuscate
	[ 'VS',	 1,		 1,		 1,		'VS',	 1,		'VS',	 1,		 1 ],		// Point
	[ '-',	'VS',	'-',	'-',	'VS',	'VS',	'-',	 0,		 0 ],		// Rebuttal
	[ '-',	'-',	'-',	'-',	'-',	'-',	'-',	'-',	'-' ],		// hesitate
	[ '-',	'-',	'-',	'-',	'-',	'-',	'-',	'-',	'-' ]		// casting, praying etc.
];

const DoWOptions = [ 
	{ name: 'avoid_the_topic', value: 0 },
	{ name: 'dismiss_opponent', value: 1} ,
	{ name: 'feint', value: 2 },
	{ name: 'incite_emotion', value: 3 },
	{ name: 'obfuscate', value: 4 },
	{ name: 'make_a_point', value: 5 },
	{ name: 'rebuttal', value: 6 },
  //Hesitation actions
	{ name: 'fall_prone_and_beg', value: 7 },
	{ name: 'run_screaming', value: 7 },
	{ name: 'swoon', value: 7 },
	{ name: 'stand_and_drool', value: 7 },
	{ name: 'hesitate', value: 7 },
  //Special actions
	{ name: 'command_spirit', value: 8 },
	{ name: 'cast_spell', value: 8 },
	{ name: 'pray', value: 8 },
	{ name: 'sing_spellsong', value: 8 },
	{ name: 'howl_wolfsong', value: 8 },
	{ name: 'special', value: 8 }
];

const RaCActions = 
[
	[`Charge`, 
		`Steel`, `stat`, 
		`advance`,
		`If successful: you advance one range category.\n\tIf tied: you get to shoot.\n\tIf failed: your opponent gets a free shot and you hesitate in the next volley.`,
		`Your opponents get 1 free shot before this action is resolved`],
	[`Close Distance`, 
		`Speed `, `stat`,
		`advance`,
		`If successful: advance one range category.`],
	[`Fall Back`, 
		`Tactics`, `skill`,
		`withdraw`, 
		`If successful: withdraw one range category.\n\tThen, for two successes, you can re-range all combatant's weapons`],
	[`Flank`, 
		`Tactics`, `skill`,
		`advance`,
		`If successful: advance one range category.`],
	[`Hold Position`, 
		`Perception Vs Stat, Observation Vs Skill`, `special`,
		`hold`,
		`If successful: take an additional free shot.`,
		`The movement portion of your opponent's maneuver automatically occurs.\n\tAdvantage dice from a position are carried over into your next maneuver.`], //doesn't get advantage from Stride
	[`Maintain Distance`, 
		`Speed`, `stat`,
		`hold`,
		`If successful: if your opponent advanced you withdraw or vice versa.`],
	[`Retreat`, 
		`Steel +1D`, `stat`,
		`withdraw`, 
		`If successful: you withdraw one range category.\n\tIf tied, your opponent gets an additional free shot.\n\tIf failed, your opponents gets an additional free shot plus you hesitate in the next volley.`,
		`Your opponent gets 1 free shot before this action is resolved.`],
	[`Sneak In`, 
		`Stealthy`, `skill`,
		`advance`,
		`If successful: advance one range category.`],
	[`Sneak Out`, 
		`Stealthy`, `skill`,
		`withdraw`, 
		`If successful: withdraw one range category.`],
	[`Withdraw`, 
		`Speed +2D`, `stat`,
		`withdraw`, 
		`If successful: withdraw one range category.\n\tYou can then take an action to re-range all combatant's weapons.`,
		`All actions taken cost two successes.`],
	[`Run Screaming`,
		`Speed or Steel`, `stat`,
		`withdraw`, 
		`If successful: you withdraw one range category ( while screaming ) but can make no aggressive actions.`,
		`You drop one item in your inventory.\n\tYou do not grant your opponent free shots.`],
	[`Stand and Drool`,
		`-`, `-`,
		`hold`,
		`-`,
		`Your opponent's Positioning test is Ob 1.\n\tThey may take an action to capture you if at optimal range`],
	[`Fall Prone and Beg for Mercy`,
		`-`, `-`,
		`hold`,
		`Your opponent may take an action to capture you if within optimal range.`,
		`Your opponent's *next* positioning test is at Ob 1.\n\tOnce you recover you have a +2D positiont.`],
	[`Swoon`,
		`-`, `-`,
		`hold`,
		`-`,
		`Make a Stealthy or Inconspicuous test against your opponent's Observation.\n\tIf successful: they lose track of you and you awake later cold and alone.\n\tIf failed: their next positioning test is at Ob 1`]
];

const RaCOptions = [ 
	{ name: 'charge', value: 0 },
	{ name: 'close', value: 1} ,
	{ name: 'fall_back', value: 2 },
	{ name: 'flank', value: 3 },
	{ name: 'hold', value: 4 },
	{ name: 'maintain', value: 5 },
	{ name: 'retreat', value: 6 },
	{ name: 'sneak_in', value: 7 },
	{ name: 'sneak_out', value: 8 },
	{ name: 'withdraw', value: 9 },
	{ name: 'run_screaming', value: 10 },
	{ name: 'stand_and_drool', value: 11 },
	{ name: 'fall_prone_and_beg', value: 12 },
	{ name: 'swoon', value: 13 }/*,
	{ name: 'command_spirit', value: 14 },
	{ name: 'cast_spell', value: 14 },
	{ name: 'pray', value: 14 },
	{ name: 'sing_spellsong', value: 14 },
	{ name: 'howl_wolfsong', value: 14 },
	{ name: 'special', value: 14 }*/
];

const FightActions = [];
const FightInteractions = [];

module.exports = { DoWAction, DoWInterations, DoWOptions, RaCActions, RaCOptions }; 