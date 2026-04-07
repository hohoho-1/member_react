import { useState, useEffect, useCallback } from 'react';
import { Calendar, dateFnsLocalizer } from 'react-big-calendar';
import { format, parse, startOfWeek, getDay } from 'date-fns';
import { ko } from 'date-fns/locale';
import { authFetch, getTokenPayload } from '../utils/authFetch';
import 'react-big-calendar/lib/css/react-big-calendar.css';

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek: () => startOfWeek(new Date(), { weekStartsOn: 0 }),
  getDay,
  locales: { ko },
});

const SCHEDULE_COLORS = [
  { label: '파랑', value: '#3B82F6' },
  { label: '초록', value: '#10B981' },
  { label: '빨강', value: '#EF4444' },
  { label: '주황', value: '#F97316' },
  { label: '보라', value: '#8B5CF6' },
  { label: '분홍', value: '#EC4899' },
  { label: '하늘', value: '#06B6D4' },
  { label: '노랑', value: '#EAB308' },
];

// ── 등록/수정 모달 ────────────────────────────────────────────────────────
function ScheduleFormModal({ initial, onClose, onSave }) {
  const isEdit = !!initial?.id;
  const [form, setForm] = useState(
    isEdit
      ? { ...initial }
      : {
          title: '',
          content: '',
          startDate: initial?.startDate ?? '',
          endDate: initial?.endDate ?? '',
          color: '#3B82F6',
        }
  );
  const [error, setError] = useState('');

  const set = (key, val) => setForm(prev => ({ ...prev, [key]: val }));

  const handleSubmit = async () => {
    if (!form.title.trim()) { setError('일정 제목을 입력하세요.'); return; }
    if (!form.startDate)    { setError('시작일을 입력하세요.'); return; }
    if (!form.endDate)      { setError('종료일을 입력하세요.'); return; }
    if (form.endDate < form.startDate) { setError('종료일은 시작일 이후여야 합니다.'); return; }
    setError('');
    await onSave(form, isEdit);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl w-[480px] max-h-[90vh] overflow-y-auto p-8"
        onClick={e => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-lg font-bold text-gray-700 dark:text-gray-100">
            {isEdit ? '📝 일정 수정' : '➕ 일정 등록'}
          </h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl font-bold">×</button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1">제목 <span className="text-red-400">*</span></label>
            <input value={form.title} onChange={e => set('title', e.target.value)}
              placeholder="일정 제목"
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-teal-400 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1">시작일 <span className="text-red-400">*</span></label>
              <input type="date" value={form.startDate} onChange={e => set('startDate', e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-teal-400 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1">종료일 <span className="text-red-400">*</span></label>
              <input type="date" value={form.endDate} onChange={e => set('endDate', e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-teal-400 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-2">색상</label>
            <div className="flex gap-2 flex-wrap">
              {SCHEDULE_COLORS.map(c => (
                <button key={c.value} onClick={() => set('color', c.value)} title={c.label}
                  style={{ backgroundColor: c.value }}
                  className={`w-8 h-8 rounded-full transition-transform ${form.color === c.value ? 'scale-125 ring-2 ring-offset-2 ring-gray-400' : 'hover:scale-110'}`} />
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1">내용 (선택)</label>
            <textarea value={form.content} onChange={e => set('content', e.target.value)}
              placeholder="일정 상세 내용" rows={3}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-teal-400 resize-none dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100" />
          </div>

          {error && <p className="text-sm text-red-500">⚠️ {error}</p>}

          <div className="flex gap-3 pt-2">
            <button onClick={onClose}
              className="flex-1 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-xl text-sm font-medium transition-colors">
              취소
            </button>
            <button onClick={handleSubmit}
              className="flex-1 py-2.5 bg-teal-500 hover:bg-teal-600 text-white rounded-xl text-sm font-medium transition-colors">
              {isEdit ? '수정 완료' : '일정 등록'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── 상세 모달 ─────────────────────────────────────────────────────────────
function ScheduleDetailModal({ event, isAdmin, onClose, onEdit, onDelete }) {
  if (!event) return null;
  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl w-[420px] p-8"
        onClick={e => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-5">
          <div className="flex items-center gap-3">
            <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: event.color ?? '#3B82F6' }} />
            <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100">{event.title}</h3>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl font-bold leading-none">×</button>
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
          <div className="bg-gray-50 dark:bg-gray-700 rounded-xl p-4 text-sm text-gray-600 dark:text-gray-300 whitespace-pre-wrap leading-relaxed mb-4">
            {event.content}
          </div>
        )}

        {isAdmin ? (
          <div className="flex gap-2">
            <button onClick={onClose}
              className="flex-1 py-2.5 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-600 dark:text-gray-300 rounded-xl text-sm font-medium transition-colors">
              닫기
            </button>
            <button onClick={() => onEdit(event)}
              className="flex-1 py-2.5 bg-blue-500 hover:bg-blue-600 text-white rounded-xl text-sm font-medium transition-colors">
              수정
            </button>
            <button onClick={() => onDelete(event)}
              className="flex-1 py-2.5 bg-red-500 hover:bg-red-600 text-white rounded-xl text-sm font-medium transition-colors">
              삭제
            </button>
          </div>
        ) : (
          <button onClick={onClose}
            className="w-full py-2.5 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-600 dark:text-gray-300 rounded-xl text-sm font-medium transition-colors">
            닫기
          </button>
        )}
      </div>
    </div>
  );
}

// ── 메인 페이지 ───────────────────────────────────────────────────────────
export default function SchedulePage() {
  const payload = getTokenPayload();
  const isAdmin = payload?.role === 'ROLE_ADMIN';

  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [currentDate, setCurrentDate] = useState(new Date());

  // 모달 상태: null=닫힘
  const [detailEvent, setDetailEvent] = useState(null);   // 상세 모달
  const [formInitial, setFormInitial] = useState(null);   // 등록/수정 모달

  const fetchSchedules = useCallback(async (date) => {
    setLoading(true);
    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    try {
      const res = await fetch(`/api/schedules?year=${year}&month=${month}`);
      if (res.ok) {
        const data = await res.json();
        setEvents(data.map(s => ({
          id: s.id,
          title: s.title,
          start: parseLocalDate(s.startDate),
          end: addDay(parseLocalDate(s.endDate)),
          color: s.color ?? '#3B82F6',
          content: s.content,
          authorName: s.authorName,
          // 수정용 원본 날짜 보존
          startDate: s.startDate,
          endDate: s.endDate,
          allDay: true,
        })));
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchSchedules(currentDate); }, []);

  const handleNavigate = (date) => {
    setCurrentDate(date);
    fetchSchedules(date);
  };

  // 일정 클릭 → 상세 모달
  const handleSelectEvent = (event) => {
    setDetailEvent(event);
  };

  // 빈 날짜/슬롯 클릭 → 관리자만 등록 모달
  const handleSelectSlot = ({ start, end }) => {
    if (!isAdmin) return;
    const startStr = formatDateStr(start);
    // react-big-calendar의 slot end는 다음날 0시이므로 -1일
    const endStr = formatDateStr(subDay(end));
    setFormInitial({ startDate: startStr, endDate: endStr < startStr ? startStr : endStr });
  };

  // 저장 (등록/수정 공통)
  const handleSave = async (form, isEdit) => {
    const url    = isEdit ? `/api/schedules/${form.id}` : '/api/schedules';
    const method = isEdit ? 'PUT' : 'POST';
    const res = await authFetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    });
    if (res.ok) {
      setFormInitial(null);
      setDetailEvent(null);
      fetchSchedules(currentDate);
    }
  };

  // 수정 버튼 (상세→수정 모달 전환)
  const handleEdit = (event) => {
    setDetailEvent(null);
    setFormInitial({
      id: event.id,
      title: event.title,
      content: event.content ?? '',
      startDate: event.startDate,
      endDate: event.endDate,
      color: event.color,
    });
  };

  // 삭제
  const handleDelete = async (event) => {
    if (!window.confirm(`'${event.title}' 일정을 삭제하시겠습니까?`)) return;
    const res = await authFetch(`/api/schedules/${event.id}`, { method: 'DELETE' });
    if (res.ok) {
      setDetailEvent(null);
      fetchSchedules(currentDate);
    }
  };

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
      <div className="flex justify-between items-start mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">📅 일정</h1>
          <p className="text-sm text-gray-400 mt-1">
            {isAdmin ? '날짜를 클릭해서 일정을 등록하세요.' : '월간 일정을 확인할 수 있습니다.'}
          </p>
        </div>
        {isAdmin && (
          <button onClick={() => setFormInitial({})}
            className="px-4 py-2 bg-teal-500 hover:bg-teal-600 text-white rounded-lg text-sm font-medium transition-colors">
            + 일정 등록
          </button>
        )}
      </div>

      {/* 캘린더 */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow p-4 min-h-[620px]">
        {loading && <div className="text-center py-4 text-sm text-gray-400">로딩 중...</div>}
        <Calendar
          localizer={localizer}
          events={events}
          startAccessor="start"
          endAccessor="end"
          style={{ height: 620 }}
          culture="ko"
          defaultView="month"
          views={['month']}
          onNavigate={handleNavigate}
          onSelectEvent={handleSelectEvent}
          onSelectSlot={handleSelectSlot}
          selectable={isAdmin}          // 관리자만 슬롯 선택 가능
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
        event={detailEvent}
        isAdmin={isAdmin}
        onClose={() => setDetailEvent(null)}
        onEdit={handleEdit}
        onDelete={handleDelete}
      />

      {/* 등록/수정 모달 */}
      {formInitial !== null && (
        <ScheduleFormModal
          initial={formInitial}
          onClose={() => setFormInitial(null)}
          onSave={handleSave}
        />
      )}
    </div>
  );
}

// ── 유틸 ─────────────────────────────────────────────────────────────────
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

function formatDateStr(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}
