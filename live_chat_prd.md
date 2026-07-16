# PRD: Live Chat สำหรับเว็บ Enjoybook

สถานะเอกสาร: Draft พร้อมให้ทีมตรวจสอบ
แหล่งข้อมูลหลัก: Live Chat Web Frontend Integration Guide ณ วันที่ 16 กรกฎาคม 2026
ขอบเขตผลิตภัณฑ์: Frontend เว็บ Enjoybook สำหรับผู้ใช้ที่เข้าสู่ระบบแล้ว

## Problem Statement

ผู้ใช้ Enjoybook ที่พบปัญหาระหว่างใช้งานยังไม่มีช่องทางช่วยเหลือบนเว็บที่รวมการค้นหาคำตอบด้วยตนเอง การคัดกรองปัญหา การสนทนากับเจ้าหน้าที่แบบเรียลไทม์ การย้อนดูประวัติ และการประเมินผลหลังจบเคสไว้ในประสบการณ์เดียว

หากไม่มี Live Chat ผู้ใช้อาจต้องออกจากเว็บไซต์เพื่อขอความช่วยเหลือ อธิบายปัญหาซ้ำ ไม่ทราบว่าเจ้าหน้าที่ตอบกลับแล้วหรือยัง และไม่สามารถกลับไปอ่านคำตอบจากเคสเดิมได้ ขณะเดียวกันทีมสนับสนุนจะได้รับเคสที่ไม่มีข้อมูลคัดกรองเพียงพอ ทำให้ใช้เวลาทำความเข้าใจปัญหานานขึ้น

ระบบ Frontend จึงต้องรองรับ lifecycle ของ Live Chat ที่ Backend กำหนดอย่างถูกต้อง โดยเฉพาะสถานะ thread, intake, message, read state และ feedback รวมถึงต้องทำงานได้เมื่อการเชื่อมต่อ Socket.IO ขาดช่วง เนื่องจาก REST API เป็น source of truth และ Socket.IO เป็นเพียงสัญญาณให้ client sync ข้อมูลล่าสุด

## Solution

เพิ่มประสบการณ์ Live Chat บนเว็บสำหรับผู้ใช้ที่เข้าสู่ระบบแล้ว โดยมีความสามารถดังนี้:

- เปิดหน้า Live Chat เพื่อดู active thread ปัจจุบัน หรือเริ่มขอความช่วยเหลือใหม่
- เลือกหัวข้อช่วยเหลือและทำ intake แบบ decision tree เพื่อพยายามแก้ปัญหาด้วยตนเองก่อน
- ข้าม intake และเริ่มสนทนากับเจ้าหน้าที่ได้โดยตรง
- ส่งและรับข้อความ text และ image ใน active thread
- รับสัญญาณแบบ realtime แล้ว sync ข้อมูล authoritative จาก REST API
- โหลดข้อความเก่า ข้อความที่พลาดระหว่าง offline และประวัติ thread ด้วย cursor pagination
- แสดง thread ที่ resolved หรือ archived เป็นแบบอ่านอย่างเดียว
- แสดงและแก้ไข feedback ภายในเงื่อนไขที่ Backend อนุญาต
- แสดง loading, empty, offline, retry, validation และ authentication state ที่ผู้ใช้เข้าใจได้

ประสบการณ์หลักต้องเป็น mobile-first, ใช้งานด้วยคีย์บอร์ดได้ และสอดคล้องกับ design system ของเว็บ Enjoybook

## User Stories

