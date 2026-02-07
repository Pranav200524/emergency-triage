Emergency Triage Dispatcher Dashboard

A decision-support web application designed to assist emergency response teams in prioritizing high-volume distress messages and allocating nearby resources efficiently during crisis situations.

Problem Context

During disasters and local emergencies, response teams receive hundreds or thousands of unstructured messages via SMS, helplines, and social media. Manually reading, prioritizing, and acting on these messages is slow, error-prone, and does not scale during peak crisis periods. Critical cases may be delayed due to unclear urgency and incomplete location information.

This project addresses that operational gap by providing an AI-assisted triage and resource-matching dashboard for dispatchers and NGO control rooms.

Solution Overview

The system ingests bulk emergency messages, extracts actionable information, computes an explainable urgency score, and assists dispatchers in matching requests with nearby verified resources. It is designed as a human-in-the-loop decision-support tool, not a fully automated response system.

The application focuses on clarity, transparency, and rapid situational awareness.

Key Features

Bulk Message Ingestion
Simulates emergency message feeds by allowing multiple distress messages to be analyzed simultaneously.

AI-Assisted Triage
Uses lightweight NLP to extract need type, location, quantity, and urgency from unstructured text.

Explainable Urgency Scoring
Assigns a transparent urgency score (0–100) based on severity indicators, medical keywords, and vulnerable population mentions.

Resource Matching
Matches prioritized requests to the nearest relevant verified resources using proximity-based logic.

Map-Based Visualization
Displays incidents and resources on an interactive map with clear visual indicators for urgency and allocation.

Tech Stack

Frontend: React, Vite, Tailwind CSS

Backend: Node.js, Express

NLP: Prompt-based analysis using OpenAI API (replaceable with rule-based logic)

Maps: Leaflet with OpenStreetMap

Storage: In-memory data (no database, demo-focused)

How to Use the Demo

Paste multiple emergency messages (one per line) into the message input panel.

Click Analyze Messages to process the feed.

View prioritized incidents in the results table.

Inspect matched resources and urgency levels on the interactive map.

Demo Notes

This is a simulated environment intended for hackathon demonstration and evaluation.

All messages and resources are processed in memory.

The geographic region used in the demo is configurable and represents a placeholder deployment area.

No authentication or persistent storage is implemented by design.

Design Principles

Human-in-the-loop decision support

Explainability over black-box automation

Low-cost, scalable NLP approach

Practical deployment constraints for NGOs and government agencies

Future Improvements

Integration with real SMS and social media ingestion pipelines

Multilingual message support

Improved location disambiguation

Role-based access for multi-agency coordination

Analytics for response time and resource utilization

Disclaimer

This project is a prototype built for evaluation purposes and is not intended for direct deployment without further validation, testing, and integration with official emergency systems.
