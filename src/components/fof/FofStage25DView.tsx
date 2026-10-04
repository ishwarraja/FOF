import React from 'react';
import CombatRenderer, { type CombatRendererProps, type CameraPreset, type FofStage25DViewHandle } from './CombatRenderer';

export type { CameraPreset, FofStage25DViewHandle };
export type FofStage25DViewProps = CombatRendererProps;

/** Compatibility wrapper. The old CSS/card renderer is intentionally removed from the 2.5D path. */
export const FofStage25DView = React.forwardRef<FofStage25DViewHandle, FofStage25DViewProps>(function FofStage25DView(props, ref) {
  return <CombatRenderer {...props} ref={ref} />;
});

export default FofStage25DView;
