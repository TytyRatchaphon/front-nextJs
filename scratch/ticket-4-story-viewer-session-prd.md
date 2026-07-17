# Ticket 4: Centralize Story Group Transitions and Cache

**Status:** ready-for-agent
**Blocked by:** None
**Related follow-up:** Ticket 5 - Close Leaked Story Viewer Interfaces

## Problem Statement

Story Viewer currently splits ownership of one viewing session across several layers. Navigation state and item indexes live in the Story store, group-item loading and adjacent prefetch live in a viewer hook backed by React Query, while the Viewer component still coordinates pagination and directly understands API calls, query keys, cached response shapes, and cache replacement. A single transition from one Story group to another therefore crosses multiple owners before the next item becomes authoritative.

This fragmented ownership is especially risky when a user swipes through groups quickly. Requests for A, B, and C can overlap; a response from an older group can arrive after the active group has changed; loading state can describe a different request from the content on screen; and revisiting a group can use a different cache path from the one used for prefetch or refresh. These races can appear to users as a blank frame, the wrong Story, progress resetting, delayed navigation, or a viewer that feels stuck while swiping.

The current boundary also makes behavior difficult to verify. Store tests can prove synchronous index changes, and query tests can prove fetching in isolation, but neither proves that navigation, loading, stale-response protection, cache reuse, adjacent prefetch, pagination, and cleanup work together as one Story viewing session.

Ticket 4 must establish one owner for Story group transitions and read-cache behavior. UI components should express viewing intent and render the resulting state without coordinating asynchronous transitions themselves.

## Solution

Introduce a Story viewer-session module that owns the lifecycle from opening a group through navigating items and groups, loading group items, reusing cached results, prefetching adjacent groups, handling failures, and closing the Viewer.

The viewer session will expose a small behavioral interface for opening, closing, selecting a group, moving to the next or previous item, and moving to the next or previous group. It will expose authoritative active-group, active-item, transition, loading, and error state for the UI. React wiring will connect that interface to Story Bar pagination, React Query, and the existing Story presentation components.

All group-item reads will use one cache-key policy and one fetch path. Every asynchronous result must be associated with the transition that requested it. When navigation changes before a request settles, the stale result may populate its own cache entry but must not replace the active group's items, item index, loading state, or error state.

Adjacent groups will be prefetched through the same read path after the active group becomes authoritative. Prefetch failures will remain isolated from the visible group. A cached adjacent group should be available immediately when the user navigates to it, while stale data may be refreshed according to the shared cache policy without clearing valid visible content.

## User Stories

1. As a Story viewer, I want the group I select to become the authoritative active group, so that the Viewer always shows the Story I chose.
2. As a Story viewer, I want an uncached group to display a stable loading state, so that navigation does not look frozen or broken.
3. As a Story viewer, I want a cached group to open without an unnecessary blank frame, so that revisiting Stories feels immediate.
4. As a Story viewer, I want the selected preview item to remain the starting item after the full group loads, so that opening a group does not jump to a different Story.
5. As a Story viewer, I want next-item navigation to advance within the active group, so that I can watch its Stories in order.
6. As a Story viewer, I want next-item navigation at the end of a group to continue into the next group, so that viewing remains continuous.
7. As a Story viewer, I want previous-item navigation at the beginning of a group to move to the previous group predictably, so that reverse navigation is consistent.
8. As a Story viewer, I want the Viewer to close when I advance past the final available group, so that the end-of-feed behavior remains clear.
9. As a Story viewer, I want rapid A-to-B-to-C swipes to leave C active even when A or B resolves later, so that stale network responses cannot pull me backward.
10. As a Story viewer, I want reversing direction while a transition is loading to honor my latest destination, so that navigation intent is never lost.
11. As a Story viewer, I want repeated requests for the same group to share the same cache path, so that the Viewer does not download identical data unnecessarily.
12. As a Story viewer, I want adjacent groups prefetched after the current group is ready, so that the next swipe is more likely to be instant.
13. As a Story viewer, I want prefetching to avoid changing visible loading state, so that background preparation does not interrupt playback.
14. As a Story viewer, I want an adjacent prefetch failure to leave the active Story usable, so that a speculative request cannot break the current session.
15. As a Story viewer, I want a failed active-group request to expose a recoverable error state, so that I am not left on an indefinite spinner.
16. As a Story viewer, I want retrying a failed active group to preserve my intended group, so that recovery does not restart the whole Viewer.
17. As a Story viewer, I want valid cached content to remain visible during a background refresh, so that stale-while-refresh behavior does not cause flicker.
18. As a Story viewer, I want closing the Viewer to stop pending transitions from changing visible state, so that old work cannot reopen or mutate a closed session.
19. As a Story viewer, I want reopening the Viewer to create a fresh authoritative session, so that requests from a previous opening cannot affect it.
20. As a mobile Story viewer, I want swipe navigation and programmatic navigation to enter the same transition path, so that touch, autoplay, and controls behave consistently.
21. As a desktop Story viewer, I want keyboard, sidebar, and arrow navigation to enter the same transition path, so that every control produces the same result.
22. As a Story viewer, I want autoplay at the end of an item to use the same next-item behavior as a manual action, so that automatic and manual transitions cannot diverge.
23. As a Story viewer, I want newly paginated groups to become navigable without resetting the current group, so that reaching the end of the loaded Story Bar remains seamless.
24. As a Story viewer, I want pagination failure to preserve already loaded groups and the active Story, so that feed expansion cannot break the session.
25. As a Story viewer, I want duplicate groups from paginated Story Bar results ignored consistently, so that navigation indexes remain stable.
26. As a Story viewer, I want the visible group metadata and loaded item count reconciled without changing my active item unexpectedly, so that progress indicators remain accurate.
27. As a Story viewer, I want my mute preference and playback behavior preserved across group transitions, so that this architecture change does not alter existing media controls.
28. As a Story viewer, I want viewed and liked presentation state to remain intact when navigating away and back, so that cache reuse does not visibly undo interactions.
29. As a maintainer, I want one module to own active group and item transition rules, so that navigation behavior can be understood without tracing components, hooks, and store actions separately.
30. As a maintainer, I want one group-item query-key policy, so that fetch, prefetch, revisit, retry, and refresh address compatible cache entries.
31. As a maintainer, I want stale-response protection expressed at the viewer-session boundary, so that UI effects do not need ad hoc request guards.
32. As a maintainer, I want Story UI components to issue intent and render state, so that they do not understand API payloads or asynchronous transition sequencing.
33. As a maintainer, I want transition tests to use observable state and gateway calls, so that internal refactors do not require rewriting the suite.
34. As a maintainer, I want Story Bar pagination to remain a separate feed concern connected through a narrow adapter, so that viewer navigation does not absorb ownership of the entire Story feed.
35. As a maintainer, I want the viewer session to provide a clear extension point for Ticket 5 cache reconciliation, so that interaction and link updates can later stop leaking into UI components.

## Implementation Decisions

- Add a Story viewer-session module as the single owner of active group identity, active item identity, group transition state, item navigation, group navigation, stale-result acceptance, and session cleanup.
- Keep React Query as the group-item cache and request-deduplication mechanism. The viewer session will access it through a narrow cache/read adapter rather than duplicating another long-lived item cache in Zustand.
- Define one query-key factory for group-item reads. Every input that can change the returned group response, including the effective starting reference when applicable, must be represented consistently by fetch, prefetch, revisit, retry, and refresh operations.
- Treat the requested starting item as navigation context. The session must derive and clamp the active item index from the returned items instead of allowing response timing to reset the index implicitly.
- Associate each active load with the session generation and requested group identity. Only the latest active transition may publish visible items, active indexes, loading state, or active errors.
- Older requests may complete and populate their own valid cache entries, but they must not mutate the authoritative active transition.
- Expose explicit session states sufficient to distinguish closed, loading without content, ready, refreshing with content, and failed active load. UI components must not infer transition state from empty item arrays alone.
- Preserve valid visible items while a cached group refreshes. Clear visible items only when the session has no valid content for the newly authoritative group.
- Trigger adjacent prefetch only after the active group transition is accepted. Prefetch the previous and next available groups through the same cache/read adapter and cache policy used by active loads.
- Prefetch is speculative. Its loading and failure states must not replace the active group's state or display a user-facing active-load error.
- Keep Story Bar pagination as a feed responsibility. The viewer session may request additional groups through a narrow pagination capability when navigation approaches the loaded boundary, but it must not own cursor parsing or page flattening.
- Preserve the existing canonical group ordering supplied by Story Bar. Appending or deduplicating pages must not silently remap the active group to another index; active identity should survive list growth.
- Route swipe, keyboard, sidebar, desktop arrow, autoplay, and direct-open intents through the same viewer-session commands.
- Reduce Story store viewer actions to state publication or compatibility adapters as needed during migration. Store actions must not remain a second owner of asynchronous transition rules.
- React Viewer components remain responsible for presentation concerns such as Swiper synchronization, responsive layout, keyboard binding, body scroll locking, controls, modals, and rendering playback state.
- Story media playback remains owned by the player boundary. Ticket 4 coordinates which item is active but does not reimplement HLS/DASH loading, autoplay policy, buffering, or mute preference.
- Preserve Story API endpoints, request parameters, response contracts, group ordering, visual presentation, navigation controls, and cache freshness duration unless a correctness requirement forces an explicitly documented adjustment.
- Do not move link refresh, view tracking, like mutation, playback-link refresh, or mutation cache reconciliation into this ticket. Ticket 4 must leave a narrow viewer-session/cache integration point for Ticket 5 to close those interfaces.
- Remove direct transition-fetch and adjacent-prefetch orchestration from UI components and redundant effects only after the viewer-session path represents their behavior.
- Closing or replacing a viewer session must cancel requests when supported and always make unresolved results non-authoritative.
- Avoid adding a new global state library or event bus. Use the existing Zustand, React Query, and hook boundaries with clearer ownership.

