# Japanese JavaScript Quest — Product Rules

This document is the functional and business source of truth for the local Japanese JavaScript learning campaign under `app/assets/japanese-js-quest`.

## Product scope

- The product is an original, local, browser-based CodeCombat-style campaign.
- It must not copy or depend on official or Premium CodeCombat level content.
- It must run from the static campaign directory with `py -m http.server 8000` or `python -m http.server 8000`.
- The primary learner is a Japanese elementary-school child. Explanations must be understandable without prior English reading ability.
- The current application version is displayed discreetly at the very bottom of the page and is read from one canonical version value.

## Campaign and persistence

- The current campaign contains 35 missions numbered 00 through 34.
- Missions unlock linearly unless admin mode explicitly unlocks them for the current loaded page.
- Completion state and edited code are stored in browser `localStorage`.
- Normal mission access is derived from the consecutive completed mission prefix: mission 00 is initially available, and each following mission becomes available only after every preceding mission has been completed.
- A persisted `unlocked` value is never authoritative by itself. Before the application starts, it is normalized from the completed mission prefix so a stale or admin-inflated value cannot expose later missions.
- Normalization preserves valid completed mission IDs, including later missions completed during admin verification, but those later completions do not unlock gaps in the normal linear path.
- Wizard level is never stored as a separate mutable value. It is derived deterministically from scripted mission rewards.
- Resetting progress removes completion and saved mission code after confirmation.
- Resetting one mission's code requires confirmation and restores that mission's current canonical starter code.
- A legacy saved starter may be migrated only when it exactly matches the replaced canonical starter; personally edited code must not be overwritten automatically.
- When missions are inserted and later missions are renumbered, saved code, completed mission identifiers and the unlocked position must be migrated so that existing learner work remains attached to the same lesson.
- The first reinforcement-pack migration inserts missions 02–06 and shifts every previously existing mission from old ID 02 onward by five positions. Old mission 02 therefore becomes mission 07 and old mission 22 becomes mission 27.
- The second reinforcement insertion adds missions 08–09 after mission 07 and shifts the then-existing missions 08–27 to 10–29.
- The third reinforcement insertion adds missions 12–13 after mission 11 and shifts the then-existing missions 12–29 to 14–31.
- The fourth reinforcement insertion adds missions 17–19 after mission 16 and shifts the then-existing missions 17–31 to 20–34.

## First-launch story introduction

- On the first launch, before MISSION 00 is shown, the learner receives a blocking, full-screen, centered seven-page story introduction.
- The introduction welcomes the learner as an apprentice god of `JavaScript Fantasy Land`.
- It explains that an apprentice god can use programming magic to influence the world and help heroes accomplish their destiny, but cannot do anything arbitrarily: magic has rules, and learning those rules little by little allows the learner to influence more of the world.
- The hero backstory is presented as a legend using different narrative typography from the surrounding introduction.
- The legend says that there was once a beautiful, curious and courageous young girl who loved dancing, climbing trees and making small things for her father.
- A witch jealous of the girl's youth curses her and transforms her into an old man.
- Rather than abandon hope, the girl decides to learn magic while appearing to be an adult and no longer being recognized, so she can recover her normal appearance and stop the witch from hurting other people.
- After the legend, page 6 returns to the normal introduction typography, asks the apprentice god to help the `hero` recover her original appearance, and explains that JavaScript programming magic can guide the hero's actions.
- Page 7 contains the final invitation to cast the first spell in MISSION 00.
- Every introduction page has exactly one numbered high-quality PNG illustration asset, `story-intro-page-1.png` through `story-intro-page-7.png`, and the displayed image is associated with the matching page number.
- The introduction loads those PNG files directly; obsolete WebP copies and SVG wrappers are not part of the active story asset set.
- The introduction layout keeps the illustration and text readable together by reducing image and typography sizes responsively when the viewport is shorter or narrower.
- Pages 2 through 7 provide a previous-page control; page 1 does not expose a back action because there is no earlier page.
- Intermediate pages use a centered `次へ` action. The final page uses `冒険をはじめる`, and only then reveals the normal campaign interface beginning with MISSION 00.
- The underlying campaign must not flash visibly or become interactable before the first-launch introduction is resolved.
- Completion of the introduction is persisted separately from mission progress under the dedicated `japanese-js-quest-story-intro-seen-v1` key. The key is written only after the final page is completed.
- Reloading before the final page restarts the introduction cleanly. Once completed, the introduction is not shown again on ordinary launches, including page reloads and later local-server restarts.
- Resetting mission progress does not reset the first-launch story flag; the introduction remains a one-time onboarding experience.
- After the campaign is visible, a discreet `物語をもう一度` control lets the learner replay the introduction on demand from MISSION 00.
- Replaying the introduction is view-only: it does not clear or rewrite the first-launch story flag and does not alter mission progress, saved code, unlock state or completion state. Closing the replay at the final page returns to the same campaign state.
- The introduction applies reading assistance with the same light-blue interactive reading-token treatment used by the adventure for words above the expected early-elementary reading level.
- The introduction explicitly provides readings for `見習い`（みならい）, `魔法`（まほう）, `運命`（うんめい）, `好奇心`（こうきしん）, `踊る`（おどる）, `魔女`（まじょ）, `恐ろしい`（おそろしい）, `呪い`（のろい）, `姿`（すがた）, `希望`（きぼう）, `捨て`（すて）, `傷つけ`（きずつけ）, `冒険`（ぼうけん）, `導く`（みちびく） and `手伝おう`（てつだおう） wherever those words appear in the story.
- The tooltip target is `姿` itself, not the longer text `姿なら`.
- The Latin technical word `hero` is highlighted as a reading token and its tooltip gives both its hiragana pronunciation and meaning: `ひーろー → 主人公（しゅじんこう）`.

## Mission types and reinforcement architecture

- Every mission has exactly one canonical mission type with a stable code, Japanese label and emoji.
- The five mission types are:
  - `concept` — 💡 — a mission that introduces a genuinely new JavaScript concept and therefore owns concept cards;
  - `adventure` — 🗺️ — a unique practice adventure using only concepts already introduced;
  - `typo-fix` — 🔧 — a debugging mission whose starter is almost the correct solution but contains one or more typographical/syntax mistakes;
  - `logic-fix` — 🧩 — a debugging mission whose starter is syntactically valid and executable but solves the problem incorrectly;
  - `boss` — 🐉 — a culminating challenge that combines already learned programming concepts with distinctive world mechanics.
