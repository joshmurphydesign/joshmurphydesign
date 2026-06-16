"""Tool implementations for the GFW BD Agent."""

import json
import datetime
from typing import Any

from knowledge_base import (
    PRODUCTS,
    MARKET_SEGMENTS,
    COMPETITIVE_LANDSCAPE,
    PRICING_STRATEGY,
    QUALIFYING_CRITERIA,
    KEY_OBJECTIONS,
    COMPANY_PROFILE,
)

# In-memory pipeline store (replace with DB in production)
_pipeline: list[dict] = []
_next_id = 1


# ---------------------------------------------------------------------------
# Tool definitions for the Anthropic API
# ---------------------------------------------------------------------------

TOOL_DEFINITIONS = [
    {
        "name": "get_product_info",
        "description": (
            "Retrieve detailed GFW product specifications, pricing, features, and "
            "application guidance for a specific product line or all products."
        ),
        "input_schema": {
            "type": "object",
            "properties": {
                "product_key": {
                    "type": "string",
                    "enum": ["articulated_water_trucks", "rigid_water_trucks", "dust_suppression_systems", "accessories_parts", "all"],
                    "description": "Which product to retrieve. Use 'all' for the full catalogue.",
                }
            },
            "required": ["product_key"],
        },
    },
    {
        "name": "qualify_lead",
        "description": (
            "Score and qualify a prospect against GFW's ideal customer criteria. "
            "Returns a qualification score (0-100), tier (A/B/C/D), and recommended next action."
        ),
        "input_schema": {
            "type": "object",
            "properties": {
                "company_name": {"type": "string", "description": "Prospect company name"},
                "segment": {
                    "type": "string",
                    "enum": ["oem_dealer", "mining", "construction"],
                    "description": "Market segment for the prospect",
                },
                "criteria_met": {
                    "type": "array",
                    "items": {"type": "string"},
                    "description": "List of qualifying criteria the prospect meets",
                },
                "criteria_missing": {
                    "type": "array",
                    "items": {"type": "string"},
                    "description": "List of qualifying criteria that are unknown or not met",
                },
                "budget_confirmed": {"type": "boolean", "description": "Has budget been confirmed?"},
                "timeline_months": {
                    "type": "integer",
                    "description": "Expected purchase timeline in months (0 = unknown)",
                },
                "estimated_units": {
                    "type": "integer",
                    "description": "Estimated number of units (0 = unknown)",
                },
            },
            "required": ["company_name", "segment", "criteria_met", "criteria_missing"],
        },
    },
    {
        "name": "draft_outreach_email",
        "description": "Generate a personalised cold or warm outreach email for a prospect.",
        "input_schema": {
            "type": "object",
            "properties": {
                "prospect_name": {"type": "string", "description": "Contact first name"},
                "prospect_title": {"type": "string", "description": "Contact job title"},
                "company_name": {"type": "string", "description": "Prospect company name"},
                "segment": {
                    "type": "string",
                    "enum": ["oem_dealer", "mining", "construction"],
                },
                "region": {"type": "string", "description": "Geographic region / country"},
                "pain_point_focus": {
                    "type": "string",
                    "description": "Primary pain point to address (e.g. 'dust compliance', 'parts availability', 'fleet replacement')",
                },
                "email_type": {
                    "type": "string",
                    "enum": ["cold_intro", "follow_up", "proposal_send", "re_engagement"],
                    "description": "Type of email to draft",
                },
                "custom_context": {
                    "type": "string",
                    "description": "Any additional context to personalise the email (recent news, referral, trade show meeting, etc.)",
                },
            },
            "required": ["prospect_name", "company_name", "segment", "region", "pain_point_focus", "email_type"],
        },
    },
    {
        "name": "add_opportunity",
        "description": "Add a new sales opportunity to the pipeline tracker.",
        "input_schema": {
            "type": "object",
            "properties": {
                "company_name": {"type": "string"},
                "contact_name": {"type": "string"},
                "contact_email": {"type": "string"},
                "segment": {"type": "string", "enum": ["oem_dealer", "mining", "construction"]},
                "region": {"type": "string"},
                "product_interest": {"type": "string"},
                "estimated_units": {"type": "integer"},
                "estimated_value_usd": {"type": "number"},
                "stage": {
                    "type": "string",
                    "enum": ["Prospect", "Qualified", "Proposal", "Negotiation", "Closed Won", "Closed Lost"],
                },
                "next_action": {"type": "string"},
                "next_action_date": {"type": "string", "description": "ISO date YYYY-MM-DD"},
                "notes": {"type": "string"},
            },
            "required": ["company_name", "segment", "region", "product_interest", "stage"],
        },
    },
    {
        "name": "update_opportunity",
        "description": "Update an existing opportunity in the pipeline.",
        "input_schema": {
            "type": "object",
            "properties": {
                "opportunity_id": {"type": "integer", "description": "Opportunity ID from the pipeline"},
                "stage": {
                    "type": "string",
                    "enum": ["Prospect", "Qualified", "Proposal", "Negotiation", "Closed Won", "Closed Lost"],
                },
                "next_action": {"type": "string"},
                "next_action_date": {"type": "string"},
                "notes": {"type": "string"},
                "estimated_value_usd": {"type": "number"},
            },
            "required": ["opportunity_id"],
        },
    },
    {
        "name": "view_pipeline",
        "description": "View the current opportunity pipeline, optionally filtered by stage or segment.",
        "input_schema": {
            "type": "object",
            "properties": {
                "filter_stage": {
                    "type": "string",
                    "enum": ["Prospect", "Qualified", "Proposal", "Negotiation", "Closed Won", "Closed Lost", "all"],
                    "description": "Filter by stage (use 'all' for no filter)",
                },
                "filter_segment": {
                    "type": "string",
                    "enum": ["oem_dealer", "mining", "construction", "all"],
                },
            },
            "required": [],
        },
    },
    {
        "name": "generate_proposal_outline",
        "description": "Generate a structured proposal outline for a specific prospect and product configuration.",
        "input_schema": {
            "type": "object",
            "properties": {
                "company_name": {"type": "string"},
                "contact_name": {"type": "string"},
                "segment": {"type": "string", "enum": ["oem_dealer", "mining", "construction"]},
                "product_key": {
                    "type": "string",
                    "enum": ["articulated_water_trucks", "rigid_water_trucks", "dust_suppression_systems", "mixed"],
                },
                "quantity": {"type": "integer"},
                "key_requirements": {
                    "type": "array",
                    "items": {"type": "string"},
                    "description": "Customer's specific requirements or use case details",
                },
                "competitive_context": {
                    "type": "string",
                    "description": "Which competitor(s) GFW is competing against, if known",
                },
            },
            "required": ["company_name", "segment", "product_key", "quantity"],
        },
    },
    {
        "name": "handle_objection",
        "description": "Get a recommended rebuttal or response strategy for a specific sales objection.",
        "input_schema": {
            "type": "object",
            "properties": {
                "objection_type": {
                    "type": "string",
                    "enum": [
                        "price_too_high",
                        "dont_know_gfw",
                        "happy_with_current_supplier",
                        "long_lead_time",
                        "no_local_support",
                        "already_budgeted_competitor",
                    ],
                },
                "context": {
                    "type": "string",
                    "description": "Additional context about the prospect and situation to personalise the response",
                },
            },
            "required": ["objection_type"],
        },
    },
    {
        "name": "territory_analysis",
        "description": "Retrieve market intelligence and targeting recommendations for a specific region or country.",
        "input_schema": {
            "type": "object",
            "properties": {
                "region": {
                    "type": "string",
                    "description": "Country or region name (e.g. 'Chile', 'West Africa', 'Australia', 'Indonesia')",
                },
                "segment_focus": {
                    "type": "string",
                    "enum": ["oem_dealer", "mining", "construction", "all"],
                },
            },
            "required": ["region"],
        },
    },
    {
        "name": "competitive_comparison",
        "description": "Get a competitive positioning guide comparing GFW against a specific competitor.",
        "input_schema": {
            "type": "object",
            "properties": {
                "competitor_name": {
                    "type": "string",
                    "description": "Competitor name (e.g. 'Mix-Rite', 'Rosco', 'Curry Supply', 'local fabricator')",
                },
                "product_key": {
                    "type": "string",
                    "enum": ["articulated_water_trucks", "rigid_water_trucks", "dust_suppression_systems"],
                },
            },
            "required": ["competitor_name", "product_key"],
        },
    },
]


