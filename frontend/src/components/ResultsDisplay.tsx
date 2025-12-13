import React from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "./ui/card";
import GraphDisplay from "./GraphDisplay";

interface ResultsProps {
  data: any;
}

const ResultsDisplay: React.FC<ResultsProps> = ({ data }) => {
  if (!data) {
    return null;
  }

  // Placeholder for graph data
  const graphData = {
    nodes: [
      { id: "A", group: 1 },
      { id: "B", group: 1 },
      { id: "C", group: 2 },
    ],
    links: [
      { source: "A", target: "B" },
      { source: "B", target: "C" },
    ],
  };

  return (
    <Card className="w-[800px] mt-4">
      <CardHeader>
        <CardTitle>Analysis Results</CardTitle>
        <CardDescription>
          Here is the fable of the repository.
        </CardDescription>
      </CardHeader>
      <CardContent className="grid gap-6">
        <div>
          <h3 className="text-lg font-bold mb-2">Synaptic Neuron Graph</h3>
          <div className="border rounded-lg h-[400px]">
            <GraphDisplay graphData={data.results.graph} />
        </div>
        <div>
          <h3 className="text-lg font-bold mb-2">Copilot-generated Story</h3>
          <p className="text-muted-foreground">{data.results.narrative}</p>
        </div>
        <div className="grid grid-cols-2 gap-6">
          <div>
            <h3 className="text-lg font-bold mb-2">Hotspots</h3>
            <ul className="list-disc list-inside text-muted-foreground">
              {data.results.metrics.hotspots.map((hotspot: string) => (
                <li key={hotspot}>{hotspot}</li>
              ))}
            </ul>
          </div>
          <div>
            <h3 className="text-lg font-bold mb-2">Architecture Clusters</h3>
            <ul className="list-disc list-inside text-muted-foreground">
              {Object.keys(data.results.clusters).map((cluster: string) => (
                <li key={cluster}>{cluster}</li>
              ))}
            </ul>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ResultsDisplay;