- All missions that existed before reinforcement packs were introduced are `concept` missions.
- Mission 00 is the exception to reinforcement packs: it is a standalone `concept` mission for discovering the development environment and is not followed by five reinforcement missions.
- Starting with concept mission 01, a complete reinforcement pack follows this canonical order: `concept → adventure → typo-fix → logic-fix → adventure → boss`.
- The first implemented pack is missions 01–06: mission 01 remains the unchanged concept mission, followed by missions 02 adventure, 03 typo-fix, 04 logic-fix, 05 adventure and 06 boss. The next concept mission is mission 07.
- Reinforcement can be introduced incrementally after later concept missions. Partial packs keep the requested mission types and ordering without inventing unrequested missions merely to fill the six-mission pattern.
- Non-concept missions normally use only concepts already introduced by an earlier `concept` mission and must not silently teach new syntax, operators or language rules through practice alone.
- Mission 03 is an explicit debugging exception: it exposes `hero.transform("frog")` only as the correct spelling target for a typo-fix exercise before the formal transformation concept mission. The transformation is not introduced with a concept card in mission 03, and the correct spelling is available through the mission API/hints. Outside an explicitly documented debugging exception, non-concept missions use only previously introduced programming concepts.
- Concept-card validation is a `concept`-mission rule only. `adventure`, `typo-fix`, `logic-fix` and `boss` missions never use concept-card memory to decide whether their editor or execution controls are available.
- Non-concept missions have no `新しい考え方` concept-card section and no concept-card gate. Their editor and execution become available immediately as soon as the mission itself is unlocked.
- Switching from a gated concept mission to any non-concept mission must synchronously remove any stale concept-card pending UI state and re-enable the editor/run controls.
- An `adventure` mission must be a new scenario rather than a copy of an earlier field. It reinforces learned commands through different layouts, routes, objectives or world interactions.
- A `typo-fix` starter begins from the intended solution and deliberately introduces a small number of typos or a small syntax defect. A typo is explained to the learner as a one-character input mistake; even one wrong character can prevent code from working.
- Early typo-fix missions use obvious single-character problems such as a mismatched bracket, transposed letters in a known word, or a comma where a dot belongs.
- Typo difficulty increases gradually over the campaign. Later missions may use visually similar ASCII and Japanese/full-width characters, such as `(` versus `（`, `)` versus `）`, or other punctuation that looks close but is not valid JavaScript.
- Typo-fix hints may explain that English/ASCII and Japanese/full-width characters can look similar without directly revealing the exact broken character.
- A `logic-fix` starter must compile and run. Its failure comes from reasoning, ordering, direction, branch choice or another semantic mistake, not from invalid syntax.
- Debugging missions must be unique missions built from previously learned material, not recycled concept missions with an arbitrary error inserted.
- A `boss` mission may introduce new world mechanics without treating those mechanics as new JavaScript concepts. The programming solution must still respect the concepts that the learner is expected to know at that point, except for an explicitly documented debugging exception such as mission 03.
- Boss missions normally cannot complete until the boss has been explicitly resolved by defeating, capturing, trapping or otherwise neutralizing it, or until an explicit defensive mechanism required by that boss has been activated.
- Mission 06, MISSION 09 and MISSION 13 are approved escape-boss exercises: their objective is to avoid the dragon, collect the required gem and reach the goal while the dragon remains alive. For MISSION 06 in particular, the dragon must remain alive on success.
- A dragon has a default attack range of three tiles in the four cardinal directions. If the hero is on the same row or column and enters one of those three tiles while visible to the dragon, the dragon breathes fire in that direction and the run fails.
- An active dragon ray displays one flame per reachable attack tile from the dragon toward the hero. If the ray reaches the hero, the hero tile first displays a flame and then the hero becomes a skeleton to show that the fire defeated the hero.
- Dragon line of sight is blocked by impassable world geometry such as a wall, pillar or statue. A dragon does not attack through those blockers.
- A tile occupied by a creature is always impassable to the hero. This remains true even when that creature is sleeping, disabled, magically prevented from attacking, or otherwise unable to damage the hero.
- Boss and adventure world mechanics are reusable building blocks. Supported examples include a dragon fire lane blocked by a pillar or statue, a lever that defeats/traps a boss or raises a defensive statue, water, lily pads that only the frog form can cross, and a goal door that only the human hero form can use.
- A lever may impose a form requirement. When a boss scenario specifies a human-only lever, frog form can stand on the lever tile but cannot activate it; the world must explain that the hero needs to return to human form.
- New world mechanics must communicate failure or blocking visually and through understandable speech where practical. For dragon fire, the visible execution stops on the hit tile, flames propagate from the dragon across every reachable fire tile, the flame visibly reaches the hero, and the hero then becomes a skeleton.
- A defeated visual for a boss such as a skull is shown only after an explicit boss-neutralization event. A failed run, an ordinary goal arrival, an escape objective or the activation of a defensive statue must never implicitly mark a living boss as defeated. A hero skeleton caused by lethal damage is a separate hero-death visual and does not mean the boss was defeated.
- Defeating a boss does not require elaborate combat animation; activating a trap/lever may make the boss disappear or leave a simple defeated marker such as a skull.
- The mission type appears in the opened mission near its mission number with the type emoji and label.
- The sidebar keeps mission-type differences lightweight: non-concept types receive a subtle visual distinction rather than repeating large emojis in every row.

## Focused sidebar navigation

- The normal sidebar deliberately does not show the entire campaign, to avoid an intimidating tunnel effect and to preserve discovery.
- Mission 00 is always visible and never disappears from the sidebar.
- Every mission already completed remains visible permanently, even when it belongs to an older concept segment or was completed non-contiguously during admin review.
- Before mission 00 is completed, the sidebar shows only mission 00 and mission 01, even though mission 01 is still locked.
- After mission 00, the sidebar shows all completed history plus the unfinished missions in the current concept segment through the next concept mission boundary.
- For the first pack, once mission 00 is completed, the sidebar therefore shows missions 00 through 07; mission 00 stays visible together with missions 01–06 and the locked boundary mission 07.
- While progressing through missions 01–06, already completed missions in that segment remain visible and the visible unfinished frontier still ends at mission 07.
- After the boss of a reinforcement segment is completed, all completed history stays visible while the unfinished frontier advances to the newly current concept segment and through its next concept boundary.
- The next concept mission is visible as the boundary of the current segment even while it is locked.
- Only unfinished missions after that next concept boundary are hidden.
- Hidden missions remain part of normal linear progression; sidebar hiding changes presentation only, not completion or unlock semantics.
- The sidebar progress count reflects the currently visible missions rather than advertising the full remaining campaign length.
- In admin mode, clicking the existing unlock-all control both unlocks and displays every mission in the complete campaign for review.

## Controls and learner assistance

- The editor visibly reminds the learner of `Ctrl+C`, `Ctrl+V`, `Ctrl+Z` and `Ctrl+F5`.
- `Ctrl+Enter` and `Command+Enter` execute the mission with the same behavior as clicking `実行する`.
- `Ctrl+F5` is identified as the full-page reload shortcut used by the intentional infinite-loop lesson.
- The `フィールド` panel and the `JavaScript editor` panel both display an execution button. They are two controls for one canonical execution action: both invoke the same `runCurrentCode` execution handler rather than maintaining separate execution implementations or routing one button through a synthetic click on the other.
- The two execution controls always represent the same state. Disabled state, visibility, accessible state, title and temporary labels such as infinite-loop preparation are mirrored from the editor-side run control to the field-side control.
- Only the execution button is duplicated in the field panel. Code reset, hints and admin answer controls remain only with the JavaScript editor controls.
- The field-side execution button has clear vertical spacing after the field legend and remains available in responsive layouts where the field and editor panels stack vertically, so the learner can inspect the field and run the same program without scrolling back to the editor controls.
- Mission code is saved automatically in the browser.
- Hints can be revealed progressively.
- The next-mission button appears only after the current mission succeeds on every field, except for the intentional infinite-loop demonstration described below.

## Final answers and learner partial help

- The final reference solution is available only in admin mode through a button labelled `答えを見る`.
- The admin final-answer button is enabled immediately for every selected mission; it does not require failed attempts.
- Displaying the final answer in admin mode requires no confirmation dialog and must not persist the final answer into the learner's saved mission code.
- A normal player must never be shown or receive the final reference solution through the interface.
- Normal-player help counts failed executions, not total executions. A successful execution does not increase the failure count.
- After three failed executions of the same mission, the player may open a near-complete partial solution through a button that is not labelled `答えを見る`.
- Showing the learner partial solution requires confirmation because it replaces the current editor content.
- The learner partial solution contains explanatory comments, important hints and a visible `TODO`, but omits at least one instruction required to solve the mission.
- Every generated learner partial solution must remain incomplete: it must differ from the final solution and fail at least one field of every finite mission.
- The learner partial solution may be saved as the learner's current code after confirmation.