# ---------------------------------------------------------------------------
# Tool implementations
# ---------------------------------------------------------------------------

def get_product_info(product_key: str) -> dict:
    if product_key == "all":
        return {"products": PRODUCTS, "company_overview": COMPANY_PROFILE}
    product = PRODUCTS.get(product_key)
    if not product:
        return {"error": f"Unknown product key: {product_key}"}
    return product


def qualify_lead(
    company_name: str,
    segment: str,
    criteria_met: list[str],
    criteria_missing: list[str],
    budget_confirmed: bool = False,
    timeline_months: int = 0,
    estimated_units: int = 0,
) -> dict:
    criteria = QUALIFYING_CRITERIA.get(segment, {})
    must_have = criteria.get("must_have", [])
    nice_to_have = criteria.get("nice_to_have", [])
    disqualifiers = criteria.get("disqualifiers", [])

    # Check for disqualifiers
    disqualifier_hits = [d for d in disqualifiers if any(d.lower() in c.lower() for c in criteria_missing)]

    score = 0

    # Budget: 25 points
    if budget_confirmed:
        score += 25
    elif timeline_months > 0 and timeline_months <= 12:
        score += 10

    # Timeline: 15 points
    if 0 < timeline_months <= 6:
        score += 15
    elif 6 < timeline_months <= 12:
        score += 10
    elif 12 < timeline_months <= 24:
        score += 5

    # Units / deal size: 15 points
    if estimated_units >= 10:
        score += 15
    elif estimated_units >= 5:
        score += 10
    elif estimated_units >= 2:
        score += 5
    elif estimated_units == 1:
        score += 3

    # Must-have criteria coverage: 30 points
    must_have_score = min(30, int((len(criteria_met) / max(len(must_have), 1)) * 30))
    score += must_have_score

    # Nice-to-have: 15 points
    nice_hits = sum(1 for n in nice_to_have if any(n.lower() in c.lower() for c in criteria_met))
    score += min(15, nice_hits * 5)

    # Disqualifier penalty
    if disqualifier_hits:
        score = max(0, score - 40)

    # Tier assignment
    if score >= 75:
        tier = "A"
        priority = "High Priority"
    elif score >= 50:
        tier = "B"
        priority = "Medium Priority"
    elif score >= 25:
        tier = "C"
        priority = "Low Priority – Nurture"
    else:
        tier = "D"
        priority = "Not Qualified / Disqualified"

    # Recommended next action
    if tier == "A":
        next_action = "Schedule discovery call within 48 hours. Prepare product deck tailored to their application."
    elif tier == "B":
        next_action = "Send targeted outreach email. Aim to book a call within 2 weeks to fill qualification gaps."
    elif tier == "C":
        next_action = "Add to nurture sequence. Check back in 90 days or when a buying trigger event occurs."
    else:
        next_action = "Do not pursue at this time. Flag for re-evaluation if disqualifier changes."

    return {
        "company": company_name,
        "segment": segment,
        "qualification_score": score,
        "tier": tier,
        "priority": priority,
        "recommended_next_action": next_action,
        "disqualifiers_flagged": disqualifier_hits,
        "gaps_to_fill": criteria_missing[:5],
    }


