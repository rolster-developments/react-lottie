import { AnimationItem } from 'lottie-web';
import { act } from 'react';
import { renderHook } from '../testing';
import {
  getContainerCursorPosition,
  getContainerVisibility,
  useInitInteractivity
} from './useLottieInteractivity';
import { Action } from '../types';

type Rect = Partial<DOMRect>;

function createContainer(rect: Rect): HTMLDivElement {
  const container = document.createElement('div');

  container.getBoundingClientRect = () =>
    ({ height: 0, left: 0, top: 0, width: 0, ...rect }) as DOMRect;

  return container;
}

function createAnimationItem(isPaused = false): AnimationItem {
  return {
    firstFrame: 0,
    goToAndStop: vi.fn(),
    isPaused,
    play: vi.fn(),
    playSegments: vi.fn(),
    resetSegments: vi.fn(),
    stop: vi.fn()
  } as unknown as AnimationItem;
}

function initInteractivity(
  container: HTMLDivElement,
  animationItem: AnimationItem,
  mode: 'cursor' | 'scroll',
  actions: Action[]
) {
  return renderHook(() =>
    useInitInteractivity({
      actions,
      animationItem,
      mode,
      wrapperRef: { current: container }
    })
  );
}

describe('getContainerVisibility', () => {
  beforeEach(() => {
    vi.stubGlobal('innerHeight', 1000);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('should report full visibility when the container sits on the top', () => {
    expect(getContainerVisibility(createContainer({ top: 0 }))).toBe(1);
  });

  it('should report no visibility when the container is below the fold', () => {
    expect(getContainerVisibility(createContainer({ top: 1000 }))).toBe(0);
  });

  it('should take the height of the container into account', () => {
    const container = createContainer({ height: 500, top: 500 });

    expect(getContainerVisibility(container)).toBeCloseTo(1 / 3);
  });
});

describe('getContainerCursorPosition', () => {
  it('should resolve the cursor as a ratio of the container', () => {
    const container = createContainer({ height: 100, width: 100 });

    expect(getContainerCursorPosition(container, 50, 25)).toEqual({
      x: 0.5,
      y: 0.25
    });
  });

  it('should offset the cursor with the container position', () => {
    const container = createContainer({
      height: 100,
      left: 100,
      top: 200,
      width: 100
    });

    expect(getContainerCursorPosition(container, 150, 250)).toEqual({
      x: 0.5,
      y: 0.5
    });
  });
});

describe('useInitInteractivity - Scroll mode', () => {
  const container = () => createContainer({ height: 500, top: 500 });

  beforeEach(() => {
    vi.stubGlobal('innerHeight', 1000);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  function scroll(): void {
    act(() => {
      document.dispatchEvent(new Event('scroll'));
    });
  }

  it('should stop the animation when it takes control', () => {
    const animationItem = createAnimationItem();

    initInteractivity(container(), animationItem, 'scroll', [
      { frames: [0, 100], type: 'seek', visibility: [0, 1] }
    ]);

    expect(animationItem.stop).toHaveBeenCalledTimes(1);
  });

  it('should stay idle when there are no actions', () => {
    const animationItem = createAnimationItem();

    initInteractivity(container(), animationItem, 'scroll', []);

    scroll();

    expect(animationItem.stop).not.toHaveBeenCalled();
    expect(animationItem.goToAndStop).not.toHaveBeenCalled();
  });

  it('should seek the frame matching the scroll position', () => {
    const animationItem = createAnimationItem();

    initInteractivity(container(), animationItem, 'scroll', [
      { frames: [0, 100], type: 'seek', visibility: [0, 1] }
    ]);

    scroll();

    expect(animationItem.goToAndStop).toHaveBeenCalledWith(33, true);
  });

  it('should ignore an action outside the current visibility', () => {
    const animationItem = createAnimationItem();

    initInteractivity(container(), animationItem, 'scroll', [
      { frames: [0, 100], type: 'seek', visibility: [0.8, 1] }
    ]);

    scroll();

    expect(animationItem.goToAndStop).not.toHaveBeenCalled();
  });

  it('should play the segments of a loop action', () => {
    const animationItem = createAnimationItem();

    initInteractivity(container(), animationItem, 'scroll', [
      { frames: [10, 50], type: 'loop', visibility: [0, 1] }
    ]);

    scroll();

    expect(animationItem.playSegments).toHaveBeenCalledWith([10, 50], true);
  });

  it('should play the segments of a loop action only once', () => {
    const animationItem = createAnimationItem();

    initInteractivity(container(), animationItem, 'scroll', [
      { frames: [10, 50], type: 'loop', visibility: [0, 1] }
    ]);

    scroll();
    scroll();

    expect(animationItem.playSegments).toHaveBeenCalledTimes(1);
  });

  it('should resume a paused animation on a play action', () => {
    const animationItem = createAnimationItem(true);

    initInteractivity(container(), animationItem, 'scroll', [
      { frames: [0, 100], type: 'play', visibility: [0, 1] }
    ]);

    scroll();

    expect(animationItem.resetSegments).toHaveBeenCalledWith(true);
    expect(animationItem.play).toHaveBeenCalledTimes(1);
  });

  it('should leave a running animation alone on a play action', () => {
    const animationItem = createAnimationItem(false);

    initInteractivity(container(), animationItem, 'scroll', [
      { frames: [0, 100], type: 'play', visibility: [0, 1] }
    ]);

    scroll();

    expect(animationItem.play).not.toHaveBeenCalled();
  });

  it('should go to the frame of a stop action', () => {
    const animationItem = createAnimationItem();

    initInteractivity(container(), animationItem, 'scroll', [
      { frames: [40], type: 'stop', visibility: [0, 1] }
    ]);

    scroll();

    expect(animationItem.goToAndStop).toHaveBeenCalledWith(39, true);
  });

  it('should take the first action that matches', () => {
    const animationItem = createAnimationItem();

    initInteractivity(container(), animationItem, 'scroll', [
      { frames: [40], type: 'stop', visibility: [0, 1] },
      { frames: [0, 100], type: 'seek', visibility: [0, 1] }
    ]);

    scroll();

    expect(animationItem.goToAndStop).toHaveBeenCalledTimes(1);
    expect(animationItem.goToAndStop).toHaveBeenCalledWith(39, true);
  });

  it('should release the scroll listener on unmount', () => {
    const animationItem = createAnimationItem();

    const { unmount } = initInteractivity(container(), animationItem, 'scroll', [
      { frames: [0, 100], type: 'seek', visibility: [0, 1] }
    ]);

    unmount();
    scroll();

    expect(animationItem.goToAndStop).not.toHaveBeenCalled();
  });
});

describe('useInitInteractivity - Cursor mode', () => {
  const container = () => createContainer({ height: 100, width: 100 });

  function moveCursor(wrapper: HTMLDivElement, x: number, y: number): void {
    act(() => {
      wrapper.dispatchEvent(
        new MouseEvent('mousemove', { clientX: x, clientY: y })
      );
    });
  }

  it('should seek the frame matching the cursor position', () => {
    const animationItem = createAnimationItem();
    const wrapper = container();

    initInteractivity(wrapper, animationItem, 'cursor', [
      {
        frames: [0, 100],
        position: { x: [0, 1], y: [0, 1] },
        type: 'seek'
      }
    ]);

    moveCursor(wrapper, 50, 50);

    expect(animationItem.playSegments).toHaveBeenCalledWith([0, 100], true);
    expect(animationItem.goToAndStop).toHaveBeenCalledWith(50, true);
  });

  it('should ignore a cursor outside the action position', () => {
    const animationItem = createAnimationItem();
    const wrapper = container();

    initInteractivity(wrapper, animationItem, 'cursor', [
      {
        frames: [0, 100],
        position: { x: [0, 0.2], y: [0, 0.2] },
        type: 'seek'
      }
    ]);

    moveCursor(wrapper, 90, 90);

    expect(animationItem.goToAndStop).not.toHaveBeenCalled();
  });

  it('should play the segments of a loop action', () => {
    const animationItem = createAnimationItem();
    const wrapper = container();

    initInteractivity(wrapper, animationItem, 'cursor', [
      {
        frames: [10, 50],
        position: { x: [0, 1], y: [0, 1] },
        type: 'loop'
      }
    ]);

    moveCursor(wrapper, 50, 50);

    expect(animationItem.playSegments).toHaveBeenCalledWith([10, 50], true);
  });

  it('should reset the segments of a paused play action', () => {
    const animationItem = createAnimationItem(true);
    const wrapper = container();

    initInteractivity(wrapper, animationItem, 'cursor', [
      {
        frames: [0, 100],
        position: { x: [0, 1], y: [0, 1] },
        type: 'play'
      }
    ]);

    moveCursor(wrapper, 50, 50);

    expect(animationItem.resetSegments).toHaveBeenCalledWith(false);
    expect(animationItem.playSegments).toHaveBeenCalledWith([0, 100]);
  });

  it('should go to the frame of a stop action', () => {
    const animationItem = createAnimationItem();
    const wrapper = container();

    initInteractivity(wrapper, animationItem, 'cursor', [
      {
        frames: [40],
        position: { x: [0, 1], y: [0, 1] },
        type: 'stop'
      }
    ]);

    moveCursor(wrapper, 50, 50);

    expect(animationItem.goToAndStop).toHaveBeenCalledWith(40, true);
  });

  it('should discard the cursor when it leaves the container', () => {
    const animationItem = createAnimationItem();
    const wrapper = container();

    initInteractivity(wrapper, animationItem, 'cursor', [
      {
        frames: [0, 100],
        position: { x: [0, 1], y: [0, 1] },
        type: 'seek'
      }
    ]);

    act(() => {
      wrapper.dispatchEvent(new MouseEvent('mouseout'));
    });

    expect(animationItem.goToAndStop).not.toHaveBeenCalled();
  });

  it('should release the cursor listeners on unmount', () => {
    const animationItem = createAnimationItem();
    const wrapper = container();

    const { unmount } = initInteractivity(wrapper, animationItem, 'cursor', [
      {
        frames: [0, 100],
        position: { x: [0, 1], y: [0, 1] },
        type: 'seek'
      }
    ]);

    unmount();
    moveCursor(wrapper, 50, 50);

    expect(animationItem.goToAndStop).not.toHaveBeenCalled();
  });
});
