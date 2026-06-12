import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Tag, Button, Space, Empty, Spin, Tooltip, App, Avatar, Popover } from 'antd';
import {
  LeftOutlined, RightOutlined, CalendarOutlined,
  ClockCircleOutlined, UserOutlined, ExclamationCircleOutlined, FileTextOutlined
} from '@ant-design/icons';
import dayjs from 'dayjs';
import { useNavigate } from 'react-router-dom';
import { milestoneAPI } from '../api';
import {
  MILESTONE_STATUS_OPTIONS,
  getOptionLabel,
  getOptionColor
} from '../utils/constants';
import { formatDate, daysUntil } from '../utils/helpers';

const WEEK_DAYS = ['日', '一', '二', '三', '四', '五', '六'];

function MilestoneCalendar({ filters, onRefresh }) {
  const navigate = useNavigate();
  const { message } = App.useApp();
  const [currentMonth, setCurrentMonth] = useState(dayjs());
  const [loading, setLoading] = useState(false);
  const [events, setEvents] = useState([]);
  const [draggingId, setDraggingId] = useState(null);
  const [dragOverDate, setDragOverDate] = useState(null);
  const containerRef = useRef(null);

  const { startOfMonth, endOfMonth, calendarDays } = useMemo(() => {
    const start = currentMonth.startOf('month');
    const end = currentMonth.endOf('month');
    const startWeekday = start.day();
    const calendarStart = start.subtract(startWeekday, 'day');
    const days = [];
    for (let i = 0; i < 42; i++) {
      days.push(calendarStart.add(i, 'day'));
    }
    return { startOfMonth: start, endOfMonth: end, calendarDays: days };
  }, [currentMonth]);

  useEffect(() => {
    fetchCalendarData();
  }, [currentMonth, filters]);

  const fetchCalendarData = async () => {
    setLoading(true);
    try {
      const res = await milestoneAPI.calendar({
        start_date: startOfMonth.subtract(7, 'day').format('YYYY-MM-DD'),
        end_date: endOfMonth.add(7, 'day').format('YYYY-MM-DD'),
        ...filters
      });
      setEvents(res.data || []);
    } catch (e) {} finally {
      setLoading(false);
    }
  };

  const eventsByDate = useMemo(() => {
    const map = {};
    events.forEach(ev => {
      const dateKey = dayjs(ev.deadline_date).format('YYYY-MM-DD');
      if (!map[dateKey]) map[dateKey] = [];
      map[dateKey].push(ev);
    });
    return map;
  }, [events]);

  const goPrevMonth = () => setCurrentMonth(m => m.subtract(1, 'month'));
  const goNextMonth = () => setCurrentMonth(m => m.add(1, 'month'));
  const goToday = () => setCurrentMonth(dayjs());

  const handleDragStart = (e, milestoneId) => {
    setDraggingId(milestoneId);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', String(milestoneId));
  };

  const handleDragOver = (e, dateStr) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (dragOverDate !== dateStr) {
      setDragOverDate(dateStr);
    }
  };

  const handleDragLeave = () => {
    setDragOverDate(null);
  };

  const handleDrop = async (e, dateStr) => {
    e.preventDefault();
    const id = draggingId || parseInt(e.dataTransfer.getData('text/plain'), 10);
    setDragOverDate(null);
    setDraggingId(null);
    if (!id) return;

    const original = events.find(ev => ev.id === id);
    if (!original) return;
    if (dayjs(original.deadline_date).format('YYYY-MM-DD') === dateStr) return;

    try {
      await milestoneAPI.updateDate(id, dateStr, dateStr);
      message.success(`节点日期已调整为 ${dateStr}`);
      fetchCalendarData();
      onRefresh?.();
    } catch (e) {
      message.error('调整日期失败');
    }
  };

  const getEventStyle = (status, days) => {
    let color = '#1890ff';
    if (status === 'completed') color = '#52c41a';
    else if (status === 'cancelled') color = '#8c8c8c';
    else if (status === 'delayed') color = '#ff4d4f';
    else if (days !== null && days < 0) color = '#ff4d4f';
    else if (days !== null && days <= 3) color = '#fa8c16';
    else if (days !== null && days <= 7) color = '#faad14';
    return { borderLeft: `3px solid ${color}` };
  };

  const renderEventCard = (ev) => {
    const days = daysUntil(ev.deadline_date);
    const isDragging = draggingId === ev.id;
    const caseName = ev.case_info?.case_name || '-';
    const assignee = ev.assignee?.real_name;
    const statusColor = getOptionColor(MILESTONE_STATUS_OPTIONS, ev.status);

    const popoverContent = (
      <div style={{ width: 240, fontSize: 12 }}>
        <div style={{ fontWeight: 600, marginBottom: 8, fontSize: 14 }}>{ev.name}</div>
        <div style={{ marginBottom: 6, color: '#666' }}>
          <FileTextOutlined /> {caseName}
        </div>
        {ev.case_info?.case_number && (
          <div style={{ marginBottom: 6, color: '#999', fontFamily: 'monospace' }}>
            {ev.case_info.case_number}
          </div>
        )}
        <div style={{ marginBottom: 6 }}>
          <Tag color={statusColor}>{getOptionLabel(MILESTONE_STATUS_OPTIONS, ev.status)}</Tag>
          {days !== null && ev.status !== 'completed' && ev.status !== 'cancelled' && (
            <Tag color={days < 0 ? 'red' : days <= 3 ? 'orange' : 'blue'}>
              {days < 0 ? `超期${Math.abs(days)}天` : days === 0 ? '今天到期' : `剩${days}天`}
            </Tag>
          )}
        </div>
        {assignee && (
          <div style={{ marginBottom: 6, color: '#666' }}>
            <UserOutlined /> {assignee}
          </div>
        )}
        <div style={{ color: '#999', marginTop: 8 }}>截止：{formatDate(ev.deadline_date)}</div>
        <Button
          type="primary"
          size="small"
          style={{ marginTop: 10, width: '100%' }}
          onClick={() => navigate(`/cases/${ev.case_id}`)}
        >
          查看案件详情
        </Button>
      </div>
    );

    return (
      <Popover
        key={ev.id}
        placement="rightTop"
        content={popoverContent}
        trigger="hover"
        overlayStyle={{ zIndex: 2000 }}
      >
        <div
          className={`milestone-cal-event ${isDragging ? 'dragging' : ''}`}
          style={getEventStyle(ev.status, days)}
          draggable
          onDragStart={(e) => handleDragStart(e, ev.id)}
          onDragEnd={() => { setDraggingId(null); setDragOverDate(null); }}
          onClick={() => navigate(`/cases/${ev.case_id}`)}
          title={`${ev.name} - ${caseName}（点击跳转案件详情，拖拽可调整日期）`}
        >
          <div className="milestone-cal-event-title">
            <ClockCircleOutlined style={{ fontSize: 11, marginRight: 3, opacity: 0.7 }} />
            <span className="milestone-cal-event-name">{ev.name}</span>
          </div>
          <div className="milestone-cal-event-meta">
            <span className="milestone-cal-event-case">{caseName}</span>
            {assignee && (
              <span className="milestone-cal-event-user">
                <Avatar size={12} icon={<UserOutlined />} style={{ marginRight: 3 }} />
                {assignee}
              </span>
            )}
          </div>
          {ev.status === 'completed' && (
            <Tag color="success" style={{ marginTop: 2, fontSize: 10, padding: '0 4px' }}>已完成</Tag>
          )}
          {days !== null && days < 0 && ev.status !== 'completed' && ev.status !== 'cancelled' && (
            <Tag color="red" icon={<ExclamationCircleOutlined />} style={{ marginTop: 2, fontSize: 10, padding: '0 4px' }}>
              超期
            </Tag>
          )}
        </div>
      </Popover>
    );
  };

  const renderCell = (date) => {
    const dateStr = date.format('YYYY-MM-DD');
    const isCurrentMonth = date.month() === currentMonth.month();
    const isToday = date.format('YYYY-MM-DD') === dayjs().format('YYYY-MM-DD');
    const dayEvents = eventsByDate[dateStr] || [];
    const isDragOver = dragOverDate === dateStr && draggingId;

    return (
      <div
        key={dateStr}
        className={`milestone-cal-cell ${!isCurrentMonth ? 'other-month' : ''} ${isToday ? 'today' : ''} ${isDragOver ? 'drag-over' : ''}`}
        onDragOver={(e) => handleDragOver(e, dateStr)}
        onDragLeave={handleDragLeave}
        onDrop={(e) => handleDrop(e, dateStr)}
      >
        <div className="milestone-cal-cell-header">
          <span className={`milestone-cal-cell-date ${isToday ? 'today-date' : ''}`}>
            {date.date()}
          </span>
          {dayEvents.length > 0 && (
            <span className="milestone-cal-cell-count">{dayEvents.length}</span>
          )}
        </div>
        <div className="milestone-cal-cell-body">
          {dayEvents.slice(0, 3).map(ev => renderEventCard(ev))}
          {dayEvents.length > 3 && (
            <div className="milestone-cal-cell-more">
              <Tooltip title={dayEvents.slice(3).map(e => e.name).join('、')}>
                +{dayEvents.length - 3} 更多
              </Tooltip>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="milestone-calendar-container" ref={containerRef}>
      <div className="milestone-calendar-header">
        <Space>
          <Button size="small" icon={<LeftOutlined />} onClick={goPrevMonth} />
          <Button size="small" onClick={goToday}>今天</Button>
          <Button size="small" icon={<RightOutlined />} onClick={goNextMonth} />
          <span className="milestone-calendar-title">
            <CalendarOutlined />
            {currentMonth.format('YYYY 年 MM 月')}
          </span>
        </Space>
        <div style={{ fontSize: 12, color: '#8c8c8c' }}>
          提示：拖拽节点卡片可直接调整截止日期，点击可跳转案件详情
        </div>
      </div>

      <div className="milestone-calendar-weekdays">
        {WEEK_DAYS.map(d => (
          <div key={d} className="milestone-cal-weekday">{d}</div>
        ))}
      </div>

      <div className="milestone-calendar-grid">
        {loading ? (
          <div className="milestone-cal-loading">
            <Spin />
          </div>
        ) : (
          calendarDays.map(date => renderCell(date))
        )}
      </div>

      {events.length === 0 && !loading && (
        <Empty
          description="当前月份暂无节点数据"
          style={{ padding: '40px 0' }}
          image={Empty.PRESENTED_IMAGE_SIMPLE}
        />
      )}
    </div>
  );
}

export default MilestoneCalendar;