1. As a logged-in Enjoybook user, I want to open Live Chat from the website, so that I can request help without leaving Enjoybook.
2. As a logged-out visitor, I want to be prompted to log in before using Live Chat, so that my conversations remain private and associated with my account.
3. As a returning user, I want the page to load my current active thread automatically, so that I can continue the existing conversation.
4. As a user without an active thread, I want to see available help topics, so that I can find a relevant solution quickly.
5. As a user without an active thread, I want to start chatting directly, so that I am not forced through a help topic that does not match my issue.
6. As a user, I want to choose a published help topic, so that the intake questions are relevant to my problem.
7. As a user, I want help-topic choices to appear in the intended order, so that the troubleshooting flow is understandable.
8. As a user, I want to answer one intake question at a time, so that the diagnostic process feels focused.
9. As a user, I want the next intake step to reflect the latest server state, so that stale client state does not send me down an invalid path.
10. As a user, I want to go back to an earlier intake question, so that I can correct an accidental answer.
11. As a user, I want answers after the selected back point to be removed from the active path, so that the intake summary reflects my corrected choices.
12. As a user, I want to resume an unfinished, unexpired intake, so that I do not need to repeat answers.
13. As a user, I want to be told when an intake has expired, so that I understand why I must start again.
14. As a user, I want to see a terminal help result with text and images, so that I can attempt the recommended solution.
15. As a user who solved the issue independently, I want to mark the intake as self-resolved, so that I can finish without opening a support case.
16. As a user who still needs help, I want to escalate the intake to an agent, so that the agent receives the context already collected.
17. As a user who skips topic selection, I want to start or escalate a direct-support intake, so that I can reach the chat efficiently.
18. As a user, I want the escalated intake to open the active thread returned by the server, so that I can begin chatting immediately.
19. As a user, I want intake completion retries to be safe, so that a slow network does not create duplicate outcomes or threads.
20. As a user, I want to see the active conversation timeline in chronological order, so that the discussion is easy to follow.
21. As a user, I want messages to be visually distinguished by user, admin, and system sender, so that I understand who produced each message.
22. As a user, I want text and image messages to render differently, so that each message type is clear and usable.
23. As a user, I want timestamps displayed in my presentation timezone, so that I can understand when each event occurred.
24. As a user, I want to send a text message of up to 5,000 characters, so that I can describe my issue adequately.
25. As a user, I want blank or oversized messages blocked before submission, so that I can correct them without waiting for an API error.
26. As a user, I want the original spacing of my accepted message preserved, so that the conversation reflects what I sent.
27. As a user, I want sending state shown while a message is being submitted, so that I do not submit it repeatedly.
28. As a user, I want a successful REST response to add my message immediately, so that the interface feels responsive.
29. As a user, I want the Socket echo of my own message to be deduplicated, so that the message appears only once.
30. As a user, I want a failed text message to retain its content for retry, so that I do not need to type it again.
31. As a user, I want to select and upload a supported image, so that I can show visual evidence of my problem.
32. As a user, I want unsupported, empty, or larger-than-5-MB images blocked before upload, so that I receive immediate guidance.
33. As a user, I want upload progress or an uploading state shown, so that I know the image is still being processed.
34. As a user, I want the image returned by the API to appear in the timeline, so that I can verify the upload succeeded.
35. As a user, I want a failed image upload to offer retry for the selected file, so that temporary storage errors are recoverable.
36. As a user, I want to open message images safely, so that I can inspect screenshots or evidence at a useful size.
37. As a user, I want the composer disabled when `can_send` is false, so that I cannot write into a resolved or archived thread.
38. As a user, I want sending a new message after a resolved case to use a new active thread, so that old case records remain immutable.
39. As a user, I want to start a new conversation intentionally, so that an unrelated issue is separated from the current case.
40. As a user, I want an empty active thread reused instead of duplicated, so that accidental clicks do not create redundant conversations.
41. As a user, I want a previous non-empty active thread moved to history when starting a new one, so that both cases remain accessible.
42. As a user, I want older messages to load when I scroll upward, so that I can review a long conversation.
43. As a user, I want the scroll position preserved when older messages are prepended, so that the timeline does not jump unexpectedly.
44. As a user, I want message pages deduplicated by `message_id`, so that overlapping cursor results do not create duplicates.
45. As a user, I want the page to stop requesting older messages when `has_more` is false, so that the UI avoids pointless requests.
46. As a user, I want to see my conversation history ordered from newest to oldest, so that recent cases are easiest to find.
47. As a user, I want older thread history to load incrementally, so that the initial page remains fast.
48. As a user, I want to open a resolved or archived thread from history, so that I can revisit prior guidance.
49. As a user, I want history messages loaded through the selected thread, so that the active conversation is not replaced accidentally.
50. As a user, I want a clear empty state when I have no active thread or history, so that the page does not appear broken.
51. As a user, I want to receive new admin messages without manually refreshing, so that I can respond promptly.
52. As a user, I want Socket.IO events to trigger REST synchronization, so that displayed data remains authoritative.
53. As a user, I want the app to catch up through REST after reconnecting, so that messages missed while offline are restored.
54. As a user, I want the app to catch up when I return to a visible tab, so that the conversation is current.
55. As a user, I want an offline indicator, so that I understand why realtime updates may be delayed.
56. As a user, I want messages sent before a disconnect to remain deduplicated after catch-up, so that reconnection does not corrupt the timeline.
57. As a user, I want a resolved event to refresh the active thread and history, so that the composer and feedback state update correctly.
58. As a user, I want read progress to move forward as I view messages, so that the system can track what I have seen.
59. As a user, I want read progress never to move backward, so that previously read content does not become unread.
60. As a user, I want transient read-state failures to avoid blocking chat usage, so that the primary conversation remains usable.
61. As a user, I want a feedback form only when the server marks the resolved thread as eligible, so that I am not offered an invalid action.
62. As a user, I want to rate a resolved case from 1 to 5, so that I can communicate satisfaction.
63. As a user, I want to add an optional comment of up to 2,000 characters, so that I can explain my rating.
64. As a user, I want to select up to seven active feedback tags, so that I can describe the support experience quickly.
65. As a user, I want feedback tags displayed using localized labels but submitted using stable keys, so that language changes do not break the contract.
66. As a user, I want existing feedback prefilled, so that I can review or update it.
67. As a user, I want updating feedback to replace the prior tag set, so that the saved evaluation matches my current selection.
68. As a user, I want the feedback form hidden if eligibility changes, so that a stale page does not submit an invalid evaluation.
69. As a user, I want authentication failures to return me to the established login flow, so that I can restore access safely.
70. As a blocked or revoked user, I want the established account/session handling to apply, so that Live Chat behaves consistently with the rest of the site.
71. As a user, I want field-level validation messages when the server provides issues, so that I know what to correct.
72. As a user, I want stale intake conflicts to reload the latest intake, so that I can continue from a valid state.
73. As a user, I want rate-limit errors to show when retry is available, so that repeated clicks do not worsen the problem.
74. As a user, I want unexpected errors to offer retry, so that temporary failures do not end the support flow.
75. As a support reporter, I want a request ID shown or copyable for unexpected server errors, so that Backend can trace the failure.
76. As a keyboard user, I want to navigate topics, choices, messages, composer controls, uploads, history, and feedback without a mouse, so that Live Chat is accessible.
77. As a screen-reader user, I want new messages, connection changes, errors, and sending states announced appropriately, so that realtime behavior is understandable.
78. As a mobile user, I want the conversation, intake, history, and composer to fit small screens without horizontal scrolling, so that I can request help comfortably.
79. As a user, I want controls to have adequate touch targets and visible focus states, so that actions are reliable.
80. As a user on a slow connection, I want distinct skeleton, loading-more, sending, uploading, and reconnecting states, so that I understand what is happening.
81. As a user, I want help content and server-provided text rendered safely, so that malicious content cannot execute in the page.
82. As a user, I want conversations isolated to my authenticated account, so that another user’s threads and events are never visible.
83. As a QA engineer, I want deterministic mocked REST and Socket behavior, so that critical Live Chat flows can be tested without relying on production services.
84. As a product owner, I want analytics for entry, topic selection, intake completion, escalation, first message, reconnect recovery, and feedback submission, so that feature adoption and friction can be measured.

