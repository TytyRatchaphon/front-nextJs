# Ticket 3: Remove Legacy Reading Lifecycle Paths

**Status:** ready-for-agent
**Blocked by:** Ticket 2 - Centralize Reading session and conflict lifecycle (completed in `ffe6693`)
**Related prerequisite:** Ticket 1 - Centralize Reading progress ownership (completed in `1a3b7b4`)

## Problem Statement

Reader เคยมีหลายจุดที่รับผิดชอบ lifecycle เดียวกัน ทั้งการ restore และบันทึก Reading progress, scroll listener, heartbeat, Reading session, conflict, takeover และการปิด session เมื่อเปลี่ยนตอนหรือออกจากหน้า แม้ Ticket 1 และ Ticket 2 จะย้ายกฎหลักเข้าสู่ Reading progress controller และ Reading session controller แล้ว แต่ wiring ระดับ React และเส้นทางเดิมที่เหลือยังต้องถูกตรวจสอบและลบให้หมด

หาก Reader ยังมี lifecycle ซ้ำ ผู้ใช้อาจพบการบันทึก progress หลายครั้ง, listener หรือ timer ค้างหลังเปลี่ยนตอน, session ถูกปิดมากกว่าหนึ่งครั้ง, conflict state แข่งกัน หรือ async result จากตอนเก่ากลับมาแก้สถานะของตอนใหม่ ปัญหาเหล่านี้ตรวจจับยากจาก unit test ของ controller เพียงอย่างเดียว เพราะเกิดจากการประกอบ controller, hooks, browser events, socket events และ API gateway เข้าด้วยกัน

Ticket นี้ต้องทำให้ Reader มีเส้นทาง lifecycle ที่ชัดเจนเพียงเส้นเดียวตั้งแต่เปิดจนปิด และเพิ่ม behavioral coverage ที่พิสูจน์ ownership และ cleanup โดยไม่ผูกกับรายละเอียดภายในของ React effects

## Solution

ปรับ Reader ให้ Reading progress และ Reading session ถูกประกอบผ่าน lifecycle wiring ชุดเดียว โดย controller จาก Ticket 1 และ Ticket 2 ยังคงเป็นเจ้าของ state transition และ race protection ส่วน React boundary เป็นเจ้าของเฉพาะการเชื่อมต่อกับ browser, socket, authentication และ UI

ลบ scroll listener, progress update, heartbeat, session termination, conflict normalization และ socket subscription เส้นทางเดิมที่ซ้ำหรือไม่ถูกเรียกใช้อีก พร้อมลบ state, refs, helpers, imports และ comments ที่รองรับเส้นทางเหล่านั้น

เพิ่ม lifecycle behavioral test ที่ seam ระดับ Reader hooks/page boundary เพื่อจำลองการเปิด Reader, restore progress, scroll, heartbeat, conflict, takeover, เปลี่ยน episode และปิด Reader แล้วพิสูจน์ว่าแต่ละ side effect เกิดเพียงครั้งเดียวและ cleanup ครบ การทดสอบ controller เดิมยังคงครอบคลุม race condition รายละเอียดต่ำกว่า seam นี้

## User Stories

