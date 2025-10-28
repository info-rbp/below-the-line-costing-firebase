export type DemoProject = {
  name: string;
  clientName: string;
  currency: string;
  status: "draft" | "active" | "closed";
  startDate: string;
  endDate: string;
};

export type DemoMilestone = {
  id: string;
  code: string;
  name: string;
  startDate: string;
  endDate: string;
  parentId?: string | null;
  sortIndex: number;
};

export type DemoCostLineItem = {
  id: string;
  type: "labour" | "service" | "equipment";
  roleOrSKU: string;
  rate: number;
  qty: number;
  unit: "hr" | "day" | "ea";
  startDate?: string;
  endDate?: string;
  milestoneIds: string[];
};

export type DemoMaterialCost = {
  id: string;
  sku: string;
  description: string;
  unitPrice: number;
  qty: number;
  costType: "one-time" | "monthly" | "milestone";
  startDate?: string;
  endDate?: string;
  milestoneIds: string[];
};

export type DemoPayment = {
  id: string;
  invoiceNo: string;
  invoiceDate: string;
  amount: number;
  milestoneIds: string[];
  materialCostIds: string[];
  notes?: string;
};

export type DemoDataset = {
  project: DemoProject;
  milestones: DemoMilestone[];
  costLineItems: DemoCostLineItem[];
  materialCosts: DemoMaterialCost[];
  paymentSchedules: DemoPayment[];
};

const projectTemplate: DemoProject = {
  name: "Aurora Retail Expansion",
  clientName: "Aurora Retail Group",
  currency: "AUD",
  status: "active",
  startDate: "2024-01-08",
  endDate: "2024-07-19",
};

const milestoneSeeds: DemoMilestone[] = [
  { id: "MS-100", code: "DISC", name: "Discovery", startDate: "2024-01-08", endDate: "2024-01-26", sortIndex: 1 },
  { id: "MS-101", code: "BRIEF", name: "Client Briefing", parentId: "MS-100", startDate: "2024-01-08", endDate: "2024-01-12", sortIndex: 2 },
  { id: "MS-102", code: "RESEARCH", name: "Market Research", parentId: "MS-100", startDate: "2024-01-15", endDate: "2024-01-26", sortIndex: 3 },
  { id: "MS-200", code: "PLAN", name: "Strategy & Planning", startDate: "2024-01-29", endDate: "2024-02-23", sortIndex: 4 },
  { id: "MS-201", code: "STRAT", name: "Strategy Workshops", parentId: "MS-200", startDate: "2024-01-29", endDate: "2024-02-09", sortIndex: 5 },
  { id: "MS-202", code: "MEDIA", name: "Media Planning", parentId: "MS-200", startDate: "2024-02-12", endDate: "2024-02-23", sortIndex: 6 },
  { id: "MS-300", code: "PROD", name: "Creative Production", startDate: "2024-02-26", endDate: "2024-04-19", sortIndex: 7 },
  { id: "MS-301", code: "VIDEO", name: "Video Production", parentId: "MS-300", startDate: "2024-02-26", endDate: "2024-03-22", sortIndex: 8 },
  { id: "MS-302", code: "ASSETS", name: "Campaign Assets", parentId: "MS-300", startDate: "2024-03-11", endDate: "2024-04-19", sortIndex: 9 },
  { id: "MS-400", code: "LAUNCH", name: "Launch", startDate: "2024-04-22", endDate: "2024-05-17", sortIndex: 10 },
  { id: "MS-401", code: "EVENTS", name: "Launch Events", parentId: "MS-400", startDate: "2024-04-22", endDate: "2024-05-03", sortIndex: 11 },
  { id: "MS-402", code: "PAID", name: "Paid Media Go-Live", parentId: "MS-400", startDate: "2024-05-06", endDate: "2024-05-17", sortIndex: 12 },
  { id: "MS-500", code: "OPT", name: "Optimisation", startDate: "2024-05-20", endDate: "2024-06-14", sortIndex: 13 },
  { id: "MS-600", code: "WRAP", name: "Project Wrap", startDate: "2024-06-17", endDate: "2024-07-19", sortIndex: 14 },
];

const labourRoles = [
  { role: "Project Director", rate: 180, qty: 60 },
  { role: "Account Manager", rate: 120, qty: 90 },
  { role: "Strategist", rate: 140, qty: 80 },
  { role: "Media Planner", rate: 110, qty: 75 },
  { role: "Producer", rate: 150, qty: 100 },
  { role: "Designer", rate: 95, qty: 120 },
  { role: "Copywriter", rate: 105, qty: 90 },
  { role: "Developer", rate: 130, qty: 80 },
  { role: "QA Analyst", rate: 90, qty: 70 },
];

