---
name: bpmn-modeling
description: Use this skill when creating, reviewing, validating, or generating BPMN 2.0 diagrams — whether from interview transcripts, process descriptions, or user requests. Covers notation rules, gateway semantics, common anti-patterns, naming conventions, layout best practices, swimlane usage, exception handling, and XML generation. Trigger when the user mentions BPMN, process modeling, workflow diagrams, swimlanes, gateways, process maps, or asks to convert a process description into a diagram.
---

# BPMN 2.0 Modeling Skill

This skill codifies the rules, best practices, and common pitfalls of BPMN 2.0 process modeling. Follow these guidelines whenever generating, reviewing, or translating process descriptions into BPMN diagrams.

---

## 1. Core BPMN Element Rules

### 1.1 Events — Start, Intermediate, End

**Rules:**
- Every process and subprocess MUST have exactly one Start Event and at least one End Event.
- Omitting start/end events is technically allowed by the spec but is a **pragmatic anti-pattern** — it makes it unclear where the process begins and terminates.
- Start Events have ZERO incoming sequence flows.
- End Events have ZERO outgoing sequence flows.

**Naming conventions:**
- Start Events: Name with the trigger — "Purchase Request Received", "Order Placed", "Timer: Monthly". Do NOT name "Process Start" (redundant — the circle already means "start").
- End Events: Name with the outcome — "Order Fulfilled", "Request Rejected", "Payment Completed". Do NOT name "Process End" (redundant).
- If using a plain/generic (none) event, the name can be omitted.

**Common errors:**
| Error | Why it's wrong | Fix |
|-------|---------------|-----|
| No Start Event | Reader doesn't know the trigger | Add a Start Event with the trigger name |
| No End Event | Unclear when process terminates; performers don't know what to do after the last task | Add End Event(s) with outcome names |
| Naming Start Event "Process Start" | Redundant — the symbol already means "start" | Name it with the business trigger |
| Multiple identical Start Events | Creates ambiguity — are they the same event or different triggers? | Use one Start Event, or differentiate with specific trigger types |
| Start Event inside each Lane | Suggests independent processes instead of one collaborative process | Use one Start Event in the lane where the process is triggered |

### 1.2 Activities — Tasks and Sub-Processes

**Rules:**
- A Task is an **atomic** unit of work — it cannot be decomposed further within this diagram level.
- A Sub-Process is a **compound** activity whose internals can be expanded into their own diagram.
- The choice between Task vs Sub-Process is NOT about complexity — it's about whether you can/need to show the internal steps.

**Naming conventions — THE VERB-OBJECT RULE:**
- Activities MUST be named with a **verb + object** pattern in the infinitive form.
- Good: "Review Purchase Request", "Approve Invoice", "Ship Goods", "Verify Delivery"
- Bad: "Purchase Request" (noun only — is this creating it? reviewing it? approving it?), "Approval" (noun — who does what?), "Manager" (role, not activity)

**Common errors:**
| Error | Why it's wrong | Fix |
|-------|---------------|-----|
| Naming with nouns only | "Invoice", "Approval" — unclear what action is performed | Use verb + object: "Process Invoice", "Grant Approval" |
| Inconsistent naming style | Mixing "Review request" with "The manager checks the form" | Standardize to infinitive verb + object |
| Using tasks to route work | "Send to Manager" followed by a flow to Manager's lane | Remove the routing task — the sequence flow already routes to the lane |
| Confusing Task vs Sub-Process | Using Sub-Process just because work "seems complex" | Only use Sub-Process when you can define internal steps |
| Using "Send" / "Receive" casually | "Send to Manager" implies BPMN Send Task (message to external entity) | Use "Notify Manager" or just route via sequence flow |

**Task Types (when to use which):**
- **User Task**: Work performed by a human with system assistance
- **Manual Task**: Work performed by a human without system assistance
- **Service Task**: Automated work performed by a system/application
- **Send Task**: Sends a message to an external participant (outside the pool)
- **Receive Task**: Waits for a message from an external participant
- **Business Rule Task**: Evaluates a business rule / decision table (link to DMN)
- **Script Task**: Executes an automated script

