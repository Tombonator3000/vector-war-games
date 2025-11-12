/**
 * AI Negotiation Content Generator
 *
 * Generates AI-initiated negotiation deals and diplomatic messages
 * based on the purpose and context of the negotiation.
 */

import type { Nation } from '@/types/game';
import type {
  AIInitiatedNegotiation,
  NegotiationPurpose,
  NegotiationUrgency,
  NegotiationState,
  NegotiableItem,
} from '@/types/negotiation';
import { createNegotiation, addItemToOffer, addItemToRequest } from './negotiationUtils';
import { getRelationship } from './relationshipUtils';
import { getTrust } from '@/types/trustAndFavors';
import type { TriggerResult } from './aiNegotiationTriggers';

// ============================================================================
// Message Templates
// ============================================================================

const MESSAGE_TEMPLATES: Record<NegotiationPurpose, string[]> = {
  'request-help': [
    'I reach out to you today in a time of great urgency and concern. Our nation faces a dire and immediate threat that, I must confess, exceeds our capacity to handle alone. Intelligence reports that have crossed my desk paint a deeply troubling picture of forces gathering against us, and after consulting with my military advisors, I have come to the difficult conclusion that we require assistance. I understand that asking for help is never easy between nations, and I would not make this request lightly. But the security of my people must come before pride, and so I turn to you now, hoping that you will consider standing with us in our hour of need. The threat we face is not merely against our nation - if unchecked, it could destabilize our entire region, and that would ultimately affect your interests as well. I am prepared to offer substantial compensation for your assistance, and I give you my word that this support will not be forgotten when the crisis has passed.',
    'Our intelligence services have uncovered information that has caused considerable alarm within my government. There exists a serious and growing threat to our national security, one that we cannot effectively counter with our resources alone. I am reaching out to you because I believe you understand the strategic realities of our situation, and I hope you will see that helping us serves your own interests as well. A threat to our stability is, in many ways, a threat to the regional balance of power that has served both our nations reasonably well. I am not asking for charity - we are prepared to compensate you fairly for any assistance you provide, whether military, economic, or diplomatic. What I am asking for is a partnership born of mutual interest and strategic necessity. The situation is urgent, but not yet desperate. If we act now, together, we can address this threat before it grows beyond control. I await your response and hope it will be favorable.',
    'A powerful enemy has emerged on our borders, and their intentions toward our nation are unmistakably hostile. Their military buildup, their aggressive rhetoric, their repeated provocations - all of these point to an impending crisis that my government takes with the utmost seriousness. I have spent many sleepless nights reviewing intelligence reports, consulting with military strategists, and weighing our options. The conclusion is inescapable - we need support, and we need it from a nation strong enough to make a difference. That nation is yours. I am not coming to you as a supplicant, but as a potential partner facing a common challenge. If this threat succeeds against us, do you think they will simply stop at our borders? Of course not. They will turn their attention to other targets, and eventually, that may include you. By standing with us now, you not only help a neighbor in need, but you also check aggression before it grows too powerful. We offer our friendship, our gratitude, and tangible compensation. Will you stand with us?',
  ],
  'offer-alliance': [
    'I have been reflecting lately on the state of relations between our nations, and I have come to a conclusion that I believe merits serious discussion. Our nations, while historically independent and occasionally at odds, actually share far more common interests than differences. We face similar threats, pursue similar goals, and hold similar values regarding regional stability and prosperity. Given these realities, I believe the time has come to move beyond mere cordial relations and formalize a genuine alliance between our peoples. This is not a decision I suggest lightly - alliances are profound commitments that bind the fates of nations together. But I believe that in unity, we would find strength that neither of us possesses alone. Together, we could coordinate our diplomatic efforts, enhance our collective security, expand trade and economic cooperation, and present a united front to any who might threaten our interests. I have instructed my diplomatic corps to prepare a comprehensive proposal for your review, but I wanted to reach out to you personally first, leader to leader, to gauge your interest in this concept. I believe an alliance between us could be transformative for both our nations. What are your thoughts?',
    'The world we inhabit grows more complex and challenging with each passing year. New powers emerge, old certainties crumble, and the luxury of isolation becomes increasingly untenable. In this environment, I have concluded that our two nations are stronger together than apart. We have complementary capabilities - your strengths compensate for our weaknesses, and vice versa. We share similar strategic concerns and face common threats. Most importantly, I believe our peoples could build genuine trust and friendship, given the opportunity. I am therefore proposing a formal alliance between our nations - not a casual agreement or a temporary arrangement, but a permanent partnership built on mutual commitment and shared destiny. Such an alliance would include mutual defense provisions, economic cooperation agreements, intelligence sharing, and regular high-level consultations on all matters of common concern. I recognize this is a substantial commitment, and I expect you will want to consult with your advisors before responding. Please know that this offer comes from a place of genuine respect for your nation and authentic belief in the benefits such a partnership would bring to both our peoples.',
    'Our nations have coexisted peacefully for some time, maintaining cordial but somewhat distant relations. I believe we can do better. I believe we must do better. The strategic landscape is shifting, new threats are emerging, and old certainties no longer hold. In this environment, having genuine allies - nations you can truly count on - becomes not just advantageous but essential. I am reaching out to propose that our nations enter into a formal alliance, a binding commitment to stand together in matters of security, prosperity, and mutual interest. I envision this as more than a mere treaty - I envision a genuine partnership where our governments coordinate closely, where our peoples interact freely, and where both nations benefit from the unique strengths each brings to the relationship. An alliance with us would mean you have a steadfast partner who will honor commitments and stand by you in difficult times. In return, we would expect the same from you. I have authorized my diplomatic team to discuss specific terms and arrangements, but I wanted to personally convey to you the sincerity and strategic importance I attach to this proposal. I hope you will give it the serious consideration I believe it deserves.',
  ],
  'reconciliation': [
    'I am reaching out to you today in a spirit of conciliation and, I hope, wisdom. Recent events have strained the relationship between our nations, and I believe both of us, if we are honest, bear some responsibility for how things have deteriorated. Conflicts and misunderstandings have accumulated, creating barriers of mistrust and resentment that serve neither of our peoples well. I have been thinking deeply about this situation, and I have concluded that continuing down this path benefits no one. Whatever grievances exist between us, surely they are not so insurmountable that dialogue and compromise cannot address them. I am therefore reaching out to propose that we work together to repair the damage that has been done to our relationship. This will require concessions and compromises from both sides - I recognize that. We must both be willing to acknowledge mistakes, to offer and accept apologies, and to work in good faith toward a better understanding. I am prepared to take concrete steps to demonstrate our sincerity, and I hope you will be willing to reciprocate. Our nations have more to gain from friendship than from continued hostility. Let us set aside the conflicts of the past and work together to build a more constructive future. I await your response and hope it will be positive.',
    'The relationship between our nations has deteriorated to a point that I find both regrettable and unnecessary. Past conflicts, real and perceived grievances, and a cycle of retaliation and counter-retaliation have created an atmosphere of hostility that benefits neither of us. I have consulted with my advisors, reviewed the history of our interactions, and come to a clear conclusion - this must change. I am reaching out to you as one leader to another, setting aside diplomatic formalities for a moment of honest communication. I want to repair the damage between our nations and establish a relationship based on mutual respect rather than mutual suspicion. This will not be easy - there are legitimate grievances on both sides that must be acknowledged and addressed. But I believe it is possible if both of us approach this in good faith, willing to compromise and willing to look forward rather than backward. I am prepared to make tangible gestures of reconciliation - offering apologies where appropriate, providing compensation for past harms, and committing to better behavior in the future. I ask only that you be willing to do the same. Our peoples deserve better than the current state of affairs between us. Let us work together to give them that better future.',
    'Too much bad blood has accumulated between our nations, and I believe the time has come to address this situation directly and honestly. I have reviewed the history of our relationship, examined the incidents and decisions that have brought us to this point, and I must acknowledge that my nation bears some responsibility for the current state of affairs. We have not always acted with the wisdom or restraint that good neighbors should demonstrate toward each other. I am reaching out to you now because I wish to change course and repair the damage that has been done. Reconciliation is never easy - it requires both parties to set aside pride, acknowledge mistakes, and work together toward a better future. But I believe the alternative - continued hostility and mistrust - serves neither of our interests. I am prepared to offer concrete concessions and gestures of goodwill to demonstrate that our desire for reconciliation is genuine. I hope you will be willing to meet me halfway and work together to build a healthier, more constructive relationship between our nations. The past cannot be changed, but the future is still unwritten. Let us write a better chapter together. I await your response.',
  ],
  'demand-compensation': [
    'I write to you today regarding a matter of grave concern that can no longer be ignored. Your nation\'s recent actions have caused significant and documented harm to our people, our economy, and our national security. My government has compiled extensive evidence of the damages inflicted, and our legal and diplomatic experts are unanimous in their assessment - your nation bears clear responsibility for these harms. I am therefore formally demanding that you provide appropriate compensation and make amends for these transgressions. This is not a request but a requirement of justice and international norms. The damages you have caused are real and substantial - destroyed infrastructure, economic losses, loss of life, and long-term harm to our national interests. We have calculated fair compensation for these damages, and we expect payment. Additionally, we expect a formal acknowledgment of responsibility and measures to ensure such incidents do not recur. I want to be clear - we are not seeking to exploit this situation or to extract unreasonable concessions. We seek only what is fair and just given the harm that has been inflicted. However, I must also be clear that if you refuse to address this matter responsibly, we will have no choice but to pursue other means of obtaining justice. I hope you will respond to this demand with the seriousness it deserves and work with us to resolve this matter amicably.',
    'Your recent conduct toward our nation has crossed lines that cannot be overlooked or forgiven without proper accountability. The damage you have inflicted - whether through deliberate aggression, reckless disregard for consequences, or gross negligence - has harmed our people and our national interests in ways that demand redress. I have been patient, hoping that you would recognize your responsibility and take steps to make amends. That patience has not been rewarded, and so I must now formally demand compensation and reparations. We are not asking for charity or seeking to exploit the situation. We are simply insisting on basic justice - that those who cause harm bear responsibility for repairing that harm. Our demands are measured and reasonable, calculated based on actual damages suffered rather than on anger or desire for revenge. However, make no mistake - these demands are serious, and we expect them to be treated as such. Failure to provide appropriate compensation will result in severe consequences for our bilateral relations and may force us to seek other remedies. I strongly urge you to engage with this matter constructively, to acknowledge your responsibility, and to work with us to resolve this situation in a manner that restores some measure of justice for the wrongs that have been committed.',
    'I must address a matter that has caused considerable anger and frustration within my government and among my people - the harm your nation has inflicted upon us through your recent actions. Whether these actions were intentional acts of aggression or the result of catastrophic incompetence matters little to the families who have suffered, to the communities that have been damaged, or to the national interests that have been compromised. What matters now is accountability and compensation. My nation demands that you acknowledge your responsibility for these harms, that you provide substantial financial and material compensation for the damages inflicted, and that you implement concrete measures to ensure such incidents do not recur. This is not an opening position for negotiation - these are our minimum requirements for moving forward. We have documented every aspect of the harm you have caused, and our calculations are based on objective assessments of actual damages. We are prepared to present this evidence to international arbiters if necessary, but we would prefer to resolve this matter directly between our governments. I urge you to take this demand seriously and to respond promptly and constructively. The patience of my people and my government has limits, and those limits are being tested. Make this right, or face the consequences of continued injustice.',
  ],
  'warning': [
    'I am reaching out to you today in a communication I had hoped would not be necessary, but which circumstances now demand. Your nation\'s recent behavior and actions have crossed lines that my government considers unacceptable and threatening to our national interests. I want to be absolutely clear about this - we are watching your activities with growing alarm, and we will not tolerate continued provocations or aggressive actions that threaten our security or that of our allies. This is an official warning from my government to yours. You must change course immediately. The specific behaviors we find unacceptable are well-known to you - I need not enumerate them here. What you must understand is that continued escalation along your current path will leave us with no choice but to respond with all means at our disposal to protect our interests. I am not threatening war, but I am making it absolutely clear that your actions have consequences, and those consequences will be severe if you do not alter your behavior. I am hoping - and I use that word deliberately - that this warning will be taken with the seriousness it deserves and that wisdom will prevail. There is still time to step back from the brink and pursue a more constructive path. But that time is running out. I strongly urge you to consult with your advisors, assess the strategic realities of your situation, and make the rational choice to de-escalate before events spiral beyond control. Consider this your final warning.',
    'The patience of my government and my people has reached its limit regarding your nation\'s provocative and aggressive behavior. We have tolerated repeated incidents, hoping that each would be the last, hoping that eventually wisdom would prevail. That hope has proven misplaced. Your actions continue to escalate, your rhetoric continues to become more bellicose, and your disregard for our concerns continues to grow. This cannot and will not continue. I am issuing this formal warning as a last opportunity for you to reconsider your course before my government is forced to take more decisive action. We are not your enemy, but your behavior is rapidly making confrontation inevitable. Every action has consequences, and the consequences of your current path lead nowhere good for either of our nations. I want to be absolutely explicit about what we find unacceptable and what must change. Your military activities near our borders, your support for elements hostile to our interests, your inflammatory public statements, and your apparent disregard for established norms and agreements - all of these must cease. If they do not cease, we will respond with appropriate measures to protect our interests. I do not make threats idly or for dramatic effect. This is a serious communication from one government to another. You have pushed us to the edge of what we will tolerate. Do not push further. Change course now, while that option remains available. This is your final warning.',
    'I have tried to maintain channels of communication and dialogue with your government despite mounting provocations and concerning behaviors. I have counseled restraint to my own military and political hardliners who advocate for more forceful responses to your actions. I have attempted to find diplomatic solutions to our differences. But your continued aggressive conduct has made this increasingly difficult to justify to my own people and government. I must now deliver a clear and unambiguous warning - your current actions are unacceptable and must cease immediately. We will not tolerate continued threats to our security, our interests, or our allies. Every nation has limits to what it will endure, and you are testing those limits in ways that are dangerous and reckless. I am giving you this warning not because I desire conflict, but because I wish to avoid it. But avoiding conflict requires that you understand clearly that there will be severe consequences if you continue down your current path. Those consequences may be economic, diplomatic, or military - that will depend on your choices and our assessment of what measures are necessary to protect our interests. But make no mistake - there will be consequences. You have a choice to make. You can step back from your current aggressive posture, engage in constructive dialogue, and work toward de-escalation. Or you can continue on your present course and discover that our warnings were not empty rhetoric. I urge you most strongly to choose the former. This is your final opportunity to do so.',
  ],
  'peace-offer': [
    'I write to you today as one weary leader to another, setting aside the rhetoric and posturing that war demands, and speaking with honest candor about the situation that confronts us both. Our nations have been at war for some time now, and that war has exacted a terrible toll on both our peoples. I have read the casualty reports, I have visited the wounded, I have seen the destroyed cities and broken infrastructure. I suspect you have seen the same on your side. And I must ask - what have we truly accomplished? What objectives have we achieved that justify this level of suffering and destruction? I am reaching out to you today to offer peace - not because either side has been decisively defeated, but because I believe continued war serves neither of our peoples well. The peace I propose would allow both our nations to end this conflict with dignity, without humiliating surrender or devastating defeat. It would include terms that recognize the legitimate interests and security concerns of both sides. Neither of us would get everything we might want, but both of us would escape the endless grinding destruction of prolonged conflict. Making peace is often harder than making war, because it requires compromise and the courage to explain to your people why fighting should stop. But I believe you have that courage, just as I hope I do. I urge you to consider this offer carefully, to consult with your advisors, and to respond with the wisdom that true leadership demands. Let us end this war and give our peoples the peace they deserve.',
    'The war between our nations has reached a point where I believe both of us must step back and honestly assess whether its continuation serves any rational purpose. Too much blood has been spilled, too much treasure has been expended, too many opportunities have been lost. The initial causes of this conflict, whatever they may have been, have long since been overshadowed by the sheer accumulated misery the war has produced. I am therefore offering you peace terms that I have carefully crafted to be fair and honorable to both sides. These terms recognize that war rarely produces absolute victors and absolute losers, but rather leaves all participants diminished. The peace I offer would allow both our nations to halt the fighting, withdraw forces to secure positions, and begin the long process of reconstruction and healing. It would include provisions to address the core disputes that sparked this conflict, though likely in ways neither of us finds entirely satisfactory. That is the nature of compromise - neither side is completely happy, but both sides can accept the outcome. I am not coming to you from a position of desperation or from having been defeated. I am coming to you from a position of clear-eyed assessment of reality and a determination to serve my people\'s true interests rather than abstract principles of victory. I hope you will receive this offer in the spirit it is intended and will work with me to end this destructive conflict. The time has come to make peace. Let us have the courage to do so.',
    'Leader to leader, let me speak plainly with you about the war our nations are fighting. It has gone on too long, cost too much, and achieved too little. Both our peoples are exhausted, both our economies are strained, and both our military forces have been bled white by months or years of continuous combat. And yet the strategic situation remains essentially unchanged - neither side has achieved decisive advantage, neither side has broken the other\'s will to resist. This is the reality we must confront. I am offering you an opportunity to end this conflict through negotiated peace rather than through the complete exhaustion or destruction of one side or the other. The peace terms I propose are designed to address the core issues that divide us while allowing both nations to preserve their essential interests and dignity. Yes, both of us would need to make concessions and compromises. Yes, both of us would face critics who claim we should have fought on until total victory. But both of us would also be able to tell our people that we secured peace without surrender and that we can now begin rebuilding what war has destroyed. History teaches us that wars ending in total victory often plant the seeds for future conflicts, while negotiated peace can create foundations for lasting stability. Let us be wise enough to choose the latter path. I await your response to this peace offer, and I hope it will be positive. Too many have already died in this war. Let us ensure that their sacrifice leads to peace rather than simply to more war.',
  ],
  'trade-opportunity': [
    'I am reaching out to you today with a proposal that I believe could be mutually beneficial to both our nations - a proposal rooted not in politics or security concerns, but in simple economic logic. My economic advisors have conducted extensive analysis of our respective economies, and they have identified significant opportunities for trade and economic cooperation that are currently going unexploited. We have resources and products in surplus that you need, and you have capabilities and goods that would benefit our economy. In short, there exists potential for trade arrangements that would enrich both our peoples while strengthening the economic ties between our nations. I am therefore proposing that we negotiate a comprehensive trade agreement that would facilitate the exchange of goods, resources, and services between our nations on favorable terms for both sides. This is not about foreign aid or one-sided concessions - this is about identifying genuine opportunities for mutual benefit and creating the framework to realize those opportunities. Trade has historically been one of the most powerful forces for building trust and understanding between nations, as both sides develop interests in the other\'s prosperity. I believe our nations could benefit greatly from stronger economic ties, and I hope you will be willing to explore this opportunity. I have instructed my trade representatives to prepare detailed proposals for your review, but I wanted to reach out personally to gauge your interest and to emphasize the importance I attach to this initiative. Shall we discuss this further?',
    'Economic analysis conducted by my government has revealed an interesting and potentially valuable opportunity that I wanted to bring to your attention personally. Our two economies, while quite different in some ways, appear to be remarkably complementary in others. We produce goods and resources that you need and could use efficiently, while you have capabilities and products that our economy requires. Currently, trade between our nations is minimal, which means we are both foregoing significant economic benefits that cooperation could provide. I am proposing that we establish a mutually beneficial trade arrangement - a structured agreement that would facilitate exchanges of goods, resources, technology, and services on terms favorable to both sides. This would not be a charitable gesture from either party, but a rational economic arrangement where both sides profit. My economic ministers have modeled various scenarios and believe that properly structured trade could deliver substantial benefits to both our peoples - lower prices for consumers, new markets for producers, and overall economic growth that would enhance prosperity on both sides. Beyond the immediate economic advantages, such trade would also have diplomatic benefits, creating economic interdependence that tends to discourage conflict and encourage cooperation. I hope you will consider this proposal seriously and will instruct your own economic advisors to explore these opportunities with mine. I believe we could build something quite valuable here for both our nations.',
    'I wanted to reach out to discuss an opportunity for economic cooperation between our nations that I believe has been overlooked for too long. In reviewing our economic relationship, I have been struck by how little trade actually occurs between us, despite the fact that our economies are quite complementary. We have surpluses of certain resources and products that you need, and our industries would benefit from access to goods and materials that you produce. The potential for mutually beneficial exchange is significant, yet largely unrealized. I am proposing that we work together to change this situation by negotiating trade agreements that would expand economic cooperation and create value for both our peoples. This is not about charity or political influence - this is about recognizing economic realities and acting on them for mutual benefit. Trade enriches both parties, creates jobs, improves efficiency, and builds prosperity. It also creates positive interdependence between nations, as both sides develop interests in the other\'s success. I have asked my economic advisors to develop specific proposals outlining what such trade arrangements might include and how they would benefit both sides. I hope you will be willing to review these proposals with an open mind and will instruct your own experts to work with mine to explore these opportunities. I genuinely believe that enhanced trade between our nations would serve both our peoples well, and I hope you will agree. Let us explore this potential together.',
  ],
  'mutual-defense': [
    'The strategic environment in our region has been deteriorating steadily, and I believe both our nations have noticed this troubling trend. New threats are emerging, established powers are behaving more aggressively, and the sense of instability and unpredictability has grown significantly. In this environment, I have concluded that our two nations share a common interest in security that we could advance through closer cooperation. I am therefore proposing that we negotiate a mutual defense pact - a formal agreement where both our nations pledge to defend each other against aggression or attack. This would not be an offensive alliance aimed at threatening others, but a defensive arrangement intended to deter aggression against either of us. The logic is straightforward - potential adversaries would have to consider that attacking either of our nations would mean confronting both, and that calculus would make aggression far less attractive. Such a pact would enhance both our security at reasonable cost, as the commitment would only be triggered by external attack rather than by offensive operations or distant conflicts. I recognize this is a significant commitment, and I expect you would want to discuss the specific terms and conditions carefully before agreeing. But I believe the strategic logic is compelling and that such an arrangement would serve both our interests well. Our nations may not be natural allies in all things, but in terms of security and defense against common threats, I believe our interests align quite closely. I hope you will give this proposal serious consideration.',
    'I have been reviewing intelligence assessments and strategic forecasts for our region, and I must tell you that I find the picture they paint deeply concerning. The balance of power is shifting, new threats are emerging, and the general trend is toward greater instability and increased risk of conflict. In this environment, having reliable allies and security partners becomes not merely advantageous but essential. I am reaching out to propose that our nations enter into a mutual defense agreement - a solemn commitment that if either of our nations is attacked, the other will come to its defense. Such agreements have been a cornerstone of international security for generations because they work - they deter aggression by ensuring that potential attackers face not just one opponent but multiple opponents acting in concert. For our nations specifically, I believe a mutual defense pact would provide significant security benefits to both sides. It would allow us to coordinate defense planning, share intelligence, conduct joint training, and present a unified front to potential threats. It would send a clear message that aggression against either of us would be costly and dangerous. And it would allow both our nations to maintain robust defense capabilities at more sustainable cost through coordination and cooperation. I am not proposing this lightly, and I recognize the commitment involved. But I believe the security benefits justify the commitment, and I hope you will agree. Let us discuss this further and see if we can reach an agreement that serves both our interests.',
    'The world grows more dangerous with each passing year, and I have concluded that our two nations must work more closely together on matters of defense and security if we wish to preserve our sovereignty and protect our peoples. The threats we face - whether from aggressive neighbors, regional instability, or broader strategic shifts - are real and growing. Neither of our nations can afford to stand alone against these threats, yet together we would represent a far more formidable defensive force. I am therefore proposing a mutual defense pact between our nations. Under such an agreement, both of us would pledge to come to the other\'s defense if attacked, to coordinate our defense planning and capabilities, and to present a united front against potential aggressors. This is not an offensive alliance - we would not be committing to participate in wars of choice or distant adventures. This is specifically about mutual defense, about ensuring that both our nations can deter aggression and defend themselves effectively against genuine threats to our security. The benefits of such an arrangement are substantial. Potential adversaries would have to think twice before attacking either of us, knowing they would face both our forces. We could share intelligence, coordinate strategies, and make our defense spending more efficient through cooperation. And we would both sleep somewhat easier knowing we have a reliable partner committed to our security. I hope you will consider this proposal carefully and will work with me to develop an agreement that serves both our nations well.',
  ],
  'joint-venture': [
    'I have been reflecting on the various challenges and opportunities facing both our nations, and I have identified an area where I believe we could cooperate to our mutual advantage. There exists a specific opportunity - a project, initiative, or undertaking that neither of our nations could accomplish efficiently alone, but which we could achieve together by pooling our respective resources and capabilities. I am reaching out to propose a joint venture between our nations to pursue this opportunity. The concept is simple - you bring certain strengths, capabilities, and resources to the table, and we bring others. By working together, we could accomplish objectives that would be difficult or impossible for either nation alone. This could involve joint development of technology, cooperative resource extraction, shared infrastructure projects, or any number of other initiatives where our complementary capabilities could be leveraged for mutual benefit. I have instructed my ministers to prepare detailed proposals outlining how such cooperation might work, what each nation would contribute, and how benefits would be shared. But I wanted to reach out to you personally first to discuss this concept at a high level and to gauge your interest. I believe our nations have unique opportunities to work together in ways that could benefit both our peoples significantly. Joint ventures of this sort build trust, create shared interests, and often lead to broader cooperation over time. I hope you will be open to exploring this possibility, and I look forward to your response.',
    'An opportunity has presented itself that I believe would benefit greatly from cooperation between our two nations. There is a project - an initiative that could advance the interests of both our peoples - but it requires resources, capabilities, and expertise that exceed what either nation possesses on its own. However, by working together, pooling our respective strengths, and coordinating our efforts, we could accomplish something quite valuable. I am proposing a joint venture between our nations to pursue this opportunity. Such ventures have proven remarkably successful throughout history when implemented thoughtfully and managed well. Each nation contributes what it does best, shares in the work and the investment, and ultimately shares in the benefits and results. This creates alignment of interests, builds working relationships between our governments and peoples, and often leads to unexpected additional benefits beyond the original project goals. The specific opportunity I have in mind would involve contributions from both sides - we would provide certain resources and capabilities while you would provide others. The work would be shared, the costs would be shared, and the benefits would be shared according to agreed formulas. I believe both our nations would profit from this arrangement, and that the cooperative aspects would strengthen relations between us in valuable ways. I hope you will be willing to explore this proposal seriously, and I have instructed my representatives to work with yours to develop detailed plans if you express interest. Let us discuss this further and see if we can build something valuable together.',
    'I wanted to bring to your attention an opportunity for cooperation between our nations that I find particularly exciting and promising. My strategic planners have identified an initiative - a project or undertaking - that could deliver substantial benefits to both our peoples, but which would be extremely difficult for either nation to accomplish alone due to the resources and expertise required. However, by working together as partners in a joint venture, we could make this project feasible and successful. The basic concept of the joint venture I am proposing is straightforward - both nations would contribute resources, capabilities, and expertise according to what each does best. We would share the work, share the investment costs, and ultimately share the benefits according to our respective contributions. This creates a true partnership where both sides have strong incentives to ensure success, and where the result is greater than either nation could achieve independently. Beyond the immediate benefits of whatever project we undertake together, such cooperation has broader diplomatic and strategic value. It builds trust, creates positive interdependence, demonstrates that our nations can work together effectively, and often opens doors to additional opportunities for cooperation. I have seen this pattern play out with other nations, and I believe it could work well for us. I hope you will consider this proposal with an open mind and will be willing to have your experts meet with mine to explore the possibilities. I genuinely believe we could accomplish something significant together.',
  ],
};

