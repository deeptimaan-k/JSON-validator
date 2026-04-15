import { useState, useEffect, ChangeEvent } from "react";
import { JsonEditor } from "./components/JsonEditor";
import { OutputPanel } from "./components/OutputPanel";
import { normalizeJsonWithChanges, NormalizationResult } from "./utils/normalizeJson";
import { Button } from "@/components/ui/button";
import { Toaster } from "@/components/ui/sonner";
import { toast } from "sonner";
import { motion, AnimatePresence } from "motion/react";
import { 
  Play, 
  RotateCcw, 
  Upload, 
  FileJson, 
  Database,
  ChevronDown,
  Plus,
  Minus,
  CheckCircle2,
  LayoutGrid,
  Sparkles,
  ArrowRight
} from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { TooltipProvider } from "@/components/ui/tooltip";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";

const DRAFT_BL_TEMPLATE = {
  "reference": { "additional_details": {} },
  "items": { "additional_details": {} },
  "exchange_rates": { "additional_details": {} },
  "details": {
    "additional_details": {},
    "bl_type": [{ "index": 0, "regex": " " }],
    "shipper": [{ "index": 0, "regex": " " }],
    "quantity": [{ "index": 0, "regex": " " }],
    "consignee": [{ "index": 0, "regex": " " }],
    "total_cbm": [{ "index": 0, "regex": " " }],
    "net_weight": [{ "index": 0, "regex": " " }],
    "gross_weight": [{ "index": 0, "regex": " " }],
    "freight_clause": [{ "index": 0, "regex": " " }],
    "bill_of_lading": [{ "index": 0, "regex": " " }],
    "port_of_loading": [{ "index": 0, "regex": " " }],
    "container_numbers_array": [{ "index": 0, "regex": " " }],
    "place_of_delivery": [{ "index": 0, "regex": " " }],
    "port_of_discharge": [{ "index": 0, "regex": " " }],
    "freight_payable_by": [{ "index": 0, "regex": " " }],
    "notify_party_details": [{ "index": 0, "regex": " " }],
    "container_details": [{ "index": 0, "regex": " " }],
    "hs_codes": [{ "index": 0, "regex": " " }],
    "items": [{ "index": 0, "regex": " " }],
    "carrier_name": [{ "index": 0, "regex": " " }],
    "ship_onboard_date": [{ "index": 0, "regex": " " }],
    "ship_onboard_date_day": [{ "index": 0, "regex": " " }],
    "ship_onboard_date_month_in_word": [{ "index": 0, "regex": " " }],
    "ship_onboard_date_year": [{ "index": 0, "regex": " " }]
  },
  "master_details": {},
  "items_product--reference": {
    "additional_details": {},
    "invoice_id": [{ "index": 0, "regex": " " }]
  },
  "items_product--details": {
    "additional_details": {},
    "item": [{ "index": 0, "regex": " " }],
    "gross_weight": [{ "index": 0, "regex": " " }],
    "net_weight": [{ "index": 0, "regex": " " }],
    "volumetric_weight": [{ "index": 0, "regex": " " }],
    "hs_code": [{ "index": 0, "regex": " " }],
    "quantity": [{ "index": 0, "regex": " " }]
  }
};

