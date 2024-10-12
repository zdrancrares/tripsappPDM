export interface TripProps {
  id?: string;
  withCar: boolean;
  date: Date | null;
  budget: number;
  destination: string;
}