## Implementation Decisions

- Live Chat will be implemented as a self-contained feature module, with page composition, feature-specific components, hooks, state transitions, and presentation logic grouped behind a small public interface.
- The feature will use the existing authenticated application shell and auth state. It will not introduce a separate login or token-storage mechanism.
- HTTP requests will use the project’s shared API client so that JWT and `x-device-id` behavior remain consistent with the rest of the application.
- Live Chat API responses will be normalized from the canonical envelope into typed domain results. Known errors will preserve HTTP status, `error_code`, validation issues, `request_id`, and `Retry-After` when available.
- Runtime validation will be applied at the Live Chat API boundary for contracts that directly control state transitions, pagination, or rendering.
- Server data will be managed with TanStack Query. Short-lived interaction state such as composer text, selected upload, active panel, scroll state, and intake transition state will remain local to the feature unless a cross-page requirement emerges.
- The active thread, thread history, messages, intake, feedback tags, and feedback will have separate query identities. Mutations will update or invalidate only the affected identities.
- Thread lifecycle will always be derived from the latest `ThreadDTO`. The client will not invent or persist its own thread status.
- The composer will use `can_send` as the authoritative permission signal.
- A message returned by a successful POST will be treated as confirmed server data and inserted immediately. The feature will not wait for a matching Socket event.
- All message collections will be deduplicated by `message_id` and ordered oldest to newest.
- Thread history will be ordered newest to oldest and paginated with `before_thread_id`.
- Active and historical message timelines will use separate endpoints and cache identities to prevent a selected history thread from overwriting the active thread.
- Older-message pagination will use `before_message_id`; reconnect catch-up will use `after_message_id`. These cursor directions will never be sent together.
- The feature will continue catch-up requests while `has_more` is true and advance using the cursor returned by the server.
- REST API is the source of truth. Socket.IO events are invalidation and synchronization hints, even when an event contains a full-looking payload.
- The existing authenticated Socket provider will be reused. Live Chat listeners will subscribe and unsubscribe within the feature lifecycle.
- Live Chat Socket authentication will rely on the JWT token. The feature will not trust or derive ownership from Socket query-string user data.
- On Socket connect, reconnect, browser online, focus, or visible-tab recovery, the feature will request messages after the highest known `message_id`.
- A `thread_resolved` event will refresh the current thread, thread history, and feedback eligibility.
- Text sending will trim only for client validation; the submitted accepted value will preserve the original body expected by the API contract.
- Image sending will use browser-managed `multipart/form-data`. The client will not set the multipart content type manually.
- Accepted image extensions are jpg, jpeg, png, webp, and gif, with a maximum size of 5 MB. Client validation improves feedback but does not replace server validation.
- Image rendering will use `image_url` returned by the API. The client will not construct storage URLs.
- Intake state will be replaced by the newest `IntakeDTO` after start, answer, back, load, or complete. The client will not copy or reconstruct the decision tree.
- Intake choices will be ordered by `sort_order`. Terminal content will render `terminal.images`; duplicated `terminal_images` will not be rendered twice.
- Topic intake completion will expose `self_resolved` and `escalated` only after reaching a terminal node. Topic-less intake will expose `skip` and `escalated`.
- Intake conflict and expiry errors will recover by reloading or restarting rather than attempting local state repair.
- Read state updates will be monotonic and may be coalesced to avoid sending an update for every rendered message.
- Feedback UI will be controlled exclusively by `feedback_eligible`. Existing values will come from `feedback_summary`.
- Feedback submission will send tag keys, reject duplicates, and replace the complete saved tag selection on update.
- All ISO 8601 timestamps will be formatted at the presentation layer using the user-facing timezone conventions of the existing application.
- Thai UX copy will map known Live Chat error codes to user-friendly messages. Raw Backend messages and stack-like details will not be shown as the primary message.
- A server error request ID will be retained and made available to the user for support diagnostics.
- The page will provide explicit initial loading, incremental loading, empty, offline, reconnecting, sending, uploading, success, read-only, expired, rate-limited, and retry states.
- Accessibility will include semantic controls, visible keyboard focus, labeled inputs, screen-reader announcements for new messages and connection state, and stable focus after intake transitions.
- Analytics events will not include message bodies, image URLs, JWTs, comments, or other conversation content.
- The first release will reuse the current design system and responsive conventions. Final loading skeletons, empty-state artwork, notification badge behavior, and Thai copy require design/content review before release.
- The Socket transport configuration must be reviewed against the API contract because the current application provider is websocket-only while the integration guide allows websocket and polling. The implementation should preserve existing shared-socket behavior unless the team approves a provider-wide change.

