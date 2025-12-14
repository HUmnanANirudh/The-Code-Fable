export interface HistoryItem {
  id: string;
  owner: string;
  name: string;
}

export interface Node {
  id: string;
  group: string;
  size: number;
}

export interface Link {
  source: string;
  target: string;
}

export interface GraphData {
  nodes: Node[];
  links: Link[];
}

export interface AnalysisResult extends HistoryItem {
  graph: GraphData;
  narrative: string;
  metrics: {
    hotspots: string[];
  };
  clusters: Record<string, string[]>;
}