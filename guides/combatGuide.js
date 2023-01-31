module.exports = (robot) =>
{
	robot.registerGuide( "void points", "Gain a bonus of +1k1 to one Skill, Trait, Ring, or Spell Casting Roll\nTo increase a Skill from 0 to 1 for the Round.\nReduce Wounds suffered by 10. \nIncrease Armor TN by 10 for one Round.\nSwitch Initiative with one willing target for the rest of the skirmish.\nIncrease his Initiative Score by 10 for the rest of the skirmish.\nIncrease the Damage of a Katana by +1k1");

	robot.registerGuide( "stances", "insert rules for stances here");
		robot.registerGuide( "full attack", "Cannot take any Simple or Complex action other than to attack, and can only move towards his enemies. Cannot be used to deliver ranged attacks. Attacks gain a +2k1 bonus that round but Armor TN is reduced by 10. Move actions increase the traveled distance by extra 5 feet. Cannot be used while mounted.");
		robot.registerGuide( "attack", "Standard stance. No bonus and no penalties.");
		robot.registerGuide( "center", "No action is taken this round. On the next round, the samurai gains a +1k1 plus his Void Ring bonus to one roll. The samurai also adds 10 to his Initiative for that round only.");
		robot.registerGuide( "defense", "Add the Air Ring plus Defense Skill rank to Armor TN while in this stance. Cannot attack directly but can cast spells (even attack spells).");
		robot.registerGuide( "full defense", "Roll Defense / Reflexes and add half to Armor TN. Counts as a Complex action for the round.");

	robot.registerGuide( "maneuvers", "These are some specialized actions that you may do but require raises");
		robot.registerGuide( "called shot", "Requires Raises to strike specific body parts (1 for a limb, 2 for a hand/foot. 3 for the head, 4 for a small part (eye, ear, etc.))\n\tpage 176 of **Book of Air** has optional called shots for archery.");
		robot.registerGuide( "disarm", "Inflicts 2k1 damage and forces a Contested Strength Roll. If the target loses, he drops the weapon. This requires 3 Raises.");
		robot.registerGuide( "extra attack", "By making 5 Raises on an attack roll, the character may immediately make a second attack roll after the first attack resolves.");
		robot.registerGuide( "feint", "Requires 2 Raises on an attack roll. If successful, half the amount by which the attack exceeded the target's Armor TN is added to the damage roll (max of attacker's Insight Rank x5).");
		robot.registerGuide( "guard", "A Simple Action that cannot be taken in the Full Attack Stance. When using Guard, choose one person within 5' of you. and their Armor TN is increased by 10. Your Armor TN is decreased by 5 while using Guard.");
		robot.registerGuide( "increased damage", "For every Raise made on an attack roll, you gain a bonus of + 1K0 to the damage roll for that attack.");
		robot.registerGuide( "knockdown", "Requires 2 or 4 Raises (for 2 or 4 legged opponents) on an attack roll. If successful, the attack deals normal damage and the target is rendered Prone (see Conditions).");
		robot.registerGuide( "interrupted", "When you are attacked while casting a spell make a Willpower Roll vs TN 5 + Wounds suffered (TN 10 if the attack missed)");
		
	//robot.registerGuide( "", "");

}