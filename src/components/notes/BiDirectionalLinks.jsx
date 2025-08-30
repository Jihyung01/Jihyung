// src/components/Notes/BiDirectionalLinks.jsx
import { useState, useEffect } from 'react'
import { Link2, FileText, Calendar, CheckSquare } from 'lucide-react'
import { motion } from 'framer-motion'

export const BiDirectionalLinks = ({ currentItem, onNavigate }) => {
  const [links, setLinks] = useState({
    backlinks: [],
    forwardLinks: []
  })

  useEffect(() => {
    fetchLinks()
  }, [currentItem])

  const fetchLinks = async () => {
    // API call to get linked items
    const mockLinks = {
      backlinks: [
        { id: 1, title: 'Project Planning', type: 'note' },
        { id: 2, title: 'Team Meeting', type: 'event' }
      ],
      forwardLinks: [
        { id: 3, title: 'Implementation Task', type: 'task' },
        { id: 4, title: 'Research Notes', type: 'note' }
      ]
    }
    setLinks(mockLinks)
  }

  const getIcon = (type) => {
    switch(type) {
      case 'note': return <FileText className="h-4 w-4" />
      case 'event': return <Calendar className="h-4 w-4" />
      case 'task': return <CheckSquare className="h-4 w-4" />
      default: return <Link2 className="h-4 w-4" />
    }
  }

  return (
    <div className="bg-card border rounded-lg p-4">
      <h3 className="font-semibold mb-3 flex items-center gap-2">
        <Link2 className="h-4 w-4" />
        Connections
      </h3>

      {/* Backlinks */}
      <div className="mb-4">
        <h4 className="text-sm text-muted-foreground mb-2">Referenced by</h4>
        <div className="space-y-1">
          {links.backlinks.map((link, i) => (
            <motion.button
              key={link.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05 }}
              onClick={() => onNavigate(link)}
              className="w-full text-left p-2 hover:bg-accent rounded-md transition-colors flex items-center gap-2"
            >
              {getIcon(link.type)}
              <span className="text-sm">{link.title}</span>
            </motion.button>
          ))}
        </div>
      </div>

      {/* Forward Links */}
      <div>
        <h4 className="text-sm text-muted-foreground mb-2">References</h4>
        <div className="space-y-1">
          {links.forwardLinks.map((link, i) => (
            <motion.button
              key={link.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05 }}
              onClick={() => onNavigate(link)}
              className="w-full text-left p-2 hover:bg-accent rounded-md transition-colors flex items-center gap-2"
            >
              {getIcon(link.type)}
              <span className="text-sm">{link.title}</span>
            </motion.button>
          ))}
        </div>
      </div>
    </div>
  )
}