## Mission pedagogy

- Every genuinely new programming concept must be introduced in a `concept` mission's `新しい考え方` section before the learner is expected to understand and apply it as a concept; explicitly documented debugging drills may expose a command as an opaque typo target without teaching its semantics.
- Mission 00 contains exactly one executable line: `hero.say("Hello goddess!");`.
- All learner-facing starter code, reference solutions, partial solutions and code examples use double-quoted string literals. Single-quoted strings are not introduced at this stage.
- Mission 00 explains object, method, dot access, parameters, string literals and the difference between program words and quoted text in the hero's world.
- Mission 01 introduces JavaScript as the programming language used to communicate instructions to the computer and the editor as the place where code is read, written and changed.
- Mission 01 introduces code comments. Text after `//` is explained as a human-readable note that is not executed.
- Mission 01 explicitly tells the learner that the hero must reach the glowing goal tile to clear the mission.
- Mission 01 displays four canonical cards in this exact order: `JavaScript`, `Editor`, `// はコメント（Comment）`, then `hero.move(direction)`.
- The `hero.move(direction)` card explains that one method call moves the hero one tile in the requested direction and that moving several tiles requires calling the method several times.
- Missions 02–06 are reinforcement missions for mission 01 and introduce no new concept cards. Mission 03's transformation call is a spelling/debugging target only; the formal transformation concept remains later.
- Mission 10 introduces booleans, `true`, `false`, `const`, assignment with `=`, reuse of a named value, constant naming in romaji, the common use of meaningful English names, and `hero.isTrue(boolean)`.
- Mission 10 has completed starter code. The learner validates it by executing it without needing to edit it.
- Mission 10 includes a Japanese explanatory comment directly above `const alwaysTrue = true;` and another directly above `const alwaysFalse = false;`.
- Mission 10 collects its gem and then continues to the flag. Successful execution must finish on the goal tile rather than on the gem tile.
- Mission 11 is the first `if` concept mission. It introduces `hero.readSign()`, return values, `if`, braces and comparison, while referring back to constants and assignment learned in mission 10.
- Mission 11 must not repeat dedicated concept cards for `const`, constants or assignment. Its learning guide contains one card for the `hero.readSign()` return value, one card for `if`, and one card for comparison with `===`.
- Missions 14, 15 and 16 remain concept missions. Mission 14 reinforces `if / else` with `hero.look(...)`, mission 15 introduces `&&`, and mission 16 introduces `||`.
- Mission 23 is titled `初めてのループ`, using the standard kanji spelling rather than `はじめてのループ`.
- Mission 26 is an intentional infinite-loop demonstration using `while (true)`.
- Mission 27 is the first later mission using `while (!hero.isAtGoal())`.
- Later concept missions introduce `else if`, loops, mutable variables, remainder and nested loops when first used.
- Branch starter code in relevant concept missions contains Japanese `hero.say(...)` thinking prompts inside each branch. `else` prompts begin with `その他` rather than pretending to have a named condition.

## First reinforcement pack after mission 01

- Mission 02 is an `adventure` mission that practices repeated `hero.move("right")` calls on a new corridor layout.
- Mission 03 is a `typo-fix` mission. Its mission text explains that a typo is a one-character input mistake, explicitly says that even one wrong character can stop code from working, and tells the learner that there are two typos to repair.
- Mission 03 contains exactly the two intended early typos in its starter: the closing `)` of one `hero.move("right")` call is replaced by `]`, and `hero.transform("frog")` is misspelled as `hero.transform("forg")`.
- Mission 03 validates only after both typos are repaired: the code must execute, collect the gem, reach the goal and finish in frog form. Deleting the transformation line is not a valid workaround.
- Mission 04 is a `logic-fix` mission whose code executes but initially walks in the wrong order and reaches the route without collecting the required gem.
- Mission 05 is a second `adventure` mission that requires travelling to a gem and then reversing direction to return to the goal.
- Mission 06 is the introductory `boss` escape mission. Its active field is a single horizontal corridor with walls above and below, the dragon on the left, the hero exactly five tiles away from the dragon, a gem on the route and the goal on the right.
- Mission 06's canonical starter contains three leftward moves so the unmodified program deliberately approaches the dragon. The first leftward move leaves the hero four tiles away and is safe; the second leftward move places the hero three tiles away, triggers the three-tile fire ray, kills the hero and stops JavaScript execution before the third move can execute.
- When mission 06 triggers dragon fire, exactly three flames appear on the reachable tiles from the dragon, with the third flame landing on the hero tile. The hero becomes a skeleton on that burning tile while the dragon remains alive.
- The safe mission-06 solution uses only horizontal movement: moving right four times collects the gem and reaches the goal without entering the dragon's attack range.
- Mission 06 has no active pillar, lever or boss-defeat mechanism. Completing it leaves the dragon alive. Failing by dragon fire changes only the hero into a skeleton; it must not display the dragon as defeated or as a skull.
- The previously designed dragon/pillar/lever field is retained in the mission-pack reference data for future boss reuse, but it is not the active mission 06 field.
- Mission 06 is the introductory escape-boss exception to the normal boss-resolution rule.

## Reinforcement after mission 07 and mission 11

- MISSION 08 is a `typo-fix` mission following mission 07. Its route is already correct except for the single transposed direction `dwon`, which must be repaired to `down`.
- MISSION 09 is a two-dimensional dragon escape boss following mission 07. Its safe reference route takes exactly 21 moves, and the mission enforces and displays a maximum of 21 moves (`21 moves`). The hero must collect its gem and reach the goal without entering dragon fire.
- MISSION 11 is the first `if` concept mission after the second insertion.
- MISSION 12 is a simple `logic-fix` reinforcement of MISSION 11. The starter code is valid JavaScript and uses `hero.readSign()` plus `if`, but the movement inside the `right` and `left` branches is reversed. The same corrected code must pass both a `right` and a `left` field.
- MISSION 13 is a two-field conditional dragon boss reinforcing the `if` concept from MISSION 11. Both fields use the same code and the same dragon position; the sign tells the learner which protected side to choose.
- In the `看板：right` field, a pillar is two tiles to the right of the dragon with one empty tile between them. The pillar blocks the rightward fire ray, so the hero must first move to the right side and then travel from bottom to top outside that pillar.
- In the `看板：left` field, the symmetric pillar is two tiles to the left of the dragon with one empty tile between them. The pillar blocks the leftward fire ray, so the hero must first move to the left side and then travel from bottom to top outside that pillar.
- Choosing the unprotected side in either MISSION 13 field brings the hero into a three-tile horizontal dragon ray and causes the existing flame-and-skeleton death sequence.
- The intended MISSION 13 route is ten moves in either field: three horizontal moves to the protected side and seven upward moves through the protected column, collecting the gem immediately before the goal. The mission displays and enforces a ten-move maximum so the sign and `if` branch cannot be bypassed by an unnecessarily wide detour.
- MISSION 12 and MISSION 13 introduce no new concept cards. Existing concept-card mappings after MISSION 11 move with their concept missions when later mission IDs shift.

## Reinforcement after mission 16