def draft_outreach_email(
    prospect_name: str,
    company_name: str,
    segment: str,
    region: str,
    pain_point_focus: str,
    email_type: str,
    prospect_title: str = "colleague",
    custom_context: str = "",
) -> dict:
    seg_data = MARKET_SEGMENTS.get(segment, {})
    pain_points = seg_data.get("pain_points", [])

    context_line = f"\n\n[Context: {custom_context}]" if custom_context else ""

    if email_type == "cold_intro":
        subject = f"GFW Water Trucks – Reducing {pain_point_focus.title()} for {company_name}"
        body = f"""Subject: {subject}

Hi {prospect_name},

I hope this finds you well. I'm reaching out because companies like {company_name} in {region} are facing increasing pressure around {pain_point_focus} — and I believe Ground Force Worldwide has a solution worth 15 minutes of your time.

GFW manufactures the world's most capable water trucks and dust suppression systems for mining and construction operations. Our clients in {region} report:

• 30% reduction in water consumption using our Intellispray™ spray control system
• 98.5% equipment availability — keeping your haul roads wet and your trucks running
• Parts on-the-shelf through our regional dealer network — no 6-week waits

We work with some of the largest operations in your region and would love to show you what we've done for companies facing similar challenges to yours.

Would you be open to a 15-minute call this week or next to see if there's a fit?{context_line}

Best regards,
[Your Name]
Ground Force Worldwide | BD Team
[Phone] | [Email]
www.groundforceworldwide.com"""

    elif email_type == "follow_up":
        subject = f"Following up – GFW & {company_name}"
        body = f"""Subject: {subject}

Hi {prospect_name},

Following up on my note from last week regarding {pain_point_focus} at {company_name}.

I know your schedule is demanding, so I'll keep this brief: I have a short case study showing how a {region} operation similar to yours reduced {pain_point_focus} costs by [X%] using our equipment. It takes 2 minutes to read.

Happy to send it over, or if now's a better time to chat, just reply with a time that works.{context_line}

Thanks,
[Your Name]
Ground Force Worldwide"""

    elif email_type == "proposal_send":
        subject = f"GFW Proposal for {company_name} – [{pain_point_focus.title()} Solution]"
        body = f"""Subject: {subject}

Hi {prospect_name},

Thank you for your time on our recent call — it was great to learn more about {company_name}'s operations in {region}.

Attached is our proposal addressing your {pain_point_focus} requirements. Key highlights:

• Equipment configuration tailored to your site specifications
• Total Cost of Ownership analysis vs. your current fleet
• Delivery timeline and commissioning plan
• Warranty and after-sales support structure through our {region} dealer partner

I'm available this week to walk you through the details and answer any questions before you present this to your team.

Would [Day/Time] work for a 30-minute call?{context_line}

Best regards,
[Your Name]
Ground Force Worldwide"""

    elif email_type == "re_engagement":
        subject = f"Checking in – GFW & {company_name} | Update on {pain_point_focus}"
        body = f"""Subject: {subject}

Hi {prospect_name},

It's been a few months since we last spoke, and I wanted to reach out as things may have changed at {company_name}.

Since we last connected, GFW has [launched our new AWT-40000 model / expanded our dealer network in {region} / released GFW Connect™ telematics] — and I thought it might be relevant given your {pain_point_focus} challenges.

Is {pain_point_focus} still a priority for your team this year? If the timing is better now, I'd love to reconnect.{context_line}

Best,
[Your Name]
Ground Force Worldwide"""

    else:
        body = "Email type not recognised."
        subject = ""

    return {
        "subject": subject,
        "body": body,
        "recommended_follow_up_days": 5 if email_type == "cold_intro" else 7,
        "segment": segment,
        "pain_point": pain_point_focus,
    }


