import lottie, {
  AnimationConfigWithData,
  AnimationDirection,
  AnimationItem,
  AnimationSegment,
  RendererType
} from 'lottie-web';
import {
  CSSProperties,
  ReactElement,
  useEffect,
  useRef,
  useState
} from 'react';

import {
  Listener,
  LottieOptions,
  LottieRefCurrentProps,
  PartialListener
} from '../types';

const useLottie = <T extends RendererType = 'svg'>(
  props: LottieOptions<T>,
  style?: CSSProperties
): { View: ReactElement } & LottieRefCurrentProps => {
  const {
    animationData,
    loop,
    autoplay,
    initialSegment,

    onComplete,
    onLoopComplete,
    onEnterFrame,
    onSegmentStart,
    onConfigReady,
    onDataReady,
    onDataFailed,
    onLoadedImages,
    onDOMLoaded,
    onDestroy,

    // Specified here to take them out from the 'rest'
    lottieRef,
    renderer,
    name,
    assetsPath,
    rendererSettings,
    ...rest
  } = props;

  const [animationLoaded, setAnimationLoaded] = useState(false);
  const animationInstanceRef = useRef<AnimationItem>(undefined);
  const animationContainer = useRef<HTMLDivElement>(null);

  const play = (): void => {
    animationInstanceRef.current?.play();
  };

  const stop = (): void => {
    animationInstanceRef.current?.stop();
  };

  const pause = (): void => {
    animationInstanceRef.current?.pause();
  };

  const setSpeed = (speed: number): void => {
    animationInstanceRef.current?.setSpeed(speed);
  };

  const goToAndPlay = (value: number, isFrame?: boolean): void => {
    animationInstanceRef.current?.goToAndPlay(value, isFrame);
  };

  const goToAndStop = (value: number, isFrame?: boolean): void => {
    animationInstanceRef.current?.goToAndStop(value, isFrame);
  };

  const setDirection = (direction: AnimationDirection): void => {
    animationInstanceRef.current?.setDirection(direction);
  };

  const playSegments = (
    segments: AnimationSegment | AnimationSegment[],
    forceFlag?: boolean
  ): void => {
    animationInstanceRef.current?.playSegments(segments, forceFlag);
  };

  const setSubframe = (useSubFrames: boolean): void => {
    animationInstanceRef.current?.setSubframe(useSubFrames);
  };

  const getDuration = (inFrames?: boolean): number | undefined =>
    animationInstanceRef.current?.getDuration(inFrames);

  const destroy = (): void => {
    animationInstanceRef.current?.destroy();
    animationInstanceRef.current = undefined;
  };

  const loadAnimation = (forcedConfigs = {}) => {
    if (!animationContainer.current) {
      return;
    }

    animationInstanceRef.current?.destroy();

    const config: AnimationConfigWithData<T> = {
      ...props,
      ...forcedConfigs,
      container: animationContainer.current
    };

    animationInstanceRef.current = lottie.loadAnimation(config);

    setAnimationLoaded(!!animationInstanceRef.current);

    return () => {
      animationInstanceRef.current?.destroy();
      animationInstanceRef.current = undefined;
    };
  };

  useEffect(() => {
    const onUnmount = loadAnimation();

    return () => {
      onUnmount?.();
    };
  }, [animationData, loop]);

  useEffect(() => {
    if (!animationInstanceRef.current) {
      return;
    }

    animationInstanceRef.current.autoplay = !!autoplay;
  }, [autoplay]);

  useEffect(() => {
    if (!animationInstanceRef.current) {
      return;
    }

    if (!initialSegment) {
      animationInstanceRef.current.resetSegments(true);
      return;
    }

    if (!Array.isArray(initialSegment) || !initialSegment.length) {
      return;
    }

    if (
      animationInstanceRef.current.currentRawFrame < initialSegment[0] ||
      animationInstanceRef.current.currentRawFrame > initialSegment[1]
    ) {
      animationInstanceRef.current.currentRawFrame = initialSegment[0];
    }

    animationInstanceRef.current.setSegment(
      initialSegment[0],
      initialSegment[1]
    );
  }, [initialSegment]);

  useEffect(() => {
    const partialListeners: PartialListener[] = [
      { name: 'complete', handler: onComplete },
      { name: 'loopComplete', handler: onLoopComplete },
      { name: 'enterFrame', handler: onEnterFrame },
      { name: 'segmentStart', handler: onSegmentStart },
      { name: 'config_ready', handler: onConfigReady },
      { name: 'data_ready', handler: onDataReady },
      { name: 'data_failed', handler: onDataFailed },
      { name: 'loaded_images', handler: onLoadedImages },
      { name: 'DOMLoaded', handler: onDOMLoaded },
      { name: 'destroy', handler: onDestroy }
    ];

    const listeners = partialListeners.filter(
      (listener: PartialListener): listener is Listener =>
        listener.handler != null
    );

    if (!listeners.length) {
      return;
    }

    const deregisterList = listeners.map((listener) => {
      animationInstanceRef.current?.addEventListener(
        listener.name,
        listener.handler
      );

      return () => {
        animationInstanceRef.current?.removeEventListener(
          listener.name,
          listener.handler
        );
      };
    });

    return () => {
      deregisterList.forEach((deregister) => deregister());
    };
  }, [
    onComplete,
    onLoopComplete,
    onEnterFrame,
    onSegmentStart,
    onConfigReady,
    onDataReady,
    onDataFailed,
    onLoadedImages,
    onDOMLoaded,
    onDestroy
  ]);

  const View = <div style={style} ref={animationContainer} {...rest} />;

  return {
    View,
    play,
    stop,
    pause,
    setSpeed,
    goToAndStop,
    goToAndPlay,
    setDirection,
    playSegments,
    setSubframe,
    getDuration,
    destroy,
    animationContainerRef: animationContainer,
    animationLoaded,
    animationItem: animationInstanceRef.current
  };
};

export default useLottie;