- MISSION 17 is a syntax-repair `typo-fix` mission using only already introduced `if`, `else`, comparison and `hero.readSign()`. Its starter deliberately omits the closing `}` before `else`, so the code has a JavaScript syntax error until the learner repairs the `if / else` structure. The same corrected code must pass both `up` and `right` fields.
- MISSION 18 is the single-field `adventure` mission `スイレンの川`. The hero starts on the lower river bank, the river occupies the width of the field, a vertical path of lily pads crosses it, and the goal is represented by a door on the upper bank rather than a flag.
- The MISSION 18 field must make the geography immediately visible: ordinary bank/floor tiles appear above and below the river, water tiles have a clearly blue water treatment, lily-pad tiles are visibly rendered as lily pads on water, and the upper-bank goal tile visibly renders a door.
- Water tiles are impassable. A lily-pad tile is passable only in frog form. If the human hero tries to step onto a lily pad, the move is refused and a blocking speech bubble explains that the hero cannot swim, is too heavy for the lily pad, and that the pad looks strong enough for a small animal.
- Lily pads are represented by the broadly supported green-leaf emoji `🍃`, rendered large enough to occupy roughly thirty percent of a field tile so the crossing remains clearly visible on systems that do not display the lotus emoji.
- The first MISSION 18 hint suggests changing to a smaller form. A later hint explicitly tells the learner to use `hero.transform("frog")` to cross the lily pads.
- The MISSION 18 goal door is usable only in the human hero form. If the frog tries to enter it, the move is refused and a speech bubble explains that the frog cannot use the door handle. A later hint explicitly tells the learner to use `hero.transform("hero")` before entering the door.
- The MISSION 18 reference solution approaches the river, transforms to frog, crosses the lily pads, collects the gem on the upper bank, transforms back to the human hero, and enters the goal door in six moves.
- MISSION 19 is the two-field boss `カエルと守りのドラゴン`. It combines the JavaScript concepts learned through MISSION 16: named values, comparisons and booleans, `if / else`, `||`, `&&`, sign reading, movement and frog/human transformations.
- Both MISSION 19 fields use the same source program. The sign chooses the left or right lily-pad crossing; the side statue, lever and gem are mirrored between the two fields while the dragon, top goal and central defensive-statue position stay fixed.
- The playable middle column is, from top to bottom: the goal on the top field row; one normal floor tile; one initially empty floor tile reserved for the defensive statue; the dragon; four consecutive water tiles; the hero's starting floor tile; then the bottom wall.
- The top goal has one impassable statue immediately on its left and one immediately on its right. Consequently the hero cannot enter the goal from either side and must approach it from the normal floor tile directly below it.
- The row directly below the dragon is part of the four-row river. Each river row uses the same pattern across the eleven playable columns: water, water, lily pad, water, water, water, water, water, lily pad, water, water. The chosen lily path therefore must be crossed in frog form.
- The intended MISSION 19 program uses `side === "left" || side === "west"` to derive the left-side boolean, combines it with another condition using `&&`, and uses `if / else` to move three cells to the sign-selected river crossing. It then transforms into a frog and moves upward five times: across four lily-pad river rows and onto the upper-bank row beside the dragon.
- A static statue on the sign-selected side blocks the dragon's horizontal fire while the frog reaches the upper bank. Choosing the opposite side enters the dragon's three-tile horizontal fire ray and fails.
- The lever is on the selected side one row above the dragon. Only the human/mage form can activate it. If frog form steps onto the lever, the lever remains inactive and a speech bubble explains that the hero must return to human form.
- Activating the lever does not defeat or remove the dragon. It raises a new impassable statue on the central floor tile immediately above the dragon. The new statue is part of the authoritative field state, is rendered visibly, blocks movement, and blocks the dragon's upward fire ray.
- Without the raised central statue, approaching the central top corridor or goal from above the dragon enters the dragon's upward three-tile fire ray and burns the hero. With the statue raised, the hero can move one row above it, return horizontally to the middle column and then enter the goal from below while the dragon remains alive.
- The gem is placed on that post-lever route to the central corridor. The MISSION 19 reference route takes exactly fourteen moves in either field, raises the protective statue, collects the gem and reaches the goal without defeating the dragon.
- MISSION 17, 18 and 19 introduce no new concept cards. Concept-card guides for the formerly current MISSION 17 and later concepts shift by three IDs together with their missions.

## Concept card reference base

- Every genuinely new programming concept is introduced through a dedicated card displayed in the concept mission's `新しい考え方` section.
- Each concept card is stored exactly once in the canonical concept-card reference base and has a stable, unique ID.
- A mission guide stores its title and the ordered IDs of the cards it displays; it must not duplicate the card title or explanation outside the reference base.
- The adventure renders the visible card title, explanatory HTML, code styling and explanatory tooltips by resolving those IDs from the reference base.
- Every rendered card exposes its source ID through `data-concept-card-id` so later learning tools can connect visible content to the same canonical record.
- Concept-card IDs must never be reassigned to a different meaning or silently reused after publication.
- Future flashcards, quizzes and review activities must reuse the same reference records rather than copying card content into a second data source.
- Refactoring storage or rendering must preserve the approved visual appearance, code markup, tooltip behavior and mission card order.
- The mission 10 naming card explains that constants can receive meaningful romaji names without spaces, that English names are commonly used, and that `alwaysTrue` means “always true”.
- A new-concept card must never be implemented only as ad-hoc mission HTML or an interface-only exception. It must be a record in the canonical concept-card database and be referenced by stable ID from its mission guide.
- Every canonical concept card must be referenced by exactly one concept mission guide, and every mission-guide card ID must resolve to a card whose `missionId` matches that mission.
- Non-concept missions must not be given artificial concept cards merely to satisfy the card system.
- No terminology enhancer or other post-render script may append a second visual concept block outside the canonical card database and card-memory lifecycle.

## Concept-card validation and memory

- Every concept card starts face down until that card has been validated by the learner.
- This face-down default applies to every card without exception, including `// はコメント（Comment）` and cards introduced by future concept missions.
- The learner may reveal the unvalidated cards in any order.
- Only one unvalidated card may remain previewed at a time. Revealing another card or clicking outside the cards hides the previous preview again.
- A previewed card displays its complete canonical title, HTML explanation, code formatting and tooltips, plus a visible mini-quiz action.
- A previewed unvalidated card uses a background that is only slightly different from the normal card background.
- Every card has canonical quiz data associated with the same stable card ID.
- A card quiz contains between one and three very simple multiple-choice questions, using three or four choices per question.
- The questions must be answerable directly from the card and primarily verify that the explanation was read and understood.
- Wrong choices may include one plausible trap, while the remaining wrong choices should be clearly incorrect for a child learner.
- A quiz submission validates the card only when every question is answered correctly.
- An incorrect or incomplete submission does not reveal the correct answer. It reports only that at least one answer is wrong and invites the learner to read the card and retry.
- Closing a quiz without validating the card leaves that card unvalidated and returns it to the face-down state.
- A validated card remains face up with the previously approved normal card background and displays a success icon.
- Validated card IDs are persisted separately from mission completion and saved code, under a dedicated concept-memory storage key.
- The concept-memory record stores stable card IDs rather than mission-number persistence.
- A concept mission shows the number of validated cards and the total number of cards.
- The learner cannot open the editable code view or execute a concept mission until every concept card assigned to it has been validated.
- For a `concept` mission that was already mastered, previously validated card IDs immediately satisfy the gate; the learner is never asked to validate the same cards again.
- Every non-concept mission is card-ready by mission type, regardless of concept-card history or any pedagogical association with an earlier concept mission.
- A missing or temporarily unresolved mission must fail open rather than trap the learner behind a card gate; only an explicitly resolved `concept` mission may be card-gated.
- Clicking the colored code preview, either execution button, or the execution keyboard shortcut before all cards of a concept mission are validated redirects attention to the concept cards and explains the requirement in Japanese.
- The execution restriction applies equally to the normal run path and the special infinite-loop preparation path because both visible execution controls share the same execution state and special-run interception rules.
- When all concept cards assigned to a mission become validated, a short celebratory modal appears with a validation or festive icon, says that the mission is unlocked, and asks the learner to finish reading the explanations and scroll down.
- The concept-card completion modal reuses the approved level-up visual language without reusing the level-up stars or power iconography.
- In admin mode, every quiz provides a review-only control that selects all correct choices automatically.
- The admin quiz-review control must not submit the quiz or validate the card by itself; the administrator can inspect the selected choices and submit normally.
- Admin mode also displays an admin-only control at the end of the section that validates every canonical card assigned to the current concept mission in one action.
- The admin validate-all control is absent outside admin mode, persists through the same stable-card-ID memory store, and does not complete the mission or alter mission progression.
- Whenever a mission or concept card is added or changed, the same change must verify the canonical card record, stable mission-to-card mapping, face-down default, quiz data, card-memory validation, and the edit/execution gate for all cards in that mission.