### 1.3 Gateways — THE MOST ERROR-PRONE ELEMENT

Gateways control the divergence (split) and convergence (join/merge) of sequence flows. They are the #1 source of modeling errors.

#### Gateway Types

| Gateway | Symbol | Split behavior | Join behavior |
|---------|--------|---------------|---------------|
| **Exclusive (XOR)** | ✕ in diamond | Exactly ONE outgoing path taken (based on condition) | Passes through as soon as ANY token arrives |
| **Parallel (AND)** | + in diamond | ALL outgoing paths are activated simultaneously | Waits until ALL tokens from all incoming paths arrive |
| **Inclusive (OR)** | ○ in diamond | ONE OR MORE paths taken (based on conditions) | Waits for all ACTIVATED paths to complete |
| **Event-Based** | ⬠ in diamond | Waits for first event to occur, then follows that path | N/A — typically used only as split |
| **Complex** | ✱ in diamond | Custom condition logic | Custom synchronization logic |

#### CRITICAL GATEWAY RULES

**Rule 1: Every split gateway MUST have a corresponding join gateway of the SAME type.**
- XOR split → XOR join
- AND split → AND join  
- OR split → OR join
- Mixing types (e.g., AND split → XOR join) causes **deadlocks** or **unintended multi-execution**.

**Rule 2: The Deadlock Anti-Pattern**
```
[XOR Split] → Path A → [AND Join]
           → Path B →
           → Path C →
```
This DEADLOCKS because XOR sends only 1 token, but AND join waits for 3. The process gets stuck forever.

**Rule 3: The Multi-Merge Anti-Pattern**
```
[AND Split] → Path A → [XOR Join] → [Task]
           → Path B →
```
XOR join doesn't synchronize — it passes every token through. Task executes TWICE (once per token). This is usually unintended.

**Rule 4: Exclusive Gateway labeling**
- The splitting XOR gateway MUST be labeled with a **question**: "Amount > $5,000?", "Tests passed?", "Approved?"
- Each outgoing sequence flow MUST be labeled with the **answer**: "Yes" / "No", "> $5,000" / "≤ $5,000"
- All answers MUST be **mutually exclusive** (no overlap).
- One outgoing flow SHOULD be marked as the **default** (slash mark on the flow) for when no condition matches.
- Merging XOR gateways are NEVER labeled.

**Rule 5: Parallel Gateway — NO conditions allowed**
- AND gateways are unconditional. If you need conditions on the branches, you chose the wrong gateway type.
- Use Inclusive (OR) gateway instead when some-but-not-all paths should activate.

**Common gateway errors:**
| Error | Why it's wrong | Fix |
|-------|---------------|-----|
| No gateway for decision | Process description says "if X, then Y" but modeled as linear flow | Add an XOR gateway with labeled conditions |
| Mismatched split/join types | AND split → XOR join | Match the join type to the split type |
| Overlapping XOR conditions | "≤ $2000" and "≤ $1000" are not mutually exclusive | Make conditions exclusive: "≤ $1000", "$1001–$2000", "> $2000" |
| Missing default flow on XOR | If no condition matches, process gets stuck | Add a default flow |
| Conditions on AND gateway | AND gateway is unconditional by definition | Remove conditions or switch to OR gateway |
| Unnecessary gateway | "Choose Hotel" gateway when both paths do the same next step | Remove the gateway if all paths converge to the same activity |
| Unlabeled XOR split | Reader can't tell what the decision is | Label with a question |
| Unlabeled outgoing flows | Reader can't tell which condition leads where | Label each flow with the answer |

---

## 2. Pools and Lanes (Swimlanes)

### 2.1 Rules

- A **Pool** represents a participant (organization, department, or system). Pools are the outermost container.
- A **Lane** represents a role, position, or responsibility WITHIN a pool.
- Sequence flows CANNOT cross pool boundaries. Only **Message Flows** (dashed lines) connect elements across pools.
- Sequence flows CAN cross lane boundaries within the same pool — this represents a handoff between roles.