// ============================================================================
// Deal Generation Functions
// ============================================================================

/**
 * Generate help request deal (AI needs assistance against threat)
 */
function generateHelpRequest(
  aiNation: Nation,
  targetNation: Nation,
  allNations: Nation[],
  context: TriggerResult['context'],
  currentTurn: number
): NegotiationState {
  const negotiation = createNegotiation(aiNation.id, targetNation.id, currentTurn);

  // AI requests: Military alliance or join-war
  if (context.targetNation) {
    const joinWarItem: NegotiableItem = {
      type: 'join-war',
      targetId: context.targetNation,
      description: `Join war against ${allNations.find(n => n.id === context.targetNation)?.name}`,
    };
    addItemToRequest(negotiation, joinWarItem);
  } else {
    const allianceItem: NegotiableItem = {
      type: 'alliance',
      subtype: 'military',
      duration: 20,
      description: 'Military alliance (20 turns)',
    };
    addItemToRequest(negotiation, allianceItem);
  }

  // AI offers: Gold and/or intel as payment
  const goldAmount = Math.floor((aiNation.production || 0) * 0.3);
  if (goldAmount > 0) {
    addItemToOffer(negotiation, {
      type: 'gold',
      amount: goldAmount,
      description: `${goldAmount} production points`,
    });
  }

  const intelAmount = Math.floor((aiNation.intel || 0) * 0.2);
  if (intelAmount > 10) {
    addItemToOffer(negotiation, {
      type: 'intel',
      amount: intelAmount,
      description: `${intelAmount} intelligence points`,
    });
  }

  // Also offer favor
  addItemToOffer(negotiation, {
    type: 'favor-exchange',
    amount: 2,
    description: 'Owe you 2 favors',
  });

  return negotiation;
}

