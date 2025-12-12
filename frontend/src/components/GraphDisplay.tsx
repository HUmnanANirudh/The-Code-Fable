import React from "react";
import ForceGraph2D from "react-force-graph-2d";

interface GraphProps {
  graphData: {
    nodes: any[];
    links: any[];
  };
}

const GraphDisplay: React.FC<GraphProps> = ({ graphData }) => {
  return (
    <ForceGraph2D
      graphData={graphData}
      nodeLabel="id"
      nodeAutoColorBy="group"
      linkDirectionalArrowLength={3.5}
      linkDirectionalArrowRelPos={1}
    />
  );
};

export default GraphDisplay;