def add_opportunity(
    company_name: str,
    segment: str,
    region: str,
    product_interest: str,
    stage: str,
    contact_name: str = "",
    contact_email: str = "",
    estimated_units: int = 0,
    estimated_value_usd: float = 0.0,
    next_action: str = "",
    next_action_date: str = "",
    notes: str = "",
) -> dict:
    global _next_id
    opp = {
        "id": _next_id,
        "company_name": company_name,
        "contact_name": contact_name,
        "contact_email": contact_email,
        "segment": segment,
        "region": region,
        "product_interest": product_interest,
        "estimated_units": estimated_units,
        "estimated_value_usd": estimated_value_usd,
        "stage": stage,
        "next_action": next_action,
        "next_action_date": next_action_date,
        "notes": notes,
        "created": datetime.date.today().isoformat(),
        "last_updated": datetime.date.today().isoformat(),
    }
    _pipeline.append(opp)
    _next_id += 1
    return {"success": True, "opportunity_id": opp["id"], "message": f"Opportunity #{opp['id']} added for {company_name}."}


def update_opportunity(
    opportunity_id: int,
    stage: str = None,
    next_action: str = None,
    next_action_date: str = None,
    notes: str = None,
    estimated_value_usd: float = None,
) -> dict:
    for opp in _pipeline:
        if opp["id"] == opportunity_id:
            if stage:
                opp["stage"] = stage
            if next_action:
                opp["next_action"] = next_action
            if next_action_date:
                opp["next_action_date"] = next_action_date
            if notes:
                opp["notes"] = (opp.get("notes", "") + "\n" + notes).strip()
            if estimated_value_usd is not None:
                opp["estimated_value_usd"] = estimated_value_usd
            opp["last_updated"] = datetime.date.today().isoformat()
            return {"success": True, "opportunity": opp}
    return {"error": f"Opportunity #{opportunity_id} not found."}