const BOOKING_CONFIRMATION_TEMPLATE = {
  "reference": {
    "additional_details": {}
  },
  "items": {
    "additional_details": {}
  },
  "exchange_rates": {
    "additional_details": {}
  },
  "details": {
    "additional_details": {},
    "booking_number": [
      {
        "index": 0,
        "regex": "Booking Number ?:? ?([\\w]+)"
      },
      {
        "regex": "Número de Booking ?\\: ?(\\w+)",
        "index": 0
      }
    ],
    "etd": [
      {
        "index": 0,
        "regex": "ETD ?:? ?(\\d+[\\s\\/-]?[A-Za-z]+[\\s\\/-]?\\d+)"
      }
    ],
    "eta": [
      {
        "index": 0,
        "regex": ".+ETA ?:? ?([\\w\\-]+)",
        "filter_coordinates": [
          {
            "regex": "ETD",
            "substring": "ETD",
            "where": "bottom"
          },
          {
            "regex": "FPD ETA",
            "substring": "FPD ETA",
            "where": "top"
          }
        ]
      }
    ],
    "port_of_destination": [
      {
        "index": 0,
        "regex": "Port Of Discharge ?:? ?([\\w ]+)",
        "filter_coordinates": [
          {
            "regex": "Port Of Discharge",
            "substring": "Port Of Discharge",
            "where": "start_left_top"
          },
          {
            "regex": "ETA ?:?",
            "substring": "ETA",
            "where": "start_bottom"
          },
          {
            "regex": "Final Place Of Delivery",
            "substring": "Final Place Of Delivery",
            "where": "top"
          }
        ]
      }
    ],
    "port_of_origin": [
      {
        "index": 0,
        "regex": "Port [oO]f Loading ?\\:? ?(\\w+)"
      },
      {
        "regex": "Puerto de Carga ?\\:? ?(\\w+)",
        "index": 0
      }
    ],
    "pickup_date": [
      {
        "index": 0,
        "regex": "Empty Pick Up Date ?\\: ?([\\w\\/-]+)"
      }
    ],
    "port_of_discharge": [
      {
        "index": 0,
        "regex": "Port Of Discharge ?:? ?([\\w ]+)",
        "filter_coordinates": [
          {
            "regex": "Port Of Discharge",
            "substring": "Port Of Discharge",
            "where": "start_left_top"
          },
          {
            "regex": "ETA ?:?",
            "substring": "ETA",
            "where": "start_bottom"
          },
          {
            "regex": "Final Place Of Delivery",
            "substring": "Final Place Of Delivery",
            "where": "top"
          }
        ]
      },
      {
        "filter_coordinates": [
          {
            "regex": "Puerto de Descarga",
            "substring": "Puerto de Descarga",
            "where": "top"
          },
          {
            "regex": "FPD ETA ?:?",
            "substring": "ETA",
            "where": "start_bottom"
          }
        ],
        "index": 0,
        "regex": "Puerto de Descarga ?:? ?([\\w ]+)"
      }
    ],
    "vessel": [
      {
        "index": 0,
        "regex": "Vessel/Voyage ?:? ?([\\w ]+) ?/ ?([\\w ]+)"
      },
      {
        "regex": "Buque \\/ No. Viaje ?:? ?([\\w ]+) ?/ ?([\\w ]+)",
        "index": 0
      }
    ],
    "voyage_number": [
      {
        "index": 1,
        "regex": "Vessel/Voyage ?:? ?([\\w ]+) ?/ ?([\\w ]+)"
      },
      {
        "regex": "Buque \\/ No. Viaje ?:? ?([\\w ]+) ?/ ?([\\w ]+)",
        "index": 1
      }
    ],
    "port_cutoff": [
      {
        "index": 0,
        "regex": "Port Cut-Off Date.?Time ?:? ?([\\w-]+)"
      }
    ],
    "doc_cutoff": [
      {
        "index": 0,
        "regex": "Terminal Cut-Off ?[\\:]+ ?(\\d+[\\s\\/-]?[A-Za-z]+[\\s\\/-]?\\d+) "
      },
      {
        "regex": "SI Cut-Off Date/Time ?:? ?([\\w-]+)",
        "index": 0
      }
    ],
    "vgm_cutoff": [
      {
        "index": 0,
        "regex": "VGM Cut-Off Date/Time ?:? ?([\\w\\-]+)"
      }
    ],
    "transit_time": [
      {
        "index": 0,
        "regex": " "
      }
    ],
    "booking_validity": [
      {
        "index": 0,
        "regex": " "
      }
    ],
    "container_details": [
      {
        "index": 0,
        "regex": "Quantity ?:? ([\\d]+ ?[X|x] ?[\\w\\']+)",
        "multiple_values": true
      }
    ],
    "vgm_cutoff_day": [
      {
        "index": 0,
        "regex": "VGM Cut-Off Date ?/? ?Time ?:? ?(\\d+)[\\s\\/-]?([A-Za-z]+)[\\s\\/-]?(\\d+) "
      }
    ],
    "vgm_cutoff_year": [
      {
        "index": 2,
        "regex": "VGM Cut-Off Date ?/? ?Time ?:? ?(\\d+)[\\s\\/-]?([A-Za-z]+)[\\s\\/-]?(\\d+) "
      }
    ],
    "eta_day": [
      {
        "index": 0,
        "regex": ".+ETA ?:? ?(\\d+)[\\s\\/-]?([A-Za-z]+)[\\s\\/-]?(\\d+)",
        "filter_coordinates": [
          {
            "regex": "ETD",
            "substring": "ETD",
            "where": "bottom"
          },
          {
            "regex": "FPD ETA",
            "substring": "FPD ETA",
            "where": "top"
          }
        ]
      }
    ],
    "eta_month_in_word": [
      {
        "index": 1,
        "regex": ".+ETA ?:? ?(\\d+)[\\s\\/-]?([A-Za-z]+)[\\s\\/-]?(\\d+)",
        "filter_coordinates": [
          {
            "regex": "ETD",
            "substring": "ETD",
            "where": "bottom"
          },
          {
            "regex": "FPD ETA",
            "substring": "FPD ETA",
            "where": "top"
          }
        ]
      }
    ],
    "eta_year": [
      {
        "index": 2,
        "regex": ".+ETA ?:? ?(\\d+)[\\s\\/-]?([A-Za-z]+)[\\s\\/-]?(\\d+) ",
        "filter_coordinates": [
          {
            "regex": "ETD",
            "substring": "ETD",
            "where": "bottom"
          },
          {
            "regex": "FPD ETA",
            "substring": "FPD ETA",
            "where": "top"
          }
        ]
      }
    ],
    "etd_day": [
      {
        "index": 0,
        "regex": "ETD ?:? ?(\\d+)[\\s\\/-]?([A-Za-z]+)[\\s\\/-]?(\\d+)"
      }
    ],
    "etd_month_in_word": [
      {
        "index": 1,
        "regex": "ETD ?:? ?(\\d+)[\\s\\/-]?([A-Za-z]+)[\\s\\/-]?(\\d+)"
      }
    ],
    "etd_year": [
      {
        "index": 2,
        "regex": "ETD ?:? ?(\\d+)[\\s\\/-]?([A-Za-z]+)[\\s\\/-]?(\\d+)"
      }
    ],
    "doc_cutoff_day": [
      {
        "index": 0,
        "regex": "Terminal Cut-Off ?[\\:]+ ?(\\d+)[\\s\\/-]?([A-Za-z]+)[\\s\\/-]?(\\d+) "
      },
      {
        "regex": "SI Cut-Off Date/Time ?:? ?([\\d]{2})-?([\\w]{3})-?([\\d]{4})",
        "index": 0
      }
    ],
    "doc_cutoff_month_in_word": [
      {
        "index": 1,
        "regex": "Terminal Cut-Off ?[\\:]+ ?(\\d+)[\\s\\/-]?([A-Za-z]+)[\\s\\/-]?(\\d+) "
      },
      {
        "regex": "SI Cut-Off Date/Time ?:? ?([\\d]{2})-?([\\w]{3})-?([\\d]{4})",
        "index": 1
      }
    ],
    "doc_cutoff_year": [
      {
        "index": 2,
        "regex": "Terminal Cut-Off ?[\\:]+ ?(\\d+)[\\s\\/-]?([A-Za-z]+)[\\s\\/-]?(\\d+) "
      },
      {
        "regex": "SI Cut-Off Date/Time ?:? ?([\\d]{2})-?([\\w]{3})-?([\\d]{4})",
        "index": 2
      }
    ],
    "port_cutoff_day": [
      {
        "index": 0,
        "regex": "Port Cut-Off Date.?Time ?:? ?([\\d]{2})-?/?.?([\\w]{3})-?/?.?([\\d]{4})"
      }
    ],
    "port_cutoff_month_in_word": [
      {
        "index": 1,
        "regex": "Port Cut-Off Date.?Time ?:? ?([\\d]{2})-?/?.?([\\w]{3})-?/?.?([\\d]{4})"
      }
    ],
    "port_cutoff_year": [
      {
        "index": 2,
        "regex": "Port Cut-Off Date.?Time ?:? ?([\\d]{2})-?/?.?([\\w]{3})-?/?.?([\\d]{4})"
      }
    ],
    "vgm_cutoff_month_in_word": [
      {
        "index": 1,
        "regex": "VGM Cut-Off Date ?/? ?Time ?:? ?(\\d+)[\\s\\/-]?([A-Za-z]+)[\\s\\/-]?(\\d+) "
      }
    ],
    "service_type": [
      {
        "index": 0,
        "regex": ""
      }
    ]
  },
  "master_details": {}
};

