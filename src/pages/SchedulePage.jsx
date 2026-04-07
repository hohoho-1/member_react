import { useState, useEffect, useCallback } from 'react';
import { Calendar, dateFnsLocalizer } from 'react-big-calendar';
import { format, parse, startOfWeek, getDay, startOfMonth, endOfMonth } from 'date-fns';
import { ko } from 'date-fns/locale';
import 'react-big-calendar/lib/css/react-big-calendar.css';

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek: () => startOfWeek(new Date(), { weekStartsOn: 0 }),
  getDay,
  locales: { ko },
});

// 일정 상세 모달
function ScheduleDetailModal({ event, onClose }) {
  if (!event) return null;
  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl w-[420px] p-8"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-5">
          <div className="flex items-center gap-3">
            <div
              className="w-3 h-3 rounded-full shrink-0"
              style={{ backgroundColor: event.color ?? '#3B82F6' }}
            />
            <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100">{event.title}</h3>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-xl font-bold leading-none"
          >
            ×
          </button>
        </div>

        <div className="bg-gray-50 dark:bg-gray-700 rounded-xl p-4 space-y-3 text-sm mb-4">
          <div className="flex justify-between">
            <span className="text-gray-400">시작일</span>
            <span className="font-medium text-gray-700 dark:text-gray-200">
              {format(event.start, 'yyyy년 M월 d일 (eee)', { locale: ko })}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">종료일</span>
            <span className="font-medium text-gray-700 dark:text-gray-200">
              {format(subDay(event.end), 'yyyy년 M월 d일 (eee)', { locale: ko })}
            </span>
          </div>
          {event.authorName && (
            <div className="flex justify-between">
              <span className="text-gray-400">작성자</span>
              <span className="font-medium text-gray-700 dark:text-gray-200">{event.authorName}</span>
            </div>
          )}
        </div>

        {event.content && (
          <div className="bg-gray-50 dark:bg-gray-700 rounded-xl p-4 text-sm text-gray-600 dark:text-gray-300 whitespace-pre-wrap leading-relaxed">
            {event.content}
          </div>
        )}

        <button
          onClick={onClose}
          className="mt-5 w-full py-2.5 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-600 dark:text-gray-300 rounded-xl text-sm font-medium transition-colors"
        >
          닫기
        </button>
      </div>
    </div>
  );
}

export default function SchedulePage() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [currentDate, setCurrentDate] = useState(new Date());

  const fetchSchedules = useCallback(async (date) => {
    setLoading(true);
    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    try {
      const res = await fetch(`/api/schedules?year=${year}&month=${month}`);
      if (res.ok) {
        const data = await res.json();
        // react-big-calendar 형식으로 변환
        const mapped = data.map(s => ({
          id: s.id,
          title: s.title,
          // LocalDate(yyyy-MM-dd) → Date: 종료일은 +1일 (allDay 이벤트는 end exclusive)
          start: parseLocalDate(s.startDate),
          end: addDay(parseLocalDate(s.endDate)),
          color: s.color ?? '#3B82F6',
          content: s.content,
          authorName: s.authorName,
          allDay: true,
        }));
        setEvents(mapped);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSchedules(currentDate);
  }, []);

  const handleNavigate = (date) => {
    setCurrentDate(date);
    fetchSchedules(date);
  };

  const handleSelectEvent = (event) => {
    setSelectedEvent(event);
  };

  // 이벤트 스타일 (색상 적용)
  const eventStyleGetter = (event) => ({
    style: {
      backgroundColor: event.color ?? '#3B82F6',
      borderColor: event.color ?? '#3B82F6',
      color: '#fff',
      borderRadius: '6px',
      border: 'none',
      fontSize: '12px',
      padding: '2px 6px',
    },
  });

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      {/* 헤더 */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">📅 일정</h1>
        <p className="text-sm text-gray-400 mt-1">월간 일정을 확인할 수 있습니다.</p>
      </div>

      {/* 범례 */}
      {events.length > 0 && (
        <div className="flex flex-wrap gap-3 mb-4">
          {[...new Map(events.map(e => [e.color, e])).values()].map(e => (
            <div key={e.color} className="flex items-center gap-1.5 text-xs text-gray-500">
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: e.color }} />
            </div>
          ))}
        </div>
      )}

      {/* 캘린더 */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow p-4 min-h-[600px]">
        {loading && (
          <div className="text-center py-4 text-sm text-gray-400">로딩 중...</div>
        )}
        <Calendar
          localizer={localizer}
          events={events}
          startAccessor="start"
          endAccessor="end"
          style={{ height: 600 }}
          culture="ko"
          defaultView="month"
          views={['month']}
          onNavigate={handleNavigate}
          onSelectEvent={handleSelectEvent}
          eventPropGetter={eventStyleGetter}
          popup
          messages={{
            next: '▶',
            previous: '◀',
            today: '오늘',
            month: '월',
            noEventsInRange: '이 기간에 일정이 없습니다.',
            showMore: count => `+${count}개 더보기`,
          }}
        />
      </div>

      {/* 상세 모달 */}
      <ScheduleDetailModal
        event={selectedEvent}
        onClose={() => setSelectedEvent(null)}
      />
    </div>
  );
}

// yyyy-MM-dd 문자열 → Date (로컬 시간 기준, UTC 오프셋 방지)
function parseLocalDate(str) {
  const [y, m, d] = str.split('-').map(Number);
  return new Date(y, m - 1, d);
}

function addDay(date) {
  const d = new Date(date);
  d.setDate(d.getDate() + 1);
  return d;
}

function subDay(date) {
  const d = new Date(date);
  d.setDate(d.getDate() - 1);
  return d;
}