### 2.2 Common Errors

| Error | Why it's wrong | Fix |
|-------|---------------|-----|
| Naming the Pool with the process name | Pool = participant, not the process. "Purchase Order Process" should be the process name, not the pool name. | Name pool after the organization: "ACME Corp", "Procurement Dept" |
| Using Pools when Lanes are needed | Two pools for "Manager" and "Clerk" makes them separate organizations — message flows required | Use one Pool with Lanes for roles within the same organization |
| Sequence flows between pools | Violates BPMN spec — pools are independent processes | Use Message Flows (dashed) between pools |
| Start Event in every lane | Suggests independent processes, not one collaborative flow | One Start Event in the lane that initiates the process |
| Inconsistent lane granularity | Mixing "Finance Department" (department) with "John Smith" (person) | Keep lane granularity consistent: all roles, or all departments |

### 2.3 When to Use Pools vs Lanes

- **Same organization, different roles**: Use one Pool with multiple Lanes
- **Different organizations** (customer ↔ supplier): Use separate Pools with Message Flows
- **System interactions** (user ↔ API ↔ database): Use separate Pools for truly external systems

---

## 3. Sequence Flows and Message Flows

### 3.1 Rules

- **Sequence Flow** (solid arrow): Shows the order of activities WITHIN a pool. Can cross lanes.
- **Message Flow** (dashed arrow): Shows communication BETWEEN pools. Cannot connect to elements within the same pool.
- **Association** (dotted line): Connects artifacts (text annotations, data objects) to flow elements. Not a flow.

### 3.2 Common Errors

| Error | Why it's wrong | Fix |
|-------|---------------|-----|
| Unconnected elements | "Floating" tasks with no incoming or outgoing flow | Connect all elements into the flow |
| Message flow within same pool | Message flows are for inter-pool communication | Use Sequence Flow within the same pool |
| Sequence flow between pools | Sequence flows cannot cross pool boundaries | Use Message Flow between pools |
| Crossed/tangled lines | Reduces readability | Rearrange layout to minimize crossings |

---

## 4. Naming Convention Summary

| Element | Convention | Good Example | Bad Example |
|---------|-----------|-------------|-------------|
| Start Event | Trigger: Object + past participle | "Order Received" | "Start" |
| End Event | Outcome: Object + past participle | "Order Shipped" | "End" |
| Task | Verb (infinitive) + Object | "Verify Identity" | "Verification" |
| XOR Gateway (split) | Question | "Credit approved?" | "Decision" |
| XOR Gateway outgoing flows | Answer to the question | "Yes" / "No" | (unlabeled) |
| XOR Gateway (merge) | No label | — | "Merge" |
| AND/OR Gateway | No question needed (optional description) | "Parallel processing" | — |
| Pool | Participant / Organization | "Supplier Inc." | "Shipping Process" |
| Lane | Role / Position | "Warehouse Clerk" | "Step 3" |

---

## 5. Layout Best Practices

### 5.1 Core Layout Rules

- **Flow direction**: Left-to-right (horizontal) or top-to-bottom (vertical). Never mix directions.
- **Happy path first**: The main/normal flow should be the most visually prominent horizontal path. Exceptions and alternate paths branch off vertically.
- **One page per level**: The top-level diagram should fit on one page/screen. Use Sub-Processes to expand detail.
- **Minimize crossings**: Rearrange elements to reduce line crossings. A crossing-free layout is always achievable for properly structured processes.
- **Consistent spacing**: Maintain uniform spacing between elements.
- **Sequence flows horizontal, Message flows vertical**: When pools are stacked horizontally, keep sequence flows horizontal and message flows vertical.

### 5.2 Hierarchy and Decomposition

- Don't create a 30-foot wall diagram. Use hierarchical decomposition:
  1. **Level 0**: End-to-end process overview — all sub-processes collapsed
  2. **Level 1**: Major phases expanded — each sub-process shows its internal tasks
  3. **Level 2+**: Detailed task breakdowns as needed
