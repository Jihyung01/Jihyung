import React from 'react';
import { motion } from 'framer-motion';
import { Home, Calendar, Target, FileText, Users, BarChart3 } from 'lucide-react';

interface DashboardViewProps {
  notes?: any[];
  tasks?: any[];
  events?: any[];
  onNavigate?: (page: string) => void;
}

const DashboardView: React.FC<DashboardViewProps> = ({ 
  notes = [], 
  tasks = [], 
  events = [], 
  onNavigate 
}) => {
  const stats = {
    totalNotes: notes.length,
    totalTasks: tasks.length,
    totalEvents: events.length,
    completedTasks: tasks.filter(t => t.status === 'completed').length
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 dark:from-indigo-950 dark:via-purple-950 dark:to-pink-950 p-6">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <motion.div 
          className="text-center"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h1 className="text-4xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent mb-4">
            📊 대시보드
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            전체 활동 현황을 한눈에 확인하세요
          </p>
        </motion.div>

        {/* Stats Grid */}
        <motion.div 
          className="grid grid-cols-2 md:grid-cols-4 gap-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          {[
            { label: '총 노트', value: stats.totalNotes, icon: FileText, color: 'purple' },
            { label: '총 태스크', value: stats.totalTasks, icon: Target, color: 'blue' },
            { label: '총 일정', value: stats.totalEvents, icon: Calendar, color: 'green' },
            { label: '완료된 태스크', value: stats.completedTasks, icon: BarChart3, color: 'orange' }
          ].map((stat, index) => (
            <motion.div
              key={stat.label}
              className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-2xl p-6 shadow-lg"
              whileHover={{ scale: 1.05 }}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <div className="flex items-center gap-4">
                <div className={`p-3 rounded-xl bg-${stat.color}-100 dark:bg-${stat.color}-900/30`}>
                  <stat.icon className={`h-6 w-6 text-${stat.color}-600 dark:text-${stat.color}-400`} />
                </div>
                <div>
                  <div className="text-2xl font-bold text-gray-800 dark:text-gray-200">
                    {stat.value}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    {stat.label}
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* Quick Actions */}
        <motion.div 
          className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-2xl p-6 shadow-lg"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-6">
            빠른 실행
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: '노트 작성', icon: FileText, page: 'notes' },
              { label: '태스크 추가', icon: Target, page: 'tasks' },
              { label: '일정 등록', icon: Calendar, page: 'calendar' },
              { label: '협업하기', icon: Users, page: 'collaboration' }
            ].map((action) => (
              <motion.button
                key={action.label}
                onClick={() => onNavigate?.(action.page)}
                className="flex flex-col items-center gap-2 p-4 rounded-xl bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-900/30 dark:to-purple-900/30 hover:from-indigo-100 hover:to-purple-100 dark:hover:from-indigo-900/50 dark:hover:to-purple-900/50 transition-all duration-300"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <action.icon className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  {action.label}
                </span>
              </motion.button>
            ))}
          </div>
        </motion.div>

        {/* Recent Activity */}
        <motion.div 
          className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-2xl p-6 shadow-lg"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-6">
            최근 활동
          </h2>
          <div className="space-y-4">
            {notes.slice(0, 3).map((note, index) => (
              <div key={note.id} className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                <FileText className="h-4 w-4 text-purple-500" />
                <span className="text-sm text-gray-700 dark:text-gray-300">
                  노트 "{note.title}" 생성됨
                </span>
              </div>
            ))}
            {tasks.slice(0, 2).map((task, index) => (
              <div key={task.id} className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                <Target className="h-4 w-4 text-blue-500" />
                <span className="text-sm text-gray-700 dark:text-gray-300">
                  태스크 "{task.title}" {task.status === 'completed' ? '완료됨' : '생성됨'}
                </span>
              </div>
            ))}
            {events.slice(0, 2).map((event, index) => (
              <div key={event.id} className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                <Calendar className="h-4 w-4 text-green-500" />
                <span className="text-sm text-gray-700 dark:text-gray-300">
                  일정 "{event.title}" 등록됨
                </span>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default DashboardView;
