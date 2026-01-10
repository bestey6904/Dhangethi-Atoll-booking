
import React, { useState, useMemo, useEffect } from 'react';
import { ROOMS, STAFF, STATUS_INDICATOR, STAFF_COLORS } from './constants';
import { Room, Booking, RoomStatus, RoomType } from './types';
import { getDaysInMonth, isSameDay, isDateInRange } from './utils';
import RoomStatusBadge from './components/RoomStatusBadge';
import BookingModal from './components/BookingModal';
import VoiceAssistant from './components/VoiceAssistant';
import { getSmartSummary } from './geminiService';

const App: React.FC = () => {
  const [rooms, setRooms] = useState<Room[]>(ROOMS);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedRoomForBooking, setSelectedRoomForBooking] = useState<string | undefined>();
  const [smartSummary, setSmartSummary] = useState<string>("Loading smart status...");
  const [activeStaffId, setActiveStaffId] = useState<string>(STAFF[0].id);

  const days = useMemo(() => {
    return getDaysInMonth(currentDate.getFullYear(), currentDate.getMonth());
  }, [currentDate]);

  const staffBookingCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    STAFF.forEach(s => (counts[s.id] = 0));
    bookings.forEach(b => {
      if (counts[b.staffId] !== undefined) {
        counts[b.staffId]++;
      }
    });
    return counts;
  }, [bookings]);

  useEffect(() => {
    const fetchSummary = async () => {
      const summary = await getSmartSummary(bookings, rooms);
      setSmartSummary(summary);
    };
    fetchSummary();
  }, [bookings, rooms]);

  const handleAddBooking = (data: {
    roomIds: string[];
    guestName: string;
    startDate: string;
    endDate: string;
    staffId: string;
    notes: string;
  }) => {
    const newBookings: Booking[] = data.roomIds.map(roomId => ({
      id: Math.random().toString(36).substr(2, 9),
      roomId,
      guestName: data.guestName,
      startDate: data.startDate,
      endDate: data.endDate,
      staffId: data.staffId,
      notes: data.notes,
      createdAt: new Date().toISOString()
    }));
    
    setBookings(prev => [...prev, ...newBookings]);
    
    // Auto-update room status if today is in range
    const today = new Date();
    setRooms(prev => prev.map(r => 
      data.roomIds.includes(r.id) && isDateInRange(today, data.startDate, data.endDate)
        ? { ...r, status: RoomStatus.OCCUPIED }
        : r
    ));
  };

  const updateRoomStatus = (roomId: string, status: RoomStatus) => {
    setRooms(prev => prev.map(r => r.id === roomId ? { ...r, status } : r));
  };

  const toggleRoomStatus = (roomId: string) => {
    setRooms(prev => prev.map(r => {
      if (r.id === roomId) {
        const statuses = Object.values(RoomStatus);
        const currentIndex = statuses.indexOf(r.status);
        const nextIndex = (currentIndex + 1) % statuses.length;
        return { ...r, status: statuses[nextIndex] };
      }
      return r;
    }));
  };

  const navigateMonth = (direction: number) => {
    const next = new Date(currentDate);
    next.setMonth(next.getMonth() + direction);
    setCurrentDate(next);
  };

  const twinRooms = rooms.filter(r => r.type === RoomType.TWIN);
  const doubleRooms = rooms.filter(r => r.type === RoomType.DOUBLE);

  const RoomSection = ({ title, roomList }: { title: string, roomList: Room[] }) => (
    <div className="mb-6">
      <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 ml-4">{title}</h3>
      {roomList.map(room => (
        <div key={room.id} className="flex border-b border-slate-100 group">
          {/* Room Info Sidebar */}
          <div className="w-48 flex-shrink-0 p-3 bg-white border-r border-slate-100 flex items-center justify-between sticky left-0 z-10 shadow-sm">
            <div>
              <div className="font-semibold text-slate-700 text-sm">{room.name}</div>
              <RoomStatusBadge status={room.status} onClick={() => toggleRoomStatus(room.id)} />
            </div>
            <button 
              onClick={() => { setSelectedRoomForBooking(room.id); setIsModalOpen(true); }}
              className="opacity-0 group-hover:opacity-100 p-1.5 rounded-full hover:bg-slate-100 text-teal-600 transition-all"
              title="Add Booking"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            </button>
          </div>

          {/* Calendar Cells */}
          <div className="flex flex-1">
            {days.map(day => {
              const booking = bookings.find(b => b.roomId === room.id && isDateInRange(day, b.startDate, b.endDate));
              const isStart = booking && isSameDay(day, new Date(booking.startDate));
              const isToday = isSameDay(day, new Date());
              const isWeekend = day.getDay() === 0 || day.getDay() === 6;

              // Calculate stay duration
              let stayDuration = 0;
              let staffColors = { bg: 'bg-teal-500', solid: 'bg-teal-600', light: 'bg-teal-100' };
              
              if (booking) {
                const s = new Date(booking.startDate);
                const e = new Date(booking.endDate);
                stayDuration = Math.ceil((e.getTime() - s.getTime()) / (1000 * 60 * 60 * 24));
                staffColors = STAFF_COLORS[booking.staffId] || staffColors;
              }

              return (
                <div 
                  key={day.getTime()} 
                  className={`w-12 h-14 flex-shrink-0 border-r border-slate-50 relative group/cell flex items-center justify-center
                    ${isWeekend ? 'bg-slate-50/50' : 'bg-white'} 
                    ${isToday ? 'after:content-[""] after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-teal-500' : ''}
                  `}
                >
                  {booking ? (
                    <div className={`
                      absolute inset-y-2 inset-x-0.5 rounded-sm z-1
                      ${isStart ? `${staffColors.solid} rounded-l-md ml-1 shadow-md` : `${staffColors.bg}/80`}
                      group-hover/cell:z-20 group-hover/cell:scale-105 transition-all cursor-pointer
                    `}>
                      {isStart && (
                        <div className="flex flex-col px-1.5 py-0.5 overflow-hidden">
                          <span className="text-[9px] text-white font-bold leading-tight truncate">
                            {booking.guestName.split(' ')[0]}
                          </span>
                          <span className="text-[8px] text-white/70 font-medium leading-tight">
                            {stayDuration}d
                          </span>
                        </div>
                      )}
                      
                      {/* Tooltip */}
                      <div className="invisible group-hover/cell:visible absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-56 p-3 bg-slate-900 text-white text-xs rounded-xl shadow-2xl z-50 animate-in fade-in slide-in-from-bottom-2">
                        <div className="flex justify-between items-start mb-1.5">
                          <span className="font-bold text-sm">{booking.guestName}</span>
                          <span className={`${staffColors.solid} px-1.5 py-0.5 rounded text-[10px]`}>{stayDuration} Nights</span>
                        </div>
                        <p className="opacity-70 flex items-center gap-1">
                          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                          {new Date(booking.startDate).toLocaleDateString()} — {new Date(booking.endDate).toLocaleDateString()}
                        </p>
                        <p className="mt-2 border-t border-white/10 pt-2 flex items-center justify-between">
                          <span className="opacity-60 italic">Reserved by {STAFF.find(s => s.id === booking.staffId)?.name}</span>
                          <span className="bg-white/10 px-1.5 py-0.5 rounded text-[9px]">{room.name}</span>
                        </p>
                      </div>
                    </div>
                  ) : (
                    <button 
                      onClick={() => { setSelectedRoomForBooking(room.id); setIsModalOpen(true); }}
                      className="opacity-0 group-hover/cell:opacity-100 text-slate-200 hover:text-teal-400 transition-opacity"
                    >
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" />
                      </svg>
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30 px-6 py-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          {/* Custom Logo Design */}
          <div className="relative w-12 h-12 bg-gradient-to-br from-teal-400 to-teal-600 rounded-2xl flex items-center justify-center text-white shadow-xl shadow-teal-100 group overflow-hidden">
            <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity" />
            <svg className="w-8 h-8 relative z-10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
               {/* Sun icon */}
               <circle cx="12" cy="10" r="4" fill="currentColor" fillOpacity="0.3" />
               {/* Waves icon */}
               <path d="M2 17c2 0 2-2 4-2s2 2 4 2 2-2 4-2 2 2 4 2" />
               <path d="M2 20c2 0 2-2 4-2s2 2 4 2 2-2 4-2 2 2 4 2" strokeOpacity="0.5" />
            </svg>
          </div>
          <div>
            <h1 className="text-xl font-black text-slate-900 tracking-tight leading-none mb-1">Dhangethi <span className="text-teal-600">Atoll</span></h1>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.2em]">Management Portal</p>
          </div>
        </div>

        <div className="flex items-center gap-3 bg-slate-50 p-1.5 rounded-xl border border-slate-100">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-2">Logged as:</span>
          <select 
            value={activeStaffId} 
            onChange={(e) => setActiveStaffId(e.target.value)}
            className="bg-white border border-slate-200 text-xs font-bold rounded-lg px-3 py-1.5 text-slate-700 focus:ring-2 focus:ring-teal-500 outline-none"
          >
            {STAFF.map(s => (
              <option key={s.id} value={s.id}>
                {s.name} ({staffBookingCounts[s.id]})
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-4 bg-slate-50 p-1.5 rounded-xl border border-slate-100">
          <button onClick={() => navigateMonth(-1)} className="p-2 hover:bg-white rounded-lg transition-all text-slate-600 shadow-sm">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <div className="px-4 text-sm font-bold text-slate-700 min-w-[140px] text-center">
            {currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
          </div>
          <button onClick={() => navigateMonth(1)} className="p-2 hover:bg-white rounded-lg transition-all text-slate-600 shadow-sm">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>

        <div className="flex items-center gap-3">
          <a 
            href="https://ai.studio/apps/drive/1jSpcNhbJ417q2i6JiZG6clNBhunUJcHM" 
            target="_blank" 
            rel="noopener noreferrer"
            className="p-2.5 bg-slate-100 text-slate-500 rounded-xl hover:bg-slate-200 transition-all"
            title="System Drive"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z" />
            </svg>
          </a>
          <button 
            onClick={() => { setSelectedRoomForBooking(undefined); setIsModalOpen(true); }}
            className="bg-teal-600 hover:bg-teal-700 text-white px-5 py-2.5 rounded-xl font-bold shadow-lg shadow-teal-100 transition-all active:scale-95 flex items-center justify-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Create Multi-Booking
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 p-6 overflow-hidden flex flex-col">
        {/* Smart Assistant Bar */}
        <div className="mb-6 bg-gradient-to-r from-teal-600 via-teal-500 to-cyan-600 p-4 rounded-2xl text-white shadow-xl shadow-teal-100 flex items-start gap-4 animate-in fade-in slide-in-from-top-4 duration-500">
          <div className="bg-white/20 p-2 rounded-lg backdrop-blur-md">
            <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <div className="flex-1">
            <h4 className="text-[10px] font-bold uppercase tracking-[0.2em] opacity-80 mb-1">Intelligent Overview</h4>
            <p className="text-sm font-medium leading-relaxed max-w-4xl">{smartSummary}</p>
          </div>
          <div className="hidden md:block bg-black/10 px-3 py-1.5 rounded-full text-[10px] font-bold border border-white/10">
            {bookings.length} ACTIVE BOOKINGS
          </div>
        </div>

        {/* Legend Sections */}
        <div className="flex flex-col md:flex-row gap-6 mb-6">
          <div className="flex flex-wrap gap-3">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block w-full mb-1">Room Status</span>
            {Object.entries(STATUS_INDICATOR).map(([status, color]) => (
              <div key={status} className="flex items-center gap-2 text-xs font-bold text-slate-500 bg-white px-3.5 py-2 rounded-full border border-slate-100 shadow-sm">
                <span className={`w-2.5 h-2.5 rounded-full ${color}`} />
                {status}
              </div>
            ))}
          </div>
          
          <div className="flex flex-wrap gap-3">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block w-full mb-1">Staff Assignments</span>
            {STAFF.map((staff) => (
              <div key={staff.id} className="flex items-center gap-2 text-xs font-bold text-slate-500 bg-white px-3.5 py-2 rounded-full border border-slate-100 shadow-sm">
                <span className={`w-2.5 h-2.5 rounded-full ${STAFF_COLORS[staff.id].solid}`} />
                <span className="flex items-center gap-1.5">
                  {staff.name} 
                  <span className="bg-slate-100 text-slate-400 text-[9px] px-1 rounded-sm">
                    {staffBookingCounts[staff.id]}
                  </span>
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Calendar Wrapper */}
        <div className="flex-1 bg-slate-100/50 rounded-3xl border border-slate-200 overflow-hidden flex flex-col shadow-inner">
          <div className="overflow-x-auto no-scrollbar bg-white">
            <div className="min-w-max">
              {/* Calendar Header Row */}
              <div className="flex bg-slate-50 border-b border-slate-200 sticky top-0 z-20">
                <div className="w-48 flex-shrink-0 p-4 text-xs font-bold text-slate-400 border-r border-slate-200 bg-slate-50 flex items-center justify-between">
                  <span>ROOM DETAILS</span>
                  <svg className="w-4 h-4 opacity-30" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M19 9l-7 7-7-7" /></svg>
                </div>
                <div className="flex flex-1">
                  {days.map(day => {
                    const isToday = isSameDay(day, new Date());
                    const isWeekend = day.getDay() === 0 || day.getDay() === 6;
                    return (
                      <div 
                        key={day.getTime()} 
                        className={`w-12 h-14 flex-shrink-0 flex flex-col items-center justify-center border-r border-slate-100
                          ${isWeekend ? 'bg-slate-100/50' : 'bg-slate-50'}
                          ${isToday ? 'bg-teal-50 text-teal-600 relative' : ''}
                        `}
                      >
                        {isToday && <div className="absolute top-0 left-0 right-0 h-1 bg-teal-600" />}
                        <span className="text-[10px] font-bold opacity-60 uppercase">{day.toLocaleDateString('en-US', { weekday: 'short' })}</span>
                        <span className={`text-sm font-black ${isToday ? 'text-teal-600' : 'text-slate-700'}`}>{day.getDate()}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Room Grid */}
              <div className="max-h-[calc(100vh-450px)] overflow-y-auto no-scrollbar pb-8">
                <RoomSection title="Twin Rooms" roomList={twinRooms} />
                <RoomSection title="Double Bed Rooms" roomList={doubleRooms} />
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Voice Assistant */}
      <VoiceAssistant 
        rooms={rooms}
        onBook={handleAddBooking}
        onUpdateStatus={updateRoomStatus}
        activeStaffId={activeStaffId}
      />

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 p-4 flex justify-between items-center text-[10px] font-bold text-slate-400 tracking-wider uppercase">
        <div className="flex items-center gap-4">
          <span>System v2.5.0-Dhangethi</span>
          <span className="w-1 h-1 bg-slate-300 rounded-full"/>
          <a 
            href="https://ai.studio/apps/drive/1jSpcNhbJ417q2i6JiZG6clNBhunUJcHM" 
            target="_blank" 
            rel="noopener noreferrer"
            className="hover:text-teal-500 transition-colors"
          >
            System Drive (Save Location)
          </a>
        </div>
        <div className="flex gap-4 items-center">
          <span className="flex items-center gap-1.5"><span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse shadow-sm shadow-emerald-400"/> Operational</span>
          <span className="bg-slate-100 px-2 py-0.5 rounded">© 2024 DHANGETHI ATOLL INC.</span>
        </div>
      </footer>

      {/* Modals */}
      <BookingModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onSubmit={handleAddBooking}
        selectedRoomId={selectedRoomForBooking}
        rooms={rooms}
      />
    </div>
  );
};

export default App;