/**
 * Generate alliance offer deal
 */
function generateAllianceOffer(
  aiNation: Nation,
  targetNation: Nation,
  allNations: Nation[],
  context: TriggerResult['context'],
  currentTurn: number
): NegotiationState {
  const negotiation = createNegotiation(aiNation.id, targetNation.id, currentTurn);

  const relationship = getRelationship(aiNation, targetNation.id);

  // AI offers: Military alliance + open borders
  addItemToOffer(negotiation, {
    type: 'alliance',
    subtype: 'military',
    duration: 30,
    description: 'Military alliance (30 turns)',
  });

  addItemToOffer(negotiation, {
    type: 'open-borders',
    duration: 30,
    description: 'Open borders (30 turns)',
  });

  // AI requests: Same from target
  addItemToRequest(negotiation, {
    type: 'alliance',
    subtype: 'military',
    duration: 30,
    description: 'Military alliance (30 turns)',
  });

  addItemToRequest(negotiation, {
    type: 'open-borders',
    duration: 30,
    description: 'Open borders (30 turns)',
  });

  // If relationship is really good, also add non-aggression
  if (relationship > 40) {
    addItemToOffer(negotiation, {
      type: 'treaty',
      subtype: 'non-aggression',
      duration: 50,
      description: 'Non-aggression pact (50 turns)',
    });

    addItemToRequest(negotiation, {
      type: 'treaty',
      subtype: 'non-aggression',
      duration: 50,
      description: 'Non-aggression pact (50 turns)',
    });
  }

  return negotiation;
}