- Use **Call Activities** to reuse common sub-processes across different process models.

---

## 6. Interview-to-BPMN Translation Guide

When converting a spoken/written process description into BPMN, apply these extraction rules:

### 6.1 Detecting Roles → Lanes

Listen for:
- Job titles: "The Procurement Manager...", "The QA Engineer..."
- Department references: "...goes to Finance for approval"
- Role descriptions: "...the person responsible for shipping"
- Pronouns with established context: "She then reviews..." (track who "she" refers to)

**Validation rule**: If a role is mentioned performing actions but has no lane, create one.

### 6.2 Detecting Activities → Tasks

Listen for:
- Verb + noun patterns: "submits a request", "reviews the document", "approves the order"
- Action descriptions: "checks whether...", "prepares the shipment", "sends a notification"

**Validation rule**: Each activity must have exactly one responsible role (lane).

### 6.3 Detecting Decisions → Gateways

Listen for:
- Conditional language: "if", "when", "in case", "whether", "depending on"
- Exception language: "unless", "otherwise", "except when", "if not"
- Branching: "either...or", "one of two things happens"
- Escalation: "if it exceeds...", "when the amount is above..."

**Mapping rules:**
- "if X then A, otherwise B" → **Exclusive (XOR)** gateway
- "both A and B happen simultaneously" → **Parallel (AND)** gateway  
- "one or more of A, B, C may apply" → **Inclusive (OR)** gateway
- "whichever happens first" → **Event-Based** gateway

### 6.4 Detecting Process Variants → Conditions on Gateways

Listen for:
- Monetary thresholds: "if the amount exceeds $5,000"
- Geographic conditions: "for international orders", "in the EU region"
- Category-based routing: "for premium customers", "if the item is hazardous"
- Time-based conditions: "if more than 30 days", "within the SLA"

**These become conditions on outgoing flows of XOR or OR gateways.**

### 6.5 Detecting Exceptions → Error/Boundary Events or Gateway Branches

Listen for:
- "If something goes wrong...", "in case of an error..."
- "If the delivery doesn't match...", "if the check fails..."
- Timeout language: "if no response within 48 hours"
- Escalation: "escalate to the manager", "raise an exception"

**Mapping:**
- Business exceptions (expected alternative outcomes) → XOR gateway branch
- System/technical errors → Error Boundary Event on the task
- Timeouts → Timer Boundary Event on the task
- Escalation → Escalation Event

---

## 7. BPMN XML Generation Checklist

When generating BPMN 2.0 XML, verify:

### 7.1 Structural Validity
- [ ] Every process has a Start Event and at least one End Event
- [ ] Every element has at least one incoming and one outgoing sequence flow (except Start/End Events)
- [ ] No sequence flows cross pool boundaries
- [ ] Every split gateway has a matching join gateway of the same type
- [ ] All XOR split outgoing flows have mutually exclusive conditions
- [ ] At least one XOR outgoing flow is marked as default
- [ ] Parallel gateway outgoing flows have NO conditions

### 7.2 Semantic Validity
- [ ] Activities are named with verb + object
- [ ] Start Events are named with trigger (not "Start")
- [ ] End Events are named with outcome (not "End")
- [ ] XOR gateways are labeled with a question
- [ ] XOR outgoing flows are labeled with answers
- [ ] Pools are named after participants (not process names)
- [ ] Lanes are named after roles (not actions)

### 7.3 Layout Validity (BPMNDiagram section)
- [ ] All elements have BPMNShape entries with valid Bounds
- [ ] All flows have BPMNEdge entries with waypoints
- [ ] Elements don't overlap
- [ ] Flow direction is consistently left-to-right
- [ ] Lane heights accommodate all contained elements
- [ ] Pool bounds encompass all lanes