def view_pipeline(filter_stage: str = "all", filter_segment: str = "all") -> dict:
    results = _pipeline
    if filter_stage and filter_stage != "all":
        results = [o for o in results if o["stage"] == filter_stage]
    if filter_segment and filter_segment != "all":
        results = [o for o in results if o["segment"] == filter_segment]

    total_value = sum(o.get("estimated_value_usd", 0) for o in results)
    stage_summary: dict[str, int] = {}
    for o in _pipeline:
        stage_summary[o["stage"]] = stage_summary.get(o["stage"], 0) + 1

    return {
        "total_opportunities": len(results),
        "total_pipeline_value_usd": total_value,
        "stage_summary": stage_summary,
        "opportunities": results,
    }


def generate_proposal_outline(
    company_name: str,
    segment: str,
    product_key: str,
    quantity: int,
    contact_name: str = "",
    key_requirements: list[str] = None,
    competitive_context: str = "",
) -> dict:
    product = PRODUCTS.get(product_key, {}) if product_key != "mixed" else {"name": "Mixed Fleet Solution"}
    requirements_text = "\n".join(f"  - {r}" for r in (key_requirements or []))
    competitive_note = f"\n\n**Competitive Context:** Competing against {competitive_context}. " \
                       f"Lead with TCO analysis and GFW advantages." if competitive_context else ""

    outline = f"""
# PROPOSAL OUTLINE: {company_name} – GFW {product.get('name', 'Equipment')} ({quantity} unit{'s' if quantity > 1 else ''})
**Prepared for:** {contact_name or 'Key Decision Maker'} | {company_name}
**Segment:** {segment.replace('_', ' ').title()} | **Date:** {datetime.date.today().isoformat()}

---

## 1. Executive Summary
- Overview of {company_name}'s operational challenge / opportunity
- GFW solution summary in 3 bullet points
- Expected ROI / payback period headline

## 2. Understanding Your Requirements
{requirements_text or '  - [Complete after discovery call]'}

## 3. Recommended GFW Solution
- Product: {product.get('name', 'TBD')}
- Quantity: {quantity} unit{'s' if quantity > 1 else ''}
- Capacity/Configuration: [Match to site spec]
- Key Features Highlighted:
  {chr(10).join('  - ' + f for f in product.get('key_features', [])[:4]) if product.get('key_features') else '  - [Specify after discovery]'}

## 4. Total Cost of Ownership Analysis
- Purchase price vs. alternatives
- Fuel efficiency savings (GFW aerodynamics – 8–12% improvement)
- Water savings via Intellispray™ (30% reduction)
- Downtime cost comparison (98.5% vs. industry 91% availability)
- Parts and maintenance cost delta
- 5-year TCO summary table

## 5. Delivery & Implementation Plan
- Lead time: [16–24 weeks standard / confirm in-stock options]
- Factory acceptance test (FAT) plan
- Shipping and logistics to {segment} site
- Commissioning and operator training
- Handover to local dealer for ongoing support

## 6. After-Sales Support
- Warranty: 3 years / 10,000 hours (key components)
- Local dealer support contact: [Insert regional dealer]
- GFW Connect™ telematics onboarding
- Spare parts stocking recommendation

## 7. Commercial Terms
- Unit pricing and volume discount applied
- Payment terms: [30% deposit, 70% prior to shipment standard]
- Financing options available via [partner]
- Validity: 30 days from proposal date

## 8. Why GFW
- 40+ countries, trusted by [reference accounts in segment]
- Proven in [relevant region/commodity] conditions
- Longest warranty in class
{competitive_note}

## 9. Next Steps
- [ ] Customer review of proposal
- [ ] Site visit / virtual demo session
- [ ] Final configuration sign-off
- [ ] Purchase order

---
*Proposal prepared by Ground Force Worldwide BD Team*
"""
    return {
        "proposal_outline": outline,
        "product": product.get("name", "Mixed"),
        "quantity": quantity,
        "company": company_name,
    }


def handle_objection(objection_type: str, context: str = "") -> dict:
    base_response = KEY_OBJECTIONS.get(objection_type, "Objection type not found.")
    context_note = f"\n\nAdditional context for personalisation: {context}" if context else ""
    return {
        "objection": objection_type.replace("_", " ").title(),
        "recommended_response": base_response + context_note,
        "tip": "Acknowledge the objection first before pivoting. Never argue — redirect to value.",
    }


