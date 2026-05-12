export interface CustomEvent {
  id: string;
  category: "Events" | "Ads" | "Website";
  type: string | null;
  startDate: string;
  endDate: string;
  title: string;
  desc: string;
}