## Boolean lesson and `hero.isTrue`

- A boolean is a value that can only be `true` or `false`.
- `hero.isTrue(boolean)` accepts exactly one JavaScript boolean value.
- Passing `true` makes the hero say `正しいです。`.
- Passing `false` makes the hero say `違いますよ。`.
- A missing, extra or non-boolean parameter produces a blocking Japanese hero explanation that only `true` or `false` is accepted.
- Mission 10 defines `const alwaysTrue = true` and `const alwaysFalse = false`, calls `hero.isTrue(...)` for both values, collects its required gem, and reaches the goal flag with two rightward moves.
- Mission 10 validates only after the existing program has been executed, both boolean cases have been checked, the gem has been collected and the goal has been reached.

## Standalone loading and stable curriculum rendering

- The documented launch from `app/assets/japanese-js-quest` is a standalone static-server mode.
- Standalone mode uses the built-in textarea editor fallback and must not request CodeCombat's absent `/javascripts/ace/ace.js` asset.
- An optional enhanced editor may be used only when its assets are explicitly available; failure to load an optional editor must never block the game or produce a required 404 request.
- Selecting or displaying a mission must not start unbounded work. In particular, selecting any concept or practice mission must remain responsive before the learner intentionally executes code.
- The displayed mission number is authoritative UI state and must never be changed temporarily to render legacy guides.
- A `jsquest:missionloaded` handler must not dispatch another `jsquest:missionloaded` event while handling the current event.
- Renumbered legacy guides, glossary thresholds and technical terms use explicit final-ID/source-concept conversion without changing the DOM.
- Mission execution uses the static `quest-worker.js` worker, which explicitly loads `engine.js`, `curriculum-engine.js` and the boss-mechanics extension.
- The application must not globally replace or monkey-patch the browser's native `Worker` constructor.
- The execution worker must report initialization and execution errors back to the page instead of silently waiting until timeout.
- Concept and reading annotations run a bounded number of times after mission rendering. They must not use a permanent subtree observer that mutates the same observed content.
- Progress access normalization runs synchronously before `app-v3.js`, so the first rendered mission list already reflects normal linear access rather than briefly exposing stale admin access.

## Japanese reading, technical vocabulary and tooltip layering

- Difficult kanji above the expected reading level at the beginning of Japanese third grade receive full-word reading tooltips.
- Difficult kanji and advanced words in mission explanations, concept cards and mini-quizzes must use the same shared reading-help system and expose full-word pronunciation tooltips.
- Adding or changing an explanation, concept card, quiz question or quiz choice requires reviewing and updating difficult-word readings in the same change.
- Reading help in mission explanations, cards and mini-quizzes uses a light-blue visual treatment.
- Reading help inside the glossary uses a quieter gray treatment and must not interfere with existing code-component tooltips.
- `無限` receives the reading `むげん` in the infinite-loop mission title, concept cards, explanations and the duplicated mission heading inside the field panel.
- `値` uses `あたい`, `魔法` uses `まほう`, and `実行` uses `じっこう` wherever those words are annotated.
- `初めて` receives the reading `はじめて` when used in the first loop mission title or explanatory text.
- `プログラミング言語` receives the reading `ぷろぐらみんぐげんご` in its concept card.
- When Japanese programmers commonly use an English technical term, the concept introduction displays both names.
- The English term is written in Latin characters and exposes its katakana pronunciation on hover, keyboard focus and click.
- Examples include JavaScript, Editor, Object, Method, Parameter, String, Literal, Comment, Constant, Assignment, Return value, Conditional branch, Boolean, Variable, Operator, Loop and Infinite loop.
- Every explanatory tooltip is rendered in a shared global tooltip layer mounted directly under `body`, rather than as a pseudo-element inside the triggering container.
- Tooltip triggers keep their normal document stacking level. Only the tooltip layer receives the very high z-index.
- The global tooltip is clamped into the visible viewport and remains positioned above its trigger during scrolling or resizing.
- If an open modal or overlay covers a trigger, that covered trigger cannot activate a tooltip. Tooltips triggered from content inside the active modal remain visible above that modal.

## Reference panel

- `ことば・命令のヘルプ` is collapsed by default.
- Its content grows only with programming concepts and vocabulary introduced by the learner's current source concept mission, not merely with a larger numeric mission ID caused by practice insertion.
- It contains sections for methods, parameters/variables, grammar/operators and map vocabulary.
- English code components can be hovered, focused or clicked to display Japanese meaning and pronunciation.
- `gem` explains that gems give experience, increase wizard level and unlock powers.
- The formal `transform`, `form` and `frog` reference entries remain hidden before concept mission 07. Mission 03 may display the exact `hero.transform("frog")` command as an explicit typo-fix target without unlocking the full transformation reference lesson.
- `boolean`, `true`, `false`, `always`, constants, assignment and `hero.isTrue(boolean)` appear from concept mission 10.
- Water, `lily` and the goal door are added to the map vocabulary when MISSION 18 is first reached; statue vocabulary is added from MISSION 19.
- `while (true)` and the infinite-loop warning appear from concept mission 26.

## Field and editor presentation

- Immediately before the field-progress block, the field panel displays `MISSION XX - mission title`.
- `MISSION XX` uses the same yellow eyebrow style as the main mission card.
- The separator and mission title are white and use normal font weight.
- The JavaScript editor heading contains exactly two full-width rows.
- The first editor-heading row contains only `JavaScript editor` and uses the same heading font previously used by `JavaScript`.
- The second editor-heading row is centered and contains, with the same text size and visual treatment, `Ctrl+Enter で実行`, `Ctrl+C コピー`, `Ctrl+V はりつけ`, `Ctrl+Z もどす` and `Ctrl+F5 再読み込み`.
- The shortcut row stays on one centered line when enough width is available and must wrap onto additional centered lines when the panel becomes narrower.
- Each shortcut item remains internally unbroken, and the shortcut row must never use a horizontal scrollbar.
- The execution shortcut must not be displayed as a separate supporting paragraph beneath the editor title.
- The interface uses the same detailed blue scrollbar theme throughout the game, including the page, mission list, editor, syntax preview, reference panels and mini-quiz dialogs.
- Scrollbar track, thumb, hover color and size are centralized through shared CSS custom properties.
- In Chromium/WebKit, the detailed track, rounded thumb, inset border and hover styling must remain authoritative; standardized scrollbar properties must not override them with a native gray scrollbar.
- Browsers without WebKit scrollbar pseudo-elements use the centralized standard scrollbar colors as a fallback.
- Victory conditions with explicit movement limits appear inside the field-progress block before the progress track.

## Simplified pedagogical syntax preview

