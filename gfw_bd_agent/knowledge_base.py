"""Ground Force Worldwide product and company knowledge base."""

COMPANY_PROFILE = """
Ground Force Worldwide (GFW) is a global manufacturer headquartered in Post Falls, Idaho, USA.
GFW engineers and manufactures heavy-duty water trucks, dust suppression systems, and custom
liquid-haul equipment for the world's most demanding environments — open-pit mines, mega
construction sites, quarries, oil sands, and road-building projects.

Founded with a mission to deliver unmatched quality and field reliability, GFW operates a
global dealer network of OEM partners and distributes equipment into more than 40 countries.

Key differentiators:
- Purpose-built for extreme conditions (desert heat, arctic cold, high altitude)
- Fully customizable configurations matched to customer's haul truck fleet
- Industry-leading tank designs with superior spray pattern coverage
- Fastest global parts availability via regional OEM dealer stock programs
- Operator-centric cab design for fatigue reduction on 12-hour shifts
- ISO-certified manufacturing process with rigorous QC testing
"""

PRODUCTS = {
    "articulated_water_trucks": {
        "name": "Articulated Water Trucks",
        "description": "GFW's flagship articulated water trucks are designed for maximum maneuverability in confined pit environments. The articulated chassis allows tight turning radii impossible with rigid-frame trucks.",
        "capacity_range": "10,000 – 60,000 liters",
        "key_models": [
            "AWT-10000 (10,000L) – ideal for small quarry/construction",
            "AWT-20000 (20,000L) – mid-tier mine site workhorse",
            "AWT-40000 (40,000L) – large open-pit mining standard",
            "AWT-60000 (60,000L) – ultra-class for mega-mines (Pilbara, Atacama)",
        ],
        "target_applications": ["Open-pit gold mines", "Coal mines", "Iron ore mines", "Copper mines", "Oil sands"],
        "key_features": [
            "360° articulation joint with self-leveling hydraulics",
            "GFW Intellispray™ electronic spray control system",
            "Full-width front spray bar + rear fan + side sprays",
            "Remote monitoring telematics (GFW Connect™)",
            "Caterpillar / Komatsu / Liebherr engine options",
            "Operator ROPS/FOPS certified cab",
        ],
        "price_range_usd": "$380,000 – $1,200,000",
    },
    "rigid_water_trucks": {
        "name": "Rigid Frame Water Trucks",
        "description": "High-capacity rigid water trucks built on proven commercial truck chassis or purpose-built rigid mine frames. Preferred for high-speed haul road watering on long straight runs.",
        "capacity_range": "5,000 – 45,000 liters",
        "key_models": [
            "RWT-5000 – on-highway/construction",
            "RWT-15000 – road-building and mid-size mines",
            "RWT-30000 – large haul road applications",
            "RWT-45000 – heavy haul road on-mine",
        ],
        "target_applications": ["Road construction", "Highway dust suppression", "Smaller mine sites", "Quarries", "Civil construction"],
        "key_features": [
            "GFW TankGuard™ polyethylene or stainless steel tank options",
            "Pump options: PTO centrifugal, hydraulic drive, or electric",
            "Configurable spray bar width (up to 14m front spray)",
            "Optional dust suppressant injection system",
            "Can be body-built on customer-supplied truck chassis",
        ],
        "price_range_usd": "$90,000 – $680,000",
    },
    "dust_suppression_systems": {
        "name": "Dust Suppression & Chemical Application Systems",
        "description": "Skid-mounted and trailer-mounted dust suppression systems for fixed-point and mobile application of water, chloride, or polymer suppressants.",
        "capacity_range": "1,000 – 20,000 liters",
        "key_models": [
            "DSS-Skid – fixed installation for crusher feeds",
            "DSS-Trailer – mobile suppression unit",
            "DSS-Misting – high-pressure misting cannons",
            "DSS-Chemical – multi-product chemical dosing unit",
        ],
        "target_applications": ["Crusher stations", "Conveyor transfer points", "Stockpile areas", "Road surface treatment", "Tailings areas"],
        "key_features": [
            "Programmable PLC control with remote monitoring",
            "Compatible with all major dust suppressant chemistries",
            "Stainless steel construction for corrosive environments",
            "Automated scheduling with sensor triggers",
        ],
        "price_range_usd": "$25,000 – $180,000",
    },
    "accessories_parts": {
        "name": "Accessories, Parts & Service",
        "description": "GFW stocks a comprehensive global parts supply through its OEM dealer network. Critical wear items and spray systems are inventoried regionally to support 24/7 mine operations.",
        "items": [
            "Spray nozzle kits (all configurations)",
            "Pump rebuild kits",
            "Tank repair and liner kits",
            "Spray bar assemblies",
            "GFW Intellispray™ control system upgrades",
            "GFW Connect™ telematics retrofits",
            "Operator training programs",
            "Field service and commissioning",
        ],
        "price_range_usd": "$500 – $50,000+",
    },
}

