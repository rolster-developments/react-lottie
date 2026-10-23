import { AnimationItem } from 'lottie-web';
import { act, createElement, useState } from 'react';
import { renderTree } from '../testing';
import { LottieOptions, LottieRefCurrentProps } from '../types';
import useLottie from './useLottie';

const { animationItem, loadAnimation } = vi.hoisted(() => {
  const animationItem = {
    addEventListener: vi.fn(),
    autoplay: false,
    currentRawFrame: 0,
    destroy: vi.fn(),
    getDuration: vi.fn(() => 42),
    goToAndPlay: vi.fn(),
    goToAndStop: vi.fn(),
    pause: vi.fn(),
    play: vi.fn(),
    playSegments: vi.fn(),
    removeEventListener: vi.fn(),
    resetSegments: vi.fn(),
    setDirection: vi.fn(),
    setSegment: vi.fn(),
    setSpeed: vi.fn(),
    setSubframe: vi.fn(),
    stop: vi.fn()
  };

  return { animationItem, loadAnimation: vi.fn(() => animationItem) };
});

vi.mock('lottie-web', () => ({ default: { loadAnimation } }));

const animationData = { layers: [], v: '5.10.2' };

type LottieRender = { View: unknown } & LottieRefCurrentProps;

function renderLottie(initial: Partial<LottieOptions> = {}) {
  const result = { current: undefined as unknown as LottieRender };
  const control = { setProps: (_props: Partial<LottieOptions>) => {} };

  function Host() {
    const [props, setProps] = useState(initial);

    control.setProps = (next) => {
      act(() => setProps(next));
    };

    const lottie = useLottie({ animationData, ...props });

    result.current = lottie;

    return lottie.View;
  }

  return {
    ...renderTree(createElement(Host)),
    result,
    setProps: (next: Partial<LottieOptions>) => control.setProps(next)
  };
}

describe('useLottie - Loading', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should load the animation into the rendered container', () => {
    renderLottie();

    expect(loadAnimation).toHaveBeenCalledTimes(1);

    const config = loadAnimation.mock.calls[0][0] as any;

    expect(config.container).toBeInstanceOf(HTMLDivElement);
    expect(config.animationData).toBe(animationData);
  });

  it('should forward the options to lottie-web', () => {
    renderLottie({ autoplay: false, loop: true });

    const config = loadAnimation.mock.calls[0][0] as any;

    expect(config.loop).toBe(true);
    expect(config.autoplay).toBe(false);
  });

  it('should expose the animation once it is loaded', () => {
    const { result } = renderLottie();

    expect(result.current.animationLoaded).toBe(true);
    expect(result.current.animationItem).toBe(
      animationItem as unknown as AnimationItem
    );
  });

  it('should destroy the animation on unmount', () => {
    const { unmount } = renderLottie();

    unmount();

    expect(animationItem.destroy).toHaveBeenCalled();
  });
});

describe('useLottie - Playback controls', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should delegate play, pause and stop', () => {
    const { result } = renderLottie();

    result.current.play();
    result.current.pause();
    result.current.stop();

    expect(animationItem.play).toHaveBeenCalledTimes(1);
    expect(animationItem.pause).toHaveBeenCalledTimes(1);
    expect(animationItem.stop).toHaveBeenCalledTimes(1);
  });

  it('should delegate the frame navigation with its arguments', () => {
    const { result } = renderLottie();

    result.current.goToAndPlay(10, true);
    result.current.goToAndStop(20, false);

    expect(animationItem.goToAndPlay).toHaveBeenCalledWith(10, true);
    expect(animationItem.goToAndStop).toHaveBeenCalledWith(20, false);
  });

  it('should delegate speed, direction and subframe', () => {
    const { result } = renderLottie();

    result.current.setSpeed(2);
    result.current.setDirection(-1);
    result.current.setSubframe(false);

    expect(animationItem.setSpeed).toHaveBeenCalledWith(2);
    expect(animationItem.setDirection).toHaveBeenCalledWith(-1);
    expect(animationItem.setSubframe).toHaveBeenCalledWith(false);
  });

  it('should delegate the segments to play', () => {
    const { result } = renderLottie();

    result.current.playSegments([0, 50], true);

    expect(animationItem.playSegments).toHaveBeenCalledWith([0, 50], true);
  });

  it('should return the duration reported by the animation', () => {
    const { result } = renderLottie();

    expect(result.current.getDuration(true)).toBe(42);
    expect(animationItem.getDuration).toHaveBeenCalledWith(true);
  });

  it('should ignore the controls once the animation is destroyed', () => {
    const { result } = renderLottie();

    result.current.destroy();
    result.current.play();

    expect(animationItem.destroy).toHaveBeenCalledTimes(1);
    expect(animationItem.play).not.toHaveBeenCalled();
  });
});

describe('useLottie - Event listeners', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should register only the handlers that were given', () => {
    const onComplete = vi.fn();
    const onDOMLoaded = vi.fn();

    renderLottie({ onComplete, onDOMLoaded });

    expect(animationItem.addEventListener).toHaveBeenCalledTimes(2);
    expect(animationItem.addEventListener).toHaveBeenCalledWith(
      'complete',
      onComplete
    );
    expect(animationItem.addEventListener).toHaveBeenCalledWith(
      'DOMLoaded',
      onDOMLoaded
    );
  });

  it('should not register anything when no handler was given', () => {
    renderLottie();

    expect(animationItem.addEventListener).not.toHaveBeenCalled();
  });

  it('should swap the handler that changed between renders', () => {
    const first = vi.fn();
    const second = vi.fn();

    const { setProps } = renderLottie({ onComplete: first });

    setProps({ onComplete: second });

    expect(animationItem.removeEventListener).toHaveBeenCalledWith(
      'complete',
      first
    );
    expect(animationItem.addEventListener).toHaveBeenCalledWith(
      'complete',
      second
    );
  });

  it('should deregister the handlers on unmount', () => {
    const onComplete = vi.fn();

    const { unmount } = renderLottie({ onComplete });

    unmount();

    expect(animationItem.removeEventListener).toHaveBeenCalledWith(
      'complete',
      onComplete
    );
  });

  it('should move the handlers to the animation that replaces it', () => {
    const onComplete = vi.fn();

    const { setProps } = renderLottie({ onComplete });

    setProps({ animationData: { layers: [], v: '9.9.9' }, onComplete });

    expect(loadAnimation).toHaveBeenCalledTimes(2);
    expect(animationItem.removeEventListener).toHaveBeenCalledWith(
      'complete',
      onComplete
    );
    expect(animationItem.addEventListener).toHaveBeenCalledTimes(2);
  });
});
