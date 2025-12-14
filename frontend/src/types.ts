export interface AnalysisResult {
  id: string;
  owner: string;
  name: string;
  graph: {
    nodes: any[];
    links: any[];
  };
  narrative: string;
  metrics: {
    hotspots: string[];
  };
  clusters: Record<string, any>;
}

export interface GraphData {
  nodes: any[];
  links: any[];
}