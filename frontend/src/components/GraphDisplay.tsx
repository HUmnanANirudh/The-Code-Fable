import React, { useRef } from "react";
import ForceGraph2D from "react-force-graph-2d";

interface GraphProps {
  graphData: {
    nodes: any[];
    links: any[];
  };
}

const GraphDisplay: React.FC<GraphProps> = ({ graphData }) => {
  const fgRef = useRef<any>(null);

  return (
    <ForceGraph2D
      ref={fgRef}
      graphData={graphData}
      nodeLabel="id"
      nodeAutoColorBy="group"
      linkDirectionalArrowLength={3.5}
      linkDirectionalArrowRelPos={1}
      cooldownTicks={100}
      onEngineStop={() => fgRef.current?.zoomToFit(400, 50)}
    />
  );
};

export default GraphDisplay;
