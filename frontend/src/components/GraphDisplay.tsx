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

  // Deep clone the data to avoid mutation issues with react-force-graph
  const memoizedGraphData = React.useMemo(() => {
    return {
      nodes: graphData.nodes.map((node: any) => ({ ...node })),
      links: graphData.links.map((link: any) => ({
        ...link,
        source: typeof link.source === 'object' ? link.source.id : link.source,
        target: typeof link.target === 'object' ? link.target.id : link.target
      }))
    };
  }, [graphData]);

  React.useEffect(() => {
    if (fgRef.current) {
      // Configure forces for "atom-like" structure
      fgRef.current.d3Force('charge').strength(-100);
      fgRef.current.d3Force('link').distance(30);
      fgRef.current.d3ReheatSimulation();
    }
  }, [memoizedGraphData]);

  return (
    <ForceGraph2D
      ref={fgRef}
      graphData={memoizedGraphData}
      nodeLabel="id"
      nodeAutoColorBy="group"
      nodeRelSize={6}
      linkDirectionalArrowLength={3.5}
      linkDirectionalArrowRelPos={1}
      linkColor={() => "rgba(100, 100, 100, 0.8)"} // More opaque, darker gray
      linkWidth={2} // Thicker links
      cooldownTicks={100}
      onEngineStop={() => fgRef.current?.zoomToFit(400, 50)}
    />
  );
};

export default GraphDisplay;
