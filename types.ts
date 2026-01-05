
export enum RoomType {
  TWIN = 'Twin Room',
  DOUBLE = 'Double Bed'
}

export enum RoomStatus {
  READY = 'Ready',
  OCCUPIED = 'Occupied',
  CLEANING = 'Cleaning',
  OUT_OF_ORDER = 'Out of Order'
}

export interface Room {
  id: string;
  name: string;
  type: RoomType;
  status: RoomStatus;
}

export interface Staff {
  id: string;
  name: string;
}

export interface Booking {
  id: string;
  roomId: string;
  guestName: string;
  startDate: string; // ISO format
  endDate: string;   // ISO format
  staffId: string;
  notes?: string;
  createdAt: string;
}

export interface CalendarDay {
  date: Date;
  isToday: boolean;
  isWeekend: boolean;
  formatted: string;
}
