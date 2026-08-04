# Design QA

source visual truth path:

- `C:\Users\Ayush Maurya\Downloads\Screenshot 2026-08-04 190250.png`
- `C:\Users\Ayush Maurya\Downloads\Screenshot 2026-08-04 190347.png`

implementation screenshot path:

- Not available for the `/threads/` state. The local browser rendered the app's unauthenticated login redirect at `http://127.0.0.1:4173/login/matrix.iiit.ac.in`.

viewport:

- Source: 690 × 914 px.
- Implementation target: not captured because the authenticated route was unavailable.

source and implementation pixel dimensions, CSS size, and density normalization used:

- Source screenshots were inspected at their native 690 × 914 px size.
- No valid implementation capture exists, so no density normalization or pixel comparison was performed.

state:

- Intended: Threads tab showing created Matrix thread roots.
- Observed locally: unauthenticated login screen after requesting `/threads/`.

full-view comparison evidence:

- Blocked. The source shows the authenticated feed, while the local implementation could only render the login route.

focused region comparison evidence:

- Blocked for the same reason; the thread rail item, search control, and cards were not reachable in the local browser session.

**Findings**

- [P0] Authenticated visual verification blocked.
  Location: local preview `/threads/`.
  Evidence: the route redirected to `/login/matrix.iiit.ac.in` before the new screen could render.
  Impact: rendered layout, card density, and authenticated interactions could not be compared against the supplied screenshots.
  Fix: sign in to the local preview, reload `/threads/`, capture the authenticated state, and rerun this QA pass.

**Open Questions**

- The screenshots show multiple authors, so the implementation lists all discovered thread roots in joined rooms rather than only roots authored by the current user.

**Implementation Checklist**

- Verify the Threads rail tab is visible and selected at `/threads/`.
- Verify the feed contains thread roots only, excludes ordinary messages/replies, and opens the source room when a card is clicked.
- Verify search filters by room name and thread body.
- Verify the empty state when no joined room has a thread.

**Comparison History**

- Initial source inspection completed at native dimensions.
- Authenticated implementation comparison was not started because the preview redirected to login.

final result: blocked
