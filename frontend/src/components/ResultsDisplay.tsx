import React, { useState, useMemo } from "react";
import { Avatar, AvatarFallback } from "./ui/avatar";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "./ui/card";
import GraphDisplay from "./GraphDisplay";
import type { AnalysisResult } from "@/types";
import { Bot, GitGraph, FileText, Activity, Info, ChevronDown, ChevronUp } from "lucide-react";
import { motion } from "motion/react";
import ReactMarkdown from "react-markdown";
import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "./ui/tooltip";
import { Button } from "./ui/button";

interface ResultsProps {
  data: AnalysisResult;
}

const containerVariants: any = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const itemVariants: any = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.5,
      ease: [0.22, 1, 0.36, 1],
    },
  },
};

const ResultsDisplay: React.FC<ResultsProps> = ({ data }) => {
  const [selectedCluster, setSelectedCluster] = useState<string | null>(null);
  const [showAllClusters, setShowAllClusters] = useState(false);

  if (!data) {
    return null;
  }

  // Filter graph data based on selected cluster
  const filteredGraphData = useMemo(() => {
    if (!selectedCluster) return data.graph;

    const nodes = data.graph.nodes.filter((node: any) => node.group === selectedCluster);
    const nodeIds = new Set(nodes.map((n: any) => n.id));
    const links = data.graph.links.filter(
      (link: any) => nodeIds.has(link.source.id || link.source) && nodeIds.has(link.target.id || link.target)
    );

    return { nodes, links };
  }, [data.graph, selectedCluster]);

  const clusterKeys = Object.keys(data.clusters).filter(key => {
    // Check if key is empty/whitespace
    if (!key || key.trim() === "") return false;
    
    // Check if the cluster array exists and has length > 0
    const clusterItems = data.clusters[key];
    return Array.isArray(clusterItems) && clusterItems.length > 0;
  });
  const displayedClusters = showAllClusters ? clusterKeys : clusterKeys.slice(0, 10);
  const hasMoreClusters = clusterKeys.length > 10;


  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="w-full space-y-6"
    >
      {/* Narrative Section */}
      <motion.div variants={itemVariants}>
        <div className="flex gap-6 p-6 bg-card/50 backdrop-blur-md rounded-2xl border border-primary/10 shadow-sm relative overflow-hidden group">
             <Avatar className="w-12 h-12 border border-primary/20 mt-1 shrink-0 bg-background shadow-md">
              <AvatarFallback className="bg-primary text-primary-foreground">
                <Bot className="w-6 h-6" />
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 space-y-4">
              <h3 className="text-xl font-bold text-foreground">
                  The Tale
              </h3>
              <div className="prose dark:prose-invert max-w-none text-foreground/90 leading-relaxed text-lg font-light">
                 <ReactMarkdown>{data.narrative}</ReactMarkdown>
              </div>
            </div>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* LEFT COLUMN (2/3): Graph & Clusters */}
          <div className="lg:col-span-2 space-y-6">
              {/* Graph Container */}
              <motion.div variants={itemVariants}>
                 <div className="bg-card/50 backdrop-blur-xl rounded-2xl border border-primary/20 overflow-hidden shadow-sm relative group h-[450px]">
                     <div className="absolute top-4 left-4 z-10 bg-background/80 backdrop-blur px-4 py-2 rounded-full border border-primary/20 text-sm font-medium text-foreground flex items-center gap-2 shadow-lg">
                       <Activity className="w-4 h-4 text-primary animate-pulse" />
                       {selectedCluster ? `Filtering: ${selectedCluster}` : "Full Architecture"}
                       {selectedCluster && (
                          <button onClick={() => setSelectedCluster(null)} className="ml-2 text-xs text-muted-foreground hover:text-primary underline">
                              Clear
                          </button>
                       )}
                     </div>
                     <GraphDisplay graphData={filteredGraphData} />
                 </div>
              </motion.div>

              {/* Clusters Card */}
              <motion.div variants={itemVariants}>
                <Card className="border-primary/20 bg-card/50 backdrop-blur-md shadow-sm">
                  <CardHeader className="pb-3 border-b border-border/10">
                    <CardTitle className="flex items-center gap-2 text-lg font-bold text-foreground">
                      <GitGraph className="w-5 h-5 text-accent" />
                      Architecture Clusters
                    </CardTitle>
                    <CardDescription>Select a cluster to visualize specific modules.</CardDescription>
                  </CardHeader>
                  <CardContent className="pt-4">
                    <div className="flex flex-wrap gap-2">
                      {displayedClusters.map((cluster: string) => (
                        <button 
                          key={cluster} 
                          onClick={() => setSelectedCluster(cluster === selectedCluster ? null : cluster)}
                          className={cn(
                              "px-3 py-1.5 rounded-full text-xs font-bold border transition-all duration-300",
                              cluster === selectedCluster 
                                ? "bg-primary text-primary-foreground border-primary shadow-md scale-105"
                                : "bg-card hover:bg-muted text-muted-foreground hover:text-foreground border-border hover:border-primary/30"
                          )}
                        >
                          {cluster}
                        </button>
                      ))}
                    </div>
                    {hasMoreClusters && (
                        <div className="mt-4 flex justify-center">
                            <Button 
                                variant="ghost" 
                                size="sm" 
                                onClick={() => setShowAllClusters(!showAllClusters)}
                                className="text-muted-foreground hover:text-primary"
                            >
                                {showAllClusters ? (
                                    <><ChevronUp className="w-4 h-4 mr-1" /> Show Less</>
                                ) : (
                                    <><ChevronDown className="w-4 h-4 mr-1" /> Show {clusterKeys.length - 10} More</>
                                )}
                            </Button>
                        </div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
          </div>

          {/* RIGHT COLUMN (1/3): Hotspots */}
          <motion.div variants={itemVariants} className="lg:h-full">
            <Card className="h-full border-destructive/20 bg-card/50 backdrop-blur-md shadow-sm flex flex-col">
              <CardHeader className="pb-3 border-b border-border/10">
                <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2 text-lg font-bold text-foreground">
                    <FileText className="w-5 h-5 text-destructive" />
                    Hotspots
                    </CardTitle>
                    <TooltipProvider>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Info className="w-4 h-4 text-muted-foreground cursor-help" />
                            </TooltipTrigger>
                            <TooltipContent className="max-w-xs bg-popover text-popover-foreground border-border text-sm p-3">
                                <p className="font-semibold mb-1">What is a Hotspot?</p>
                                <p>Hotspots are files that are frequently changed and have high complexity. They are often sources of technical debt and potential bugs.</p>
                            </TooltipContent>
                        </Tooltip>
                    </TooltipProvider>
                </div>
                <CardDescription>High complexity zones requiring attention.</CardDescription>
              </CardHeader>
              <CardContent className="pt-4 overflow-y-auto flex-1 max-h-[800px]">
                <ul className="space-y-3">
                  {data.metrics.hotspots.map((hotspot: string) => (
                    <li key={hotspot} className="text-sm font-medium text-foreground/80 bg-destructive/5 px-3 py-3 rounded-lg border border-destructive/10 flex items-start gap-3 hover:bg-destructive/10 transition-colors">
                      <span className="w-2 h-2 rounded-full bg-destructive mt-1.5 shrink-0 animate-pulse" />
                      <span className="break-all">{hotspot}</span>
                    </li>
                  ))}
                  {data.metrics.hotspots.length === 0 && (
                      <li className="text-sm text-muted-foreground italic text-center py-4">No significant hotspots detected. 🎉</li>
                  )}
                </ul>
              </CardContent>
            </Card>
          </motion.div>

      </div>
    </motion.div>
  );
};

export default ResultsDisplay;
