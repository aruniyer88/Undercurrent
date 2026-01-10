## Abstract

AI-led qualitative research platform that lets brand, social, community managers and other leaders go from a loose research brief to structured, AI-run interviews and synthesized insights in about a day.
The system turns an open-ended brief into a project setup, generates an interview guide, runs asynchronous AI interviews with real participants using either preset voices or cloned voices of known people (e.g., instructor, CEO), and delivers transcripts, recordings, and synthesized insights.

## Business Objectives

* Shorten qualitative research cycles from weeks to about a day for early adopters.
* Enable non-researchers (brand/social/community managers, instructors, leaders) to run credible qual studies without a research agency.
* Use personalized/voice-cloned AI interviewers to increase trust and completion rates, especially in known communities.
* Establish a base of at least 5 active customer organizations using the platform within 8–12 weeks of v1.
* Validate demand and core UX to decide whether to invest in broader self-serve and payments.

## KPI

| GOAL                    | METRIC                              | QUESTION                                                |
| ----------------------- | ----------------------------------- | ------------------------------------------------------- |
| Early Customer Adoption | # customer orgs completing ≥1 study | How many organizations meaningfully used the platform?  |
| Study Activation        | # studies created and completed     | Are customers returning to run more than one study?     |
| Participant Completion  | Interview completion rate per study | Do invited participants actually finish the interviews? |

(Target values – early pass/fail guidance)

* Customer orgs: ≥5 in 8–12 weeks.
* Total completed studies: ≥10 across all customers.
* Participant completion rate: ≥60% in v1 for invited participants who start the flow.

## Success Criteria

* At least 5 customer organizations complete at least one end-to-end study and show interest in running another.
* Time from “brief submitted” to “first interview starts” is typically within same day for at least one design partner.
* At least 3 customers explicitly describe the insights as “useful enough to share with stakeholders”.
* Positive qualitative feedback on the voice-cloned interviewer experience in community settings (e.g., “this felt like my instructor/CEO”).
* No major incidents of the AI interviewer being confusing, off-topic, or inappropriate in the majority of sessions.

## User Journeys

1. Brand / Community Manager Journey (generic)

   * Has a new campaign, feature, or concept and wants fast feedback from existing customers or community members.
   * Enters a loosely worded brief via chat.
   * Platform converts it into a structured project setup and interview guide.
   * Manager reviews and edits fields, chooses a voice (preset or cloned), and tests the interview.
   * Sends invite links to their audience.
   * Participants complete AI-led interviews asynchronously on their own time.
   * Manager returns to a dashboard, sees completed interviews, and opens a report with summary, key insights, transcripts, and recordings.
   * They share insights internally for decision-making.

2. Cohort Instructor with Voice Clone

   * Instructor runs a live or async cohort and wants to gather feedback from students mid-cohort or post-cohort.
   * They create a study with a brief (“I want to know what’s working / not working in the cohort”).
   * System proposes objectives, topics, and success criteria.
   * Instructor records or uploads sample audio so the system can clone their voice.
   * They adjust style (tone, pace, dialect, key phrases) so the interviewer “sounds like them”.
   * They test the interview flow end-to-end, listening to how the AI (using their voice) asks questions.
   * Once satisfied, they approve and share the link with students.
   * Students recognize the instructor’s voice, feel comfortable, and complete the interviews at a higher rate.
   * Instructor reviews the report and uses insights to update curriculum or communication.

3. CEO / Leader to Employees

   * CEO wants candid feedback on a new strategy, change, or culture initiative.
   * CEO (or their team) sets up a study, chooses the “CEO voice profile” (cloned voice), and configures style (direct, warm, etc.).
   * They test the flow to ensure questions and tone feel right from an employee perspective.
   * After approval, employees receive the link and hear the familiar CEO voice asking questions.
   * Completion rate improves due to familiarity and perceived importance.
   * The leadership team reviews synthesized insights and uses them to adjust communication and plans.

4. Participant Journey

   * Receives an invite link from a brand, community, instructor, or employer.
   * Opens the link, sees intro, consent, and who is “speaking” (e.g., AI interviewer, instructor voice, CEO voice).
   * Starts an AI-led interview (audio/video; text fallback if needed).
   * Answers 10–20 minutes of conversational questions.
   * Finishes and gets a confirmation and any incentive instructions.

## Scenarios

* Brand manager tests three alternative taglines and wants qualitative reactions within 24 hours.
* Community manager wants to explore why engagement has dropped and uses a friendly preset voice.
* Cohort instructor uses a cloned version of their own voice to gather confidential feedback from students on what’s working and what’s not.
* CEO uses a cloned voice to solicit anonymous employee feedback about a new strategy or reorg.
* Product/innovation team runs concept testing for a new feature or product with a neutral AI voice, then later experiments with voice clones for deeper engagement.

