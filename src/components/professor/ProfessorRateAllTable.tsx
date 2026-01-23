"use client";

import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { SearchIcon, RotateCcwIcon } from "lucide-react";
import { toast } from "sonner";

// Types
type RatingValue = 0 | 1 | 2 | 3 | 4 | 5;
type RatingsState = Record<string, Record<string, RatingValue>>;

// Task definitions
const TASKS = [
  { id: "task1", name: "Task 1" },
  { id: "task2", name: "Task 2" },
  { id: "task3", name: "Task 3" },
  { id: "task4", name: "Task 4" }
] as const;

// ✅ Hardcoded DIDs from table (prefix "stud" added)
const HARDCODED_DIDS: string[] = [
  "stud109817796804",
  "stud11664237230",
  "stud12131266977",
  "stud132475657566",
  "stud134077556914",
  "stud13470470697",
  "stud142126515142",
  "stud148361696993",
  "stud158514080977",
  "stud164088612158",
  "stud16480378358",
  "stud17069056063",
  "stud192329552129",
  "stud19490462256",
  "stud205800530622",
  "stud205936310728",
  "stud21853731168",
  "stud24139321122",
  "stud25301029557",
  "stud25665705647",
  "stud273298793113",
  "stud28052772393",
  "stud28332807336",
  "stud283863971484",
  "stud28789095015",
  "stud291122334455",
  "stud292007200225",
  "stud292173949005",
  "stud300179064950",
  "stud303418484641",
  "stud32095154575",
  "stud34115060030",
  "stud35105325918",
  "stud366482462115",
  "stud380561764531",
  "stud398360603922",
  "stud44079580363",
  "stud47106740283",
  "stud475626763237",
  "stud47902090983",
  "stud482781070114",
  "stud486094326474",
  "stud48801704977",
  "stud507339032194",
  "stud52407797578",
  "stud55202394475",
  "stud56094865405",
  "stud56263411324",
  "stud56801337042",
  "stud57095051677",
  "stud601216215394",
  "stud60608682337",
  "stud607512661447",
  "stud615378151109",
  "stud62400636513",
  "stud635224371475",
  "stud63550060483",
  "stud64176292258",
  "stud65081678165",
  "stud65988413631",
  "stud68053329076",
  "stud68249328976",
  "stud690643170387",
  "stud696120634224",
  "stud70150468622",
  "stud715939477823",
  "stud71762495731",
  "stud721852487854",
  "stud72825983132",
  "stud732642705254",
  "stud73831313751",
  "stud75544216641",
  "stud759729821218",
  "stud76012252473",
  "stud767659405415",
  "stud77372361481",
  "stud78477689232",
  "stud785099775437",
  "stud78620024184",
  "stud78828373159",
  "stud80069956771",
  "stud80282551358",
  "stud822155059293",
  "stud826594866764",
  "stud837622889833",
  "stud845501963003",
  "stud847015765183",
  "stud856998020229",
  "stud857372518173",
  "stud85990168958",
  "stud869005963376",
  "stud893477209434",
  "stud900862091687",
  "stud905125164740",
  "stud92321407066",
  "stud92563591384",
  "stud928061151477",
  "stud93044215403",
  "stud93068245615",
  "stud94843636884",
  "stud94975727316",
  "stud951960840073",
  "stud96741083542",
  "stud968147506223",
  "stud98487697975",
  "stud985451165621"
];