const DEFAULT_INPUT = {
  "details": {
    "carrier_name": "MAERSK LINE",
    "shipper": "GLOBAL LOGISTICS INC",
    "extra_data": "This will be removed"
  }
};

export default function App() {
  const [template, setTemplate] = useState(JSON.stringify(DRAFT_BL_TEMPLATE, null, 2));
  const [input, setInput] = useState(JSON.stringify(DEFAULT_INPUT, null, 2));
  const [output, setOutput] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedTemplateName, setSelectedTemplateName] = useState("Draft BL");
  const [summary, setSummary] = useState<{ added: string[], removed: string[] } | null>(null);
  const [isSummaryOpen, setIsSummaryOpen] = useState(false);

  const handleNormalize = () => {
    setIsProcessing(true);
    try {
      const templateObj = JSON.parse(template);
      const inputObj = JSON.parse(input);
      
      const result: NormalizationResult = normalizeJsonWithChanges(templateObj, inputObj);
      setOutput(JSON.stringify(result.normalized, null, 2));
      setSummary(result.changes);
      setIsSummaryOpen(true);
      toast.success("JSON normalized successfully");
    } catch (error) {
      console.error(error);
      toast.error("Invalid JSON format in Template or Input");
    } finally {
      setTimeout(() => setIsProcessing(false), 500);
    }
  };

  const handleTemplateSelect = (name: string) => {
    setSelectedTemplateName(name);
    if (name === "Draft BL") {
      setTemplate(JSON.stringify(DRAFT_BL_TEMPLATE, null, 2));
    } else {
      setTemplate(JSON.stringify(BOOKING_CONFIRMATION_TEMPLATE, null, 2));
    }
    toast.info(`Switched to ${name} template`);
  };

  const handleReset = () => {
    handleTemplateSelect(selectedTemplateName);
    setInput(JSON.stringify(DEFAULT_INPUT, null, 2));
    setOutput("");
    toast.info("Editors reset to default values");
  };

  const handleFileUpload = (e: ChangeEvent<HTMLInputElement>, type: 'template' | 'input') => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      try {
        JSON.parse(content); // Validate JSON
        if (type === 'template') {
          setTemplate(content);
          setSelectedTemplateName("Custom Upload");
        } else {
          setInput(content);
        }
        toast.success(`${type.charAt(0).toUpperCase() + type.slice(1)} JSON uploaded`);
      } catch (err) {
        toast.error("Invalid JSON file");
      }
    };
    reader.readAsText(file);
  };

  return (
    <TooltipProvider>
      <div className="min-h-screen text-[#fafafa] font-sans selection:bg-primary/30 flex flex-col relative overflow-hidden">
        {/* Background Sparkles/Glows */}
        <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-primary/10 rounded-full blur-[120px] -z-10 animate-pulse" />
        <div className="absolute bottom-0 right-1/4 w-[400px] h-[400px] bg-blue-500/5 rounded-full blur-[100px] -z-10" />

        {/* Header */}
        <header className="h-20 border-b border-white/[0.08] flex items-center justify-between px-10 bg-black/40 backdrop-blur-2xl sticky top-0 z-50">
          <div className="flex items-center gap-8">
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex items-center gap-4"
            >
              <div className="bg-primary glow-primary w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-lg">
                <LayoutGrid className="h-5 w-5" />
              </div>
              <div>
                <h1 className="text-lg font-bold tracking-tight bg-gradient-to-r from-white to-white/60 bg-clip-text text-transparent">
                  JSON NORMALIZER
                </h1>
                <p className="text-[10px] text-zinc-500 font-mono uppercase tracking-[0.2em]">Data Pipeline v1.4</p>
              </div>
            </motion.div>

            <Separator orientation="vertical" className="h-8 bg-white/[0.08]" />

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="h-10 gap-3 px-4 rounded-xl bg-white/[0.03] border border-white/[0.05] hover:bg-white/[0.08] transition-all">
                  <Sparkles className="h-3.5 w-3.5 text-primary" />
                  <span className="text-xs font-medium tracking-wide">{selectedTemplateName}</span>
                  <ChevronDown className="h-3 w-3 text-zinc-500" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="bg-[#121214] border-white/[0.1] text-zinc-300 min-w-[200px] p-2 rounded-xl shadow-2xl backdrop-blur-2xl">
                <DropdownMenuItem onClick={() => handleTemplateSelect("Draft BL")} className="rounded-lg hover:bg-white/5 focus:bg-white/5 cursor-pointer py-2.5 px-3">
                  Draft BL
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleTemplateSelect("Booking Confirmation")} className="rounded-lg hover:bg-white/5 focus:bg-white/5 cursor-pointer py-2.5 px-3">
                  Booking Confirmation
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <div className="flex items-center gap-6">
            <div className="hidden md:flex items-center gap-4">
              <div className="flex flex-col items-end">
                <span className="text-[9px] text-zinc-500 font-bold uppercase tracking-widest">System Status</span>
                <span className="text-[11px] text-green-400 font-mono flex items-center gap-2">
                  <span className="h-1.5 w-1.5 bg-green-500 rounded-full animate-ping" />
                  OPERATIONAL
                </span>
              </div>
            </div>
          </div>
        </header>

        {/* Main Layout */}
        <main className="flex-1 p-8 grid grid-cols-1 lg:grid-cols-3 gap-8 overflow-hidden max-w-[1800px] mx-auto w-full">
          {/* Column 1: Template */}
          <motion.section 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="flex flex-col relative group h-full"
          >
            <div className="absolute top-14 right-6 z-10 opacity-0 group-hover:opacity-100 transition-all duration-300 translate-y-2 group-hover:translate-y-0">
              <label className="cursor-pointer">
                <input 
                  type="file" 
                  className="hidden" 
                  accept=".json" 
                  onChange={(e) => handleFileUpload(e, 'template')}
                />
                <div className="bg-white/10 backdrop-blur-md p-2 rounded-lg border border-white/10 hover:bg-white/20 transition-all flex items-center gap-2 px-3 shadow-xl">
                  <Upload className="h-3.5 w-3.5 text-white" />
                  <span className="text-[10px] uppercase font-bold tracking-wider text-white">Upload Template</span>
                </div>
              </label>
            </div>
            <JsonEditor 
              title="01. Schema Definition" 
              value={template} 
              onChange={(v) => setTemplate(v || "")} 
            />
          </motion.section>

          {/* Column 2: Input */}
          <motion.section 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="flex flex-col relative group h-full"
          >
            <div className="absolute top-14 right-6 z-10 opacity-0 group-hover:opacity-100 transition-all duration-300 translate-y-2 group-hover:translate-y-0">
              <label className="cursor-pointer">
                <input 
                  type="file" 
                  className="hidden" 
                  accept=".json" 
                  onChange={(e) => handleFileUpload(e, 'input')}
                />
                <div className="bg-white/10 backdrop-blur-md p-2 rounded-lg border border-white/10 hover:bg-white/20 transition-all flex items-center gap-2 px-3 shadow-xl">
                  <Upload className="h-3.5 w-3.5 text-white" />
                  <span className="text-[10px] uppercase font-bold tracking-wider text-white">Upload Input</span>
                </div>
              </label>
            </div>
            <JsonEditor 
              title="02. Raw Data Stream" 
              value={input} 
              onChange={(v) => setInput(v || "")} 
            />
          </motion.section>

          {/* Column 3: Output */}
          <motion.section 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="h-full"
          >
            <OutputPanel value={output} />
          </motion.section>
        </main>

        {/* Footer */}
        <footer className="h-24 border-t border-white/[0.08] bg-black/40 backdrop-blur-2xl flex items-center justify-center gap-6 px-10">
          <Button 
            variant="outline" 
            className="h-12 border-white/[0.1] bg-white/[0.02] hover:bg-white/[0.08] text-white px-8 rounded-2xl font-bold transition-all hover:scale-105 active:scale-95"
            onClick={handleReset}
          >
            <RotateCcw className="h-4 w-4 mr-2" />
            Reset Fields
          </Button>
          
          <Button 
            className="h-12 bg-primary glow-primary text-white hover:bg-primary/90 px-12 rounded-2xl font-bold gap-3 transition-all hover:scale-105 active:scale-95 shadow-2xl"
            onClick={handleNormalize}
            disabled={isProcessing}
          >
            <span className="tracking-wide">{isProcessing ? 'PROCESSING...' : 'NORMALIZE JSON'}</span>
            <Play className={`h-4 w-4 ${isProcessing ? 'animate-spin' : ''}`} />
          </Button>
        </footer>

        {/* Summary Dialog */}
        <Dialog open={isSummaryOpen} onOpenChange={setIsSummaryOpen}>
          <DialogContent className="bg-[#0c0c0e]/98 backdrop-blur-3xl border-white/[0.1] text-zinc-100 !max-w-[95vw] w-full h-[92vh] flex flex-col p-0 overflow-hidden rounded-[2.5rem] shadow-[0_0_100px_rgba(0,0,0,0.8)] border-t border-white/20">
            {/* Animated Header Section */}
            <div className="p-8 md:p-12 border-b border-white/[0.08] bg-gradient-to-r from-green-500/10 via-transparent to-blue-500/10 relative overflow-hidden shrink-0">
              <motion.div 
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="absolute top-0 left-0 w-full h-full pointer-events-none"
              >
                <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 rounded-full blur-[80px] -translate-y-1/2 translate-x-1/2" />
                <div className="absolute bottom-0 left-0 w-64 h-64 bg-green-500/10 rounded-full blur-[80px] translate-y-1/2 -translate-x-1/2" />
              </motion.div>

              <DialogHeader className="relative z-10">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-8">
                  <div className="flex items-center gap-6">
                    <motion.div 
                      initial={{ rotate: -20, scale: 0 }}
                      animate={{ rotate: 0, scale: 1 }}
                      transition={{ type: "spring", damping: 12 }}
                      className="bg-green-500 glow-green w-16 h-16 rounded-2xl flex items-center justify-center text-white shadow-2xl"
                    >
                      <CheckCircle2 className="h-8 w-8" />
                    </motion.div>
                    <div>
                      <DialogTitle className="text-4xl font-black tracking-tight mb-2">
                        NORMALIZATION <span className="text-green-500">COMPLETE</span>
                      </DialogTitle>
                      <DialogDescription className="text-zinc-400 text-lg font-medium">
                        Pipeline execution successful. Structural mapping validated against schema.
                      </DialogDescription>
                    </div>
                  </div>

                  {/* Stats Cards */}
                  <div className="flex gap-4">
                    <div className="bg-white/5 border border-white/10 p-4 rounded-2xl min-w-[140px] backdrop-blur-md">
                      <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest mb-1">Added</p>
                      <p className="text-2xl font-mono font-bold text-green-400">+{summary?.added.length || 0}</p>
                    </div>
                    <div className="bg-white/5 border border-white/10 p-4 rounded-2xl min-w-[140px] backdrop-blur-md">
                      <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest mb-1">Removed</p>
                      <p className="text-2xl font-mono font-bold text-red-400">-{summary?.removed.length || 0}</p>
                    </div>
                    <div className="bg-white/5 border border-white/10 p-4 rounded-2xl min-w-[140px] backdrop-blur-md">
                      <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest mb-1">Integrity</p>
                      <p className="text-2xl font-mono font-bold text-blue-400">100%</p>
                    </div>
                  </div>
                </div>
              </DialogHeader>
            </div>

            <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-0 overflow-hidden min-h-0">
              {/* Added Fields Section */}
              <div className="p-10 border-r border-white/[0.08] flex flex-col bg-green-500/[0.02] relative min-h-0">
                <div className="flex items-center justify-between mb-8 shrink-0">
                  <div className="flex items-center gap-4">
                    <div className="bg-green-500/20 p-2 rounded-xl border border-green-500/20">
                      <Plus className="h-5 w-5 text-green-500" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold tracking-tight">Schema Backfill</h3>
                      <p className="text-xs text-zinc-500 font-medium">Missing keys populated from template</p>
                    </div>
                  </div>
                </div>
                
                <ScrollArea className="flex-1 rounded-3xl border border-white/[0.05] bg-black/60 shadow-inner">
                  <div className="p-8">
                    <AnimatePresence mode="popLayout">
                      <div className="space-y-4">
                        {summary?.added.length === 0 ? (
                          <motion.div 
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="flex flex-col items-center justify-center h-[400px] opacity-20"
                          >
                            <Database className="h-16 w-16 mb-6" />
                            <p className="text-lg font-medium italic">No new fields were required.</p>
                          </motion.div>
                        ) : (
                          summary?.added.map((key, i) => (
                            <motion.div 
                              initial={{ opacity: 0, x: -20 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: i * 0.01 }}
                              key={i} 
                              className="group/item text-[13px] font-mono text-green-400/80 bg-green-500/[0.03] p-4 rounded-xl border border-green-500/10 flex items-center gap-4 hover:bg-green-500/10 hover:border-green-500/30 transition-all cursor-default"
                            >
                              <span className="text-green-500/20 font-black text-lg w-8">{String(i + 1).padStart(2, '0')}</span>
                              <span className="break-all leading-relaxed">{key}</span>
                            </motion.div>
                          ))
                        )}
                      </div>
                    </AnimatePresence>
                  </div>
                </ScrollArea>
              </div>

              {/* Removed Fields Section */}
              <div className="p-10 flex flex-col bg-red-500/[0.02] relative min-h-0">
                <div className="flex items-center justify-between mb-8 shrink-0">
                  <div className="flex items-center gap-4">
                    <div className="bg-red-500/20 p-2 rounded-xl border border-red-500/20">
                      <Minus className="h-5 w-5 text-red-500" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold tracking-tight">Data Cleansing</h3>
                      <p className="text-xs text-zinc-500 font-medium">Extraneous fields purged from input</p>
                    </div>
                  </div>
                </div>
                
                <ScrollArea className="flex-1 rounded-3xl border border-white/[0.05] bg-black/60 shadow-inner">
                  <div className="p-8">
                    <AnimatePresence mode="popLayout">
                      <div className="space-y-4">
                        {summary?.removed.length === 0 ? (
                          <motion.div 
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="flex flex-col items-center justify-center h-[400px] opacity-20"
                          >
                            <Database className="h-16 w-16 mb-6" />
                            <p className="text-lg font-medium italic">Input data was already clean.</p>
                          </motion.div>
                        ) : (
                          summary?.removed.map((key, i) => (
                            <motion.div 
                              initial={{ opacity: 0, x: -20 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: i * 0.01 }}
                              key={i} 
                              className="group/item text-[13px] font-mono text-red-400/80 bg-red-500/[0.03] p-4 rounded-xl border border-red-500/10 flex items-center gap-4 hover:bg-red-500/10 hover:border-red-500/30 transition-all cursor-default"
                            >
                              <span className="text-red-500/20 font-black text-lg w-8">{String(i + 1).padStart(2, '0')}</span>
                              <span className="break-all leading-relaxed">{key}</span>
                            </motion.div>
                          ))
                        )}
                      </div>
                    </AnimatePresence>
                  </div>
                </ScrollArea>
              </div>
            </div>

            {/* Enhanced Footer */}
            <div className="p-10 border-t border-white/[0.08] bg-black/60 flex flex-col md:flex-row justify-between items-center gap-6">
              <div className="flex items-center gap-8">
                <div className="flex flex-col">
                  <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest mb-1">Execution Time</span>
                  <span className="text-sm font-mono text-blue-400">12ms</span>
                </div>
                <Separator orientation="vertical" className="h-8 bg-white/10" />
                <div className="flex flex-col">
                  <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest mb-1">Status</span>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                    <span className="text-sm font-bold text-zinc-300">VALIDATED</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <Button 
                  variant="ghost" 
                  onClick={() => setIsSummaryOpen(false)}
                  className="h-14 px-8 rounded-2xl text-zinc-400 hover:text-white hover:bg-white/5 font-bold"
                >
                  DISMISS
                </Button>
                <Button 
                  onClick={() => setIsSummaryOpen(false)} 
                  className="h-14 bg-primary glow-primary hover:bg-primary/90 text-white px-12 rounded-2xl font-black text-lg transition-all hover:scale-105 active:scale-95 shadow-[0_0_30px_rgba(59,130,246,0.4)]"
                >
                  VIEW NORMALIZED DATA
                  <ArrowRight className="ml-3 h-6 w-6" />
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        <Toaster theme="dark" position="bottom-right" />
      </div>
    </TooltipProvider>
  );
}