- The code area displays a simplified concept-based syntax preview by default whenever the editor is not focused.
- The syntax preview is presentational only and must never modify the learner's stored or executed source code.
- Focusing or activating the editable code area removes the concept colors and returns to the approved uniform editor text color.
- When the editor loses focus, the preview is rebuilt from the latest version of the code and the simplified coloring returns.
- When the learner clicks a specific character or word in the colored preview, the editable editor opens with its cursor placed at the corresponding source-code offset.
- Cursor placement from the preview must work with the standalone textarea editor and remain compatible with Ace.
- The syntax colors are centralized in easy-to-change CSS custom properties rather than repeated as literal colors throughout the implementation.
- Object names and declared constant or variable names use the object/variable color, initially blue.
- `hero` is treated as an object name.
- Names declared with `const`, `let` or `var` use the object/variable color both at declaration and later use.
- Method names following dot access and used as calls use the method color, initially purple.
- Primitive literal values use the literal color, initially red. This includes numbers, `true`, `false`, `null`, `undefined`, `NaN`, `Infinity` and string contents.
- String quote characters remain in the default syntax color while only the contents between the quotes use the literal color.
- Line and block comments use the comment color, initially a gray that remains reasonably close to the normal white text.
- Keywords, operators, punctuation, parentheses, braces, brackets, dots, semicolons, assignment and comparison symbols, logical operators and string quote characters retain the default white syntax color.
- For `const alwaysTrue = true;`, `const`, `=`, and `;` are white, `alwaysTrue` is blue and `true` is red.
- A compact Japanese legend below the code area explains the five categories: object/variable, method, value, comment and grammar/symbol.
- The preview and legend support the standalone textarea editor and remain compatible with Ace if it is available later.

## Action execution

- Every click on either `実行する` control, including Ctrl/Command+Enter through the canonical execution path, starts the adventure from field 1 of the current mission.
- The complete field, hero position, hero form, collected items, statistics and active speech UI are reset before field 1 and before every later field.
- User code is simulated once per field and rendered from the engine trace.
- Movement, transformation, speech and failure speech are rendered in exact source order.
- Each visible action must finish before the next action begins.
- The engine maintains an authoritative `alive` state for the hero. A new hero action may begin only while that state is alive.
- Every hero API action resolves lethal world hazards at action boundaries. Hazards are checked before an action starts and again after an action changes the hero or world state, so later movement methods or future action methods cannot bypass danger resolution.
- When an action kills the hero, the engine sets the hero to dead, records the death cause, emits the lethal trace frame and immediately terminates the learner's JavaScript execution. No later `hero.*` action from the source program may execute or appear in the trace.
- `hero.move(...)` checks blocking world occupancy before changing the hero position. Walls, statues, water, closed doors, form-incompatible lily pads/goal doors and creature-occupied tiles cannot be entered.
- Entering a lethal trap kills the hero and stops the remaining JavaScript execution. Starting another hero action while already standing on a lethal hazard also resolves the hazard before that action can run.
- Dragon-fire danger is resolved by the same action lifecycle rather than by post-processing a fully executed trace. Entering a live dragon ray therefore kills the hero before the next source instruction can execute.
- Dynamic boss geometry such as MISSION 19's raised protective statue becomes part of authoritative field state immediately when its trigger succeeds, so it affects both movement collision and subsequent dragon line-of-sight checks.
- Speech pauses execution until the learner closes the bubble.
- Speech bubbles are attached visually to the hero's position at the corresponding trace frame.
- A refused lily-pad or frog-at-goal-door move emits a normal trace-based hero speech bubble and keeps the hero on the original tile; it is not a lethal failure.
- World-mechanic failure events such as dragon fire terminate the actual action chain, not merely the visible animation.
- When dragon fire is lethal, the fire ray is rendered on every affected tile including the hero tile, and the hero is shown as a skeleton on the burning tile so the player can visually understand what caused the failure.

## Loop victory conditions

- Every mission whose intended solution teaches a loop has canonical loop victory metadata.
- The field panel displays the execution limit as `移動：最大 N 回` when the mission has a maximum movement count and corresponding victory metadata.
- The field panel displays each source-code call limit in Japanese, for example `コードに hero.move(...)：最大 1 回`.
- A source-code call limit counts how many times the learner writes a named `hero` method in source code, not how many times the loop executes it.
- Exceeding a source-code call limit fails the field and produces a Japanese result-console message showing the maximum, the current count and the instruction to place the command inside a loop.
- Loop syntax requirements are evaluated after comments are removed. A commented-out loop keyword does not satisfy a loop requirement.
- Commented-out method calls do not count toward source-code call limits.
- A learner cannot complete a loop mission by writing the repeated movement commands one by one while leaving a loop only in comments or as an unused dummy structure.
- The canonical source-code call limits are stored once in `loop-rules.js` and are attached to renumbered concept missions through their source concept identity rather than raw displayed ID.

## Speech bubble accessibility

- Speech bubbles are mounted outside the field clipping context.
- They appear above all panels and remain aligned with the hero during scrolling or resizing.
- The close button must always remain reachable. If the viewport would crop the bubble, it is clamped into the visible viewport.
- It is acceptable for a speech bubble to cover surrounding instructions temporarily.

## Methods and understandable errors

- Invalid method parameters must produce a blocking Japanese hero speech bubble before the run is reported as failed.
- Direction-taking methods accept exactly one value: `right`, `left`, `up` or `down`.
- A missing, extra or invalid direction produces a dedicated Japanese explanation that repeats all four accepted values.
- Methods that accept no parameters reject supplied parameters with a Japanese hero explanation.
- `hero.say(message)` requires exactly one string value. Invalid input produces a Japanese hero explanation.
- `hero.isTrue(boolean)` requires exactly one boolean value. Invalid input produces a Japanese hero explanation.
- Unknown or misspelled `hero` methods produce a Japanese hero explanation asking the learner to check the command spelling.
- An invalid transformation name produces a Japanese hero explanation that the requested form is not understood.
- Syntax errors in typo-fix missions are allowed to use the execution/result error output as part of the debugging experience; hints supplement rather than replace that feedback.

## Transformations and levels

- `hero.transform("hero")` and `hero.transform("frog")` require wizard level 1 in the engine.
- `hero.transform("dragon")` is a recognized future hero power requiring wizard level 99.
- A recognized transformation used below its required level makes the hero say `この技はまだ使えないよ。` and leaves the current form unchanged.
- Unknown transformation values are different from locked recognized powers and use the invalid-transformation explanation.
- Frog and hero-dragon forms use original local sprites.
- The enemy dragon introduced by the boss missions is a world creature and is distinct from the future `hero.transform("dragon")` power.
- A power or API must not normally be exposed in a practice mission merely because accumulated gem experience satisfies its technical level gate. Mission 03 is the explicit typo-fix exception for `hero.transform("frog")`; the full learner-facing transformation concept and reference remain reserved for concept mission 07.
- The future hero dragon transformation must not be exposed in normal instructions, glossary or transformation legend before its future concept/story introduction.

## Gems, experience and level progression

- Mission 00 has no required gem and wizard level 0.
- Every mission after mission 00 displays and requires at least one gem.
- A mission cannot validate unless its required gem count is collected in every field.
- Maps without a gem receive one on the reference solution path.
- Wizard level 1 is reached after the first gem.
- Going from wizard level 1 to level 2 requires 20 additional gems, so level 2 begins at 21 accumulated gems in total.
- Going from wizard level 2 to level 3 requires 30 additional gems, so level 3 begins at 51 accumulated gems in total.
- Higher thresholds continue the same increasing-step progression: the next level requires 40 additional gems, so level 4 begins at 91 total gems, then subsequent level costs continue increasing by ten gems per level.
- Reinforcement missions also award their required gems, so wizard XP and every mission's before/after progress are derived from the complete expanded mission sequence. The specific mission that crosses a level boundary is determined from the cumulative scripted rewards and must not be hard-coded from its numeric ID.
- The mission interface displays current wizard level and an experience progress bar using these accumulated-gem thresholds rather than a mission-number shortcut.
- Crossing a threshold displays a blocking level-up modal distinct from hero speech.
- Level progression must not cause a JavaScript concept or power to appear in practice missions before its concept mission introduces it, except for a specifically documented debugging target such as mission 03.