## Testing Decisions

- The primary test seam is the public Story viewer-session boundary with fake group-item gateway, cache, and feed-pagination adapters. This seam must exercise navigation and asynchronous completion together without rendering the full visual Viewer.
- A good test asserts observable behavior: active group and item, transition status, visible items, errors, cache/read calls, prefetch calls, pagination requests, and ignored stale completions. It must not assert private refs, effect ordering, internal promise layout, or specific Zustand setter calls.
- Add a behavioral test for opening an uncached group and publishing its requested starting item after the response settles.
- Add a behavioral test for opening a cached group without clearing valid visible content.
- Add a rapid A-to-B-to-C race test in which responses resolve out of order and only C may become visible.
- Add a reverse-navigation race test in which the latest destination remains authoritative.
- Add tests for next and previous item navigation within a group and across group boundaries.
- Add a test for advancing beyond the last available group and closing the Viewer.
- Add tests proving that accepted active loads prefetch available adjacent groups through the same key and fetch policy.
- Add a test proving that adjacent prefetch completion or failure cannot change active loading, content, or error state.
- Add tests for active-load failure, retry, cached-content refresh failure, and recovery.
- Add a test proving that closing and reopening the Viewer prevents the prior session's pending result from mutating the new session.
- Add a test proving that appended Story Bar pages preserve active identity and make new groups navigable.
- Add a test proving that near-boundary navigation requests the next Story Bar page at most once while a page request is already in flight.
- Add a test proving that duplicate paginated groups do not produce duplicate navigation entries.
- Add a narrow React integration test for the adapter that binds viewer-session state to the existing Story store and React Query cache. Assert behavior at the hook's public result and commands, not individual effects.
- Existing Story store tests are prior art for persistent viewer-level preferences across group transitions. Keep them focused on synchronous store behavior rather than expanding them into asynchronous session tests.
- Existing player stale-callback guards are prior art for protecting active media identity. Ticket 4 applies the same behavioral principle at group-transition scope.
- Run focused Story tests, the full unit test suite, lint, and production build before completing the ticket. Document unrelated baseline failures rather than broadening this ticket to repair them.

## Out of Scope

- Changing Story API endpoints, authentication, request payloads, response schemas, or backend ordering rules.
- Redesigning Story Viewer, Story Bar, sidebar, progress bars, controls, loading visuals, or responsive layout.
- Changing swipe physics, Swiper configuration, animation duration, autoplay timing, buffering behavior, or media-player implementation.
- Changing mute persistence, browser autoplay policy, HLS/DASH selection, playback URL refresh rules, or video error recovery.
- Refactoring Story view tracking, impressions, likes, comments, CTA links, link-management refresh, or interaction mutation reconciliation; these belong to Ticket 5 where applicable.
- Refactoring Story upload validation, processing status, polling, or socket lifecycle; these belong to Tickets 6 and 7.
- Changing Story Bar ranking, audience selection, section semantics, page size, cursor contract, or product-level deduplication rules.
- Adding offline Story caching, persistent browser storage, service workers, analytics, or new telemetry.
- Introducing a new global store, event bus, or state-machine dependency.
- Fixing unrelated tests, lint errors, or build failures outside the Story viewer-session scope.

## Further Notes

- `Story group` means one ordered collection identified by its group type and group ID. `Story item` means one playable entry within that group. `Story viewer session` means the authoritative lifecycle from opening the Viewer until it closes or is replaced.
- Ticket 4 is independent of the completed Reading lifecycle tickets. It begins the Story viewer architecture track from the original review.
- Completion requires all four outcomes from the original ticket breakdown: navigation ownership, explicit loading behavior, stale-response protection, and adjacent prefetch behind one viewer-session module.
- Ticket 5 should build on this boundary to move link refresh, view tracking, and mutation cache reconciliation out of Story UI components. Ticket 4 should not preempt that work, but it must avoid creating another cache interface that Ticket 5 would immediately need to remove.
- The implementation should remain reviewable as an ownership refactor. Avoid unrelated visual changes, formatting churn, or Story upload work.
- This specification is stored locally because issue-tracker publication was previously deferred.
