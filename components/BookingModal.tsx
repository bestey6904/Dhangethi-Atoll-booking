
import React, { useState, useEffect } from 'react';
import { Room, Staff } from '../types';
import { STAFF } from '../constants';

interface BookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (bookingData: {
    roomIds: string[];
    guestName: string;
    startDate: string;
    endDate: string;
    staffId: string;
    notes: string;
  }) => void;
  selectedRoomId?: string;
  rooms: Room[];
}

const BookingModal: React.FC<BookingModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  selectedRoomId,
  rooms
}) => {
  const [selectedRoomIds, setSelectedRoomIds] = useState<string[]>([]);
  const [guestName, setGuestName] = useState('');
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(new Date(Date.now() + 86400000).toISOString().split('T')[0]);
  const [duration, setDuration] = useState(1);
  const [staffId, setStaffId] = useState(STAFF[0].id);
  const [notes, setNotes] = useState('');

  // Sync selectedRoomIds when selectedRoomId prop changes or modal opens
  useEffect(() => {
    if (isOpen) {
      setSelectedRoomIds(selectedRoomId ? [selectedRoomId] : []);
    }
  }, [isOpen, selectedRoomId]);

  // Sync Duration when dates change
  useEffect(() => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = end.getTime() - start.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    if (diffDays >= 1) {
      setDuration(diffDays);
    }
  }, [startDate, endDate]);

  const handleDurationChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseInt(e.target.value) || 1;
    setDuration(val);
    const start = new Date(startDate);
    start.setDate(start.getDate() + val);
    setEndDate(start.toISOString().split('T')[0]);
  };

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!guestName || !startDate || !endDate || selectedRoomIds.length === 0) return;
    onSubmit({ roomIds: selectedRoomIds, guestName, startDate, endDate, staffId, notes });
    onClose();
  };

  const toggleRoom = (id: string) => {
    setSelectedRoomIds(prev => 
      prev.includes(id) ? prev.filter(rid => rid !== id) : [...prev, id]
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xl overflow-hidden animate-in fade-in zoom-in duration-200">
        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
          <div>
            <h3 className="text-lg font-bold text-slate-800">New Booking</h3>
            <p className="text-xs text-slate-500">Create entries for one or multiple rooms</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Guest Name</label>
                <input
                  type="text"
                  required
                  value={guestName}
                  onChange={(e) => setGuestName(e.target.value)}
                  className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                  placeholder="e.g. John Doe"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2">
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Check-in Date</label>
                  <input
                    type="date"
                    required
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Nights</label>
                  <input
                    type="number"
                    min="1"
                    value={duration}
                    onChange={handleDurationChange}
                    className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Check-out</label>
                  <input
                    type="date"
                    required
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none bg-slate-50"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Handled By Staff</label>
                <select
                  value={staffId}
                  onChange={(e) => setStaffId(e.target.value)}
                  className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none"
                >
                  {STAFF.map(staff => (
                    <option key={staff.id} value={staff.id}>{staff.name}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex flex-col">
              <label className="block text-sm font-semibold text-slate-700 mb-1">Select Rooms (Multi-book)</label>
              <div className="flex-1 border border-slate-200 rounded-lg overflow-y-auto max-h-[240px] p-2 space-y-1 bg-slate-50">
                {rooms.map(room => (
                  <label 
                    key={room.id} 
                    className={`flex items-center justify-between p-2 rounded-md cursor-pointer transition-colors ${
                      selectedRoomIds.includes(room.id) ? 'bg-indigo-50 border-indigo-100 border' : 'hover:bg-white border border-transparent'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <input 
                        type="checkbox" 
                        checked={selectedRoomIds.includes(room.id)}
                        onChange={() => toggleRoom(room.id)}
                        className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500"
                      />
                      <div>
                        <span className="text-sm font-medium text-slate-700">{room.name}</span>
                        <span className="block text-[10px] text-slate-400 uppercase">{room.type}</span>
                      </div>
                    </div>
                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${
                      room.status === 'Ready' ? 'text-emerald-600 bg-emerald-50 border-emerald-100' : 'text-slate-400 bg-slate-100 border-slate-200'
                    }`}>
                      {room.status}
                    </span>
                  </label>
                ))}
              </div>
              <p className="text-[10px] text-slate-400 mt-2">Selected: {selectedRoomIds.length} rooms</p>
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">Notes / Special Requests</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none h-16 resize-none"
              placeholder="Breakfast time, airport shuttle, etc..."
            />
          </div>

          <div className="pt-2 flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-bold hover:bg-slate-50 transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={selectedRoomIds.length === 0}
              className="flex-[2] px-4 py-2.5 rounded-xl bg-indigo-600 text-white font-bold hover:bg-indigo-700 shadow-lg shadow-indigo-100 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Book {selectedRoomIds.length} Room{selectedRoomIds.length !== 1 ? 's' : ''} • {duration} Night{duration !== 1 ? 's' : ''}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default BookingModal;