1. As an authenticated reader, I want my saved Reading progress restored when I open an episode, so that I can continue from the correct position.
2. As an authenticated reader, I want restoration to complete before heartbeat persistence can write progress, so that an initial zero value cannot overwrite server progress.
3. As an authenticated reader, I want one scroll action to enter one progress calculation and persistence path, so that duplicate listeners do not send duplicate updates.
4. As an authenticated reader, I want rapid scroll events to be throttled by the single lifecycle owner, so that reading remains responsive and API traffic stays bounded.
5. As an authenticated reader, I want heartbeat persistence to reuse the latest captured progress, so that progress remains current without recalculating through another owner.
6. As an authenticated reader, I want heartbeat persistence to run only while the document is visible and focused, so that inactive tabs do not generate unnecessary writes.
7. As an authenticated reader, I want the Reader to register only one heartbeat timer for the active episode, so that rerenders do not multiply persistence calls.
8. As an authenticated reader, I want progress tracking to stop while another device owns the Reading session, so that my device cannot compete with the active reader.
9. As an authenticated reader, I want an HTTP Reading conflict and a socket Reading conflict to produce the same visible conflict state, so that behavior is consistent regardless of event source.
10. As an authenticated reader, I want repeated conflict events to use one conflict lifecycle, so that the modal and hidden content do not flicker or diverge.
11. As an authenticated reader, I want a successful takeover to resume the existing progress lifecycle, so that I can continue reading without refreshing the page.
12. As an authenticated reader, I want a failed takeover to preserve the conflict state, so that content is not exposed before ownership is acquired.
13. As an authenticated reader, I want a newer conflict to win over an older in-flight takeover or refresh, so that stale async results cannot unlock the Reader.
14. As an authenticated reader, I want a device logout event aimed at my device to log me out through one path, so that duplicate socket events do not trigger duplicate logout work.
15. As an authenticated reader, I want device logout events for other devices ignored, so that another device's lifecycle does not interrupt my Reader.
16. As an authenticated reader, I want the active Reading session ended once when I leave the Reader, so that competing unload and unmount events cannot send duplicate termination requests.
17. As an authenticated reader, I want the Reader not to end a session owned by another device, so that conflict cleanup cannot terminate the actual owner's session.
18. As an authenticated reader, I want changing episodes to cancel the old episode's pending restore, so that stale work cannot scroll the new episode.
19. As an authenticated reader, I want changing episodes to remove the old episode's listeners, timer and socket subscriptions, so that only the new episode remains active.
20. As an authenticated reader, I want changing episodes to close the old lifecycle once and start the new lifecycle once, so that session and progress ownership follow the visible episode.
21. As an authenticated reader, I want unmounting the Reader to clear pending scroll work, so that a delayed callback cannot save after navigation.
22. As an authenticated reader, I want unmounting the Reader to unsubscribe every lifecycle-owned socket event, so that revisiting Reader does not accumulate handlers.
23. As an authenticated reader, I want `beforeunload`, `pagehide` and React cleanup to share idempotent session termination, so that browser-specific event ordering is safe.
24. As a guest reader, I want the readable content to work without authenticated progress or session side effects, so that guest access does not call protected lifecycle APIs.
25. As a reader, I want navigation visibility behavior to remain unchanged after lifecycle cleanup, so that this architecture work does not alter the reading interface.
26. As a reader, I want content protection and paragraph tracking to keep working independently, so that unrelated Reader scroll consumers are not removed as duplicates.
27. As a maintainer, I want Reading progress rules owned by the Reading progress controller, so that React wiring does not reimplement restore, capture, suspend or resume rules.
28. As a maintainer, I want Reading session and conflict rules owned by the Reading session controller, so that React wiring does not reimplement normalization, race handling or idempotency.
29. As a maintainer, I want each browser and socket event registered at one discoverable boundary, so that lifecycle ownership can be audited without tracing the whole page.
30. As a maintainer, I want dead lifecycle state, refs, helpers, imports and comments removed, so that future changes cannot accidentally reactivate the old path.
31. As a maintainer, I want tests to assert observable API calls, state and cleanup behavior, so that internal refactors do not require rewriting the suite.
32. As a maintainer, I want the full Reader lifecycle covered at one high-level seam, so that duplicate ownership regressions are caught before release.

## Implementation Decisions

