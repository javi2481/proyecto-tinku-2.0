# Delta Spec: onboarding-support (ADDED)

## Capability

`onboarding-support` — Personalized onboarding flow for external families via WhatsApp, providing guided account creation and child registration through direct assistance from Javier.

## ADDED Requirements

### REQ-01: WhatsApp Onboarding Guide Document

A structured onboarding guide SHALL exist as a reference document for Javier to walk each family through account creation.

- **RFC 2119**: SHALL / MUST

#### Scenario: Onboarding guide exists

- **Given** `docs/onboarding-guide.md`
- **Then** it MUST contain step-by-step instructions for:
  1. Parent registration (email + password or Google OAuth)
  2. Child registration (name, birthdate, grade, avatar)
  3. Consent acceptance (explicit checkbox)
  4. Child code retrieval and first login
  5. Troubleshooting common issues (forgot code, avatar won't load)
- **And** each step MUST include a screenshot or wireframe reference
- **And** the guide MUST be written in rioplatense Spanish for Javier's use

### REQ-02: Personalized Onboarding via WhatsApp

Javier SHALL provide personalized onboarding assistance to each of the 5 families via WhatsApp, NOT through an automated onboarding system.

- **RFC 2119**: SHALL / MUST NOT

#### Scenario: Onboarding is human-guided, not automated

- **Given** a new family invited to the beta
- **When** they begin the registration process
- **Then** Javier MUST guide them personally through WhatsApp
- **And** the app MUST NOT require automated onboarding wizards or tutorials for this phase
- **And** each family's onboarding completion MUST be tracked manually in a shared tracker

#### Scenario: Onboarding covers critical steps

- **Given** a family being onboarded by Javier
- **When** the onboarding call/chat concludes
- **Then** the parent MUST have: created their account, registered their child(ren), accepted consent, and received the child's login code
- **And** the child MUST have successfully logged in and reached the world view at least once

### REQ-03: Onboarding Success Tracking

Each family's onboarding MUST be tracked to measure completion rate and identify drop-off points.

- **RFC 2119**: MUST

#### Scenario: Onboarding metrics captured

- **Given** the 5 families being onboarded
- **Then** the following metrics MUST be tracked per family:
  - Date invited
  - Date parent account created
  - Date consent accepted
  - Date child first logged in
  - Date child reached world view
  - Any issues encountered during onboarding
- **And** this data MUST be stored in a lightweight tracker (spreadsheet or Notion, NOT in the app database)

### REQ-04: Consent Flow Integrated in Registration

The parental consent flow from `privacy-compliance` (REQ-01) MUST be integrated into the registration flow as a mandatory step.

- **RFC 2119**: MUST

#### Scenario: Consent is a required registration step

- **Given** a parent creating an account for a new child
- **When** they reach the child registration step
- **Then** the consent acceptance MUST be the final step before the child code is generated
- **And** the child code MUST NOT be generated until consent is recorded
- **And** the parent MUST be able to review the full consent text before accepting

#### Scenario: Consent screen accessible in rioplatense Spanish

- **Given** the consent screen rendered in the registration flow
- **Then** all text MUST be in rioplatense Spanish
- **And** language MUST be clear and jargon-free (accessible to non-technical parents)
- **And** a link to the full privacy policy at `/privacy` MUST be visible