// ✅ Initial Ratings from table (blanks -> 0; "NA" -> 0; ignore "Yes" columns)
const INITIAL_RATINGS: RatingsState = {
  "stud109817796804": { task1: 4, task2: 5, task3: 4, task4: 4 },
  "stud11664237230": { task1: 4, task2: 5, task3: 4, task4: 4 },
  "stud12131266977": { task1: 5, task2: 5, task3: 4, task4: 4 },
  "stud132475657566": { task1: 3, task2: 5, task3: 4, task4: 4 },
  "stud134077556914": { task1: 3, task2: 5, task3: 4, task4: 4 },
  "stud13470470697": { task1: 5, task2: 5, task3: 5, task4: 4 },
  "stud142126515142": { task1: 4, task2: 5, task3: 0, task4: 4 }, // NA -> 0
  "stud148361696993": { task1: 3, task2: 5, task3: 4, task4: 4 },
  "stud158514080977": { task1: 4, task2: 5, task3: 4, task4: 4 },
  "stud164088612158": { task1: 4, task2: 5, task3: 4, task4: 4 },
  "stud16480378358": { task1: 2, task2: 5, task3: 4, task4: 4 },
  "stud17069056063": { task1: 3, task2: 5, task3: 4, task4: 4 },
  "stud192329552129": { task1: 3, task2: 5, task3: 4, task4: 4 },
  "stud19490462256": { task1: 4, task2: 3, task3: 4, task4: 4 },
  "stud205800530622": { task1: 3, task2: 5, task3: 4, task4: 4 },
  "stud205936310728": { task1: 4, task2: 5, task3: 4, task4: 4 },
  "stud21853731168": { task1: 4, task2: 5, task3: 3, task4: 4 },
  "stud24139321122": { task1: 4, task2: 5, task3: 4, task4: 5 },
  "stud25301029557": { task1: 3, task2: 5, task3: 4, task4: 4 },
  "stud25665705647": { task1: 4, task2: 5, task3: 4, task4: 4 },
  "stud273298793113": { task1: 4, task2: 5, task3: 4, task4: 4 },
  "stud28052772393": { task1: 5, task2: 5, task3: 4, task4: 4 },
  "stud28332807336": { task1: 5, task2: 5, task3: 4, task4: 4 },
  "stud283863971484": { task1: 4, task2: 5, task3: 0, task4: 4 }, // NA -> 0
  "stud28789095015": { task1: 3, task2: 5, task3: 4, task4: 4 },
  "stud291122334455": { task1: 3, task2: 5, task3: 4, task4: 4 },
  "stud292007200225": { task1: 3, task2: 5, task3: 4, task4: 4 },

  // NOTE: DID appears twice in provided table. Using the second row values (last wins):
  "stud292173949005": { task1: 2, task2: 5, task3: 4, task4: 4 },

  "stud300179064950": { task1: 3, task2: 3, task3: 4, task4: 4 },
  "stud303418484641": { task1: 3, task2: 5, task3: 3, task4: 4 },
  "stud32095154575": { task1: 2, task2: 3, task3: 4, task4: 4 },
  "stud34115060030": { task1: 4, task2: 5, task3: 4, task4: 4 },
  "stud35105325918": { task1: 2, task2: 5, task3: 4, task4: 5 },
  "stud366482462115": { task1: 4, task2: 5, task3: 4, task4: 4 },
  "stud380561764531": { task1: 4, task2: 5, task3: 4, task4: 4 },
  "stud398360603922": { task1: 4, task2: 5, task3: 4, task4: 4 },
  "stud44079580363": { task1: 4, task2: 5, task3: 4, task4: 4 },
  "stud47106740283": { task1: 5, task2: 5, task3: 4, task4: 4 },
  "stud475626763237": { task1: 3, task2: 5, task3: 4, task4: 4 },
  "stud47902090983": { task1: 5, task2: 5, task3: 5, task4: 5 },
  "stud482781070114": { task1: 3, task2: 5, task3: 4, task4: 4 },
  "stud486094326474": { task1: 2, task2: 5, task3: 0, task4: 4 }, // NA -> 0
  "stud48801704977": { task1: 5, task2: 5, task3: 4, task4: 4 },
  "stud507339032194": { task1: 2, task2: 5, task3: 4, task4: 4 },
  "stud52407797578": { task1: 3, task2: 5, task3: 4, task4: 4 },
  "stud55202394475": { task1: 3, task2: 5, task3: 4, task4: 4 },
  "stud56094865405": { task1: 4, task2: 5, task3: 4, task4: 4 },
  "stud56263411324": { task1: 3, task2: 5, task3: 4, task4: 5 },
  "stud56801337042": { task1: 3, task2: 5, task3: 4, task4: 4 },
  "stud57095051677": { task1: 4, task2: 5, task3: 4, task4: 4 },
  "stud601216215394": { task1: 3, task2: 0, task3: 0, task4: 0 }, // NA -> 0
  "stud60608682337": { task1: 3, task2: 5, task3: 4, task4: 4 },
  "stud607512661447": { task1: 4, task2: 5, task3: 4, task4: 4 },
  "stud615378151109": { task1: 2, task2: 5, task3: 3, task4: 4 },
  "stud62400636513": { task1: 5, task2: 5, task3: 4, task4: 4 },
  "stud635224371475": { task1: 3, task2: 4, task3: 4, task4: 4 },
  "stud63550060483": { task1: 3, task2: 5, task3: 3, task4: 4 },
  "stud64176292258": { task1: 3, task2: 4, task3: 5, task4: 4 },
  "stud65081678165": { task1: 3, task2: 5, task3: 4, task4: 4 },
  "stud65988413631": { task1: 5, task2: 5, task3: 4, task4: 4 },
  "stud68053329076": { task1: 3, task2: 5, task3: 3, task4: 4 },
  "stud68249328976": { task1: 3, task2: 4, task3: 4, task4: 4 },
  "stud690643170387": { task1: 5, task2: 5, task3: 5, task4: 4 },
  "stud696120634224": { task1: 3, task2: 5, task3: 4, task4: 4 },
  "stud70150468622": { task1: 4, task2: 5, task3: 4, task4: 4 },
  "stud715939477823": { task1: 2, task2: 5, task3: 4, task4: 4 },
  "stud71762495731": { task1: 5, task2: 5, task3: 5, task4: 5 },
  "stud721852487854": { task1: 2, task2: 5, task3: 4, task4: 4 },
  "stud72825983132": { task1: 4, task2: 5, task3: 4, task4: 4 },
  "stud732642705254": { task1: 4, task2: 5, task3: 4, task4: 4 },
  "stud73831313751": { task1: 2, task2: 5, task3: 4, task4: 4 },
  "stud75544216641": { task1: 3, task2: 5, task3: 4, task4: 4 },
  "stud759729821218": { task1: 3, task2: 5, task3: 3, task4: 4 },
  "stud76012252473": { task1: 4, task2: 5, task3: 4, task4: 4 },
  "stud767659405415": { task1: 2, task2: 5, task3: 3, task4: 4 },
  "stud77372361481": { task1: 3, task2: 5, task3: 4, task4: 4 },
  "stud78477689232": { task1: 3, task2: 5, task3: 4, task4: 4 },
  "stud785099775437": { task1: 3, task2: 5, task3: 3, task4: 4 },
  "stud78620024184": { task1: 3, task2: 5, task3: 0, task4: 4 }, // NA -> 0
  "stud78828373159": { task1: 4, task2: 5, task3: 4, task4: 4 },
  "stud80069956771": { task1: 2, task2: 4, task3: 4, task4: 4 },
  "stud80282551358": { task1: 3, task2: 5, task3: 4, task4: 4 },
  "stud822155059293": { task1: 4, task2: 5, task3: 4, task4: 4 },
  "stud826594866764": { task1: 1, task2: 5, task3: 4, task4: 4 },
  "stud837622889833": { task1: 3, task2: 5, task3: 3, task4: 4 },
  "stud845501963003": { task1: 4, task2: 5, task3: 4, task4: 4 },
  "stud847015765183": { task1: 4, task2: 5, task3: 4, task4: 4 },
  "stud856998020229": { task1: 3, task2: 5, task3: 4, task4: 4 },
  "stud857372518173": { task1: 2, task2: 4, task3: 4, task4: 4 },
  "stud85990168958": { task1: 3, task2: 5, task3: 4, task4: 4 },
  "stud869005963376": { task1: 4, task2: 5, task3: 4, task4: 4 },
  "stud893477209434": { task1: 3, task2: 5, task3: 4, task4: 4 },
  "stud900862091687": { task1: 4, task2: 5, task3: 3, task4: 4 },
  "stud905125164740": { task1: 3, task2: 5, task3: 3, task4: 4 },
  "stud92321407066": { task1: 5, task2: 5, task3: 4, task4: 4 },
  "stud92563591384": { task1: 3, task2: 5, task3: 4, task4: 4 },
  "stud928061151477": { task1: 5, task2: 5, task3: 4, task4: 4 },
  "stud93044215403": { task1: 3, task2: 3, task3: 4, task4: 4 },
  "stud93068245615": { task1: 4, task2: 4, task3: 4, task4: 4 },
  "stud94843636884": { task1: 4, task2: 5, task3: 4, task4: 4 },
  "stud94975727316": { task1: 3, task2: 5, task3: 4, task4: 4 },
  "stud951960840073": { task1: 5, task2: 5, task3: 4, task4: 4 },
  "stud96741083542": { task1: 4, task2: 5, task3: 4, task4: 4 },
  "stud968147506223": { task1: 3, task2: 5, task3: 4, task4: 4 },
  "stud98487697975": { task1: 4, task2: 5, task3: 4, task4: 4 },
  "stud985451165621": { task1: 4, task2: 5, task3: 4, task4: 4 }
};


