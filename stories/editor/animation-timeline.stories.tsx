import type { Meta, StoryObj } from "@storybook/react";
import { AnimationTimeline } from "../../client/src/components/editor/animation-timeline";
import { useState } from "react";
import { fn } from "storybook/test";
import type { SpriteAnimation } from "@shared/types/pixel-asset";
import { createDefaultAnimation, createDefaultObject } from "@shared/utils/pixel-asset";

const meta = {
  title: "Editor/AnimationTimeline",
  component: AnimationTimeline,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  args: {
    onAnimationChange: fn(),
    onFrameSelect: fn(),
    onPlayPause: fn(),
    onFrameAdd: fn(),
    onFrameDelete: fn(),
    onFrameDurationChange: fn(),
  },
} satisfies Meta<typeof AnimationTimeline>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => {
    const [animation] = useState<SpriteAnimation>(createDefaultAnimation("Walk Cycle"));
    return (
      <div className="w-96">
        <AnimationTimeline animation={animation} currentFrameIndex={0} />
      </div>
    );
  },
};

export const EmptyAnimation: Story = {
  render: () => {
    const [animation] = useState<SpriteAnimation>({
      ...createDefaultAnimation("Empty Animation"),
      frames: [],
    });
    return (
      <div className="w-96">
        <AnimationTimeline animation={animation} currentFrameIndex={0} />
      </div>
    );
  },
};

export const MultipleFrames: Story = {
  render: () => {
    const obj1 = createDefaultObject("Frame 1");
    const obj2 = createDefaultObject("Frame 2");
    const obj3 = createDefaultObject("Frame 3");
    const [animation] = useState<SpriteAnimation>({
      ...createDefaultAnimation("Walk Cycle"),
      frames: [
        { objectId: obj1.id, duration: 100 },
        { objectId: obj2.id, duration: 150 },
        { objectId: obj3.id, duration: 100 },
      ],
    });
    const [currentFrameIndex, setCurrentFrameIndex] = useState(0);
    return (
      <div className="w-96">
        <AnimationTimeline
          animation={animation}
          currentFrameIndex={currentFrameIndex}
          onFrameSelect={setCurrentFrameIndex}
        />
      </div>
    );
  },
};

export const PlayPauseControls: Story = {
  render: () => {
    const obj1 = createDefaultObject("Frame 1");
    const obj2 = createDefaultObject("Frame 2");
    const [animation, setAnimation] = useState<SpriteAnimation>({
      ...createDefaultAnimation("Walk Cycle"),
      frames: [
        { objectId: obj1.id, duration: 100 },
        { objectId: obj2.id, duration: 150 },
      ],
      playing: false,
    });
    const [currentFrameIndex, setCurrentFrameIndex] = useState(0);

    const handlePlayPause = () => {
      setAnimation({ ...animation, playing: !animation.playing });
    };

    return (
      <div className="w-96">
        <AnimationTimeline
          animation={animation}
          currentFrameIndex={currentFrameIndex}
          onFrameSelect={setCurrentFrameIndex}
          onPlayPause={handlePlayPause}
        />
      </div>
    );
  },
};

export const FrameDurationEditing: Story = {
  render: () => {
    const obj1 = createDefaultObject("Frame 1");
    const obj2 = createDefaultObject("Frame 2");
    const [animation, setAnimation] = useState<SpriteAnimation>({
      ...createDefaultAnimation("Walk Cycle"),
      frames: [
        { objectId: obj1.id, duration: 100 },
        { objectId: obj2.id, duration: 150 },
      ],
    });
    const [currentFrameIndex, setCurrentFrameIndex] = useState(0);

    const handleDurationChange = (frameIndex: number, duration: number) => {
      const newFrames = [...animation.frames];
      newFrames[frameIndex] = { ...newFrames[frameIndex], duration };
      setAnimation({ ...animation, frames: newFrames });
    };

    return (
      <div className="w-96">
        <AnimationTimeline
          animation={animation}
          currentFrameIndex={currentFrameIndex}
          onFrameSelect={setCurrentFrameIndex}
          onFrameDurationChange={handleDurationChange}
        />
      </div>
    );
  },
};

export const CurrentFrameIndicator: Story = {
  render: () => {
    const obj1 = createDefaultObject("Frame 1");
    const obj2 = createDefaultObject("Frame 2");
    const obj3 = createDefaultObject("Frame 3");
    const [animation] = useState<SpriteAnimation>({
      ...createDefaultAnimation("Walk Cycle"),
      frames: [
        { objectId: obj1.id, duration: 100 },
        { objectId: obj2.id, duration: 150 },
        { objectId: obj3.id, duration: 100 },
      ],
    });
    const [currentFrameIndex, setCurrentFrameIndex] = useState(1);
    return (
      <div className="w-96">
        <AnimationTimeline
          animation={animation}
          currentFrameIndex={currentFrameIndex}
          onFrameSelect={setCurrentFrameIndex}
        />
      </div>
    );
  },
};

export const Interactive: Story = {
  render: () => {
    const obj1 = createDefaultObject("Frame 1");
    const obj2 = createDefaultObject("Frame 2");
    const obj3 = createDefaultObject("Frame 3");
    const [animation, setAnimation] = useState<SpriteAnimation>({
      ...createDefaultAnimation("Walk Cycle"),
      frames: [
        { objectId: obj1.id, duration: 100 },
        { objectId: obj2.id, duration: 150 },
        { objectId: obj3.id, duration: 100 },
      ],
      playing: false,
    });
    const [currentFrameIndex, setCurrentFrameIndex] = useState(0);

    const handlePlayPause = () => {
      setAnimation({ ...animation, playing: !animation.playing });
    };

    const handleDurationChange = (frameIndex: number, duration: number) => {
      const newFrames = [...animation.frames];
      newFrames[frameIndex] = { ...newFrames[frameIndex], duration };
      setAnimation({ ...animation, frames: newFrames });
    };

    const handleFrameDelete = (frameIndex: number) => {
      const newFrames = animation.frames.filter((_, i) => i !== frameIndex);
      setAnimation({ ...animation, frames: newFrames });
      if (currentFrameIndex >= newFrames.length) {
        setCurrentFrameIndex(Math.max(0, newFrames.length - 1));
      }
    };

    return (
      <div className="w-96 space-y-4">
        <AnimationTimeline
          animation={animation}
          currentFrameIndex={currentFrameIndex}
          onFrameSelect={setCurrentFrameIndex}
          onPlayPause={handlePlayPause}
          onFrameDurationChange={handleDurationChange}
          onFrameDelete={handleFrameDelete}
        />
        <div className="text-xs text-muted-foreground space-y-1">
          <p>• Click frame to select</p>
          <p>• Edit duration to change frame timing</p>
          <p>• Use play/pause to control animation</p>
          <p>• Click trash icon to delete frame</p>
        </div>
      </div>
    );
  },
};