- Reading progress controller remains the single owner of restore, current progress, capture-and-save, heartbeat save eligibility, conflict suspension, resume and cancellation.
- Reading session controller remains the single owner of conflict normalization, conflict state, active-session refresh races, takeover races, targeted device logout and idempotent session termination.
- React lifecycle wiring owns only integration concerns: creating the controllers for the active book and episode, binding browser events, binding socket events, connecting gateways, exposing state to UI and performing cleanup.
- There must be exactly one authenticated scroll-to-progress binding for the active episode. Other scroll listeners are allowed only when they serve a different Reader capability, such as paragraph tracking, and must not persist Reading progress.
- There must be exactly one active progress heartbeat for the active episode.
- There must be exactly one subscription per Reading lifecycle socket event for the active episode.
- `beforeunload`, `pagehide`, episode replacement and React unmount may all request termination, but idempotency remains enforced by the Reading session controller.
- Episode identity is the lifecycle boundary. Replacing book or episode identity cancels and cleans the previous lifecycle before the replacement becomes authoritative.
- Guest or disabled lifecycle states must not bind authenticated progress or session side effects.
- Conflict state disables progress tracking through the public integration contract; UI code must not bypass the controllers to persist progress while conflicted.
- HTTP conflict payloads and socket conflict payloads enter the same Reading session boundary before reaching UI state.
- API contracts, socket event names and server payload formats remain unchanged.
- Existing public Reader behavior and visual presentation remain unchanged.
- Remove legacy state, refs, helpers, effects, direct service calls and imports only after their behavior is represented by the surviving lifecycle path.
- Do not classify unrelated scroll consumers as duplicate progress ownership. Content protection, paragraph tracking and presentation effects retain their independent responsibilities.
- Prefer simplifying the existing hook/page integration seam over introducing another runtime state manager or global store.

## Testing Decisions

- The primary test seam is the public Reader lifecycle integration boundary where progress and session hooks are composed with browser, socket and API adapters.
- A good test asserts external behavior: gateway call count and arguments, exposed conflict state, scroll restoration, listener/subscription registration, timer behavior and cleanup. It must not assert effect order, hook internals, private refs or controller implementation details.
- The lifecycle suite will cover opening an authenticated Reader, restoring progress before persistence, capturing scroll once, heartbeat persistence, receiving a conflict, suspending progress, successful and failed takeover behavior, episode replacement, browser termination and unmount cleanup.
- The lifecycle suite will verify that rerendering with the same lifecycle identity does not create duplicate listeners, timers, subscriptions, restore calls or session termination calls.
- The lifecycle suite will verify that replacing episode identity cleans the old lifecycle and prevents stale restore or timer work from affecting the new episode.
- The lifecycle suite will verify the guest/disabled path binds no authenticated progress or session side effects.
- Controller tests created in Ticket 1 are prior art for Reading progress behavior, including stable-layout restoration, current-progress reuse, conflict suspension and stale restore cancellation.
- Controller tests created in Ticket 2 are prior art for Reading session behavior, including payload normalization, takeover and refresh races, targeted logout and idempotent termination.
- Existing Reader hook lifecycle tests are prior art for listener cleanup and conflict-disabled tracking, but Ticket 3 should raise coverage to the combined lifecycle seam instead of multiplying hook-internal mocks.
- Keep focused controller tests for race conditions that would be cumbersome or ambiguous at the integration seam.
- Add a narrow ownership regression check only if it can use the repository's existing tooling without brittle matching of source formatting. Behavioral call-count tests are the primary proof that duplicate paths are gone.
- Run focused Reader tests, the full unit test suite, lint and production build before completing the ticket.

## Out of Scope

- Changing Reading progress calculation, rounding, throttle duration or heartbeat interval.
- Changing Reading session API endpoints, request/response schemas or socket event names.
- Redesigning the conflict modal, navigation controls, Reader layout or content visibility presentation.
- Changing takeover authorization or backend concurrency rules.
- Adding a new global state library, event bus or runtime orchestration framework.
- Refactoring content protection, paragraph tracking, obfuscation, episode fetching, purchase flow or Story features.
- Adding offline progress synchronization, retry queues, telemetry or new product behavior.
- Fixing unrelated lint, test or build failures outside the Reader lifecycle scope.

## Further Notes

- Ticket 3 is deliberately a cleanup and integration-verification ticket. Ticket 1 and Ticket 2 already established the two domain controllers; this ticket should deepen and prove their composition rather than replace them.
- `Reading progress` means the normalized saved position within the active episode. `Reading session` means device ownership and conflict lifecycle for the active book and episode.
- Completion requires both conditions from the original ticket breakdown: no duplicate scroll listener or progress update path, and lifecycle coverage from opening through closing Reader.
- The branch should remain reviewable as an architecture change: avoid unrelated formatting or module moves.