/**
 * Generate reconciliation offer deal
 */
function generateReconciliationOffer(
  aiNation: Nation,
  targetNation: Nation,
  allNations: Nation[],
  context: TriggerResult['context'],
  currentTurn: number
): NegotiationState {
  const negotiation = createNegotiation(aiNation.id, targetNation.id, currentTurn);

  // AI offers: Apology for grievances + some compensation
  const ourGrievances = (targetNation.grievances || []).filter(
    g => g.againstNationId === aiNation.id
  );

  if (ourGrievances.length > 0) {
    addItemToOffer(negotiation, {
      type: 'grievance-apology',
      grievanceId: ourGrievances[0].id,
      description: `Apology for: ${ourGrievances[0].description}`,
    });
  }

  // Offer some gold as goodwill
  const goldAmount = Math.floor((aiNation.production || 0) * 0.15);
  if (goldAmount > 0) {
    addItemToOffer(negotiation, {
      type: 'gold',
      amount: goldAmount,
      description: `${goldAmount} production as goodwill`,
    });
  }

  // Request: They apologize too if they have grievances
  const theirGrievances = (aiNation.grievances || []).filter(
    g => g.againstNationId === targetNation.id
  );

  if (theirGrievances.length > 0) {
    addItemToRequest(negotiation, {
      type: 'grievance-apology',
      grievanceId: theirGrievances[0].id,
      description: `Apology for: ${theirGrievances[0].description}`,
    });
  }

  // Request non-aggression pact
  addItemToRequest(negotiation, {
    type: 'treaty',
    subtype: 'non-aggression',
    duration: 20,
    description: 'Non-aggression pact (20 turns)',
  });

  return negotiation;
}

