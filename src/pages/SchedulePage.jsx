import { useState, useEffect, useCallback } from 'react';
import { Calendar, dateFnsLocalizer } from 'react-big-calendar';
import { format, parse, startOfWeek, getDay } from 'date-fns';
import { ko } from 'date-fns/locale';
import { useSearchParams } from 'react-router-dom';
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

const VISIBILITY_OPTIONS = [
  { value: 'PUBLIC',  label: '🌐 전체 공개', desc: '비로그인 포함 모두 볼 수 있음' },
  { value: 'MEMBER',  label: '👥 회원 공개', desc: '로그인한 회원만 볼 수 있음' },
  { value: 'PRIVATE', label: '🔒 비공개',    desc: '관리자만 볼 수 있음' },
];

const VISIBILITY_META = {
  PUBLIC:  { icon: '🌐', label: '전체 공개', color: 'text-teal-500' },
  MEMBER:  { icon: '👥', label: '회원 공개', color: 'text-blue-500' },
  PRIVATE: { icon: '🔒', label: '비공개',    color: 'text-gray-500' },
};

// ── 등록/수정 모달 ────────────────────────────────────────────────────────
function ScheduleFormModal({ initial, onClose, onSave }) {
  const isEdit = !!initial?.id;
  const [form, setForm] = useState(
    isEdit
      ? { allDay: !initial.startTime, ...initial }
      : {
          title: '',
          content: '',
          startDate: initial?.startDate ?? '',
          endDate: initial?.endDate ?? '',
          startTime: '',
          endTime: '',
          allDay: true,
          color: '#3B82F6',
          visibility: 'PUBLIC',
        }
  );
  const [error, setError] = useState('');

  const set = (key, val) => setForm(prev => ({ ...prev, [key]: val }));

  const handleSubmit = async () => {
    if (!form.title.trim()) { setError('일정 제목을 입력하세요.'); return; }
    if (!form.startDate)    { setError('시작일을 입력하세요.'); return; }
    if (!form.endDate)      { setError('종료일을 입력하세요.'); return; }
    if (form.endDate < form.startDate) { setError('종료일은 시작일 이후여야 합니다.'); return; }
    if (!form.allDay) {
      if (!form.startTime) { setError('시작 시간을 입력하세요.'); return; }
      if (!form.endTime)   { setError('종료 시간을 입력하세요.'); return; }
      if (form.startDate === form.endDate && form.endTime <= form.startTime) {
        setError('종료 시간은 시작 시간 이후여야 합니다.'); return;
      }
    }
    setError('');
    const payload = {
      ...form,
      startTime: form.allDay ? null : form.startTime,
      endTime:   form.allDay ? null : form.endTime,
    };
    await onSave(payload, isEdit);
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
          {/* 제목 */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1">제목 <span className="text-red-400">*</span></label>
            <input value={form.title} onChange={e => set('title', e.target.value)}
              placeholder="일정 제목"
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-teal-400 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100" />
          </div>

          {/* 종일 토글 */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => set('allDay', !form.allDay)}
              className={`relative w-10 h-5 rounded-full transition-colors ${form.allDay ? 'bg-teal-500' : 'bg-gray-300'}`}>
              <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${form.allDay ? 'left-5' : 'left-0.5'}`} />
            </button>
            <span className="text-sm text-gray-600 dark:text-gray-300">종일</span>
          </div>

          {/* 날짜 */}
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

          {/* 시간 (종일 아닐 때) */}
          {!form.allDay && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">시작 시간 <span className="text-red-400">*</span></label>
                <input type="time" value={form.startTime} onChange={e => set('startTime', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-teal-400 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">종료 시간 <span className="text-red-400">*</span></label>
                <input type="time" value={form.endTime} onChange={e => set('endTime', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-teal-400 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100" />
              </div>
            </div>
          )}

          {/* 색상 */}
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

          {/* 공개 설정 */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-2">공개 설정</label>
            <div className="flex flex-col gap-2">
              {VISIBILITY_OPTIONS.map(opt => (
                <button key={opt.value} onClick={() => set('visibility', opt.value)}
                  className={`flex items-center gap-3 px-4 py-2.5 rounded-xl border text-left transition-colors ${
                    form.visibility === opt.value
                      ? 'border-teal-400 bg-teal-50 dark:bg-teal-950'
                      : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 bg-white dark:bg-gray-700'
                  }`}>
                  <span className="text-base">{opt.label.split(' ')[0]}</span>
                  <div>
                    <p className={`text-sm font-medium ${form.visibility === opt.value ? 'text-teal-700 dark:text-teal-300' : 'text-gray-700 dark:text-gray-200'}`}>
                      {opt.label.split(' ').slice(1).join(' ')}
                    </p>
                    <p className="text-xs text-gray-400">{opt.desc}</p>
                  </div>
                  {form.visibility === opt.value && (
                    <span className="ml-auto text-teal-500 text-sm font-bold">✓</span>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* 내용 */}
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
  const vis = VISIBILITY_META[event.visibility] ?? VISIBILITY_META.PUBLIC;

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
            <span className="text-gray-400">시작</span>
            <span className="font-medium text-gray-700 dark:text-gray-200">
              {format(event.start, event.allDay ? 'yyyy년 M월 d일 (eee)' : 'yyyy년 M월 d일 (eee) HH:mm', { locale: ko })}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">종료</span>
            <span className="font-medium text-gray-700 dark:text-gray-200">
              {event.allDay
                ? format(subDay(event.end), 'yyyy년 M월 d일 (eee)', { locale: ko })
                : format(event.end, 'yyyy년 M월 d일 (eee) HH:mm', { locale: ko })}
            </span>
          </div>
          {event.authorName && (
            <div className="flex justify-between">
              <span className="text-gray-400">작성자</span>
              <span className="font-medium text-gray-700 dark:text-gray-200">{event.authorName}</span>
            </div>
          )}
          <div className="flex justify-between">
            <span className="text-gray-400">공개 설정</span>
            <span className={`font-medium text-sm ${vis.color}`}>{vis.icon} {vis.label}</span>
          </div>
        </div>

        {event.content && (
          <div className="bg-gray-50 dark:bg-gray-700 rounded-xl p-4 text-sm text-gray-600 dark:text-gray-300 whitespace-pre-wrap leading-relaxed mb-4">
            {event.content}
          </div>
        )}

        {isAdmin ? (
          <div className="flex gap-2">
            <button onClick={onClose} className="flex-1 py-2.5 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-600 dark:text-gray-300 rounded-xl text-sm font-medium transition-colors">닫기</button>
            <button onClick={() => onEdit(event)} className="flex-1 py-2.5 bg-blue-500 hover:bg-blue-600 text-white rounded-xl text-sm font-medium transition-colors">수정</button>
            <button onClick={() => onDelete(event)} className="flex-1 py-2.5 bg-red-500 hover:bg-red-600 text-white rounded-xl text-sm font-medium transition-colors">삭제</button>
          </div>
        ) : (
          <button onClick={onClose} className="w-full py-2.5 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-600 dark:text-gray-300 rounded-xl text-sm font-medium transition-colors">닫기</button>
        )}
      </div>
    </div>
  );
}

// ── 커스텀 이벤트 렌더러 ─────────────────────────────────────────────────
function EventItem({ event }) {
  const icon = event.visibility === 'PRIVATE' ? '🔒'
             : event.visibility === 'MEMBER'  ? '👥'
             : null;
  return (
    <span className="flex items-center gap-1 truncate">
      {icon && <span className="shrink-0 text-[11px]">{icon}</span>}
      <span>{event.title}</span>
    </span>
  );
}

// ── 메인 페이지 ───────────────────────────────────────────────────────────
export default function SchedulePage() {
  const payload = getTokenPayload();
  const isAdmin = payload?.role === 'ROLE_ADMIN';
  const [searchParams, setSearchParams] = useSearchParams();

  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [detailEvent, setDetailEvent] = useState(null);
  const [formInitial, setFormInitial] = useState(null);

  const fetchSchedules = useCallback(async (date) => {
    setLoading(true);
    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    try {
      const res = await authFetch(`/api/schedules?year=${year}&month=${month}`);
      if (res.ok) {
        const data = await res.json();
        const mapped = data.map(s => {
          const hasTime = !!s.startTime;
          let start, end;
          if (hasTime) {
            // 시간 지정 일정
            start = parseLocalDateTime(s.startDate, s.startTime);
            end   = parseLocalDateTime(s.endDate, s.endTime);
          } else {
            // 종일 일정
            start = parseLocalDate(s.startDate);
            end   = addDay(parseLocalDate(s.endDate));
          }
          return {
            id: s.id,
            title: s.title,
            start,
            end,
            allDay: !hasTime,
            color: s.color ?? '#3B82F6',
            content: s.content,
            authorName: s.authorName,
            visibility: s.visibility ?? 'PUBLIC',
            startDate: s.startDate,
            endDate: s.endDate,
            startTime: s.startTime ?? '',
            endTime: s.endTime ?? '',
          };
        });
        setEvents(mapped);
        const openId = searchParams.get('open');
        if (openId) {
          const target = mapped.find(e => String(e.id) === openId);
          if (target) setDetailEvent(target);
          setSearchParams({}, { replace: true });
        }
      }
    } finally {
      setLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { fetchSchedules(currentDate); }, []);

  const handleNavigate = (date) => { setCurrentDate(date); fetchSchedules(date); };
  const handleSelectEvent = (event) => setDetailEvent(event);

  const handleSelectSlot = ({ start, end }) => {
    if (!isAdmin) return;
    const startStr = formatDateStr(start);
    const endStr = formatDateStr(subDay(end));
    setFormInitial({ startDate: startStr, endDate: endStr < startStr ? startStr : endStr });
  };

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

  const handleEdit = (event) => {
    setDetailEvent(null);
    setFormInitial({
      id: event.id,
      title: event.title,
      content: event.content ?? '',
      startDate: event.startDate,
      endDate: event.endDate,
      startTime: event.startTime ?? '',
      endTime: event.endTime ?? '',
      allDay: event.allDay,
      color: event.color,
      visibility: event.visibility ?? 'PUBLIC',
    });
  };

  const handleDelete = async (event) => {
    if (!window.confirm(`'${event.title}' 일정을 삭제하시겠습니까?`)) return;
    const res = await authFetch(`/api/schedules/${event.id}`, { method: 'DELETE' });
    if (res.ok) { setDetailEvent(null); fetchSchedules(currentDate); }
  };

  const eventStyleGetter = (event) => {
    const v = event.visibility ?? 'PUBLIC';
    const base = { borderRadius: '6px', fontSize: '12px', padding: '2px 6px', borderWidth: '2px', borderColor: event.color ?? '#3B82F6' };
    if (v === 'PRIVATE') return { style: { ...base, backgroundColor: 'transparent', borderStyle: 'dashed', color: event.color ?? '#3B82F6' } };
    if (v === 'MEMBER')  return { style: { ...base, backgroundColor: event.color ?? '#3B82F6', borderStyle: 'solid', color: '#fff', opacity: 0.75 } };
    return { style: { ...base, backgroundColor: event.color ?? '#3B82F6', borderStyle: 'solid', color: '#fff' } };
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <div className="flex justify-between items-start mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">📅 일정</h1>
          <p className="text-sm text-gray-400 mt-1">
            {isAdmin ? '날짜를 클릭해서 일정을 등록하세요.' : '월간 일정을 확인할 수 있습니다.'}
          </p>
        </div>
        {isAdmin && (
          <button onClick={() => setFormInitial({})} className="px-4 py-2 bg-teal-500 hover:bg-teal-600 text-white rounded-lg text-sm font-medium transition-colors">
            + 일정 등록
          </button>
        )}
      </div>

      {isAdmin && (
        <div className="flex gap-4 mb-4 text-xs text-gray-500 dark:text-gray-400">
          <span className="flex items-center gap-1.5"><span className="inline-block w-6 h-3 rounded" style={{ backgroundColor: '#3B82F6' }} />🌐 전체 공개</span>
          <span className="flex items-center gap-1.5"><span className="inline-block w-6 h-3 rounded opacity-75" style={{ backgroundColor: '#3B82F6' }} />👥 회원 공개</span>
          <span className="flex items-center gap-1.5"><span className="inline-block w-6 h-3 rounded border-2 border-dashed border-blue-400" style={{ backgroundColor: 'transparent' }} />🔒 비공개</span>
        </div>
      )}

      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow p-4 relative">
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center bg-white/60 dark:bg-gray-800/60 rounded-2xl z-10">
            <div className="text-sm text-gray-400">로딩 중...</div>
          </div>
        )}
        <Calendar
          localizer={localizer}
          events={events}
          startAccessor="start"
          endAccessor="end"
          style={{ height: 740 }}
          culture="ko"
          defaultView="month"
          views={['month', 'week']}
          onNavigate={handleNavigate}
          onSelectEvent={handleSelectEvent}
          onSelectSlot={handleSelectSlot}
          selectable={isAdmin}
          dayMaxEvents={2}
          components={{ event: EventItem }}
          eventPropGetter={eventStyleGetter}
          popup
          messages={{
            next: '▶', previous: '◀', today: '오늘', month: '월', week: '주',
            noEventsInRange: '이 기간에 일정이 없습니다.',
            showMore: count => `+${count}개 더보기`,
          }}
        />
        {!loading && events.length === 0 && (
          <div className="flex flex-col items-center justify-center py-10 text-center text-gray-400 dark:text-gray-500 gap-2">
            <span className="text-4xl">📭</span>
            <p className="text-sm font-medium">이 달에 등록된 일정이 없습니다.</p>
            {isAdmin && (
              <p className="text-xs">날짜를 클릭하거나{' '}
                <button onClick={() => setFormInitial({})} className="text-teal-500 hover:underline font-medium">+ 일정 등록</button>
                {' '}버튼으로 추가해보세요.
              </p>
            )}
          </div>
        )}
      </div>

      {/* 이달의 일정 리스트 */}
      {!loading && events.length > 0 && (() => {
        const today = formatDateStr(new Date());
        const sorted = [...events].sort((a, b) => a.startDate.localeCompare(b.startDate));
        return (
          <div className="mt-6 bg-white dark:bg-gray-800 rounded-2xl shadow p-6">
            <h2 className="text-sm font-bold text-gray-600 dark:text-gray-300 mb-4">
              📋 이달의 일정 <span className="ml-1 text-gray-400 font-normal">({events.length}건)</span>
            </h2>
            <ul className="divide-y divide-gray-50 dark:divide-gray-700">
              {sorted.map(event => {
                const vis = VISIBILITY_META[event.visibility] ?? VISIBILITY_META.PUBLIC;
                const isToday = event.startDate <= today && event.endDate >= today;
                const isPast  = event.endDate < today;
                return (
                  <li key={event.id} onClick={() => setDetailEvent(event)}
                    className="flex items-center gap-4 py-3 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 rounded-xl px-2 transition-colors group">
                    <div className="w-1 h-10 rounded-full shrink-0" style={{ backgroundColor: event.color ?? '#3B82F6', opacity: isPast ? 0.4 : 1 }} />
                    <div className="w-24 shrink-0">
                      <p className={`text-xs font-semibold ${isPast ? 'text-gray-300 dark:text-gray-600' : 'text-gray-500 dark:text-gray-400'}`}>
                        {event.startDate.slice(5).replace('-', '/')}
                        {event.startTime && ` ${event.startTime.slice(0, 5)}`}
                      </p>
                      {(event.startDate !== event.endDate || event.endTime) && (
                        <p className={`text-[10px] ${isPast ? 'text-gray-300 dark:text-gray-600' : 'text-gray-400'}`}>
                          ~ {event.endDate.slice(5).replace('-', '/')}
                          {event.endTime && ` ${event.endTime.slice(0, 5)}`}
                        </p>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-medium truncate group-hover:text-blue-600 transition-colors ${isPast ? 'text-gray-400 dark:text-gray-500 line-through' : 'text-gray-700 dark:text-gray-200'}`}>
                        {!event.allDay && <span className="text-xs mr-1">🕐</span>}{event.title}
                      </p>
                      {event.content && <p className="text-xs text-gray-400 truncate mt-0.5">{event.content}</p>}
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {isToday && <span className="px-2 py-0.5 bg-teal-100 text-teal-600 dark:bg-teal-900 dark:text-teal-300 text-xs font-semibold rounded-full">오늘</span>}
                      {isAdmin && <span className={`text-xs ${vis.color}`}>{vis.icon}</span>}
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>
        );
      })()}

      <ScheduleDetailModal event={detailEvent} isAdmin={isAdmin} onClose={() => setDetailEvent(null)} onEdit={handleEdit} onDelete={handleDelete} />
      {formInitial !== null && <ScheduleFormModal initial={formInitial} onClose={() => setFormInitial(null)} onSave={handleSave} />}
    </div>
  );
}

// ── 유틸 ─────────────────────────────────────────────────────────────────
function parseLocalDate(str) {
  const [y, m, d] = str.split('-').map(Number);
  return new Date(y, m - 1, d);
}
function parseLocalDateTime(dateStr, timeStr) {
  const [y, m, d] = dateStr.split('-').map(Number);
  const [h, min]  = timeStr.split(':').map(Number);
  return new Date(y, m - 1, d, h, min);
}
function addDay(date) { const d = new Date(date); d.setDate(d.getDate() + 1); return d; }
function subDay(date) { const d = new Date(date); d.setDate(d.getDate() - 1); return d; }
function formatDateStr(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}