def territory_analysis(region: str, segment_focus: str = "all") -> dict:
    region_lower = region.lower()

    # Basic regional intelligence matrix
    regional_intel = {
        "australia": {
            "mining_hotspots": ["Pilbara (iron ore)", "Hunter Valley (coal)", "Bowen Basin (coal)", "Goldfields WA (gold)"],
            "key_companies": ["Fortescue Metals", "BHP", "Rio Tinto", "Glencore", "Newmont", "Gold Fields"],
            "dealer_status": "GFW has established dealer presence. Target dealer expansion in QLD and SA.",
            "construction_projects": ["Sydney Metro expansion", "Inland Rail", "Bruce Highway upgrades"],
            "regulatory_driver": "SafeWork Australia dust exposure standards tightening in 2024–2025",
            "opportunity_rating": "Very High",
        },
        "chile": {
            "mining_hotspots": ["Atacama (copper/lithium)", "Antofagasta region", "Coquimbo (copper/gold)"],
            "key_companies": ["Codelco", "Anglo American", "Antofagasta Minerals", "Freeport-McMoRan", "Lundin Mining"],
            "dealer_status": "Seeking dealer partner in Antofagasta or Santiago. High priority territory.",
            "construction_projects": ["Lithium processing plant buildouts", "Highway Route 5 expansion"],
            "regulatory_driver": "SERNAGEOMIN dust standards increasing enforcement",
            "opportunity_rating": "Very High",
        },
        "west africa": {
            "mining_hotspots": ["Ghana (gold)", "Guinea (bauxite/iron ore)", "Mali (gold)", "Burkina Faso (gold)", "Senegal (phosphate)"],
            "key_companies": ["AngloGold Ashanti", "Gold Fields", "Kinross", "Barrick", "Endeavour Mining", "Newmont"],
            "dealer_status": "Dealer in Accra (Ghana). Seeking expansion into Guinea and Mali.",
            "construction_projects": ["Transgambienne highway", "Port of Freetown expansion", "Ghana E-roads"],
            "regulatory_driver": "EPA Ghana dust regulations, international mining company HSE standards",
            "opportunity_rating": "High",
        },
        "indonesia": {
            "mining_hotspots": ["Kalimantan (coal/nickel)", "Sulawesi (nickel)", "Papua (gold/copper)"],
            "key_companies": ["Adaro", "Bayan Resources", "Vale Indonesia", "Freeport Indonesia", "Harita Nickel"],
            "dealer_status": "Jakarta-based dealer active. Seeking Kalimantan sub-dealer for coal belt.",
            "construction_projects": ["Nusantara capital city development", "Trans-Sumatra toll road"],
            "regulatory_driver": "MINERBA regulations on mine road standards, KLHK dust standards",
            "opportunity_rating": "High",
        },
        "canada": {
            "mining_hotspots": ["Alberta oil sands", "BC (copper/gold)", "Ontario/Quebec (gold)", "Nunavut (gold/diamonds)"],
            "key_companies": ["Suncor", "Canadian Natural", "Teck Resources", "Barrick Gold", "Agnico Eagle", "Kinross"],
            "dealer_status": "Western Canada dealer established. Eastern Canada and North underserved.",
            "construction_projects": ["Trans Mountain pipeline corridor", "Ring of Fire infrastructure", "LNG Canada"],
            "regulatory_driver": "Alberta EPEA dust standards, federal clean air regulations",
            "opportunity_rating": "Very High",
        },
        "middle east": {
            "mining_hotspots": ["Saudi Arabia (phosphate/gold)", "UAE (construction)", "Oman (copper)", "Jordan (phosphate)"],
            "key_companies": ["Ma'aden", "SABIC", "Lafarage Arabia", "ACWA Power", "NEOM project contractors"],
            "dealer_status": "UAE dealer active. Saudi Arabia – new dealer recruitment priority for NEOM/Vision 2030.",
            "construction_projects": ["NEOM (Saudi)", "Dubai Urban Master Plan", "Oman Duqm SEZ", "Red Sea Project"],
            "regulatory_driver": "NEOM sustainability mandates, Saudi Green Initiative dust requirements",
            "opportunity_rating": "Very High",
        },
        "southern africa": {
            "mining_hotspots": ["DRC (copper/cobalt)", "Zambia (copper)", "South Africa (platinum/gold/coal)", "Zimbabwe (platinum/chrome)"],
            "key_companies": ["Glencore Katanga", "Ivanhoe Mines", "First Quantum", "Anglo American Platinum", "Sibanye-Stillwater"],
            "dealer_status": "South Africa dealer established. DRC and Zambia key expansion targets.",
            "construction_projects": ["Lobito Corridor (DRC-Angola rail)", "Zambia road program", "SA N2 Wild Coast"],
            "regulatory_driver": "DMR dust standards SA, COMESA construction HSE requirements",
            "opportunity_rating": "High",
        },
        "india": {
            "mining_hotspots": ["Jharkhand (coal/iron ore)", "Odisha (iron ore)", "Rajasthan (limestone/marble)", "Chhattisgarh (coal)"],
            "key_companies": ["Coal India", "SAIL", "JSW Steel", "Tata Steel", "Vedanta", "NMDC"],
            "dealer_status": "Delhi/Mumbai dealer recruiting in progress. Coal India direct opportunity.",
            "construction_projects": ["National Infrastructure Pipeline", "Bharatmala road program", "Sagarmala port development"],
            "regulatory_driver": "CPCB dust norms, National Clean Air Programme",
            "opportunity_rating": "Medium-High",
        },
    }

    # Match region
    intel = None
    for key, data in regional_intel.items():
        if key in region_lower or region_lower in key:
            intel = data
            break

    if not intel:
        intel = {
            "note": f"Detailed regional data not yet available for {region}. Recommend custom market research.",
            "opportunity_rating": "Unknown",
            "action": "Contact GFW BD team for bespoke territory assessment.",
        }

    segments_data = {}
    if segment_focus == "all" or segment_focus == "oem_dealer":
        segments_data["oem_dealer"] = MARKET_SEGMENTS["oem_dealers"]["ideal_dealer_profile"]
    if segment_focus == "all" or segment_focus == "mining":
        segments_data["mining"] = MARKET_SEGMENTS["mining"]["buying_triggers"]
    if segment_focus == "all" or segment_focus == "construction":
        segments_data["construction"] = MARKET_SEGMENTS["construction"]["project_types"][:4]

    return {
        "region": region,
        "regional_intelligence": intel,
        "segment_guidance": segments_data,
        "recommended_first_targets": intel.get("key_companies", [])[:3] if intel else [],
    }