/**
 * Generate compensation demand deal
 */
function generateCompensationDemand(
  aiNation: Nation,
  targetNation: Nation,
  allNations: Nation[],
  context: TriggerResult['context'],
  currentTurn: number
): NegotiationState {
  const negotiation = createNegotiation(aiNation.id, targetNation.id, currentTurn);

  // AI demands: Compensation based on grievance severity
  const severity = context.totalSeverity || 3;
  const compensationAmount = severity * 30;

  addItemToRequest(negotiation, {
    type: 'gold',
    amount: compensationAmount,
    description: `${compensationAmount} production as reparations`,
  });

  // Also demand apology
  if (context.grievanceId) {
    addItemToRequest(negotiation, {
      type: 'grievance-apology',
      grievanceId: context.grievanceId,
      description: 'Formal apology',
    });
  }

  // AI offers: Will drop grievances and restore relationship
  addItemToOffer(negotiation, {
    type: 'promise',
    subtype: 'drop-grievances',
    description: 'Drop all grievances against you',
  });

  // Offer non-aggression if they comply
  addItemToOffer(negotiation, {
    type: 'treaty',
    subtype: 'non-aggression',
    duration: 15,
    description: 'Non-aggression pact (15 turns)',
  });

  return negotiation;
}

/**
 * Generate warning (ultimatum) deal
 */
