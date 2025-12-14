import React from "react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "./ui/accordion";
import { Avatar, AvatarFallback } from "./ui/avatar";
import { Card, CardContent } from "./ui/card";
import GraphDisplay from "./GraphDisplay";
import type { AnalysisResult } from "@/types";
import { Bot } from "lucide-react";

interface ResultsProps {
  data: AnalysisResult | { repo: AnalysisResult };
}

const ResultsDisplay: React.FC<ResultsProps> = ({ data }) => {
  if (!data) {
    return null;
  }

  const displayData = "repo" in data ? data.repo : data;

  return (
    <div className="w-[800px] mt-4 p-4 space-y-4">
      <div className="flex items-start space-x-4">
        <Avatar>
          <AvatarFallback>
            <Bot />
          </AvatarFallback>
        </Avatar>
        <Card className="flex-1">
          <CardContent className="p-4">
            <p className="text-muted-foreground">{displayData.narrative}</p>
          </CardContent>
        </Card>
      </div>

      <Accordion type="single" collapsible className="w-full">
        <AccordionItem value="item-1">
          <AccordionTrigger>View detailed analysis</AccordionTrigger>
          <AccordionContent>
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-bold mb-2">
                  Synaptic Neuron Graph
                </h3>
                <div className="border rounded-lg h-[400px]">
                  <GraphDisplay graphData={displayData.graph} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <h3 className="text-lg font-bold mb-2">Hotspots</h3>
                  <ul className="list-disc list-inside text-muted-foreground">
                    {displayData.metrics.hotspots.map((hotspot: string) => (
                      <li key={hotspot}>{hotspot}</li>
                    ))}
                  </ul>
                </div>
                <div>
                  <h3 className="text-lg font-bold mb-2">
                    Architecture Clusters
                  </h3>
                  <ul className="list-disc list-inside text-muted-foreground">
                    {Object.keys(displayData.clusters).map((cluster: string) => (
                      <li key={cluster}>{cluster}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  );
};

export default ResultsDisplay;
