export interface PhygitalBook {
  id: string;
  title: string;
  author: string;
  year: number;
  genre: 'Technology' | 'Fiction' | 'Philosophy' | 'Science' | 'Biography';
  isbn: string;
  rating: number;
  pages: number;
  physicalCopiesTotal: number;
  physicalCopiesAvailable: number;
  digitalAvailable: boolean;
  shelfLocation: {
    aisle: 'A' | 'B' | 'C' | 'D' | 'E';
    shelfId: string; // e.g., "A1", "B2"
    row: number; // 1 to 4
  };
  summary: string;
  keyTakeaways: string[];
  mockDigitalContent: string; // Scrollable digital preview text
  reviews: { user: string; text: string; rating: number; date: string }[];
}

export interface LibraryZone {
  id: string;
  name: string;
  type: 'shelf' | 'amenity' | 'gate' | 'kiosk';
  x: number; // Percentage coordinate on SVGs map
  y: number;
  width: number;
  height: number;
  aisle?: 'A' | 'B' | 'C' | 'D' | 'E';
  status: 'idle' | 'busy' | 'alert';
  details: string;
}

export interface LiveRFIDEvent {
  id: string;
  timestamp: string;
  type: 'gate_pass' | 'shelf_lift' | 'shelf_return' | 'kiosk_checkout' | 'kiosk_checkin';
  bookTitle: string;
  userMeta: string; // Member ID or name
  details: string;
}

export const LIBRARY_ZONES: LibraryZone[] = [];
