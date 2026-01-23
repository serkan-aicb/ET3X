"use client";

import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { SearchIcon, RotateCcwIcon } from "lucide-react";
import { toast } from "sonner";

// Hardcoded DIDs - Replace with real DIDs as needed
const HARDCODED_DIDS: string[] = [
  "did:example:001", "did:example:002", "did:example:003", "did:example:004", "did:example:005",
  "did:example:006", "did:example:007", "did:example:008", "did:example:009", "did:example:010",
  "did:example:011", "did:example:012", "did:example:013", "did:example:014", "did:example:015",
  "did:example:016", "did:example:017", "did:example:018", "did:example:019", "did:example:020",
  "did:example:021", "did:example:022", "did:example:023", "did:example:024", "did:example:025",
  "did:example:026", "did:example:027", "did:example:028", "did:example:029", "did:example:030",
  "did:example:031", "did:example:032", "did:example:033", "did:example:034", "did:example:035",
  "did:example:036", "did:example:037", "did:example:038", "did:example:039", "did:example:040",
  "did:example:041", "did:example:042", "did:example:043", "did:example:044", "did:example:045",
  "did:example:046", "did:example:047", "did:example:048", "did:example:049", "did:example:050",
  "did:example:051", "did:example:052", "did:example:053", "did:example:054", "did:example:055",
  "did:example:056", "did:example:057", "did:example:058", "did:example:059", "did:example:060",
  "did:example:061", "did:example:062", "did:example:063", "did:example:064", "did:example:065",
  "did:example:066", "did:example:067", "did:example:068", "did:example:069", "did:example:070",
  "did:example:071", "did:example:072", "did:example:073", "did:example:074"
];

// Task definitions
const TASKS = [
  { id: "task1", name: "Task 1" },
  { id: "task2", name: "Task 2" },
  { id: "task3", name: "Task 3" },
  { id: "task4", name: "Task 4" }
];

type RatingValue = 0 | 1 | 2 | 3 | 4 | 5;
type RatingsState = Record<string, Record<string, RatingValue>>;

export function ProfessorRateAllTable() {
  const [searchTerm, setSearchTerm] = useState("");
  const [ratings, setRatings] = useState<RatingsState>(() => {
    // Initialize all ratings to 0
    const initialState: RatingsState = {};
    HARDCODED_DIDS.forEach(did => {
      initialState[did] = {};
      TASKS.forEach(task => {
        initialState[did][task.id] = 0;
      });
    });
    return initialState;
  });

  // Filter DIDs based on search term
  const filteredDids = useMemo(() => {
    if (!searchTerm) return HARDCODED_DIDS;
    const term = searchTerm.toLowerCase();
    return HARDCODED_DIDS.filter(did => did.toLowerCase().includes(term));
  }, [searchTerm]);

  const handleRatingChange = (did: string, taskId: string, value: string) => {
    const numValue = parseInt(value, 10);
    
    // Allow empty string (user clearing input)
    if (value === '') {
      setRatings(prev => ({
        ...prev,
        [did]: {
          ...prev[did],
          [taskId]: 0
        }
      }));
      return;
    }
    
    // Validate input - only allow 0-5
    if (isNaN(numValue) || numValue < 0 || numValue > 5) {
      toast.error("Please enter a value between 0 and 5");
      return;
    }
    
    setRatings(prev => ({
      ...prev,
      [did]: {
        ...prev[did],
        [taskId]: numValue as RatingValue
      }
    }));
  };

  const handleSubmit = () => {
    // Validate that all ratings are between 0-5
    const allValid = Object.values(ratings).every(didRatings =>
      Object.values(didRatings).every(rating => rating >= 0 && rating <= 5)
    );
    
    if (!allValid) {
      toast.error("Please ensure all ratings are between 0 and 5");
      return;
    }
    
    toast.success("Ratings have been assigned to the DIDs.");
  };

  const handleReset = () => {
    const resetState: RatingsState = {};
    HARDCODED_DIDS.forEach(did => {
      resetState[did] = {};
      TASKS.forEach(task => {
        resetState[did][task.id] = 0;
      });
    });
    setRatings(resetState);
    toast.info("All ratings have been reset to 0");
  };

  return (
    <div className="space-y-6">
      {/* Search and Actions */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="relative w-full sm:w-64">
          <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Search by DID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleReset}>
            <RotateCcwIcon className="mr-2 h-4 w-4" />
            Reset
          </Button>
          <Button onClick={handleSubmit}>
            Submit
          </Button>
        </div>
      </div>

      {/* Results count */}
      <div className="text-sm text-muted-foreground">
        Showing {filteredDids.length} of {HARDCODED_DIDS.length} DIDs
      </div>

      {/* Ratings Table */}
      <div className="rounded-2xl border border-border/40 bg-background/30 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-muted/30 sticky top-0">
              <TableRow>
                <TableHead className="font-semibold text-foreground sticky left-0 bg-muted/30 z-10 min-w-64 md:min-w-80">
                  DID
                </TableHead>
                {TASKS.map(task => (
                  <TableHead key={task.id} className="text-center font-semibold text-foreground w-24">
                    <div className="truncate">{task.name}</div>
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredDids.map(did => (
                <TableRow key={did} className="border-b-border/20 hover:bg-muted/10">
                  <TableCell className="font-mono text-sm sticky left-0 bg-background z-10">
                    {did}
                  </TableCell>
                  {TASKS.map(task => (
                    <TableCell key={task.id} className="text-center p-2">
                      <Input
                        type="number"
                        min="0"
                        max="5"
                        value={ratings[did][task.id]}
                        onChange={(e) => handleRatingChange(did, task.id, e.target.value)}
                        className={`w-16 text-center h-9 ${ratings[did][task.id] !== 0 ? 'bg-primary/10 border-primary/30' : ''}`}
                        aria-label={`Rating for ${task.name} for DID ${did}`}
                      />
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>

      {filteredDids.length === 0 && (
        <div className="text-center py-12">
          <div className="text-muted-foreground">
            No DIDs match your search criteria
          </div>
        </div>
      )}
    </div>
  );
}