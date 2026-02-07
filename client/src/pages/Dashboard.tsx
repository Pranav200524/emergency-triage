import { useState } from "react";
import { useResources, useAnalyzeMessages } from "@/hooks/use-triage";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { MapVisualization } from "@/components/MapVisualization";
import { UrgencyBadge } from "@/components/UrgencyBadge";
import { ScoreGauge } from "@/components/ScoreGauge";
import { ResourceIcon } from "@/components/ResourceIcon";
import { AnalyzedMessage } from "@shared/schema";
import { 
  Activity, 
  AlertOctagon, 
  Loader2, 
  Map as MapIcon, 
  MessageSquare, 
  Play, 
  RefreshCcw 
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const DEFAULT_INPUT = `Urgent help needed at 123 Broadway, severe flooding, trapped in basement.
Need medical assistance at Central Park South, elderly woman having chest pains.
Running out of food at the shelter on 42nd St, need supplies for 50 people.
Suspicious activity reported near Times Square station.
Tree down blocking road at 5th Ave and 34th St, no injuries.`;

export default function Dashboard() {
  const { toast } = useToast();
  const [input, setInput] = useState(DEFAULT_INPUT);
  const [analyzedMessages, setAnalyzedMessages] = useState<AnalyzedMessage[]>([]);
  
  const { data: resources = [], isLoading: isLoadingResources } = useResources();
  const { mutate: analyze, isPending: isAnalyzing } = useAnalyzeMessages();

  const handleAnalyze = () => {
    if (!input.trim()) {
      toast({
        title: "Input required",
        description: "Please enter some messages to analyze.",
        variant: "destructive",
      });
      return;
    }

    const messages = input.split('\n').filter(line => line.trim().length > 0);
    
    analyze(messages, {
      onSuccess: (data) => {
        setAnalyzedMessages(data.results);
        toast({
          title: "Analysis Complete",
          description: `Successfully processed ${data.results.length} messages.`,
        });
      },
      onError: (error) => {
        toast({
          title: "Analysis Failed",
          description: error.message,
          variant: "destructive",
        });
      },
    });
  };

  const handleClear = () => {
    setInput("");
    setAnalyzedMessages([]);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="h-16 border-b border-border/40 bg-card/50 backdrop-blur px-6 flex items-center justify-between shrink-0 z-10">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded bg-primary/20 flex items-center justify-center text-primary">
            <AlertOctagon className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-lg font-display font-bold tracking-tight text-foreground leading-none">
              ResQ<span className="text-primary">AI</span> Triage
            </h1>
            <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-mono">
              Emergency Command Center
            </p>
          </div>
        </div>
        <div className="flex items-center gap-4 text-xs font-mono text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            SYSTEM ONLINE
          </span>
          <span className="text-border">|</span>
          <span>{new Date().toLocaleDateString()} {new Date().toLocaleTimeString()}</span>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 p-4 md:p-6 overflow-hidden flex flex-col md:flex-row gap-6 h-[calc(100vh-4rem)]">
        
        {/* Left Panel: Input */}
        <div className="w-full md:w-[350px] lg:w-[400px] flex flex-col gap-4 shrink-0 h-full overflow-hidden">
          <Card className="flex-1 flex flex-col bg-card/50 border-white/5 shadow-xl">
            <CardHeader className="pb-3 border-b border-white/5">
              <CardTitle className="flex items-center gap-2 text-base">
                <MessageSquare className="w-4 h-4 text-primary" />
                Incoming Feed
              </CardTitle>
              <CardDescription className="text-xs">
                Paste raw emergency messages below (one per line).
              </CardDescription>
            </CardHeader>
            <CardContent className="flex-1 p-4 flex flex-col gap-4 min-h-0">
              <Textarea 
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Enter emergency messages..."
                className="flex-1 resize-none bg-background/50 border-white/10 font-mono text-xs leading-relaxed focus:ring-primary/20"
              />
              <div className="flex gap-2 shrink-0">
                <Button 
                  variant="outline" 
                  onClick={handleClear}
                  className="flex-1 border-white/10 hover:bg-white/5 hover:text-white"
                >
                  <RefreshCcw className="w-4 h-4 mr-2" />
                  Clear
                </Button>
                <Button 
                  onClick={handleAnalyze}
                  disabled={isAnalyzing}
                  className="flex-[2] bg-primary hover:bg-primary/90 text-primary-foreground font-semibold shadow-[0_0_20px_-5px_rgba(59,130,246,0.5)]"
                >
                  {isAnalyzing ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Analyzing...
                    </>
                  ) : (
                    <>
                      <Play className="w-4 h-4 mr-2 fill-current" />
                      Run Analysis
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Stats Card */}
          <Card className="shrink-0 bg-card/50 border-white/5">
            <CardContent className="p-4 grid grid-cols-2 gap-4">
              <div>
                <div className="text-xs text-muted-foreground uppercase font-bold mb-1">Processed</div>
                <div className="text-2xl font-mono font-bold text-foreground">
                  {analyzedMessages.length}
                </div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground uppercase font-bold mb-1">Critical</div>
                <div className="text-2xl font-mono font-bold text-red-500">
                  {analyzedMessages.filter(m => m.urgency_level === 'high').length}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Panel: Visualization & Results */}
        <div className="flex-1 flex flex-col gap-6 h-full overflow-hidden min-w-0">
          
          {/* Map View */}
          <div className="h-[45%] min-h-[300px] shrink-0 relative group">
            <div className="absolute top-4 left-4 z-10 bg-background/90 backdrop-blur border border-white/10 px-3 py-1.5 rounded-md shadow-lg flex items-center gap-2">
              <MapIcon className="w-4 h-4 text-primary" />
              <span className="text-xs font-bold uppercase tracking-wider text-foreground">Geospatial View</span>
            </div>
            
            {isLoadingResources ? (
              <div className="w-full h-full flex items-center justify-center bg-muted/20 border border-white/5 rounded-xl">
                <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <MapVisualization 
                resources={resources} 
                analyzedMessages={analyzedMessages} 
              />
            )}
          </div>

          {/* Results Table */}
          <Card className="flex-1 min-h-0 bg-card/50 border-white/5 shadow-xl flex flex-col">
            <CardHeader className="py-3 border-b border-white/5 shrink-0">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Activity className="w-4 h-4 text-primary" />
                  Triage Results
                </CardTitle>
                <div className="text-xs text-muted-foreground">
                  Sorted by Urgency Score
                </div>
              </div>
            </CardHeader>
            <div className="flex-1 overflow-auto">
              <Table>
                <TableHeader className="bg-muted/30 sticky top-0 backdrop-blur z-10">
                  <TableRow className="hover:bg-transparent border-white/5">
                    <TableHead className="w-[80px] font-bold text-xs uppercase">Score</TableHead>
                    <TableHead className="w-[100px] font-bold text-xs uppercase">Level</TableHead>
                    <TableHead className="font-bold text-xs uppercase">Need & Context</TableHead>
                    <TableHead className="font-bold text-xs uppercase">Location</TableHead>
                    <TableHead className="font-bold text-xs uppercase text-right">Resource Match</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {analyzedMessages.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="h-32 text-center text-muted-foreground">
                        No active incidents. Run analysis to populate triage table.
                      </TableCell>
                    </TableRow>
                  ) : (
                    analyzedMessages.map((msg) => (
                      <TableRow key={msg.id} className="border-white/5 hover:bg-white/5 transition-colors group">
                        <TableCell>
                          <ScoreGauge score={msg.urgency_score} />
                        </TableCell>
                        <TableCell>
                          <UrgencyBadge level={msg.urgency_level} />
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col gap-1">
                            <span className="font-medium text-sm text-foreground">{msg.need}</span>
                            <span className="text-xs text-muted-foreground line-clamp-1 group-hover:line-clamp-none transition-all duration-300">
                              "{msg.original_content}"
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="text-xs font-mono text-muted-foreground">
                          {msg.location}
                        </TableCell>
                        <TableCell className="text-right">
                          {msg.matched_resource ? (
                            <div className="flex items-center justify-end gap-2 text-emerald-500">
                              <span className="text-xs font-medium">{msg.matched_resource.name}</span>
                              <ResourceIcon type={msg.matched_resource.type} className="w-4 h-4" />
                            </div>
                          ) : (
                            <span className="text-xs text-muted-foreground italic">No nearby match</span>
                          )}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </Card>
        </div>
      </main>
    </div>
  );
}