## User Flow

Happy path (invited customer; allowlisted account):

0. Access and Account Provisioning

   * Potential customer visits public landing page.
   * There is no self-serve signup. Only:

     * “Book a meeting” and/or “Contact me” CTA.
   * You manually vet and onboard selected customers.
   * You create allowlisted login credentials/accounts for selected users.

1. Login

   * Allowlisted users log in to the web app (no public signup flow).
   * They land on a projects dashboard.

2. Create Project (Chat-Based Brief)

   * Click “New Study”.
   * Chat interface asks for open brief (“What do you want to learn?” etc.).
   * User can upload assets (images, copy, links) if relevant.

3. Auto-Structured Project Setup

   * System parses the brief and proposes:

     * Project objective
     * Topics to be covered
     * Success definition
     * Target audience description
     * General guidelines
     * Interview introduction text
     * Suggested project type: Discovery, Concept Testing, Creative Testing, Brand Health.

4. Human Review, Voice Setup, and Edit

   * User reviews and edits each field in a structured form.
   * System generates an interview guide (sections, questions, probes).
   * User reviews/edits the guide.
   * User configures interviewer voice:

     * Choose from preset voices; or
     * Create/select a cloned voice profile by uploading/recording samples and confirming consent.
   * User can optionally specify style and dialect details (e.g., pacing, warmth, key phrases, dialect notes) to refine how the interviewer talks.

5. Test Interview Flow (Pre-Launch)

   * Before approval, user can run a “Test Interview” as if they were a participant:

     * System launches a test session using the selected guide and voice/voice clone.
     * User listens to the AI interviewer asking questions and can experience the flow.
   * If unhappy with questions or voice, user returns to edit guide, voice, or style settings.
   * Once satisfied, user clicks “Approve & Generate Link”.

6. Participant Invite

   * System generates a unique interview link for participants.
   * User copies link and distributes via email, DM, internal tools, or community posts.
   * No in-product recruitment or email sending in v1.

7. AI-Led Interview

   * Participant opens link, sees intro, consent, and info about who’s speaking (AI voice, cloned instructor/CEO, etc.).
   * Participant chooses audio/video (or text fallback).
   * AI interviewer (voice clone or preset) runs the interview according to the guide and dynamic follow-ups.
   * Session ends; recording and transcript are saved.

8. Analysis & Report

   * Once enough interviews complete, system generates:

     * Project-level summary
     * Key insights/themes
     * Access to each interview’s transcripts and recordings.
   * User views report, navigates to transcripts/videos and key quotes.

9. Sharing

   * User shares a read-only link to the report or exports content for slides/PDF (simplest feasible in v1).

Alternative flows (v1 awareness but limited handling):

* Participants drop mid-interview; partial data is flagged.
* User changes voice or guide after testing; only future interviews use updated settings.
* User pauses or cancels a project mid-way.

## Functional Requirements

### Major flows and behaviors

| SECTION          | SUB-SECTION            | USER STORY & EXPECTED BEHAVIORS                                                                                                | SCREENS      |
| ---------------- | ---------------------- | ------------------------------------------------------------------------------------------------------------------------------ | ------------ |
| Auth             | Allowlisted Login      | As an invited user, I can securely log in with credentials provided by the product owner to access my projects.                | Login        |
| Auth             | No Public Signup       | There is no self-serve signup form; access is controlled via allowlist and manual account creation.                            | N/A          |
| Projects         | Dashboard              | As a user, I can see a list of my studies with status (draft, testing, live, completed).                                       | Projects     |
| Projects         | New Study (Chat)       | As a user, I can start a new study by describing my goals and context in plain language.                                       | Chat Brief   |
| Projects         | Auto-Setup             | System converts the brief into structured fields and a proposed project type.                                                  | Setup Form   |
| Projects         | Review & Edit          | As a user, I can edit objectives, topics, success, audience, guidelines, and intro copy before approving.                      | Setup Form   |
| Interview Guide  | Generation             | System generates a structured guide (sections, questions, probes) based on project setup.                                      | Guide Editor |
| Interview Guide  | Editing                | As a user, I can edit questions, order, and probes and then approve the final guide.                                           | Guide Editor |
| Voice Profiles   | Preset Voice Selection | As a user, I can select from a small set of preset AI voices for the interviewer.                                              | Voice Setup  |
| Voice Profiles   | Voice Cloning          | As a user, I can upload/record voice samples for a specific person (myself or a consenting leader) to create a clone.          | Voice Setup  |
| Voice Profiles   | Style & Dialect Config | As a user, I can specify style cues (tone, speed, dialect, key phrases) so the cloned voice behaves more like the real person. | Voice Setup  |
| Testing          | Test Interview Flow    | As a user, I can run a test interview using the selected voice and guide to experience the flow before inviting others.        | Test Mode    |
| Testing          | Iteration              | After testing, I can adjust guide, voice, or style and re-test until I’m satisfied.                                            | Test Mode    |
| Participant Link | Link Generation        | Upon approval, system generates a unique interview link for participants.                                                      | Link Modal   |
| Participant Link | Distribution           | As a user, I can copy the link and share it externally; the system does not manage email sending in v1.                        | Link Modal   |
| Interview        | Participant Onboard    | Participant sees intro, consent, basic instructions, and device check before starting.                                         | Participant  |
| Interview        | AI Session             | AI interviewer (preset or cloned voice) asks questions, listens, follows up; session is recorded and timed.                    | Participant  |
| Interview        | Completion             | On completion, participant sees confirmation; system marks interview as completed and logs metadata.                           | Participant  |
| Analysis         | Transcription          | System converts audio to text and aligns transcript with timeline; attached to each interview.                                 | Interview    |
| Analysis         | Synthesis              | System aggregates across interviews to produce summary and key insights.                                                       | Report       |
| Reporting        | Report View            | As a user, I can see overall summary, key insights, and access to transcripts/videos and quotes.                               | Report       |
| Reporting        | Sharing/Export         | As a user, I can share a read-only link or export content for slides/PDF (simplest feasible in v1).                            | Report       |