MARKET_SEGMENTS = {
    "oem_dealers": {
        "description": "Global network of OEM dealer partners who buy GFW products wholesale and resell/support in their territories. They stock units and parts, provide local service, and carry GFW branding.",
        "key_value_props": [
            "Exclusive or preferred territory rights",
            "Competitive dealer margin structure (15–25% typical)",
            "Co-branded marketing materials and lead sharing",
            "Factory training and certification programs",
            "Stock and floor-plan financing options",
            "Access to GFW's global reputation in mining markets",
        ],
        "ideal_dealer_profile": "Existing heavy equipment dealer with mining/construction relationships, service workshop capability, parts inventory capacity, and 3+ experienced sales reps. Revenue $5M+.",
        "key_regions": [
            "Australia (Pilbara, Hunter Valley, Bowen Basin)",
            "Chile / Peru (Atacama, copper belt)",
            "West Africa (Ghana, Guinea, Mali – gold)",
            "Southern Africa (DRC, Zambia, South Africa – copper/platinum)",
            "Canada (Alberta oil sands, BC/Ontario mines)",
            "Southeast Asia (Indonesia, Philippines – coal/nickel)",
            "India (Jharkhand, Odisha – coal/iron ore)",
            "Middle East (Saudi, UAE – construction mega-projects)",
        ],
    },
    "mining": {
        "description": "Direct and dealer-mediated sales to mine operators, mining companies, and mining contractors. Buying decisions are made by fleet managers, mine managers, procurement, and C-suite.",
        "key_commodities": ["Gold", "Coal", "Copper", "Iron Ore", "Nickel", "Phosphate", "Diamonds", "Oil Sands", "Lithium"],
        "buyer_personas": [
            "Fleet Manager – owns equipment selection and maintenance budget",
            "Mine Manager – final authority on capital purchases",
            "Procurement Manager – runs RFQ/tender processes",
            "HSE Manager – dust compliance and operator safety",
            "VP Operations / COO – large fleet deals (10+ units)",
        ],
        "pain_points": [
            "Dust compliance fines from regulators (MSHA, MHSAfricA, state EPA)",
            "Haul road deterioration increasing maintenance and tire costs",
            "High water consumption and pump reliability issues with current fleet",
            "Operator fatigue and cab comfort on 12-hour shifts",
            "Parts availability delays causing downtime in remote locations",
            "Aging fleet with no local OEM support",
        ],
        "buying_triggers": [
            "New mine development or expansion phase",
            "Fleet replacement cycle (7–12 year typical life)",
            "Regulatory dust compliance audit/fine",
            "Competitor equipment failure event",
            "Production ramp-up requiring additional water trucks",
            "Safety incident linked to dust or water truck",
        ],
    },
    "construction": {
        "description": "Road builders, civil contractors, earthworks companies, and infrastructure developers. Projects are capital-intensive with defined timelines.",
        "project_types": [
            "Highway and freeway construction",
            "Airport construction",
            "Dam and reservoir projects",
            "Large-scale residential/commercial earthworks",
            "Rail corridor construction",
            "Port and logistics hub development",
            "Mega-projects (NEOM, Belt & Road, etc.)",
        ],
        "buyer_personas": [
            "Plant Manager – manages equipment fleet for project",
            "Project Director – P&L owner, approves major capex",
            "Equipment Procurement – runs tender/RFQ",
            "Site HSE Manager – dust suppression compliance",
        ],
        "pain_points": [
            "Dust fines from local environmental authorities",
            "Short project timelines requiring reliable equipment from day one",
            "Need for mobility across multiple project sites",
            "Fuel and water efficiency on remote projects",
            "Operator availability and ease of use",
        ],
    },
}

