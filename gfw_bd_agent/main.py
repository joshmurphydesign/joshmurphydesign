#!/usr/bin/env python3
"""Ground Force Worldwide BD Agent — CLI entry point."""

import os
import sys

BANNER = """
╔══════════════════════════════════════════════════════════════════╗
║         GROUND FORCE WORLDWIDE — BD AGENT                       ║
║         Global OEM Dealers | Mining | Construction               ║
╚══════════════════════════════════════════════════════════════════╝

Type your request or question. Examples:
  • "Qualify Acme Mining in Chile — they run 8 water trucks, budget confirmed, buying in 6 months"
  • "Draft a cold email to the fleet manager at Fortescue in Australia about dust compliance"
  • "What are GFW's advantages over Mix-Rite for articulated water trucks?"
  • "Show me the current pipeline"
  • "Add an opportunity: Rio Tinto, Pilbara WA, 5x AWT-40000, $2M, Proposal stage"
  • "Territory analysis for West Africa, mining focus"
  • "Generate a proposal outline for Codelco, Chile, 10 articulated trucks"

Type 'help' for more examples | 'quit' to exit
"""

HELP_TEXT = """
EXAMPLE COMMANDS:
─────────────────────────────────────────────────────────────────
PROSPECTING & TERRITORY:
  "Analyze the Indonesia mining market for GFW dealer opportunities"
  "Who should GFW target in the Pilbara region?"
  "What are the top 3 copper mines in Chile we should call this month?"

LEAD QUALIFICATION:
  "Qualify this lead: Goldstrike Mining, Nevada USA, open-pit gold mine,
   fleet of 12 water trucks, fleet manager is the contact, timeline 9 months,
   budget $4M, no local GFW dealer in their area"
  "Score a dealer prospect: ABC Equipment, based in Ghana, Caterpillar dealer,
   service workshop with 8 techs, strong relationships with 3 gold mines"

OUTREACH EMAILS:
  "Write a cold email to James Chen, Fleet Manager at Shandong Gold, China,
   focusing on water savings and telematics"
  "Draft a follow-up email for Barrick Gold Peru after our last call"
  "Write a re-engagement email to a construction prospect in the Middle East"

OBJECTION HANDLING:
  "A prospect says GFW is too expensive — how do I respond?"
  "Customer says they've never heard of GFW — what do I say?"
  "They already budgeted for a Mix-Rite — give me a rebuttal"

PIPELINE MANAGEMENT:
  "Show me all opportunities in the Proposal stage"
  "Add opportunity: Anglo American, South Africa, 4x rigid water trucks, $600K, Qualified"
  "Update opportunity #3 — moved to Negotiation, next step: present final pricing Friday"

PROPOSALS:
  "Generate a proposal outline for Freeport Indonesia, mining segment, 6 articulated trucks"
  "What should I include in a proposal for a new OEM dealer in Canada?"

COMPETITIVE INTELLIGENCE:
  "Battle card: GFW vs Rosco for rigid water trucks"
  "How do we compete against local fabricators in Africa?"
─────────────────────────────────────────────────────────────────
"""


def check_api_key() -> bool:
    key = os.environ.get("ANTHROPIC_API_KEY", "")
    if not key or not key.startswith("sk-"):
        print("\n[ERROR] ANTHROPIC_API_KEY not set or invalid.")
        print("  Export your key: export ANTHROPIC_API_KEY=sk-ant-...")
        print("  Get a key at: https://console.anthropic.com/\n")
        return False
    return True


def main():
    print(BANNER)

    if not check_api_key():
        sys.exit(1)

    # Import here so missing key error shows before import errors
    from agent import run_agent

    conversation_history: list[dict] = []

    while True:
        try:
            user_input = input("\nYou: ").strip()
        except (EOFError, KeyboardInterrupt):
            print("\n\nExiting GFW BD Agent. Good selling!")
            break

        if not user_input:
            continue

        if user_input.lower() in ("quit", "exit", "q"):
            print("\nExiting GFW BD Agent. Good selling!")
            break

        if user_input.lower() in ("help", "?", "h"):
            print(HELP_TEXT)
            continue

        if user_input.lower() == "clear":
            conversation_history = []
            print("[Conversation history cleared]")
            continue

        print("\nAgent: ", end="", flush=True)

        try:
            response, conversation_history = run_agent(user_input, conversation_history)
            print(response)
        except Exception as exc:
            print(f"\n[ERROR] {exc}")
            if "authentication" in str(exc).lower() or "api_key" in str(exc).lower():
                print("Check your ANTHROPIC_API_KEY.")


if __name__ == "__main__":
    main()