const serviceVendors = [
  { role: "Focus Group Facilitation", rate: 18000, qty: 1, unit: "ea" as const },
  { role: "Media Buying Fees", rate: 24000, qty: 1, unit: "ea" as const },
  { role: "Print Vendor", rate: 14500, qty: 1, unit: "ea" as const },
  { role: "Photography Studio", rate: 9800, qty: 1, unit: "ea" as const },
  { role: "Venue Hire", rate: 12500, qty: 1, unit: "ea" as const },
  { role: "Catering", rate: 7200, qty: 1, unit: "ea" as const },
];

const equipmentItems = [
  { role: "Camera Kit", rate: 450, qty: 18, unit: "day" as const },
  { role: "Lighting Rig", rate: 380, qty: 18, unit: "day" as const },
  { role: "Editing Suite", rate: 520, qty: 30, unit: "day" as const },
  { role: "Field Audio", rate: 260, qty: 12, unit: "day" as const },
  { role: "Event Staging", rate: 6800, qty: 1, unit: "ea" as const },
];

function buildCostSeeds(): DemoCostLineItem[] {
  const milestoneBuckets: Record<string, string[]> = {
    discovery: ["MS-100", "MS-101", "MS-102"],
    planning: ["MS-200", "MS-201", "MS-202"],
    production: ["MS-300", "MS-301", "MS-302"],
    launch: ["MS-400", "MS-401", "MS-402"],
    optimisation: ["MS-500"],
    wrap: ["MS-600"],
  };
  const costs: DemoCostLineItem[] = [];
  let index = 1;
  for (const role of labourRoles) {
    const bucketKeys = Object.keys(milestoneBuckets);
    const targetKey = bucketKeys[(index - 1) % bucketKeys.length];
    const milestoneIds = milestoneBuckets[targetKey];
    const firstMilestone = milestoneSeeds.find((m) => m.id === milestoneIds[0]);
    const lastMilestone = milestoneSeeds.find((m) => m.id === milestoneIds[milestoneIds.length - 1]);
    costs.push({
      id: `COST-LAB-${index.toString().padStart(2, "0")}`,
      type: "labour",
      roleOrSKU: role.role,
      rate: role.rate,
      qty: role.qty,
      unit: "hr",
      startDate: firstMilestone?.startDate,
      endDate: lastMilestone?.endDate,
      milestoneIds,
    });
    index++;
  }
  let serviceIndex = 1;
  for (const vendor of serviceVendors) {
    const milestoneId = ["MS-102", "MS-202", "MS-302", "MS-402"][((serviceIndex - 1) % 4 + 4) % 4];
    costs.push({
      id: `COST-SVC-${serviceIndex.toString().padStart(2, "0")}`,
      type: "service",
      roleOrSKU: vendor.role,
      rate: vendor.rate,
      qty: vendor.qty,
      unit: vendor.unit,
      milestoneIds: milestoneId ? [milestoneId] : ["MS-300"],
    });
    serviceIndex++;
  }
  let equipmentIndex = 1;
  for (const equipment of equipmentItems) {
    const milestoneId = ["MS-301", "MS-302", "MS-401"][((equipmentIndex - 1) % 3 + 3) % 3];
    costs.push({
      id: `COST-EQP-${equipmentIndex.toString().padStart(2, "0")}`,
      type: "equipment",
      roleOrSKU: equipment.role,
      rate: equipment.rate,
      qty: equipment.qty,
      unit: equipment.unit,
      milestoneIds: milestoneId ? [milestoneId] : ["MS-300"],
    });
    equipmentIndex++;
  }

  while (costs.length < 30) {
    const template = costs[costs.length % labourRoles.length];
    costs.push({
      ...template,
      id: `COST-LAB-${(costs.length + 1).toString().padStart(2, "0")}`,
      qty: Number((template.qty * 0.5).toFixed(0)),
    });
  }

  return costs;
}

