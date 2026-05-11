export interface OtherBill {
  id: string;
  propertyId: string;
  billType: "electricity" | "water" | "maintenance" | "gas" | "internet" | "cleaning" | "other";
  title: string;
  description: string;
  amount: number;
  applicableRooms: string[]; // room numbers
  dueDate: string;
  createdAt: string;
  status: "active" | "paid" | "overdue";
  billingCycle: "one-time" | "monthly" | "quarterly";
}
export const billTypeLabels: Record<OtherBill["billType"], string> = {
  electricity: "Electricity",
  water: "Water",
  maintenance: "Maintenance",
  gas: "Gas / LPG",
  internet: "Internet",
  cleaning: "Cleaning",
  other: "Other",
};
export const billTypeColors: Record<OtherBill["billType"], { text: string; bg: string }> = {
  electricity: { text: "text-amber-600", bg: "bg-amber-50 dark:bg-amber-950" },
  water: { text: "text-blue-600", bg: "bg-blue-50 dark:bg-blue-950" },
  maintenance: { text: "text-violet-600", bg: "bg-violet-50 dark:bg-violet-950" },
  gas: { text: "text-orange-600", bg: "bg-orange-50 dark:bg-orange-950" },
  internet: { text: "text-cyan-600", bg: "bg-cyan-50 dark:bg-cyan-950" },
  cleaning: { text: "text-emerald-600", bg: "bg-emerald-50 dark:bg-emerald-950" },
  other: { text: "text-muted-foreground", bg: "bg-muted" },
};
export const mockBills: OtherBill[] = [
  {
    id: "bill-1",
    propertyId: "prop-1",
    billType: "electricity",
    title: "April Electricity Bill",
    description: "Monthly electricity charges based on meter reading",
    amount: 450,
    applicableRooms: ["101-A", "102-B", "103-A"],
    dueDate: "2026-04-30",
    createdAt: "2026-04-05",
    status: "active",
    billingCycle: "monthly",
  },
  {
    id: "bill-2",
    propertyId: "prop-1",
    billType: "maintenance",
    title: "Q2 Maintenance Fee",
    description: "Common area maintenance and building upkeep",
    amount: 800,
    applicableRooms: ["101-A", "102-B", "103-A", "201-A", "202-B"],
    dueDate: "2026-04-15",
    createdAt: "2026-04-01",
    status: "active",
    billingCycle: "quarterly",
  },
  {
    id: "bill-3",
    propertyId: "prop-1",
    billType: "water",
    title: "March Water Bill",
    description: "Municipal water supply charges",
    amount: 200,
    applicableRooms: ["101-A", "102-B"],
    dueDate: "2026-03-31",
    createdAt: "2026-03-20",
    status: "paid",
    billingCycle: "monthly",
  },
];