## Testing Decisions

- Tests will assert externally visible behavior and public contracts rather than component internals, hook call counts, private state shape, CSS implementation details, or specific cache operations.
- The highest primary seam will be the complete Live Chat feature page with mocked REST endpoints and a controllable Socket adapter. This seam will cover the user journey from entry through intake, escalation, conversation, reconnect recovery, resolution, history, and feedback.
- This primary seam is an assumed testing decision synthesized from the current codebase. It should be confirmed during implementation kickoff; if changed, the replacement should remain at the highest practical feature boundary.
- Contract-level unit tests will cover API request construction, canonical response-envelope parsing, `200`/`201` idempotent outcomes, multipart behavior, error normalization, request ID retention, and retry timing from `Retry-After`.
- State-transition tests will cover message ordering and deduplication, active-versus-history isolation, before/after cursor progression, catch-up loops, thread replacement after resolution, intake state replacement, and monotonic read cursors.
- Validation tests will cover blank and oversized text, accepted and rejected image formats and sizes, feedback rating/comment/tag rules, and intake action eligibility.
- Realtime integration tests will cover new-message hints, self-message Socket echo, reconnect catch-up, missed multiple pages, repeated events, out-of-order hints, offline/online transitions, visible-tab recovery, and resolved-thread refresh.
- Feature tests will verify that REST remains authoritative when Socket payloads are partial, duplicated, delayed, or absent.
- Authentication tests will verify logged-out entry, invalid/expired session handling, and that the feature does not connect or request private data without authenticated state.
- Accessibility tests will verify keyboard navigation, focus management, accessible names, live announcements, read-only composer state, and error association with fields.
- Responsive browser tests will cover at least a narrow mobile viewport and desktop Chromium for the full conversation layout.
- E2E tests will mock Backend APIs at the network boundary, following the existing Playwright smoke-test pattern, so that tests are deterministic and do not create real support conversations.
- Existing API service unit tests provide prior art for mocking the shared API client and asserting request/response behavior.
- Existing Socket provider and notification listener patterns provide prior art for attaching event listeners and cleaning them up.
- Existing Playwright network-routing helpers provide prior art for end-to-end page tests with controlled Backend responses.
- Release-critical scenarios are: authenticated entry, no-active-thread state, direct chat, topic intake to self-resolution, topic intake to escalation, text send, image validation/upload, older-message pagination, reconnect catch-up without duplicates, resolved read-only state, history view, feedback create/update, authentication failure, rate limit, and unexpected error with request ID.