function generateWarning(
  aiNation: Nation,
  targetNation: Nation,
  allNations: Nation[],
  context: TriggerResult['context'],
  currentTurn: number
): NegotiationState {
  const negotiation = createNegotiation(aiNation.id, targetNation.id, currentTurn);

  // AI demands: Stop aggressive behavior
  addItemToRequest(negotiation, {
    type: 'promise',
    subtype: 'cease-aggression',
    duration: 20,
    description: 'Promise to cease aggressive actions (20 turns)',
  });

  // Demand some compensation
  const compensationAmount = 50;
  addItemToRequest(negotiation, {
    type: 'gold',
    amount: compensationAmount,
    description: `${compensationAmount} production as compensation`,
  });

  // AI offers: Will not retaliate if demands met
  addItemToOffer(negotiation, {
    type: 'promise',
    subtype: 'no-retaliation',
    duration: 10,
    description: 'Promise not to retaliate (10 turns)',
  });

  return negotiation;
}

/**
 * Generate trade offer deal
 */
function generateTradeOffer(
  aiNation: Nation,
  targetNation: Nation,
  allNations: Nation[],
  context: TriggerResult['context'],
  currentTurn: number
): NegotiationState {
  const negotiation = createNegotiation(aiNation.id, targetNation.id, currentTurn);

  const resourceType = context.resourceType || 'gold';

  // AI offers: Surplus resource
  if (resourceType === 'gold') {
    addItemToOffer(negotiation, {
      type: 'gold',
      amount: 80,
      description: '80 production points',
    });
  } else if (resourceType === 'intel') {
    addItemToOffer(negotiation, {
      type: 'intel',
      amount: 40,
      description: '40 intelligence points',
    });
  } else if (resourceType === 'uranium') {
    addItemToOffer(negotiation, {
      type: 'production',
      amount: 50,
      description: '50 uranium',
    });
  }

  // AI requests: Resources they need
  const targetResources = [];
  if ((targetNation.production || 0) > 100) targetResources.push('gold');
  if ((targetNation.intel || 0) > 50) targetResources.push('intel');

  if (targetResources.length > 0) {
    const requestType = targetResources[0];
    if (requestType === 'gold') {
      addItemToRequest(negotiation, {
        type: 'gold',
        amount: 60,
        description: '60 production points',
      });
    } else {
      addItemToRequest(negotiation, {
        type: 'intel',
        amount: 30,
        description: '30 intelligence points',
      });
    }
  } else {
    // Request favor instead
    addItemToRequest(negotiation, {
      type: 'favor-exchange',
      amount: 1,
      description: 'Owe me 1 favor',
    });
  }

  return negotiation;
}

