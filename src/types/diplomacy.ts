/**
 * Diplomacy Proposal System
 * Implements Civilization-style diplomacy where AI can propose deals
 * and both AI and player can accept/reject proposals
 */

export type ProposalType =
  | 'alliance'           // Permanent alliance (costs resources)
  | 'truce'             // Temporary peace treaty
  | 'non-aggression'    // Non-aggression pact
  | 'aid-request'       // Request for economic assistance
  | 'sanction-lift'     // Request to lift sanctions
  | 'joint-war'         // Propose war against common enemy
  | 'demand-surrender'  // Demand target surrender/tribute
  | 'peace-offer';      // Offer peace terms

export interface ProposalTerms {
  duration?: number;              // For truces (in turns)
  goldAmount?: number;            // Gold/production to exchange
  resourceAmount?: number;        // Resources to exchange
  targetNationId?: string;        // For joint war declarations
  tributeAmount?: number;         // For surrender demands
  reason?: string;                // Diplomatic message
}

export interface DiplomacyProposal {
  id: string;                     // Unique proposal ID
  type: ProposalType;             // Type of proposal
  proposerId: string;             // Nation making the proposal
  targetId: string;               // Nation receiving the proposal
  terms: ProposalTerms;           // Terms of the proposal
  message: string;                // Diplomatic message explaining proposal
  turn: number;                   // Turn when proposal was made
  expiresAt?: number;             // Turn when proposal expires
  playerInitiated: boolean;       // True if player proposed, false if AI
}

export interface DiplomacyResponse {
  proposalId: string;
  accepted: boolean;
  reason: string;                 // Explanation for accept/reject
  counterOffer?: DiplomacyProposal; // Optional counter-proposal
}

export interface DiplomacyEvaluationFactors {
  threatLevel: number;            // -10 to +10 (negative = friendly)
  militaryRatio: number;          // Their power / our power
  relationshipScore: number;      // Overall relationship modifier
  personalityBias: number;        // AI personality influence
  strategicValue: number;         // How valuable is this deal?
  randomFactor: number;           // Add unpredictability
  recentHistory: number;          // Recent interactions modifier
}

export interface DiplomacyHistory {
  turn: number;
  action: string;
  withNation: string;
  result: 'accepted' | 'rejected' | 'expired';
  relationshipChange: number;
}

/**
 * Calculate acceptance score for AI evaluating a proposal
 * Returns score from -100 to +100
 * Positive scores likely to accept, negative likely to reject
 */
export function calculateAcceptanceScore(factors: DiplomacyEvaluationFactors): number {
  let score = 0;

  // Threat level: high threat = more likely to accept peace/truce
  // Low threat = less likely to want diplomacy
  score += factors.threatLevel * 5;

  // Military ratio: if we're stronger, less likely to accept unless beneficial
  // If we're weaker, more likely to accept defensive pacts
  if (factors.militaryRatio < 0.5) {
    score += 20; // We're much weaker, more desperate
  } else if (factors.militaryRatio < 0.8) {
    score += 10; // Somewhat weaker
  } else if (factors.militaryRatio > 1.5) {
    score -= 10; // We're much stronger, less need
  }

  // Relationship score directly influences acceptance
  score += factors.relationshipScore * 3;

  // Personality bias
  score += factors.personalityBias;

  // Strategic value of the deal
  score += factors.strategicValue;

  // Random factor for unpredictability (-10 to +10)
  score += factors.randomFactor;

  // Recent history
  score += factors.recentHistory;

  return Math.max(-100, Math.min(100, score));
}

/**
 * Determine acceptance threshold based on proposal type
 */
export function getAcceptanceThreshold(proposalType: ProposalType): number {
  switch (proposalType) {
    case 'alliance':
      return 30; // High bar for permanent alliance
    case 'truce':
      return 10; // Lower bar during conflict
    case 'non-aggression':
      return 20; // Moderate commitment
    case 'aid-request':
      return 15; // Depends on relationship
    case 'sanction-lift':
      return 25; // Requires good standing
    case 'joint-war':
      return 35; // Very high bar
    case 'demand-surrender':
      return 40; // Extremely high (usually rejected)
    case 'peace-offer':
      return 5;  // Low bar, most want peace
    default:
      return 20;
  }
}

