# Skill: Using media-ui-react components (prop-getters, styling, a11y)

Use this skill when writing or editing UI code that renders `Grid`,
`Lightbox`, or `ReelSwiper` from `media-ui-react` (or the native
equivalents from `media-ui-native`).

## Rule 1 — These components ship NO styles. You supply all of it.

There is no CSS import, no theme, no className with baked-in visual
meaning. If something looks unstyled, that's correct — style it in your
own stylesheet. Do not go looking for a "theme" prop; it doesn't exist by
design.

## Rule 2 — Prefer the hook over the wrapper component when you need custom markup

Every component has two forms:
- `useGrid`/`useLightbox`/`useReelSwiper` — the hook, returns state +
  prop-getters (`getSentinelProps`, `getDialogProps`, `getContainerProps`/
  `getItemProps`). Full control over markup.
- `Grid`/`Lightbox`/`ReelSwiper` — thin convenience components that call
  the hook for you and take a `renderItem`/`renderContent` prop.

If your markup needs anything the wrapper doesn't expose (custom loading
skeletons between grid items, a non-standard lightbox layout, etc.), drop
to the hook. Don't fork the wrapper component's source — call the hook
directly instead.

```tsx
// Prefer this when you need custom structure:
const { getSentinelProps } = useGrid({ onLoadMore, hasMore, loading });
return (
  <div className="my-grid">
    {items.map(renderMyTile)}
    {hasMore && <div {...getSentinelProps()} />}
  </div>
);
```

## Rule 3 — Prop-getters must be spread, not read piecemeal

`getDialogProps()`, `getSentinelProps()`, `getContainerProps()`, and
`getItemProps(index)` return an object meant to be spread wholesale onto
one element:

```tsx
<div {...lightbox.getDialogProps()}>...</div>   // correct
```

```tsx
<div role="dialog" onKeyDown={lightbox.getDialogProps().onKeyDown}>       // wrong — you'll
```
Cherry-picking individual fields silently drops behavior (e.g. the focus
trap ref, the `aria-modal` attribute) that a reviewer or screen-reader user
will notice even if it "looks" fine visually.

## Rule 4 — Accessibility contract you must not remove

- `Lightbox`'s dialog props include `role="dialog"`, `aria-modal`, and a
  focus trap + Escape/Arrow key handling. Don't add a second, competing
  `onKeyDown` on a wrapping element that could swallow these keys before
  they reach the dialog.
- `Grid`'s sentinel element is `aria-hidden` on purpose — it's a scroll
  trigger, not content. Don't put visible/interactive content inside it.
- Always pass a meaningful `alt` via the `MediaLike.alt` field when
  rendering `<img>`; components don't invent alt text for you.

## Rule 5 — `ReelSwiper`'s active-item detection is data, not decoration

`isActive` (third arg to `renderItem`) tells you which item is centered in
the viewport via `IntersectionObserver`. Use it to decide behavior — e.g.
autoplay video only on the active item — not just to toggle a CSS class.
Playing every video at once because `isActive` was ignored is the most
common misuse.

## Rule 6 — Never import from `media-core` or a wrapper package here

If you find yourself typing `import { Photo } from "media-core"` inside a
file under `media-ui-react` or `media-ui-native`, stop — that violates the
independence constraint. Convert to `MediaLike` at the app layer instead
(see the `wiring-data` skill, Rule 5).
