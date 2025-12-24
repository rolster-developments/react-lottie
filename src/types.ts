import {
  AnimationConfigWithData,
  AnimationDirection,
  AnimationEventCallback,
  AnimationEventName,
  AnimationEvents,
  AnimationItem,
  AnimationSegment,
  RendererType
} from 'lottie-web';
import React, { ReactElement, RefObject } from 'react';

export type LottieRefCurrentProps = {
  animationContainerRef: RefObject<HTMLDivElement | null>;
  animationLoaded: boolean;
  animationItem: AnimationItem | undefined;
  destroy: () => void;
  getDuration: (inFrames?: boolean) => number | undefined;
  goToAndPlay: (value: number, isFrame?: boolean) => void;
  goToAndStop: (value: number, isFrame?: boolean) => void;
  play: () => void;
  playSegments: (
    segments: AnimationSegment | AnimationSegment[],
    forceFlag?: boolean
  ) => void;
  pause: () => void;
  setDirection: (direction: AnimationDirection) => void;
  setSpeed: (speed: number) => void;
  setSubframe: (useSubFrames: boolean) => void;
  stop: () => void;
};

export type LottieRef = RefObject<LottieRefCurrentProps | null>;

export type LottieOptions<T extends RendererType = 'svg'> = Omit<
  AnimationConfigWithData<T>,
  'container' | 'animationData'
> & {
  animationData: unknown;
  lottieRef?: LottieRef;
  onComplete?: AnimationEventCallback<
    AnimationEvents[AnimationEventName]
  > | null;
  onConfigReady?: AnimationEventCallback<
    AnimationEvents[AnimationEventName]
  > | null;
  onDataFailed?: AnimationEventCallback<
    AnimationEvents[AnimationEventName]
  > | null;
  onDataReady?: AnimationEventCallback<
    AnimationEvents[AnimationEventName]
  > | null;
  onDestroy?: AnimationEventCallback<
    AnimationEvents[AnimationEventName]
  > | null;
  onDOMLoaded?: AnimationEventCallback<
    AnimationEvents[AnimationEventName]
  > | null;
  onEnterFrame?: AnimationEventCallback<
    AnimationEvents[AnimationEventName]
  > | null;
  onLoopComplete?: AnimationEventCallback<
    AnimationEvents[AnimationEventName]
  > | null;
  onLoadedImages?: AnimationEventCallback<
    AnimationEvents[AnimationEventName]
  > | null;
  onSegmentStart?: AnimationEventCallback<
    AnimationEvents[AnimationEventName]
  > | null;
} & Omit<React.HTMLProps<HTMLDivElement>, 'loop'>;

export type PartialLottieOptions = Omit<LottieOptions, 'animationData'> & {
  animationData?: LottieOptions['animationData'];
};

export type Axis = 'x' | 'y';
export type Position = { [key in Axis]: number | [number, number] };

export type Action = {
  type: 'seek' | 'play' | 'stop' | 'loop';

  frames: [number] | [number, number];
  visibility?: [number, number];
  position?: Position;
};

export type InteractivityProps = {
  lottieObj: { View: ReactElement } & LottieRefCurrentProps;
  actions: Action[];
  mode: 'scroll' | 'cursor';
};

export type LottieComponentProps = LottieOptions & {
  interactivity?: Omit<InteractivityProps, 'lottieObj'>;
};

export type PartialLottieComponentProps = Omit<
  LottieComponentProps,
  'animationData'
> & {
  animationData?: LottieOptions['animationData'];
};

export type Listener = {
  name: AnimationEventName;
  handler: AnimationEventCallback<AnimationEvents[AnimationEventName]>;
};

export type PartialListener = Omit<Listener, 'handler'> & {
  handler?: Listener['handler'] | null;
};