### 7.4 XML Namespace Requirements
```xml
<bpmn:definitions 
  xmlns:bpmn="http://www.omg.org/spec/BPMN/20100524/MODEL"
  xmlns:bpmndi="http://www.omg.org/spec/BPMN/20100524/DI"
  xmlns:dc="http://www.omg.org/spec/DD/20100524/DC"
  xmlns:di="http://www.omg.org/spec/DD/20100524/DI"
  targetNamespace="http://bpmn.io/schema/bpmn">
```

---

## 8. Quick-Reference: Anti-Pattern → Fix Table

| # | Anti-Pattern | Severity | Fix |
|---|-------------|----------|-----|
| 1 | No Start Event | High | Add Start Event with trigger name |
| 2 | No End Event | High | Add End Event with outcome name |
| 3 | Activity named with noun only | Medium | Rename to verb + object |
| 4 | "Send to Manager" routing task | Medium | Remove task; sequence flow already routes |
| 5 | XOR split without question label | Medium | Label the gateway with a question |
| 6 | XOR outgoing flows unlabeled | Medium | Label each flow with the answer |
| 7 | AND split → XOR join (deadlock) | Critical | Match join type to split type |
| 8 | XOR split → AND join (deadlock) | Critical | Match join type to split type |
| 9 | AND split → XOR join (multi-execution) | High | Use AND join to synchronize |
| 10 | Overlapping XOR conditions | High | Make conditions mutually exclusive |
| 11 | Missing default flow on XOR | Medium | Add default flow |
| 12 | Conditions on AND gateway | Medium | Remove conditions or use OR gateway |
| 13 | Sequence flow between pools | Critical | Use Message Flow instead |
| 14 | Start Event in every lane | Medium | One Start Event in the triggering lane |
| 15 | Pool named after process | Low | Name pool after participant |
| 16 | Unconnected/floating element | High | Connect all elements to the flow |
| 17 | Redundant "Start"/"End" naming | Low | Name with trigger/outcome |
| 18 | Mixing flow directions | Medium | Consistent left-to-right |
| 19 | No exception handling | Medium | Add error/timer boundary events or gateway branches |
| 20 | Unnecessary gateway | Low | Remove if all paths lead to same next step |

---

## 9. Process Complexity Guidelines

| Complexity | Elements per diagram | Recommendation |
|-----------|---------------------|----------------|
| Simple | 5–15 elements | Single-level diagram |
| Medium | 15–30 elements | Use sub-processes for phases |
| Complex | 30–50 elements | Hierarchical decomposition required |
| Very Complex | 50+ elements | Split into multiple linked processes with Call Activities |

**Rule of thumb**: If your diagram doesn't fit on one screen/page, decompose it.

---

## 10. BPMN Tools and Compatibility

When generating BPMN XML, ensure compatibility with major tools:
- **bpmn-js** (bpmn.io): The most popular open-source JavaScript viewer/editor. Use for web-based rendering.
- **Camunda Modeler**: Full-featured desktop editor. Supports execution-level BPMN.
- **Signavio / SAP Signavio**: Enterprise process management platform.
- **Bizagi Modeler**: Free desktop modeler, widely used in education.
- **Visual Paradigm**: Enterprise modeling suite with BPMN support.

All tools expect valid BPMN 2.0 XML with proper namespace declarations and DI (Diagram Interchange) sections for layout.

---

## 11. SME Interview Elicitation Guide

This section provides the structured methodology for interviewing Subject Matter Experts (SMEs) and translating their spoken descriptions into accurate BPMN diagrams. An SME interview is the primary source material — and the #1 source of modeling errors when misunderstood.

### 11.1 The 5W Extraction Framework

Every process step must be captured using the **5W method**. Keep asking until every W is answered:

| W | What it captures | BPMN element | Example question |
|---|-----------------|-------------|-----------------|
| **Who** | The person/role performing the work | Lane / Pool | "Who is responsible for this step?" |
| **What** | The action being performed | Task (verb + object) | "What exactly do they do?" |
| **When** | The trigger or timing | Start Event / Timer Event / Sequence | "What triggers this step? What has to happen first?" |
| **Where** | The system, location, or channel | Annotation / Data Object | "Where does this happen — in which system, form, or location?" |
| **Why** | The business purpose / decision logic | Gateway condition / Annotation | "Why is this step necessary? What decision is being made?" |

