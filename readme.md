# Rolster React Lottie

Package containing UI components for Lottie in React.

## Installation

```
npm i @rolster/react-lottie
```

`react` and `react-dom` are not declared as dependencies of this package: the
consuming project must have them installed (React 19 typings are used).

## Features

The package wraps [`lottie-web`](https://www.npmjs.com/package/lottie-web) and
exposes a component (default export), two hooks and their types.

### `Lottie` component

`Lottie` is the **default export**. It renders a `<div>` container, loads the
animation in it and, optionally, wires scroll/cursor interactivity. Its props
are `LottieComponentProps`:

| Prop                                                                                                                                                           | Description                                                                                                         |
| -------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------- |
| `animationData`                                                                                                                                                | Parsed Lottie JSON (required).                                                                                      |
| `loop`, `autoplay`, `initialSegment`                                                                                                                           | Playback options forwarded to `lottie-web`. `loop` and `initialSegment` are watched and applied on change.          |
| `renderer`, `name`, `assetsPath`, `rendererSettings`                                                                                                           | Remaining `lottie-web` configuration.                                                                               |
| `lottieRef`                                                                                                                                                    | A `LottieRef` that receives the playback API (`LottieRefCurrentProps`) once the animation is loaded.                |
| `onComplete`, `onLoopComplete`, `onEnterFrame`, `onSegmentStart`, `onConfigReady`, `onDataReady`, `onDataFailed`, `onLoadedImages`, `onDOMLoaded`, `onDestroy` | `lottie-web` event listeners.                                                                                       |
| `interactivity`                                                                                                                                                | `{ mode: 'scroll' \| 'cursor'; actions: Action[] }` to drive the animation from scroll position or cursor position. |
| `style` and any other `<div>` HTML prop                                                                                                                        | Applied to the container element.                                                                                   |

```typescript
import Lottie, { LottieRefCurrentProps } from '@rolster/react-lottie';
import { useRef } from 'react';
import animationData from './loader.json';

function Loader() {
  const lottieRef = useRef<LottieRefCurrentProps>(null);

  return (
    <Lottie
      animationData={animationData}
      loop
      lottieRef={lottieRef}
      style={{ width: 200, height: 200 }}
      onLoopComplete={() => lottieRef.current?.setSpeed(2)}
    />
  );
}
```

Interactivity example, seeking through frames 0–120 while the container scrolls
into view:

```typescript
<Lottie
  animationData={animationData}
  interactivity={{
    mode: 'scroll',
    actions: [{ type: 'seek', visibility: [0, 1], frames: [0, 120] }]
  }}
/>
```

### `useLottie(props, style?)`

Named export. Receives `LottieOptions` (the component props minus
`interactivity`) plus an optional `CSSProperties` object for the container and
returns `{ View } & LottieRefCurrentProps`: `View` is the `ReactElement` to
render, and the rest is the playback API.

| Member                                       | Description                                               |
| -------------------------------------------- | --------------------------------------------------------- |
| `View`                                       | Container element with the animation attached.            |
| `play()`, `stop()`, `pause()`                | Playback control.                                         |
| `setSpeed(speed)`, `setDirection(direction)` | Speed and direction (`1` / `-1`).                         |
| `goToAndPlay(value, isFrame?)`               | Jump to a frame or time and play.                         |
| `goToAndStop(value, isFrame?)`               | Jump to a frame or time and stop.                         |
| `playSegments(segments, forceFlag?)`         | Play one or several `[from, to]` segments.                |
| `setSubframe(useSubFrames)`                  | Toggle subframe rendering.                                |
| `getDuration(inFrames?)`                     | Duration in seconds (or frames); `undefined` before load. |
| `destroy()`                                  | Destroys the `lottie-web` instance.                       |
| `animationContainerRef`                      | `RefObject<HTMLDivElement \| null>` of the container.     |
| `animationLoaded`                            | `true` once `lottie-web` created the animation.           |
| `animationItem`                              | The underlying `AnimationItem`, or `undefined`.           |

```typescript
import { useLottie } from '@rolster/react-lottie';
import animationData from './hero.json';

function Hero() {
  const { View, play, pause } = useLottie(
    { animationData, loop: true, autoplay: false },
    { height: 320 }
  );

  return (
    <section onMouseEnter={play} onMouseLeave={pause}>
      {View}
    </section>
  );
}
```

### `useLottieInteractivity({ actions, mode, lottieObj })`

Named export. Takes `InteractivityProps` — the object returned by `useLottie`
as `lottieObj`, the interactivity `mode` and the list of `Action`s — attaches
the scroll or cursor listeners to the container and returns the `View` to
render. `Lottie` uses it internally when `interactivity` is provided.

### Types

| Type                                                  | Description                                                                                                                                                                                                |
| ----------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `LottieOptions<T extends RendererType = 'svg'>`       | `lottie-web` `AnimationConfigWithData` without `container`, plus `animationData`, `lottieRef`, the `on*` listeners and `<div>` HTML props (except `loop`).                                                 |
| `LottieComponentProps`                                | `LottieOptions & { interactivity?: { mode; actions } }` — props of `Lottie`.                                                                                                                               |
| `LottieRefCurrentProps`                               | Playback API exposed through `lottieRef` and returned by `useLottie`.                                                                                                                                      |
| `LottieRef`                                           | `RefObject<LottieRefCurrentProps \| null>`.                                                                                                                                                                |
| `InteractivityProps`                                  | `{ lottieObj; actions: Action[]; mode: 'scroll' \| 'cursor' }` — argument of `useLottieInteractivity`.                                                                                                     |
| `Action`                                              | `{ type: 'seek' \| 'play' \| 'stop' \| 'loop'; frames: [number] \| [number, number]; visibility?: [number, number]; position?: Position }`. `visibility` applies to `scroll` mode, `position` to `cursor`. |
| `Position`                                            | `{ x: number \| [number, number]; y: number \| [number, number] }` — relative (0–1) cursor coordinates or ranges.                                                                                          |
| `PartialLottieOptions`, `PartialLottieComponentProps` | Same as the base types with `animationData` optional.                                                                                                                                                      |

## Contributing

- Daniel Andrés Castillo Pedroza :rocket:
