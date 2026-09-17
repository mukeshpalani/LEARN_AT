import re
from typing import Dict, Any, List
from backend.nlp.taxonomy import MessagePurpose


class SemanticClassifier:
    """
    Layer C — Semantic Similarity Classification.
    Evaluates semantic closeness between the user query and intent taxonomy.
    Handles semantic phrasing such as:
      - 'tell them how I feel', 'express my feelings', 'ask them to be with me' -> ROMANTIC_PROPOSAL
      - 'show my gratitude', 'say thanks', 'thank-you' -> THANK_YOU
      - 'agree to join', 'say yes to the invite', 'accept invitation' -> ACCEPTANCE
    """

    TAXONOMY_DESCRIPTIONS: Dict[MessagePurpose, List[str]] = {
        MessagePurpose.THANK_YOU: [
            "thank you", "thanks", "thank-you", "show gratitude", "express appreciation", "say thanks",
            "grateful for your support", "acknowledgement"
        ],
        MessagePurpose.ACCEPTANCE: [
            "accept invitation", "accepting invitation", "accept project showcase", "agree to join",
            "say yes to invite", "accepting offer", "will be attending", "confirm participation",
            "accept the offer", "i accept"
        ],
        MessagePurpose.BUSINESS_PROPOSAL: [
            "business proposal", "commercial proposal", "partnership proposal", "sales proposal", "business pitch",
            "project proposal", "corporate proposal"
        ],
        MessagePurpose.EVENT_PROPOSAL: [
            "event proposal", "showcase proposal", "workshop proposal", "conference proposal"
        ],
        MessagePurpose.GENERIC_EMAIL: [
            "dummy mail", "dummy email", "test mail", "test email", "sample mail", "sample email", "generic email"
        ],
        MessagePurpose.ROMANTIC_PROPOSAL: [
            "love proposal", "proposal of love", "express feelings", "feelings for you",
            "tell them how i feel", "express my feelings", "send a romantic message",
            "ask them if they would like to be with me", "marry me", "i love you",
            "romantic letter", "confess love", "be my partner"
        ],
        MessagePurpose.REJECTION: [
            "decline invitation", "reject offer", "cannot make it", "unable to attend",
            "turn down invite", "say no"
        ],
        MessagePurpose.INVITATION: [
            "invite you", "invitation to event", "project showcase invitation", "requesting attendance",
            "join us for meeting"
        ],
        MessagePurpose.FOLLOW_UP: [
            "follow up on previous", "status check", "any updates", "following up"
        ],
        MessagePurpose.APOLOGY: [
            "apologize for error", "sorry for late reply", "sincere apology"
        ],
        MessagePurpose.REMINDER: [
            "reminder for deadline", "don't forget event", "remind team"
        ],
        MessagePurpose.PROFESSIONAL: [
            "business update", "project sync", "official report", "formal notice"
        ],
        MessagePurpose.PERSONAL: [
            "personal note", "catch up", "friendly greeting", "private message"
        ]
    }

    @staticmethod
    def classify(query: str) -> Dict[str, Any]:
        # Normalize text: replace hyphens with spaces and remove non-alphanumeric except spaces
        clean_text = query.lower().replace('-', ' ')
        q_tokens = set(re.findall(r'\b[a-z0-9]+\b', clean_text))

        scores: Dict[str, float] = {}

        for purpose, phrases in SemanticClassifier.TAXONOMY_DESCRIPTIONS.items():
            max_sim = 0.0
            for phrase in phrases:
                phrase_clean = phrase.lower().replace('-', ' ')
                p_tokens = set(re.findall(r'\b[a-z0-9]+\b', phrase_clean))
                
                # Jaccard / Overlap similarity
                intersection = q_tokens.intersection(p_tokens)
                union = q_tokens.union(p_tokens)
                jaccard = len(intersection) / len(union) if union else 0.0

                # Phrase substring match boost
                if phrase_clean in clean_text or phrase.lower() in query.lower():
                    jaccard = max(jaccard, 0.95)

                if jaccard > max_sim:
                    max_sim = jaccard
            
            scores[purpose.value] = max_sim

        # Find top candidate
        sorted_candidates = sorted(scores.items(), key=lambda x: x[1], reverse=True)
        top_purpose, top_score = sorted_candidates[0] if sorted_candidates else (MessagePurpose.OTHER.value, 0.0)

        # If no strong match (score < 0.15), default to OTHER
        if top_score < 0.15:
            final_top_purpose = MessagePurpose.OTHER.value
            top_score = 0.0
        else:
            final_top_purpose = top_purpose

        return {
            "top_purpose": final_top_purpose,
            "top_score": top_score,
            "all_scores": scores
        }