COMPETITIVE_LANDSCAPE = {
    "main_competitors": {
        "Rosco Manufacturing": "US-based, strong in road construction water trucks. Less presence in heavy mining.",
        "Curry Supply": "US-based custom truck body builder. Broad product line but not mining-specialized.",
        "Mix-Rite": "Australian manufacturer strong in articulated water trucks for mines. Direct GFW competitor.",
        "Nilfisk (MORO)": "European dust suppression misting cannon specialist. Different category.",
        "Local Fabricators": "In-country tank fabricators common in Africa/Asia. Lower quality, limited support.",
    },
    "gfw_advantages_over_competitors": [
        "Superior articulated truck design proven in Pilbara iron ore (world's most demanding)",
        "GFW Intellispray™ delivers 30% water savings vs. manual spray systems",
        "GFW Connect™ telematics provides real-time fleet management",
        "Global OEM parts network = fastest parts availability outside USA",
        "Longest warranty in class (3 years / 10,000 hours on key components)",
        "Purpose-built mining cabs vs. adapted commercial truck cabs from competitors",
    ],
}

PRICING_STRATEGY = """
GFW uses a value-based pricing model positioned at the premium end of the market.
Key pricing principles:
- Never compete on lowest price — compete on total cost of ownership (TCO)
- Lead with ROI: GFW's Intellispray saves 30% water = $180K/year at typical mine
- Fuel efficiency improvements (GFW aerodynamics + drivetrain) = 8–12% savings
- Uptime value: 98.5% availability guarantee vs. industry avg of 91%
- Typical payback period vs. competitors: 18–36 months on premium

Dealer margin: 15–22% standard, up to 25% for volume commitments.
Volume discounts: 5% (3+ units), 8% (5+ units), 12% (10+ units).
"""

QUALIFYING_CRITERIA = {
    "oem_dealer": {
        "must_have": [
            "Active heavy equipment business in target territory",
            "Existing customer relationships in mining or construction",
            "Service workshop with minimum 4 qualified technicians",
            "Ability to stock minimum 2 units and 6 months parts",
            "Financial capacity (min $2M liquidity)",
        ],
        "nice_to_have": [
            "Current Cat, Komatsu, or Liebherr dealer relationship",
            "Existing water truck or dust suppression sales experience",
            "ISO-certified workshop",
            "Multiple branch locations in territory",
        ],
        "disqualifiers": [
            "Existing exclusive arrangement with a direct GFW competitor",
            "Territory already covered by existing GFW dealer",
            "No service capability (parts-only reseller)",
        ],
    },
    "mining_customer": {
        "must_have": [
            "Active or planned mine operation",
            "Water truck need (existing fleet pain or new operation)",
            "Capital budget available within 12 months",
            "Decision-maker accessible (fleet/mine manager)",
        ],
        "nice_to_have": [
            "Multiple sites (fleet opportunity)",
            "Existing relationship with GFW dealer in region",
            "Dust compliance pressure (regulatory driver)",
            "Fleet replacement cycle within 24 months",
        ],
        "disqualifiers": [
            "Underground-only operation (no surface water truck need)",
            "Exploration stage only (no production budget)",
            "Under receivership or financial distress",
        ],
    },
    "construction_customer": {
        "must_have": [
            "Active project with earthworks or road construction component",
            "Project duration 6+ months",
            "Equipment procurement role accessible",
            "Dust suppression requirement (regulatory or client spec)",
        ],
        "nice_to_have": [
            "Multiple concurrent projects",
            "Long-term rental or purchase preference",
            "International project portfolio",
        ],
        "disqualifiers": [
            "Project under 3 months duration",
            "No dust suppression requirement",
            "Using owner/operator model with no fleet",
        ],
    },
}

KEY_OBJECTIONS = {
    "price_too_high": "GFW's premium reflects lowest total cost of ownership. Intellispray saves 30% water costs — at 500,000L/day usage that's $180K/year. Most customers recoup the premium in 18–24 months.",
    "dont_know_gfw": "We understand — GFW has historically grown through referrals in the mining community. We now operate in 40+ countries and are the preferred water truck supplier for [Fortescue / Anglo American / Codelco — use relevant reference]. Happy to connect you with our reference accounts.",
    "happy_with_current_supplier": "Understood. Our best customers often felt the same way. The most common reason they switched was [parts availability / cab comfort / water savings — match to their pain]. Would it be worth a 15-minute comparison to see if there's a gap we could address?",
    "long_lead_time": "GFW's standard lead time is 16–24 weeks, with express options for in-stock configurations. Our regional dealer [name] typically has units available for immediate delivery. What's your required delivery date?",
    "no_local_support": "GFW's dealer network ensures local support in your region. [Dealer name] covers your area with a full service workshop, certified technicians, and stocked parts. They can be on-site within 24 hours.",
    "already_budgeted_competitor": "Appreciate the transparency. Before you finalize, would you allow us to provide a TCO comparison? Our analysis on comparable fleets typically shows [X%] cost advantage over 5 years. Takes 20 minutes and may give you stronger justification for your procurement committee.",
}