## Out of Scope

- Admin or support-agent console, queue management, assignment, case resolution controls, internal notes, and agent presence.
- Direct calls from the web Frontend to Admin APIs.
- Backend schema, database, transaction, rate-limit, MinIO, stream worker, notification outbox, or Socket bridge implementation.
- LINE notification and any UI for notification outbox state while `LIVE_CHAT_LINE_NOTIFY=false`.
- Voice messages, video messages, file attachments other than supported images, audio/video calling, screen sharing, reactions, message editing, message deletion, quoting, forwarding, and typing indicators.
- Full-text search across conversation history.
- User-controlled thread deletion or archival.
- Client-side invention of thread, intake, resolution, feedback eligibility, or ownership state.
- Guaranteed delivery or replay through Socket.IO; recovery is provided through REST synchronization.
- Offline message composition queue or background sending after the page is closed.
- Link-preview presentation unless separately approved; the API contract exists, but the product behavior and security/UX requirements are not defined in this PRD.
- Notification badge behavior outside the Live Chat page until product and design define unread-count requirements.
- New design-system primitives, new brand direction, or final bespoke illustrations.
- Changes to global Socket transport/auth behavior unless required and approved as a separate cross-cutting change.
- Production analytics dashboards, support SLAs, staffing workflows, and operational alerting.

## Further Notes

- Proposed product route, navigation entry point, and whether access is restricted by VIP `live_chat_access` are not defined in the source guide. This PRD assumes every authenticated user can reach the feature because all documented Live Chat endpoints are described as authenticated-user APIs. If VIP entitlement is required, it must be confirmed before implementation.
- API origin and Socket origin must come from the environment configuration already used by the application.
- The current shared API client automatically attaches authentication and `x-device-id`; Live Chat should preserve that behavior.
- The current shared Socket provider sends query-string identity fields and forces websocket transport. The Live Chat contract does not require query-string identity and describes REST recovery as mandatory. Any provider-wide cleanup should be handled carefully because it affects existing realtime consumers.
- Success metrics proposed for the first release:
  - Live Chat page load success rate.
  - Percentage of users who complete intake.
  - Self-resolution rate.
  - Escalation rate.
  - Percentage of escalations that send a first message.
  - Reconnect/catch-up failure rate.
  - Duplicate-message incidence observed by client telemetry.
  - Feedback submission rate and average rating.
  - API error rates grouped by HTTP status and `error_code`, excluding private message content.
- Product/content decisions still needed before release include the final Thai label for Live Chat, entry-point placement, introductory copy, help-topic empty state, offline copy, rate-limit copy, generic retry copy, upload failure copy, feedback confirmation copy, and whether request IDs should be displayed directly or behind a “รายละเอียดปัญหา” action.
- Suggested triage label when this PRD is published to the project issue tracker: `ready-for-agent`.