/**
 * Generate diplomatic message based on proposal type and context
 */
export function generateDiplomaticMessage(
  proposal: DiplomacyProposal,
  proposerName: string,
  targetName: string,
  isAcceptance: boolean
): string {
  const messages = {
    alliance: {
      proposal: `Greetings from ${proposerName}. I come before you today with a proposition that I believe could reshape the future of both our nations. The world grows more complex and dangerous with each passing day, and I have come to realize that our peoples share far more in common than divides us. I propose we formalize a permanent alliance - not merely words on paper, but a genuine partnership where our nations stand shoulder to shoulder in times of both prosperity and adversity. Together, we can pool our resources, coordinate our strategies, and ensure that our mutual interests are protected against any who would threaten them. Such an alliance would not only guarantee our security but would open new avenues for trade, cultural exchange, and technological cooperation. I believe this is an opportunity we cannot afford to ignore. What say you?`,
      accept: `After careful deliberation and consultation with my advisors, ${targetName} is honored to accept your proposal of alliance. Our analysts have reviewed the strategic benefits, and we are convinced that this partnership will serve both our peoples well. Let this day mark the beginning of a new era of cooperation between our nations. We pledge to honor this alliance with loyalty and good faith, and we look forward to the prosperity and security it will bring to both our peoples. Our nations shall stand together, united in purpose and resolve. May this alliance endure for generations to come.`,
      reject: `I have given your proposal the serious consideration it deserves, consulting with my military advisors, economic ministers, and diplomatic corps. However, I must respectfully decline your offer of alliance at this time. ${targetName} faces unique challenges and obligations that make such a commitment difficult to undertake in the current geopolitical climate. While I recognize the potential benefits you outline, we believe that the timing is not right for such a permanent and binding arrangement. Our nation must preserve its flexibility to respond to rapidly evolving circumstances. I hope you can understand our position, and I remain open to other forms of cooperation that might better suit our respective situations. Perhaps in the future, circumstances will change and we can revisit this matter.`
    },
    truce: {
      proposal: `Leader of ${targetName}, I reach out to you in a spirit of pragmatism and, dare I say, hope. Our nations have been locked in conflict for some time now, and while both sides have demonstrated their military capabilities and resolve, I must ask - to what end? The cost in lives, resources, and missed opportunities grows with each passing day. I am proposing a ${proposal.terms.duration}-turn truce between our nations. This would not be a permanent peace, nor would it require either of us to abandon our principles or long-term objectives. Rather, it would be a pause - a breathing space where cooler heads can prevail, where our economies can recover from the strain of war, and where diplomatic channels can be reopened. War should be a tool of policy, not an end in itself. If we can achieve our aims through negotiation rather than bloodshed, surely that is the more enlightened path? I await your response, hoping that wisdom and strategic thinking will guide your decision.`,
      accept: `Your words have resonated with my council, and after much debate, ${targetName} agrees to your proposal for a ${proposal.terms.duration}-turn truce. You speak truth when you say that continued conflict serves neither of our peoples well at this juncture. Both our nations have proven their martial prowess, and both have paid a heavy price in blood and treasure. Let this truce be a time for reflection, recovery, and perhaps even reconciliation. Our forces will stand down and return to defensive positions. We will respect the ceasefire and use this time to tend to our wounded, repair our infrastructure, and consider what the future might hold. May this pause in hostilities lead to a more lasting peace. Let it be known that ${targetName} honors its commitments and will uphold this truce faithfully.`,
      reject: `I have considered your proposal for a truce with the gravity it warrants, but I must inform you that ${targetName} cannot accept these terms. Our military leadership believes we have momentum in this conflict, and our people, while weary of war, remain resolute in their determination to see this through to a decisive conclusion. A truce at this moment would only allow our adversaries to regroup and rearm, potentially prolonging the ultimate resolution of this conflict. Furthermore, certain grievances and strategic objectives remain unaddressed, and we cannot in good conscience pause our operations while these matters stand unresolved. The conflict must continue until a more favorable outcome presents itself. We do not seek war for its own sake, but we will not shy from it when our national interests demand steadfastness. Perhaps when the strategic situation has evolved, we can discuss terms again.`
    },
    'non-aggression': {
      proposal: `Esteemed leader of ${targetName}, I write to you today with a straightforward but important proposition. In these turbulent times, our two nations need not be enemies. While we may not be ready for a full alliance, I believe we can both benefit from a formal non-aggression pact. Such an agreement would provide security for both our peoples - you need not fear that ${proposerName} harbors aggressive intentions toward your territories, and in return, we would have the same assurance from you. This would allow both our nations to focus our military resources and strategic attention elsewhere, on threats that truly concern us rather than on each other. A non-aggression pact is not a sign of weakness but of wisdom - recognizing that not every nation need be an adversary, and that sometimes the greatest strength lies in knowing which battles not to fight. I believe this arrangement would serve both our interests admirably. Will you join me in this commitment to peaceful coexistence?`,
      accept: `Your proposal arrives at an opportune moment, and ${targetName} is pleased to accept this non-aggression pact. You are correct that our nations need not be at odds with one another. We have reviewed our strategic assessments and concluded that peace between us serves our national interests far better than the alternative. Our military planners will rest easier knowing that your borders are secure and that ours are equally protected. This pact will allow both our peoples to redirect their energies toward more productive endeavors - building our economies, advancing our technologies, and strengthening our defenses against actual threats rather than hypothetical ones. Let this agreement stand as a testament to the power of diplomacy and rational calculation over the easy path of suspicion and hostility. ${targetName} pledges to honor this commitment faithfully.`,
      reject: `I appreciate you taking the time to present this proposal, but ${targetName} must decline your offer of a non-aggression pact at this time. Our strategic doctrine requires maintaining maximum flexibility in our military and diplomatic options. While we do not necessarily harbor aggressive intentions toward ${proposerName}, circumstances in our region remain fluid and unpredictable, and we cannot afford to constrain our options with formal commitments that might later prove disadvantageous. Additionally, there are certain territorial and strategic questions between our nations that remain unresolved, and until these matters are addressed, we cannot in good faith enter into any formal agreement regarding military actions. We prefer to evaluate each situation on its merits as it arises rather than binding ourselves with preemptive agreements. I hope you can understand our position, even if you disagree with it.`
    },
    'aid-request': {
      proposal: `Leader of ${targetName}, I come before you today not with pride, but with the honest recognition that ${proposerName} faces a period of significant economic hardship. Whether through natural disasters, economic mismanagement, the lingering costs of past conflicts, or simple misfortune, our nation finds itself in dire straits. Our people struggle, our infrastructure crumbles, and our economy falters. I am reaching out to request economic assistance from ${targetName} - not as a permanent arrangement, but as a lifeline to help us weather this storm. The aid we request would go directly toward feeding our people, repairing critical infrastructure, and stabilizing our economy. This is not easy for me to ask, as national pride sometimes demands we solve our own problems. But I have come to understand that there is no shame in seeking help when help is needed. Should our fortunes improve - and with your assistance, I believe they will - ${proposerName} will remember this kindness and will be in your debt. I hope you will consider this request with the compassion and strategic wisdom I know you possess.`,
      accept: `Your candor in acknowledging your nation's difficulties speaks well of your character, and ${targetName} has decided to provide the assistance you request. While we are not in the business of charity, we recognize that instability in ${proposerName} could have broader regional implications that might eventually affect our own interests. Moreover, helping a nation in its time of need is an investment in future goodwill and potential cooperation. Our economic ministers are preparing a package of aid that we believe will help stabilize your situation without creating unhealthy dependencies. We trust that you will use these resources wisely and work diligently to restore your nation's economic health. Know that ${targetName} does not offer this assistance lightly or with any intention to exploit your vulnerability. We simply believe that sometimes, the strongest diplomacy is the diplomacy of humanitarian assistance. May your nation recover swiftly, and may this gesture strengthen the bonds between our peoples.`,
      reject: `I have reviewed your request for economic aid with my treasury and foreign ministers, and I regret to inform you that ${targetName} cannot provide assistance at this time. Our own economic situation, while stable, does not permit us to extend significant resources to other nations without jeopardizing our own people's welfare. Our first responsibility must be to our own citizens, and committing resources we cannot spare would be an abdication of that responsibility. Additionally, our analysts have expressed concerns about whether aid would truly address the root causes of your economic difficulties, or merely postpone necessary but difficult reforms. We have also considered the political implications of such assistance and the precedent it might set for other nations who might then approach us with similar requests. While we sympathize with the hardships your people face, we must respectfully decline your request. We hope you understand that this is a practical decision based on our own constraints, not a reflection on our diplomatic relations.`
    },
    'sanction-lift': {
      proposal: `Respected leader of ${targetName}, I reach out to you regarding a matter that has strained relations between our nations for too long - the economic sanctions that ${targetName} currently maintains against ${proposerName}. These sanctions were imposed during a different time, under different circumstances, and I believe the moment has come to reconsider their continuation. Whatever behavior or policies prompted these sanctions, I would argue that circumstances have evolved significantly. The sanctions, while perhaps achieving some of their intended purposes, now serve primarily to inflict hardship on ordinary citizens who bear no responsibility for the policies that prompted them. Our economies, which once might have been completely independent, are now increasingly interconnected, and sanctions that harm ${proposerName} inevitably create ripple effects that impact your own interests as well. I am formally requesting that ${targetName} lift these sanctions and allow normal economic relations to resume between our nations. Such a gesture would not only ease the suffering of my people but would also open new opportunities for trade and cooperation that could benefit both our nations. Surely the path of engagement and dialogue is more productive than the path of isolation and punishment?`,
      accept: `After extensive deliberations and reviews of current intelligence assessments, ${targetName} has concluded that the sanctions against ${proposerName} have served their purpose and can now be lifted. Our original objectives in imposing these measures have been largely achieved, and we recognize that continued sanctions may no longer be serving our strategic interests. Furthermore, we have observed changes in your nation's behavior and policies that suggest the conditions that prompted these sanctions have evolved. Our economic analysts have also pointed out that normalized trade relations could indeed benefit both our nations, and there seems little point in maintaining barriers that harm both our peoples. Therefore, we are prepared to lift the sanctions and restore normal economic relations. However, we do so with the expectation that ${proposerName} will continue to act as a responsible member of the international community. Should circumstances change and old behaviors return, we reserve the right to reconsider this decision. For now, let us move forward in a spirit of mutual benefit and renewed cooperation.`,
      reject: `I have carefully reviewed your request to lift sanctions, consulting with my foreign policy advisors, intelligence services, and economic ministers. However, ${targetName} must maintain the current sanctions regime against ${proposerName} at this time. The policies and behaviors that prompted these sanctions in the first place have not changed sufficiently to warrant their removal. While we acknowledge that sanctions can create hardship for ordinary citizens - something we do not celebrate - we believe they remain an necessary tool to encourage policy changes that serve broader regional stability and international norms. Our intelligence suggests that lifting sanctions at this juncture would be interpreted as weakness and might actually embolden the very behaviors we seek to discourage. Furthermore, we have obligations to our allies and partners who share our concerns about certain aspects of your nation's conduct. Unilaterally lifting sanctions could undermine coordinated international efforts and damage our credibility. The path to sanctions relief remains open, but it requires demonstrated changes in behavior and policy, not merely the passage of time. When such changes occur, we will be ready to reconsider.`
    },
    'joint-war': {
      proposal: `Leader of ${targetName}, the time has come to speak plainly about a threat that concerns both our nations. There exists a power in our region that poses a danger not just to ${proposerName}, but to the entire balance of power that has maintained relative stability. I am speaking, of course, of our mutual adversary whose ambitions and capabilities grow with each passing month. Individually, either of our nations might struggle to contain this threat. But together, pooling our military might and coordinating our strategies, we would represent a formidable coalition capable of checking this aggression before it grows beyond control. I am therefore proposing a joint military campaign - a coordinated effort to neutralize this threat while we still can. This is not a decision I take lightly; war is always costly and its outcomes uncertain. But I believe the cost of inaction would be far greater. If we allow this threat to continue unchecked, we may find that when we finally are forced to act, we will do so from a position of weakness rather than strength. The strategic moment is now. I am proposing we act together, combining our forces and presenting a united front. This would send an unmistakable message to all who would disturb the peace. What is your answer?`,
      accept: `Your assessment aligns closely with our own intelligence evaluations, and ${targetName} agrees to join you in this military campaign. Our strategic planners have been monitoring the situation you describe with growing concern, and we have reached similar conclusions about the necessity of action. The threat you identify is real, it is growing, and waiting will only make the eventual confrontation more costly and more dangerous. By acting together now, we can achieve objectives that neither nation could accomplish alone, and we can do so with greater efficiency and at lower cost than if we waited and were forced to fight separately. Our military commanders are prepared to coordinate with yours to develop an integrated campaign strategy that leverages the strengths of both our forces. Let this joint campaign demonstrate the power of allied nations acting in concert to defend their mutual interests. ${targetName} commits to this endeavor fully, and we will see it through to a successful conclusion. Together, we will eliminate this threat and restore stability to our region.`,
      reject: `I have given your proposal for a joint military campaign the serious consideration it demands, reviewing it with my military chiefs, intelligence directors, and senior diplomatic advisors. However, after this extensive review, ${targetName} must decline to participate in this operation. While we acknowledge the threat you describe, our assessment of its severity and immediacy differs from yours. Our intelligence suggests that the situation, while concerning, has not yet reached the crisis point that would justify a major military intervention. We also have concerns about the broader implications of such a campaign - the potential for escalation, the risk of unintended consequences, and the possibility that military action might actually worsen the very problems we seek to solve. Additionally, ${targetName} has other strategic priorities and commitments that would be compromised by involvement in this conflict. Our military resources, while substantial, are not unlimited, and we must deploy them judiciously. While we may share some concerns about the nation you view as a threat, we do not believe that joining this military campaign serves our national interests at this time. We hope you understand our position, even as we recognize your disappointment.`
    },
    'demand-surrender': {
      proposal: `Leader of ${targetName}, this communication is not a negotiation but an ultimatum. The military situation has developed in such a way that ${proposerName} now holds an overwhelming advantage. Your forces are depleted, your defenses are crumbling, and your strategic position is untenable. I could continue this conflict to its inevitable conclusion, but such an outcome would result in tremendous suffering for your people and complete devastation of your nation's infrastructure and economy. Instead, I am offering you a choice - submit to ${proposerName}'s terms now, pay the tribute we demand, and accept the conditions we impose, or face the full fury of our military might unleashed without restraint. This is not said with cruelty but with practical recognition of reality. You have fought bravely, but you have lost. Prolonging this conflict serves no purpose except to increase the misery of your people and the extent of the ruins from which you will eventually have to rebuild. The terms I offer, while harsh, are far more generous than what total military defeat would bring. You have ${proposal.terms.tributeAmount} hours to respond. Choose wisely, for your people's sake if not your own pride.`,
      accept: `It is with a heavy heart and after much painful deliberation that ${targetName} accepts your terms of surrender. You are correct that our military situation has become untenable, and our advisors have confirmed that continued resistance would only lead to greater catastrophe for our people. We have exhausted our options, depleted our reserves, and can no longer sustain organized defense against your superior forces. While it grieves me to accept these conditions, my first duty is to my people, and I cannot allow my pride to be the cause of their complete destruction. We will pay the tribute you demand and comply with your requirements. However, know that while we submit to force, we do not abandon our hope for a future where ${targetName} might once again stand as a sovereign nation. History is long, and today's victors are not always tomorrow's masters. But for now, we accept your terms. May you show mercy in your victory, for how you treat the defeated will be remembered when circumstances eventually change, as they always do.`,
      reject: `I have received your ultimatum, and I must inform you that ${targetName} rejects your demands entirely. You mistake our current difficulties for total defeat, and you underestimate both the resilience of our people and the resources we still possess. While I do not deny that our situation is challenging, we are far from the broken, helpless victim you describe. Our forces may be strained, but they remain cohesive and capable. Our people, rather than despairing, have rallied to the defense of their homeland with fierce determination. Your demands are not terms of peace but terms of enslavement, and no leader of ${targetName} could accept them and retain any shred of honor or legitimacy. We would rather fight to the last soldier and the last bullet than submit to such humiliation. Your ultimatum has accomplished only one thing - it has united our people in defiant resistance to your aggression. History will judge which of us chose the right path. For now, we say this: come and take what you think you can take. You will find that victory is far more expensive than you imagine. We reject your demands and will defend our sovereignty to the end!`
    },
    'peace-offer': {
      proposal: `Distinguished leader of ${targetName}, I write to you as one leader to another, setting aside the rhetoric of war for a moment of honest communication. Our nations have been locked in conflict, each convinced of the righteousness of our cause, each determined to prevail. But I must ask you to step back with me and look at this situation with clear eyes. How many have died? How much treasure have we both expended? How much has this conflict cost both our peoples in opportunities lost, in development delayed, in suffering endured? I am reaching out to offer peace - not a peace of total victory or humiliating defeat, but a negotiated peace that allows both our nations to end this conflict with dignity and move forward. War is sometimes necessary, but it should never be perpetual. There comes a time when leaders must have the courage not just to fight, but to make peace. I believe that time has come for us. The peace I offer includes terms that I believe are fair and reasonable, recognizing the legitimate interests of both our nations. Neither of us will get everything we want, but both of us will escape the grinding destructiveness of endless war. I ask you to consider this offer seriously, to consult with your advisors, and to respond with the wisdom that leadership demands. Let us end this conflict and give our peoples the peace they deserve.`,
      accept: `Your words have moved me, and after deep reflection and extensive consultation with my government, ${targetName} accepts your offer of peace. You speak truth when you observe that this conflict has cost both our nations dearly - in lives, in resources, in opportunities, and in the simple hope for a better future that war inevitably destroys. My military commanders can list our victories and enumerate ways we might continue fighting, but even victories in a losing war are ultimately defeats. The terms you offer, while requiring compromises on our part, are honorable terms that allow ${targetName} to make peace without utter humiliation. Our people are weary, our economy is strained, and the path of continued war offers only more of the same suffering we have already endured. It takes more courage to make peace than to make war, and I am choosing courage over pride. Let the peace between ${proposerName} and ${targetName} be formalized, and let both our nations work to heal the wounds this conflict has opened. May this peace be lasting, and may future generations look back and judge that we made the right decision when we chose dialogue over destruction.`,
      reject: `I have read your offer of peace with the attention it deserves, and I have consulted widely with my government and military leadership. However, ${targetName} cannot accept the terms you propose. While you speak eloquently about the costs of war and the virtues of peace, your actual terms reflect neither fairness nor balance, but rather an attempt to achieve through negotiation what you could not achieve on the battlefield. The conditions you propose would leave ${targetName} in an unacceptable strategic position, compromising our security, undermining our sovereignty, and betraying the sacrifices our people have already made in this conflict. You are correct that war is costly, but some things are worth fighting for, and the independence and dignity of our nation are among them. We did not start this conflict seeking glory or conquest, but neither will we end it by accepting terms that amount to surrender dressed up in the language of peace. When you are ready to propose terms that truly reflect mutual compromise rather than disguised capitulation, we will be ready to negotiate seriously. Until then, the conflict continues. We choose to fight for a just peace rather than accept an unjust one.`
    }
  };

  const typeMessages = messages[proposal.type];
  if (isAcceptance) {
    return typeMessages.accept;
  } else {
    return proposal.playerInitiated ? typeMessages.reject : typeMessages.proposal;
  }
}