**Rule**: If you cannot answer "Who does What" for a step, you don't have enough information to model it. Go back to the SME.

### 11.2 Interview Structure — Three Phases

#### Phase 1: Context Setting (5–10 minutes)

Establish scope before diving into steps. Ask:

1. **"What is the name of this process?"** → Becomes the process name
2. **"What triggers this process to start?"** → Becomes the Start Event
3. **"What is the successful outcome?"** → Becomes the primary End Event
4. **"Who are all the people/roles involved?"** → Becomes the Lane set
5. **"Are there different versions of this process?"** (e.g., by region, product type, customer tier) → Flags process variants for gateway conditions
6. **"What systems or tools are used?"** → Informs task types (User Task vs Service Task vs Manual Task)

#### Phase 2: Happy Path Walkthrough (15–30 minutes)

Walk through the **normal/successful** flow first. This becomes the main horizontal path in the diagram.

**Structured prompts:**
- "Walk me through the process step by step, starting from the trigger."
- "What happens next?" (repeat until End Event)
- "Who does that?" (for every step — never assume)
- "Is there a handoff here to someone else?" (detect lane crossings)
- "How long does this typically take?" (informs Timer Events)
- "What information do they need to do this?" (informs Data Objects)
- "What is the output of this step?" (informs Data Objects / message content)

**Active listening rules:**
- When the SME says a **noun without a verb** ("Then the approval"), ask: "Who approves it, and what exactly are they approving?"
- When the SME says **"we"**, ask: "When you say 'we', which specific role do you mean?"
- When the SME says **"it goes to"**, ask: "How does it get there — automatically, via email, or does someone manually send it?"
- When the SME says **"usually"** or **"sometimes"**, STOP — this signals a gateway. Ask: "What determines whether it goes one way or the other?"
- When the SME says **"they check"**, ask: "What are the possible outcomes of that check?" (XOR gateway incoming)

#### Phase 3: Exceptions and Alternatives (15–20 minutes)

After the happy path is complete, systematically probe for exceptions:

**Probing questions:**
1. "What can go wrong at [each step]?"
2. "What happens if [step X] is rejected/denied/failed?"
3. "Is there a timeout — what if no one acts on this for [X days]?"
4. "Are there situations where the process takes a completely different path?"
5. "What happens if the customer/requester cancels midway?"
6. "Are there any approvals that can be escalated?"
7. "Does anything happen in parallel — tasks that don't depend on each other?"

**Mapping exceptions to BPMN:**

| SME says... | BPMN element |
|------------|-------------|
| "If X is rejected, it goes back to..." | XOR gateway → loop back to earlier task |
| "If there's an error, we escalate to..." | Error Boundary Event → Escalation path |
| "If we don't hear back in 3 days..." | Timer Boundary Event (non-interrupting or interrupting) |
| "Both the legal review and financial check happen at the same time" | Parallel (AND) gateway split → AND join |
| "Depending on the amount, either one or both approvals are needed" | Inclusive (OR) gateway |
| "The process is cancelled" | Terminate End Event |
| "They get notified but the process continues" | Non-interrupting Signal/Message Event |

### 11.3 Common SME Communication Pitfalls

SMEs are experts in their domain but not in process modeling. Expect these patterns:

| SME pitfall | What they say | What they mean | How to fix |
|------------|--------------|---------------|-----------|
| **Implicit knowledge** | "Then it gets approved" | There's a review, a decision, and possibly a rejection path — but the SME skips it because it's obvious to them | Ask: "Walk me through the approval — who reviews it, what do they check, and what happens if they say no?" |
| **Role ambiguity** | "We do the check" | Unclear who "we" is — could be a team, a specific role, or a system | Ask: "When you say 'we', which specific person or role performs this?" |
| **Missing the unhappy path** | SME only describes the success scenario | 80% of process complexity is in the exceptions | Systematically ask "What if this fails/is rejected/times out?" at every step |
| **Conflating steps** | "We review and approve the request" | Review and approve may be two separate activities, possibly by different people | Ask: "Is reviewing and approving the same action by the same person, or are they separate?" |
| **Describing what SHOULD happen vs what DOES happen** | "The manager always checks within 24 hours" | In reality there may be delays, escalations, or the step is skipped | Ask: "What happens when it doesn't get checked in time?" |
| **System-speak** | "It goes into SAP" / "The ticket moves to Resolved" | The SME describes the system behavior, not the business process | Ask: "What business action causes that system update? Who triggers it?" |
| **Skipping handoffs** | "Then procurement handles it" | Missing the explicit handoff mechanism — email? system notification? meeting? | Ask: "How does procurement know it's their turn? What triggers them to act?" |
| **Circular reasoning** | "If it's not approved, we send it back and they resubmit" | This is a loop — needs a gateway and a path back to an earlier task | Model as: XOR gateway "Approved?" → "No" → back to "Submit Request" |

### 11.4 Real-Time Translation Checklist

Use this checklist while listening to the SME to ensure you capture everything:

- [ ] **Trigger identified** — What starts this process? (Start Event)
- [ ] **All roles named** — Every person/role mentioned has a lane
- [ ] **Every step has a Who + What** — No orphan actions without a responsible role
- [ ] **Every "if" has two paths** — No decision without both the Yes and No outcomes
- [ ] **Every split has a merge** — Parallel or alternative paths rejoin
- [ ] **Handoffs are explicit** — How does work move between roles?
- [ ] **End states are clear** — What are all the ways this process can end?
- [ ] **Exceptions are captured** — What happens when things go wrong?
- [ ] **Loops are bounded** — If something goes back for rework, is there a limit?
- [ ] **Variants are conditions, not separate processes** — "For international orders..." becomes a gateway condition, not a separate diagram

### 11.5 Post-Interview Validation

After the interview:

1. **Read back the sequence**: Walk the SME through the modeled flow verbally: "So first [Role A] does [X], then if [condition], [Role B] does [Y]..." — let them correct you.
2. **Show the diagram**: Present the BPMN diagram and walk through it visually. SMEs don't need to understand BPMN notation — explain: "Diamonds are decisions, rectangles are tasks, the horizontal bands are roles."
3. **Check for missing roles**: Ask "Is there anyone else involved in this process that we haven't mentioned?"
4. **Check for missing exceptions**: Ask "What's the worst thing that can happen during this process?"
5. **Confirm the happy path**: Ask "If everything goes perfectly, does this flow look right?"
6. **Send notes for review**: Email the transcript and diagram to the SME for asynchronous review. They will catch things they forgot to mention.

### 11.6 Interview Anti-Patterns to Avoid

| Interviewer mistake | Why it's harmful | Better approach |
|--------------------|-----------------|----------------|
| Leading questions: "So the manager approves it, right?" | You're putting words in the SME's mouth | Ask: "What happens next?" and let them describe it |
| Modeling during the interview without checking | You may misinterpret and build on wrong assumptions | Periodically read back: "Let me check I've got this right..." |
| Not asking about exceptions | You'll produce a happy-path-only diagram that doesn't reflect reality | Dedicate 30%+ of interview time to exceptions |
| Interviewing only managers | Managers describe the ideal process; front-line workers describe the real one | Interview both managers and the people who actually do the work |
| Accepting "it depends" without follow-up | "It depends" = a gateway. Without the condition, you can't model it | Ask: "What specifically does it depend on? What are the possible options?" |
| Skipping the trigger question | Without a clear trigger, you don't know what the Start Event is | Always ask first: "What causes this process to begin?" |
| Treating every variant as a separate process | You end up with 10 diagrams instead of 1 with gateways | Use gateways for variants: "If [region=EU]..." is a condition on an XOR, not a new process |