def competitive_comparison(competitor_name: str, product_key: str) -> dict:
    competitor_lower = competitor_name.lower()

    base_data = COMPETITIVE_LANDSCAPE["main_competitors"]
    matched_competitor = None
    for name, desc in base_data.items():
        if competitor_lower in name.lower():
            matched_competitor = {"name": name, "description": desc}
            break

    if not matched_competitor:
        matched_competitor = {
            "name": competitor_name,
            "description": "Custom/local competitor — GFW advantages over local fabricators include ISO certification, global parts network, and proven engineering vs. bespoke one-off builds.",
        }

    product = PRODUCTS.get(product_key, {})
    gfw_advantages = COMPETITIVE_LANDSCAPE["gfw_advantages_over_competitors"]

    return {
        "competitor": matched_competitor,
        "gfw_product": product.get("name", product_key),
        "gfw_advantages": gfw_advantages,
        "battle_card_summary": (
            f"Against {matched_competitor['name']}: Lead with TCO, Intellispray water savings (30%), "
            f"GFW warranty (3yr/10,000hr), and regional dealer support. "
            f"Do not compete on price alone — reframe the conversation around uptime value and parts availability."
        ),
        "pricing_strategy": PRICING_STRATEGY,
    }


# ---------------------------------------------------------------------------
# Tool dispatcher
# ---------------------------------------------------------------------------

TOOL_HANDLERS: dict[str, Any] = {
    "get_product_info": get_product_info,
    "qualify_lead": qualify_lead,
    "draft_outreach_email": draft_outreach_email,
    "add_opportunity": add_opportunity,
    "update_opportunity": update_opportunity,
    "view_pipeline": view_pipeline,
    "generate_proposal_outline": generate_proposal_outline,
    "handle_objection": handle_objection,
    "territory_analysis": territory_analysis,
    "competitive_comparison": competitive_comparison,
}


def dispatch_tool(tool_name: str, tool_input: dict) -> str:
    handler = TOOL_HANDLERS.get(tool_name)
    if not handler:
        return json.dumps({"error": f"Unknown tool: {tool_name}"})
    try:
        result = handler(**tool_input)
        return json.dumps(result, indent=2)
    except Exception as exc:
        return json.dumps({"error": str(exc)})