## Multiple fields

- A mission may contain one or more fields represented by its variants.
- The interface displays the current field number and total field count with a progress bar.
- One click on either execution button runs the same unchanged code through all fields in order, starting with field 1.
- A successful field advances automatically to the next field.
- If a field fails, execution stops on that field and the mission remains incomplete.
- Re-running always restarts at field 1, not at the failed or previously displayed field.
- A mission completes only after the same code passes all fields.

## Intentional infinite-loop mission

- Mission 26 teaches conditional loops and the danger of a condition that stays `true` forever.
- Its canonical code collects the required gem and then runs `while (true)` with a Japanese `hero.say(...)` inside every iteration.
- The explanation clearly states that an always-true loop cannot reach later instructions and may continuously consume computer resources.
- Mission 26 uses a two-step reload preparation before the actual infinite-loop execution.
- On the first normal display of an incomplete mission 26, the editor is read-only and visually grayed out.
- On that first display, the normal yellow `▶ 実行する` button is replaced by a harmonious green preparation button; the field-side mirrored button shows the same preparation state and label.
- Clicking either preparation control does not start the learner code and does not complete the mission. Both visible execution controls are intercepted by the same infinite-loop preparation behavior, which makes the hero explain in Japanese that the learner must reload with `Ctrl+F5` so the hero can enter the infinite loop.
- Preparation is recorded for the browser tab, but it becomes executable only after a real page reload. Navigating away and back on the same loaded page must not bypass the reload step.
- After the prepared page is reloaded, the editor becomes editable and both normal yellow execution controls return.
- Clicking either normal execution control after preparation persists mission completion and the next-mission unlock before the infinite demonstration starts.
- During the demonstration, closing the speech bubble starts the next loop iteration and shows the same speech again.
- Adventure controls remain unavailable during the demonstration. Reloading the page is the intended exit.
- After the post-execution reload, the persisted completion allows the learner to continue to mission 27 when missions 00 through 25 were completed normally.
- Completing the infinite-loop mission through temporary admin access does not bypass unfinished earlier missions after reload.
- Runtime logic identifies this lesson by its `infiniteLoopDemo` behavior rather than assuming a permanently fixed numeric ID, so future mission-pack insertions remain possible.
- Automated validation must not execute the truly infinite canonical solution directly; it validates the staged preparation and runtime mechanism instead.

## Legend disclosure

- The legend reveals world elements progressively and contains no duplicate entries.
- Every new field element or visible hero form must be added to the legend from the first mission in which that element/form actually appears and remain available thereafter when relevant to the campaign's progressive vocabulary.
- The hero is visible from mission 00.
- Gem and goal are visible from mission 01.
- Frog first appears as a visible typo-fix result in mission 03 and therefore appears exactly once in the legend from mission 03 onward, even though its formal concept lesson remains mission 07.
- Enemy dragon and dragon fire first appear in mission 06 and are added to the legend from mission 06 onward.
- A pillar becomes an active route-protection element in MISSION 09 and is used again in MISSION 13. MISSION 19 uses statue tiles for both its side protection and its dynamic central fire blocker.
- Water, green-leaf `🍃` lily pads and the goal door first appear in MISSION 18 and enter the legend at MISSION 18.
- A lever first becomes an active world-interaction element in MISSION 19 and is shown at its configured field position. In MISSION 19 it raises a protective statue rather than defeating the dragon.
- Statue tiles are impassable and block dragon fire. They enter the legend with MISSION 19.
- Trap first appears by MISSION 15.
- Key and the normal keyed door first appear in MISSION 20 after the fourth insertion.
- Enemy appears from MISSION 27 after the fourth insertion.
- The enemy dragon in boss missions does not reveal the future hero dragon transformation.

## Admin mode

- Admin mode is enabled by adding `?admin=1` or `?admin=true` to the local URL, for example `http://localhost:8000/?admin=true`.
- Admin mode is intentionally not protected.
- Merely opening an admin URL must not unlock missions before the admin button is activated.
- Admin mode adds a visible button that unlocks all missions for manual verification.
- The admin unlock is temporary to the current loaded page. Reloading the page, removing the admin URL or opening a normal page restores access derived from normal consecutive completion.
- Activating the admin unlock must not write `unlocked = missionCount` into normal persisted progress.
- Unlocking all missions does not automatically mark missions complete or grant persisted wizard level.
- Missions completed during admin verification may remain recorded as completed, but they must not unlock unfinished gaps in the normal mission sequence.
- Once the admin unlock button is activated, the same admin-unlocked state must be used both when rendering mission buttons and when checking whether a selected mission may open.
- The same admin action must also override focused-sidebar hiding so all missions become visible for review.
- Admin mode shows `答えを見る` for the selected mission even before three failed attempts. This final-answer control is independent of the temporary unlock-all button and remains editor-side only.
- Admin mode provides a quiz-review control on every concept-card quiz that selects the correct choices without submitting the form or validating the card automatically.
- Admin mode provides the validate-all control only at the end of a concept mission's `新しい考え方` section; it validates those cards through normal concept memory and does not complete the mission.

## Speech and branch prompts

- `hero.say(...)` displays a comic-style bubble and pauses execution until closed.
- Locked powers, understandable runtime errors and non-lethal world-mechanic refusals reuse the same trace-based blocking speech mechanism.
- Multiple speech calls appear at their true execution positions and never get pre-collected before movement.

## Validation and regression protection