// ============================================================================
// Master Generation Function
// ============================================================================

/**
 * Generate complete AI-initiated negotiation based on trigger result
 */
export function generateAINegotiationDeal(
  aiNation: Nation,
  targetNation: Nation,
  allNations: Nation[],
  triggerResult: TriggerResult,
  currentTurn: number
): AIInitiatedNegotiation {
  let proposedDeal: NegotiationState;

  // Generate deal based on purpose
  switch (triggerResult.purpose) {
    case 'request-help':
      proposedDeal = generateHelpRequest(aiNation, targetNation, allNations, triggerResult.context, currentTurn);
      break;
    case 'offer-alliance':
      proposedDeal = generateAllianceOffer(aiNation, targetNation, allNations, triggerResult.context, currentTurn);
      break;
    case 'reconciliation':
      proposedDeal = generateReconciliationOffer(aiNation, targetNation, allNations, triggerResult.context, currentTurn);
      break;
    case 'demand-compensation':
      proposedDeal = generateCompensationDemand(aiNation, targetNation, allNations, triggerResult.context, currentTurn);
      break;
    case 'warning':
      proposedDeal = generateWarning(aiNation, targetNation, allNations, triggerResult.context, currentTurn);
      break;
    case 'trade-opportunity':
      proposedDeal = generateTradeOffer(aiNation, targetNation, allNations, triggerResult.context, currentTurn);
      break;
    case 'mutual-defense':
      proposedDeal = generateAllianceOffer(aiNation, targetNation, allNations, triggerResult.context, currentTurn);
      break;
    case 'peace-offer':
      proposedDeal = generateReconciliationOffer(aiNation, targetNation, allNations, triggerResult.context, currentTurn);
      break;
    case 'joint-venture':
      proposedDeal = generateTradeOffer(aiNation, targetNation, allNations, triggerResult.context, currentTurn);
      break;
    default:
      proposedDeal = createNegotiation(aiNation.id, targetNation.id, currentTurn);
  }

  // Add purpose to negotiation
  proposedDeal.purpose = triggerResult.purpose;

  // Select message template
  const templates = MESSAGE_TEMPLATES[triggerResult.purpose] || ['I wish to negotiate with you.'];
  const message = templates[Math.floor(Math.random() * templates.length)];

  // Calculate expiration
  const expirationTurns = triggerResult.urgency === 'critical' ? 2 :
                          triggerResult.urgency === 'high' ? 3 :
                          triggerResult.urgency === 'medium' ? 5 : 10;

  const result: AIInitiatedNegotiation = {
    aiNationId: aiNation.id,
    targetNationId: targetNation.id,
    purpose: triggerResult.purpose,
    proposedDeal,
    message: `${message}\n\n${triggerResult.context.reason}`,
    urgency: triggerResult.urgency,
    expiresAtTurn: currentTurn + expirationTurns,
    createdTurn: currentTurn,
  };

  return result;
}

/**
 * Get diplomatic message based on personality and context
 */
export function getPersonalizedMessage(
  aiNation: Nation,
  targetNation: Nation,
  purpose: NegotiationPurpose,
  context: string
): string {
  const personality = aiNation.aiPersonality || 'balanced';
  const relationship = getRelationship(aiNation, targetNation.id);

  let tone = '';

  // Adjust tone based on personality
  if (personality === 'aggressive') {
    tone = relationship > 0 ? 'firm but respectful' : 'assertive and demanding';
  } else if (personality === 'defensive') {
    tone = 'cautious and diplomatic';
  } else if (personality === 'trickster') {
    tone = 'cunning and persuasive';
  } else {
    tone = 'balanced and pragmatic';
  }

  // Get base template
  const templates = MESSAGE_TEMPLATES[purpose] || ['I wish to negotiate.'];
  const baseMessage = templates[Math.floor(Math.random() * templates.length)];

  return `${baseMessage}\n\n${context}`;
}