export function ProfessorRateAllTable() {
  const [searchTerm, setSearchTerm] = useState("");

  const [ratings, setRatings] = useState<RatingsState>(() => {
    // Ensure we always have an entry for every DID + every task
    const state: RatingsState = {};
    HARDCODED_DIDS.forEach((did) => {
      const initial = INITIAL_RATINGS[did] ?? { task1: 0, task2: 0, task3: 0, task4: 0 };
      state[did] = {
        task1: initial.task1 ?? 0,
        task2: initial.task2 ?? 0,
        task3: initial.task3 ?? 0,
        task4: initial.task4 ?? 0
      };
    });
    return state;
  });

  // Filter DIDs based on search term
  const filteredDids = useMemo(() => {
    if (!searchTerm) return HARDCODED_DIDS;
    const term = searchTerm.toLowerCase();
    return HARDCODED_DIDS.filter((did) => did.toLowerCase().includes(term));
  }, [searchTerm]);

  const handleRatingChange = (did: string, taskId: string, value: string) => {
    const numValue = parseInt(value, 10);

    // Allow empty string (user clearing input)
    if (value === "") {
      setRatings((prev) => ({
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

    setRatings((prev) => ({
      ...prev,
      [did]: {
        ...prev[did],
        [taskId]: numValue as RatingValue
      }
    }));
  };

  const handleSubmit = () => {
    const allValid = Object.values(ratings).every((didRatings) =>
      Object.values(didRatings).every((rating) => rating >= 0 && rating <= 5)
    );

    if (!allValid) {
      toast.error("Please ensure all ratings are between 0 and 5");
      return;
    }

    toast.success("Ratings have been assigned to the DIDs.");
  };

  const handleReset = () => {
    // Reset back to Excel initial values (not all zeros)
    const resetState: RatingsState = {};
    HARDCODED_DIDS.forEach((did) => {
      const initial = INITIAL_RATINGS[did] ?? { task1: 0, task2: 0, task3: 0, task4: 0 };
      resetState[did] = {
        task1: initial.task1 ?? 0,
        task2: initial.task2 ?? 0,
        task3: initial.task3 ?? 0,
        task4: initial.task4 ?? 0
      };
    });
    setRatings(resetState);
    toast.info("All ratings have been reset to the initial values");
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
          <Button onClick={handleSubmit}>Submit</Button>
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
                {TASKS.map((task) => (
                  <TableHead key={task.id} className="text-center font-semibold text-foreground w-24">
                    <div className="truncate">{task.name}</div>
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredDids.map((did) => (
                <TableRow key={did} className="border-b-border/20 hover:bg-muted/10">
                  <TableCell className="font-mono text-sm sticky left-0 bg-background z-10">{did}</TableCell>
                  {TASKS.map((task) => (
                    <TableCell key={task.id} className="text-center p-2">
                      <Input
                        type="number"
                        min="0"
                        max="5"
                        value={ratings[did][task.id]}
                        onChange={(e) => handleRatingChange(did, task.id, e.target.value)}
                        className={`w-16 text-center h-9 ${
                          ratings[did][task.id] !== 0 ? "bg-primary/10 border-primary/30" : ""
                        }`}
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
          <div className="text-muted-foreground">No DIDs match your search criteria</div>
        </div>
      )}
    </div>
  );
}