- The expanded-campaign validator must execute every finite reference solution on every field.
- The current expanded campaign contains 35 missions and 53 fields; the original concept-only validators may continue to protect the underlying 23-mission/37-field core separately.
- It verifies consecutive identifiers, unique identifiers, required gems, scripted levels, transformation gates and ordered action traces.
- It verifies the five canonical mission type codes, labels and emojis and the reinforcement order after concept mission 01.
- It verifies mission 00 remains a standalone concept mission with no reinforcement pack.
- It verifies the first-launch story introduction appears before MISSION 00 only until the dedicated story-intro-seen flag is persisted, uses seven centered pages with different narrative typography for the legend, and does not expose the underlying campaign before completion.
- It verifies that one high-quality PNG illustration per introduction page exists physically in the codebase, that pages 1 through 7 reference their matching numbered assets directly, and that responsive styling keeps image and copy usable together.
- It verifies the requested introduction reading tooltips, including the `姿`-only target, and the `hero` tooltip `ひーろー → 主人公（しゅじんこう）`.
- It verifies pages 2 through 7 provide a previous-page control, page 1 hides that control, and replaying the introduction through `物語をもう一度` does not alter mission progress or clear the persisted first-launch flag.
- It verifies missions 02–06 have no concept-card guides and that mission 03's transform exposure is only the documented explicit debugging exception.
- It verifies `requiresCardValidation(...)` is true only for missions explicitly typed `concept`; practice missions and a missing/unresolved mission are never card-gated.
- It verifies switching to a non-concept mission clears stale `concept-cards-pending` state and leaves the canonical run control enabled.
- It verifies the field-side execution button invokes the same canonical execution handler as the editor-side button, mirrors its disabled/visible/accessibility/temporary-label state, and receives the same infinite-loop special-run interception rather than maintaining an independent execution path.
- It verifies mission 03 explains what a typo is, contains exactly the intended bracket typo and `forg`/`frog` typo, fails before correction, and cannot be completed by deleting the transformation line.
- It verifies logic-fix starter code executes successfully but fails mission evaluation while its reference solution succeeds.
- It verifies the dragon attacks for three tiles in all four cardinal directions and that blocking geometry stops its line of sight.
- It verifies mission 06's starter contains three leftward moves; the first leftward move remains outside the attack range and the second enters the three-tile range, produces a `dragon-fire` trace event, kills the hero and prevents the third move from executing.
- It verifies the mission-06 fire event contains exactly three fire cells and that the last fire cell is the hero tile.
- It verifies the dragon-fire UI displays one flame per reachable attack tile and shows the dead hero as a skeleton on the burning hero tile while leaving the dragon alive.
- It verifies the engine tracks hero life authoritatively and no hero API action after a lethal hazard is executed or appended to the trace.
- It verifies lethal traps stop execution through the same action lifecycle.
- It verifies a hero cannot move onto a tile occupied by a creature, independently of whether that creature attacks.
- It verifies the mission-06 reference solution moves only right, collects the gem, reaches the goal, avoids dragon fire, leaves `bossDefeated` false and produces no `boss-defeated` event.
- It verifies the preserved dragon/pillar/lever scenario remains available as reusable reference data.
- It verifies MISSION 09 enforces and displays its 21-move maximum and that its reference route succeeds in exactly 21 moves.
- It verifies MISSION 12's reversed-branch starter runs but fails by logic, while the corrected `if` code succeeds on both signs.
- It verifies MISSION 13 uses `hero.readSign()` and `if`, contains both `看板：right` and `看板：left` fields, places the pillar on the indicated side, kills a hero choosing the unprotected side, and lets the same ten-move conditional solution pass both fields safely.
- It verifies MISSION 17's syntax-broken starter does not execute, while its corrected `if / else` solution passes both fields.
- It verifies MISSION 18 has exactly one field with visibly styled water, enlarged green-leaf `🍃` lily pads and a goal door; the human hero is refused on a lily pad with the requested swimming/weight speech, frog form crosses lily pads, frog form is refused at the goal door with the handle speech, and the human form can enter the goal door to finish.
- It verifies MISSION 19 uses two fields and one unchanged program, requires `||`, `&&`, `if / else`, sign reading, movement and both transformations, contains exactly four vertical river rows beneath the dragon, keeps the goal on the top row between two statues, kills the hero on the unprotected side, refuses lever activation in frog form, raises an impassable central statue only from human form, blocks the dragon's upward ray with that statue, keeps the dragon alive, and lets the same fourteen-move reference solution collect the gem and reach the goal on both fields.
- It verifies wizard progression thresholds are exactly 1 total gem for level 1, 21 total gems for level 2 and 51 total gems for level 3, with level 4 at 91 under the continuing +10-per-level-cost pattern.
- It verifies progression metadata identifies the level-2 crossing from cumulative scripted XP rather than assuming a fixed mission number, and that the mission immediately after that crossing starts at level 2.
- It verifies focused sidebar visibility: 00–01 before mission 00 completion; completed missions remain visible permanently; only unfinished missions beyond the next concept boundary are hidden; and 00–34 are visible after admin unlock-all.
- It verifies invalid direction, invalid parameter, invalid boolean, unknown method, invalid transformation and locked hero-dragon behavior.
- It verifies the boolean concept mission checks both `true` and `false`, collects its gem and ends on the goal tile after two moves.
- It verifies the infinite-loop mission uses the two-step reload preparation, persists completion before the actual infinite execution and requires a second page reload to leave it.
- It verifies each canonical loop solution still passes all fields after renumbering.
- It verifies commented-out loop keywords do not satisfy loop syntax requirements.
- It verifies manually unrolled commands exceeding a source-code call limit fail with a Japanese result message.
- It verifies multi-field ordering, field-progress source rules, admin URL behavior and progressive legend thresholds.
- It verifies saved curriculum and all mission-pack migrations preserve existing code and progress semantics while inserting new mandatory practice missions.
- It verifies the first loop concept mission uses the exact title `初めてのループ`.
- It verifies all 38 canonical cards, including the JavaScript and Editor cards, and the exact four-card order for mission 01.
- It verifies every concept mission guide resolves its ordered concept-card IDs from the canonical reference base, all IDs are unique and every rendered card exposes its ID.
- It verifies the card database and guide mappings are remapped to renumbered concept missions without assigning cards to practice missions.
- It verifies that the set of IDs referenced by concept mission guides is exactly the set of records in the canonical concept-card database and that no card is referenced twice.
- It verifies that no legacy or ad-hoc HTML injector can append a second comment-concept card outside the canonical database and memory system.
- It verifies every canonical concept card has between one and three quiz questions and every question has three or four unique choices containing its correct answer.
- It verifies concept-card validation uses stable card IDs and a dedicated memory storage key rather than mission-number persistence.
- It verifies every unprepared concept card is visually hidden before the memory layer applies its face-down state.
- It verifies concept missions remain edit/execution gated until their cards are validated, while all non-concept types are immediately card-ready once unlocked.
- It verifies the completion celebration appears when the last required concept card is validated and does not replace mission completion.
- It verifies admin quiz review can select the correct choices but does not submit or validate automatically.
- It verifies the admin-only validate-all control is rendered at the end of the guide, persists all current mission card IDs, and is absent from normal mode.
- It verifies difficult-word reading help is applied to mini-quiz prompts and choices through the shared reading dictionary, including `値`, `魔法` and `実行`.
- It verifies clicking the colored code preview maps the click position to the corresponding textarea or Ace cursor offset.
- It verifies simplified syntax coloring keeps keywords and punctuation in the default color while distinguishing objects/variables, methods, literal values and comments.
- It verifies string quote characters remain in the default color while string contents receive the literal color.
- It verifies learner-facing mission code uses double-quoted string literals and exact legacy defaults may migrate from single quotes to double quotes.
- It verifies the mission 01 goal instruction and the one-tile `hero.move(...)` concept explanation and quiz.
- It verifies the five syntax colors are centralized through CSS custom properties.
- It verifies the editor header has exactly two rows, displays `Ctrl+Enter で実行`, keeps all five shortcuts centered on one line when possible, wraps them onto additional centered lines when necessary and never uses horizontal scrolling.
- It verifies the same detailed blue scrollbar theme is used throughout the game and that Chromium does not fall back to native gray scrollbars.
- It verifies explanatory tooltips use the global body-level layer, remain viewport-clamped and cannot be triggered through an active covering modal.
- It verifies standalone mode does not request the absent Ace asset and that curriculum rendering does not recursively redispatch mission loading.
- It verifies the static execution worker loads the complete engine and boss-mechanics extension, the app does not create Blob workers, and admin navigation uses the canonical unlock predicate.
- It verifies normal access repairs stale or admin-inflated persisted unlock values before `app-v3.js` renders the mission list.
- It verifies an admin URL alone leaves later missions locked and that temporary admin access does not survive page initialization.
- It verifies every finite mission's learner partial solution differs from the final solution, contains comments and a `TODO`, and must remain incomplete on at least one field.
- It verifies the final answer is restricted to admin mode, is immediately available there without confirmation, and is not persisted as learner code.
- It verifies concept annotation does not install a self-mutating permanent subtree observer.
- It verifies the canonical application version is rendered discreetly in the footer and follows the repository versioning rules.
- It verifies required documentation exists and remains consistent with the implementation.
- ESLint must pass for changed JavaScript files.