Non-goals for v1:

* Self-serve signup or automated onboarding.
* Participant recruitment and incentives management.
* Complex segmentation dashboards and advanced quant metrics.
* Multi-language support beyond English (Assumption).
* Full team collaboration features.

## Model Requirements

| SPECIFICATION           | REQUIREMENT                                              | RATIONALE                                                           |
| ----------------------- | -------------------------------------------------------- | ------------------------------------------------------------------- |
| Open vs Proprietary     | Hosted LLM (e.g., OpenAI/Anthropic)                      | Faster to ship, less infra overhead.                                |
| Context Window          | ~16k tokens or higher                                    | Supports guides + history + multi-interview synthesis.              |
| Modalities              | Text; audio via ElevenLabs + ASR                         | Text for logic/analysis; ElevenLabs for TTS, ASR for transcription. |
| Voice Cloning           | Use ElevenLabs voice cloning capabilities                | Enables personalized interviewer voices and style controls.         |
| Fine Tuning Capability  | Not required in v1                                       | Prompt engineering and few-shot will suffice.                       |
| Latency                 | Bounded by ElevenLabs + LLM; no hard SLA in v1           | Acceptable for a few-second response; experimental phase.           |
| Hallucination Tolerance | Low for factual claims, medium for qualitative synthesis | Insights should be grounded in transcripts, not invented facts.     |
| Languages               | English only (Assumption)                                | Simpler prompts, evaluation, and ASR handling.                      |

## Data Requirements

* Data types

  * Project metadata (objective, topics, audience, etc.).
  * Interview guides (structure, questions, probes).
  * Voice profiles:

    * Raw or processed voice samples for cloning (audio files).
    * Style/dialect metadata (notes, settings).
  * Participant session data: recordings (audio/video), transcripts, timestamps.
  * Derived data: summaries, key insights, quotes, tags.

* Voice cloning specifics

  * Store voice samples and derived voice profiles securely.
  * Clear association between a voice profile and the consenting owner.
  * Ability to delete a voice profile and its samples on request.

* Storage and retention (v1 stance)

  * Store project metadata, transcripts, recordings, and voice profiles indefinitely by default; allow manual deletion per project/profile. (Assumption)
  * Encryption at rest and in transit.
  * No strict data residency guarantees beyond commercial cloud region (Assumption).

* Ongoing collection

  * Log model prompts/responses (with an eye to future redaction).
  * Capture user feedback on guides, voice quality, and reports.

## Prompt Requirements

* Project and guide generation

  * Transform open-ended briefs into structured project data and project type.
  * Generate interview guides tuned for conversational, non-leading questions.

* Interview behavior

  * System prompts that define persona and constraints for the interviewer, independent of voice:

    * Warm, neutral, non-judgmental.
    * Stays on topic, uses follow-ups for clarification, doesn’t give advice.
  * Safety prompts to ignore user attempts to manipulate the AI or change roles.
  * Clear instructions for handling off-topic or abusive input (graceful redirection or termination).

* Style and voice alignment

  * For cloned voices, include style notes (tone, pacing, key phrases, dialect hints) in prompts so the LLM’s text output matches the expected speech pattern as much as possible before TTS.
  * Ensure prompts keep language consistent with the intended persona (instructor, CEO, neutral moderator, etc.).

* Analysis

  * Synthesis prompts that:

    * Ground all insights in transcript content.
    * Produce clear sections: Summary, Key Insights, Evidence/Quotes.
    * Avoid speculative claims not supported by data.

