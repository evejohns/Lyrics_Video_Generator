import React from 'react';
import { Composition } from 'remotion';
import { LyricVideo } from './LyricVideo';

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id="LyricVideo"
        component={LyricVideo as any}
        durationInFrames={300}
        fps={30}
        width={1920}
        height={1080}
        defaultProps={{
          lyrics: [],
          audioUrl: '',
          template: {},
          config: {},
        }}
      />
    </>
  );
};
