import React, { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Calendar, Plus, Edit, Trash, Clock, MapPin, Users, 
  CaretLeft, CaretRight, DotsThree, Bell, Repeat
} from '@phosphor-icons/react'
import { useRealTimeCalendar, CalendarEvent } from '../hooks/useRealTimeCalendar'
import { toast } from 'sonner'

interface RealCalendarProps {
  isOpen: boolean
  onClose: () => void
}

export const RealCalendar: React.FC<RealCalendarProps> = ({ isOpen, onClose }) => {
  const calendar = useRealTimeCalendar()
  const [currentDate, setCurrentDate] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [editingEvent, setEditingEvent] = useState<CalendarEvent | null>(null)
  const [showEventModal, setShowEventModal] = useState(false)
  const [newEvent, setNewEvent] = useState({
    title: '',
    description: '',
    start: '',
    end: '',
    location: '',
    type: 'event' as const,
    priority: 'medium' as const,
    recurring: false,
    frequency: 'weekly' as const,
    interval: 1
  })

  // 현재 월의 달력 데이터 생성
  const calendarData = useMemo(() => {
    const year = currentDate.getFullYear()
    const month = currentDate.getMonth()
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const startDate = new Date(firstDay)
    startDate.setDate(startDate.getDate() - firstDay.getDay())
    
    const days = []
    const current = new Date(startDate)
    
    for (let i = 0; i < 42; i++) {
      days.push(new Date(current))
      current.setDate(current.getDate() + 1)
    }
    
    return { days, firstDay, lastDay }
  }, [currentDate])

  // 날짜별 이벤트 가져오기
  const getEventsForDay = (date: Date) => {
    return calendar.getEventsForDate(date)
  }

  // 날짜 클릭 핸들러
  const handleDateClick = (date: Date) => {
    setSelectedDate(date)
    // 더블클릭으로 빠른 이벤트 생성
  }

  // 날짜 더블클릭 핸들러 (빠른 이벤트 생성)
  const handleDateDoubleClick = (date: Date) => {
    const startTime = new Date(date)
    startTime.setHours(9, 0, 0, 0) // 오전 9시로 설정
    const endTime = new Date(startTime)
    endTime.setHours(10, 0, 0, 0) // 1시간 후

    setNewEvent({
      title: '',
      description: '',
      start: startTime.toISOString().slice(0, 16),
      end: endTime.toISOString().slice(0, 16),
      location: '',
      type: 'event',
      priority: 'medium',
      recurring: false,
      frequency: 'weekly',
      interval: 1
    })
    setShowEventModal(true)
  }

  // 이벤트 저장
  const handleSaveEvent = async () => {
    if (!newEvent.title.trim() || !newEvent.start || !newEvent.end) {
      toast.error('제목, 시작시간, 종료시간을 모두 입력해주세요.')
      return
    }

    const startDate = new Date(newEvent.start)
    const endDate = new Date(newEvent.end)

    if (startDate >= endDate) {
      toast.error('종료시간은 시작시간보다 늦어야 합니다.')
      return
    }

    try {
      if (editingEvent) {
        // 기존 이벤트 수정
        calendar.updateEvent(editingEvent.id, {
          title: newEvent.title,
          description: newEvent.description,
          start: startDate,
          end: endDate,
          location: newEvent.location,
          type: newEvent.type,
          priority: newEvent.priority
        })
        toast.success('이벤트가 수정되었습니다!')
      } else {
        // 새 이벤트 생성
        if (newEvent.recurring) {
          calendar.createRecurringEvent({
            title: newEvent.title,
            description: newEvent.description,
            start: startDate,
            end: endDate,
            location: newEvent.location,
            type: newEvent.type,
            priority: newEvent.priority
          }, {
            frequency: newEvent.frequency,
            interval: newEvent.interval,
            endDate: new Date(startDate.getTime() + 365 * 24 * 60 * 60 * 1000) // 1년 후
          })
          toast.success('반복 이벤트가 생성되었습니다!')
        } else {
          calendar.addEvent({
            title: newEvent.title,
            description: newEvent.description,
            start: startDate,
            end: endDate,
            location: newEvent.location,
            type: newEvent.type,
            priority: newEvent.priority
          })
          toast.success('이벤트가 생성되었습니다!')
        }
      }

      setShowEventModal(false)
      setEditingEvent(null)
      resetEventForm()
    } catch (error) {
      toast.error('이벤트 저장에 실패했습니다.')
    }
  }

  // 이벤트 삭제
  const handleDeleteEvent = (eventId: string) => {
    calendar.deleteEvent(eventId)
    toast.success('이벤트가 삭제되었습니다!')
  }

  // 이벤트 편집
  const handleEditEvent = (event: CalendarEvent) => {
    setEditingEvent(event)
    setNewEvent({
      title: event.title,
      description: event.description || '',
      start: event.start.toISOString().slice(0, 16),
      end: event.end.toISOString().slice(0, 16),
      location: event.location || '',
      type: event.type,
      priority: event.priority,
      recurring: !!event.recurring,
      frequency: event.recurring?.frequency || 'weekly',
      interval: event.recurring?.interval || 1
    })
    setShowEventModal(true)
  }

  // 폼 초기화
  const resetEventForm = () => {
    setNewEvent({
      title: '',
      description: '',
      start: '',
      end: '',
      location: '',
      type: 'event',
      priority: 'medium',
      recurring: false,
      frequency: 'weekly',
      interval: 1
    })
  }

  // 월 이동
  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentDate(prev => {
      const newDate = new Date(prev)
      if (direction === 'prev') {
        newDate.setMonth(newDate.getMonth() - 1)
      } else {
        newDate.setMonth(newDate.getMonth() + 1)
      }
      return newDate
    })
  }

  // 오늘로 이동
  const goToToday = () => {
    setCurrentDate(new Date())
  }

  if (!isOpen) return null

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
    >
      <motion.div
        initial={{ scale: 0.95 }}
        animate={{ scale: 1 }}
        exit={{ scale: 0.95 }}
        className="bg-white rounded-2xl shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-hidden"
      >
        {/* 헤더 */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Calendar className="w-8 h-8" />
              <div>
                <h2 className="text-2xl font-bold">실시간 캘린더</h2>
                <p className="opacity-90">
                  {currentDate.toLocaleDateString('ko-KR', { 
                    year: 'numeric', 
                    month: 'long' 
                  })}
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <button
                onClick={() => navigateMonth('prev')}
                className="p-2 hover:bg-white/20 rounded-lg transition-colors"
              >
                <CaretLeft className="w-5 h-5" />
              </button>
              
              <button
                onClick={goToToday}
                className="px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg transition-colors"
              >
                오늘
              </button>
              
              <button
                onClick={() => navigateMonth('next')}
                className="p-2 hover:bg-white/20 rounded-lg transition-colors"
              >
                <CaretRight className="w-5 h-5" />
              </button>
              
              <button
                onClick={() => setShowEventModal(true)}
                className="flex items-center space-x-2 bg-white/20 hover:bg-white/30 px-4 py-2 rounded-lg transition-colors"
              >
                <Plus className="w-4 h-4" />
                <span>새 이벤트</span>
              </button>
              
              <button
                onClick={onClose}
                className="p-2 hover:bg-white/20 rounded-lg transition-colors"
              >
                ✕
              </button>
            </div>
          </div>
        </div>

        <div className="flex h-[calc(90vh-120px)]">
          {/* 캘린더 그리드 */}
          <div className="flex-1 p-6">
            {/* 요일 헤더 */}
            <div className="grid grid-cols-7 gap-1 mb-4">
              {['일', '월', '화', '수', '목', '금', '토'].map((day, index) => (
                <div key={day} className={`text-center py-2 font-medium ${
                  index === 0 ? 'text-red-500' : index === 6 ? 'text-blue-500' : 'text-gray-700'
                }`}>
                  {day}
                </div>
              ))}
            </div>

            {/* 날짜 그리드 */}
            <div className="grid grid-cols-7 gap-1 h-[calc(100%-60px)]">
              {calendarData.days.map((date, index) => {
                const isCurrentMonth = date.getMonth() === currentDate.getMonth()
                const isToday = date.toDateString() === new Date().toDateString()
                const isSelected = selectedDate && date.toDateString() === selectedDate.toDateString()
                const dayEvents = getEventsForDay(date)

                return (
                  <motion.div
                    key={index}
                    className={`border border-gray-200 p-2 cursor-pointer transition-colors ${
                      !isCurrentMonth ? 'bg-gray-50 text-gray-400' :
                      isToday ? 'bg-blue-50 border-blue-300' :
                      isSelected ? 'bg-purple-50 border-purple-300' :
                      'hover:bg-gray-50'
                    }`}
                    onClick={() => handleDateClick(date)}
                    onDoubleClick={() => handleDateDoubleClick(date)}
                    whileHover={{ scale: 1.02 }}
                  >
                    <div className="h-full flex flex-col">
                      <div className={`text-sm font-medium mb-1 ${
                        isToday ? 'text-blue-600' : ''
                      }`}>
                        {date.getDate()}
                      </div>
                      
                      <div className="flex-1 space-y-1 overflow-hidden">
                        {dayEvents.slice(0, 3).map((event) => (
                          <div
                            key={event.id}
                            className={`text-xs p-1 rounded truncate ${
                              event.type === 'task' ? 'bg-green-100 text-green-800' :
                              event.type === 'reminder' ? 'bg-yellow-100 text-yellow-800' :
                              'bg-blue-100 text-blue-800'
                            }`}
                            title={event.title}
                            onClick={(e) => {
                              e.stopPropagation()
                              handleEditEvent(event)
                            }}
                          >
                            {event.title}
                          </div>
                        ))}
                        {dayEvents.length > 3 && (
                          <div className="text-xs text-gray-500">
                            +{dayEvents.length - 3} 더
                          </div>
                        )}
                      </div>
                    </div>
                  </motion.div>
                )
              })}
            </div>
          </div>

          {/* 사이드바 */}
          {selectedDate && (
            <div className="w-80 border-l bg-gray-50 p-6">
              <h3 className="text-lg font-semibold mb-4">
                {selectedDate.toLocaleDateString('ko-KR', {
                  month: 'long',
                  day: 'numeric',
                  weekday: 'long'
                })}
              </h3>
              
              <div className="space-y-3">
                {getEventsForDay(selectedDate).map((event) => (
                  <motion.div
                    key={event.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white p-4 rounded-lg shadow-sm border"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-900">{event.title}</h4>
                        {event.description && (
                          <p className="text-sm text-gray-600 mt-1">{event.description}</p>
                        )}
                        
                        <div className="flex items-center space-x-4 mt-2 text-sm text-gray-500">
                          <div className="flex items-center space-x-1">
                            <Clock className="w-4 h-4" />
                            <span>
                              {event.start.toLocaleTimeString('ko-KR', { 
                                hour: '2-digit', 
                                minute: '2-digit' 
                              })} - {event.end.toLocaleTimeString('ko-KR', { 
                                hour: '2-digit', 
                                minute: '2-digit' 
                              })}
                            </span>
                          </div>
                          
                          {event.location && (
                            <div className="flex items-center space-x-1">
                              <MapPin className="w-4 h-4" />
                              <span>{event.location}</span>
                            </div>
                          )}
                        </div>
                        
                        <div className="flex items-center space-x-2 mt-2">
                          <span className={`px-2 py-1 rounded-full text-xs ${
                            event.type === 'task' ? 'bg-green-100 text-green-800' :
                            event.type === 'reminder' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-blue-100 text-blue-800'
                          }`}>
                            {event.type}
                          </span>
                          
                          <span className={`px-2 py-1 rounded-full text-xs ${
                            event.priority === 'high' ? 'bg-red-100 text-red-800' :
                            event.priority === 'medium' ? 'bg-orange-100 text-orange-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {event.priority}
                          </span>
                          
                          {event.recurring && (
                            <Repeat className="w-4 h-4 text-gray-500" title="반복 이벤트" />
                          )}
                        </div>
                      </div>
                      
                      <div className="flex space-x-1 ml-2">
                        <button
                          onClick={() => handleEditEvent(event)}
                          className="p-1 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteEvent(event.id)}
                          className="p-1 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded"
                        >
                          <Trash className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </motion.div>
                ))}
                
                {getEventsForDay(selectedDate).length === 0 && (
                  <div className="text-center text-gray-500 py-8">
                    <Calendar className="w-12 h-12 mx-auto mb-2 opacity-50" />
                    <p>이 날에는 일정이 없습니다</p>
                    <button
                      onClick={() => handleDateDoubleClick(selectedDate)}
                      className="mt-2 text-blue-600 hover:underline"
                    >
                      새 이벤트 추가
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </motion.div>

      {/* 이벤트 생성/편집 모달 */}
      <AnimatePresence>
        {showEventModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-60 flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.95 }}
              className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6"
            >
              <h3 className="text-lg font-semibold mb-4">
                {editingEvent ? '이벤트 편집' : '새 이벤트 생성'}
              </h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    제목 *
                  </label>
                  <input
                    type="text"
                    value={newEvent.title}
                    onChange={(e) => setNewEvent({ ...newEvent, title: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="이벤트 제목"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    설명
                  </label>
                  <textarea
                    value={newEvent.description}
                    onChange={(e) => setNewEvent({ ...newEvent, description: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    rows={3}
                    placeholder="이벤트 설명"
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      시작 *
                    </label>
                    <input
                      type="datetime-local"
                      value={newEvent.start}
                      onChange={(e) => setNewEvent({ ...newEvent, start: e.target.value })}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      종료 *
                    </label>
                    <input
                      type="datetime-local"
                      value={newEvent.end}
                      onChange={(e) => setNewEvent({ ...newEvent, end: e.target.value })}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    위치
                  </label>
                  <input
                    type="text"
                    value={newEvent.location}
                    onChange={(e) => setNewEvent({ ...newEvent, location: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="위치"
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      유형
                    </label>
                    <select
                      value={newEvent.type}
                      onChange={(e) => setNewEvent({ ...newEvent, type: e.target.value as any })}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="event">이벤트</option>
                      <option value="task">태스크</option>
                      <option value="reminder">리마인더</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      우선순위
                    </label>
                    <select
                      value={newEvent.priority}
                      onChange={(e) => setNewEvent({ ...newEvent, priority: e.target.value as any })}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="low">낮음</option>
                      <option value="medium">보통</option>
                      <option value="high">높음</option>
                    </select>
                  </div>
                </div>
                
                <div>
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={newEvent.recurring}
                      onChange={(e) => setNewEvent({ ...newEvent, recurring: e.target.checked })}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm font-medium text-gray-700">반복 이벤트</span>
                  </label>
                </div>
                
                {newEvent.recurring && (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        반복 주기
                      </label>
                      <select
                        value={newEvent.frequency}
                        onChange={(e) => setNewEvent({ ...newEvent, frequency: e.target.value as any })}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="daily">매일</option>
                        <option value="weekly">매주</option>
                        <option value="monthly">매월</option>
                        <option value="yearly">매년</option>
                      </select>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        간격
                      </label>
                      <input
                        type="number"
                        min="1"
                        value={newEvent.interval}
                        onChange={(e) => setNewEvent({ ...newEvent, interval: parseInt(e.target.value) })}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                )}
              </div>
              
              <div className="flex justify-end space-x-3 mt-6">
                <button
                  onClick={() => {
                    setShowEventModal(false)
                    setEditingEvent(null)
                    resetEventForm()
                  }}
                  className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  취소
                </button>
                <button
                  onClick={handleSaveEvent}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                >
                  {editingEvent ? '수정' : '생성'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}