function buildMaterialSeeds(): DemoMaterialCost[] {
  const materials: DemoMaterialCost[] = [
    {
      id: "MAT-001",
      sku: "PRINT-POSTERS",
      description: "Large format posters",
      unitPrice: 45,
      qty: 180,
      costType: "milestone",
      milestoneIds: ["MS-302", "MS-401"],
    },
    {
      id: "MAT-002",
      sku: "SWAG-KITS",
      description: "Launch attendee gift packs",
      unitPrice: 85,
      qty: 250,
      costType: "milestone",
      milestoneIds: ["MS-401"],
    },
    {
      id: "MAT-003",
      sku: "DIG-TOOLS",
      description: "Marketing automation licences",
      unitPrice: 950,
      qty: 6,
      costType: "monthly",
      startDate: "2024-02-01",
      endDate: "2024-07-01",
      milestoneIds: ["MS-200", "MS-500"],
    },
    {
      id: "MAT-004",
      sku: "CLOUD-HOST",
      description: "Microsite hosting",
      unitPrice: 320,
      qty: 6,
      costType: "monthly",
      startDate: "2024-02-01",
      endDate: "2024-07-01",
      milestoneIds: ["MS-300", "MS-500"],
    },
    {
      id: "MAT-005",
      sku: "EVENT-SIGNAGE",
      description: "Directional signage",
      unitPrice: 65,
      qty: 120,
      costType: "milestone",
      milestoneIds: ["MS-401"],
    },
    {
      id: "MAT-006",
      sku: "PRINT-BROCHURES",
      description: "Campaign brochures",
      unitPrice: 3.2,
      qty: 5000,
      costType: "milestone",
      milestoneIds: ["MS-302"],
    },
    {
      id: "MAT-007",
      sku: "SOCIAL-BOOST",
      description: "Paid social boost",
      unitPrice: 4200,
      qty: 3,
      costType: "monthly",
      startDate: "2024-05-01",
      endDate: "2024-07-01",
      milestoneIds: ["MS-402", "MS-500"],
    },
    {
      id: "MAT-008",
      sku: "PR-RETAINER",
      description: "PR agency retainer",
      unitPrice: 6400,
      qty: 4,
      costType: "monthly",
      startDate: "2024-02-01",
      endDate: "2024-05-01",
      milestoneIds: ["MS-200", "MS-400"],
    },
    {
      id: "MAT-009",
      sku: "EXPERIENCE-KITS",
      description: "In-store experience kits",
      unitPrice: 220,
      qty: 90,
      costType: "milestone",
      milestoneIds: ["MS-400"],
    },
    {
      id: "MAT-010",
      sku: "SURVEY-PLATFORM",
      description: "Survey platform subscription",
      unitPrice: 180,
      qty: 6,
      costType: "monthly",
      startDate: "2024-01-01",
      endDate: "2024-06-01",
      milestoneIds: ["MS-100", "MS-500"],
    },
    {
      id: "MAT-011",
      sku: "POST-LAUNCH-REPORTS",
      description: "Post launch reporting",
      unitPrice: 1250,
      qty: 3,
      costType: "milestone",
      milestoneIds: ["MS-500", "MS-600"],
    },
  ];

  while (materials.length < 12) {
    const template = materials[materials.length % 4];
    materials.push({
      ...template,
      id: `MAT-${(materials.length + 1).toString().padStart(3, "0")}`,
      sku: `${template.sku}-EXTRA-${materials.length}`,
      description: `${template.description} - supplemental`,
    });
  }

  return materials;
}

function buildPayments(materials: DemoMaterialCost[]): DemoPayment[] {
  const payments: DemoPayment[] = [
    {
      id: "INV-001",
      invoiceNo: "INV-001",
      invoiceDate: "2024-02-05",
      amount: 85000,
      milestoneIds: ["MS-100", "MS-200"],
      materialCostIds: [materials[0].id],
      notes: "Initial discovery & planning",
    },
    {
      id: "INV-002",
      invoiceNo: "INV-002",
      invoiceDate: "2024-03-15",
      amount: 112500,
      milestoneIds: ["MS-300"],
      materialCostIds: [materials[2].id, materials[3].id],
      notes: "Production progress",
    },
    {
      id: "INV-003",
      invoiceNo: "INV-003",
      invoiceDate: "2024-04-26",
      amount: 96500,
      milestoneIds: ["MS-301", "MS-302"],
      materialCostIds: [materials[5].id],
    },
    {
      id: "INV-004",
      invoiceNo: "INV-004",
      invoiceDate: "2024-05-20",
      amount: 78500,
      milestoneIds: ["MS-400", "MS-401"],
      materialCostIds: [materials[1].id, materials[4].id],
    },
    {
      id: "INV-005",
      invoiceNo: "INV-005",
      invoiceDate: "2024-06-21",
      amount: 65500,
      milestoneIds: ["MS-402", "MS-500"],
      materialCostIds: [materials[6].id, materials[7].id],
    },
    {
      id: "INV-006",
      invoiceNo: "INV-006",
      invoiceDate: "2024-07-12",
      amount: 58000,
      milestoneIds: ["MS-600"],
      materialCostIds: [materials[10].id],
      notes: "Project close out",
    },
  ];

  while (payments.length < 8) {
    const template = payments[payments.length % 3];
    payments.push({
      ...template,
      id: `INV-${(payments.length + 1).toString().padStart(3, "0")}`,
      invoiceNo: `INV-${(payments.length + 1).toString().padStart(3, "0")}`,
      invoiceDate: template.invoiceDate,
      amount: Math.round(template.amount * 0.65),
    });
  }

  return payments;
}

export function createDemoDataset(): DemoDataset {
  const materialCosts = buildMaterialSeeds();
  const payments = buildPayments(materialCosts);
  return {
    project: projectTemplate,
    milestones: milestoneSeeds,
    costLineItems: buildCostSeeds(),
    materialCosts,
    paymentSchedules: payments,
  };
}