* Accuracy/quality targets

  * Guides: must cover key objectives and avoid leading questions.
  * Summaries: majority of claims can be traced to transcript evidence upon manual review.

## Testing & Measurement

* Offline evaluation

  * Create 3–5 sample projects across use cases.
  * Manually define “gold” guides and summaries.
  * Compare AI outputs using rubrics for clarity, relevance, coverage.
  * Specifically test voice flows: ensure prompts produce text that “fits” the declared voice/role.

* Pilot / design partner testing

  * Run initial studies with design partners using both preset and cloned voices.
  * Collect feedback on:

    * Interviewer quality (content + voice fit).
    * Comfort level of participants when hearing cloned vs neutral voices.
    * Report usefulness.

* Online metrics

  * Track funnel: project created → guide approved → test interview run → link generated → ≥1 completed interview → report viewed.
  * Track participant completion and dropoff points.
  * Track usage of voice-cloning vs preset voices.

* Guardrails and rollback

  * If repeated issues in voice-cloned flows (e.g., mispronunciations, inappropriate style), adjust style prompts or recommend preset voice fallback.
  * Ability to quickly disable a problematic voice profile.

## Risks & Mitigations

| RISK                                           | MITIGATION                                                                                               |
| ---------------------------------------------- | -------------------------------------------------------------------------------------------------------- |
| Poor interview quality (off-topic, shallow)    | Strong prompt design; mandatory test interview; early manual review of transcripts.                      |
| Voice cloning misused (non-consenting voice)   | Explicit consent requirement in UI; limit voice profile creation to allowlisted accounts; simple policy. |
| Voice clone feels “off” and harms trust        | Style/dialect configuration; test-interview flow so owners can hear and refine before going live.        |
| Users manipulate AI to go off-script           | System messages that ignore role-change requests; content filters and sanity checks on unexpected input. |
| Insights not trusted                           | Make traceability easy: link each insight to representative quotes and interviews.                       |
| Latency feels sluggish                         | Keep questions focused; reuse context in prompts; accept some delay in v1; set expectations in UI.       |
| Technical failures in recording/transcription  | Clear error states, retry options, and logging of failed sessions.                                       |
| Ambiguous privacy or voice-rights expectations | Simple policy pages explaining storage, deletion, and consent; explicit warnings for voice cloning.      |
| Scope creep beyond 6–8 weeks                   | Strict v1: allowlisted access only, no self-serve signup, no recruitment, basic reporting only.          |

## Costs

* Development

  * MVP web app; integrations with LLM, ElevenLabs (including cloning), ASR, storage.
  * UI for project setup, voice profiles, test interviews, and reports.

* Operational

  * LLM usage for project setup, guide generation, live interview logic, and analysis.
  * ElevenLabs usage for TTS and voice cloning (creation + per-minute usage).
  * ASR costs for all recorded interviews.
  * Cloud storage for voice samples, interviews, transcripts.

* Future

  * Payments integration and billing once going beyond allowlisted free trials.
  * Additional monitoring and analytics tools if scale grows.

## Assumptions & Dependencies

Assumptions

* Clients supply their own participants; no panel marketplace in v1.
* English-only interviews and analysis.
* Asynchronous, 1:1 interviews driven by a single AI interviewer per project.
* Data and voice samples stored in one commercial cloud region, with standard security but no special regulatory regime.
* Design partners understand and agree to experimental nature and costs.
* You manually control which users get access (allowlist), due to cost.

Dependencies

* LLM provider (OpenAI/Anthropic or similar).
* ElevenLabs for TTS and voice cloning.
* Third-party ASR for transcription.
* Cloud provider for hosting, storage, and auth.

## Compliance/Privacy/Legal

* No targeting of minors or sensitive populations in v1.
* Explicit consent required from any person whose voice is cloned; prohibit cloning public figures without rights.
* Simple terms and privacy notice covering:

  * Storage and use of voice samples and recordings.
  * Data retention and deletion options.
* Encryption in transit and at rest for all stored data.
* Minimal PII; participant identity kept as light as possible.

## GTM/Rollout Plan

* Public-facing site

  * Landing page explaining use cases and value, highlighting voice-cloned interviewer as a differentiator.
  * “Book a Meeting” and/or “Contact Me” CTAs only; no signup or pricing page initially.

* Phase 1: Allowlisted design partners

  * You select a small set of instructors, CEOs, brand/community managers.
  * You provision accounts manually and configure initial voice profiles with them.
  * They run first studies; you stay close to them for feedback and troubleshooting.

* Phase 2: Iterate on v1

  * Incorporate feedback on voice cloning accuracy, test flows, and report usefulness.
  * Decide on pricing model and payment integration.
  * Assess whether to expand beyond allowlist.

* Phase 3: Gradual expansion

  * If economics and UX look good, expand allowlist; later consider adding Stripe/payments and controlled signup.