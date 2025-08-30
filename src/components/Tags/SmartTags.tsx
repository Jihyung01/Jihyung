// src/components/Tags/SmartTags.jsx
import { useState, useEffect } from 'react'
import { Hash, Plus, X } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '@/components/ui/Button'

export const SmartTags = ({ item, onUpdate }) => {
  const [tags, setTags] = useState(item?.tags || [])
  const [suggestedTags, setSuggestedTags] = useState([])
  const [inputValue, setInputValue] = useState('')
  const [showInput, setShowInput] = useState(false)

  useEffect(() => {
    fetchSuggestedTags()
  }, [item])

  const fetchSuggestedTags = async () => {
    // AI-powered tag suggestions
    const suggestions = ['important', 'project-x', 'review', 'urgent']
    setSuggestedTags(suggestions.filter(t => !tags.includes(t)))
  }

  const addTag = (tag) => {
    if (!tags.includes(tag)) {
      const newTags = [...tags, tag]
      setTags(newTags)
      onUpdate({ ...item, tags: newTags })
      setSuggestedTags(suggestedTags.filter(t => t !== tag))
    }
  }

  const removeTag = (tag) => {
    const newTags = tags.filter(t => t !== tag)
    setTags(newTags)
    onUpdate({ ...item, tags: newTags })
  }

  const handleInputSubmit = () => {
    if (inputValue.trim()) {
      addTag(inputValue.trim())
      setInputValue('')
      setShowInput(false)
    }
  }

  return (
    <div className="space-y-3">
      {/* Current Tags */}
      <div className="flex flex-wrap gap-2">
        <AnimatePresence>
          {tags.map((tag) => (
            <motion.span
              key={tag}
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0 }}
              className="inline-flex items-center gap-1 px-2 py-1 bg-primary/10 text-primary rounded-full text-sm"
            >
              <Hash className="h-3 w-3" />
              {tag}
              <button
                onClick={() => removeTag(tag)}
                className="hover:text-destructive"
              >
                <X className="h-3 w-3" />
              </button>
            </motion.span>
          ))}
        </AnimatePresence>

        {/* Add Tag Button */}
        {showInput ? (
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleInputSubmit()}
            onBlur={handleInputSubmit}
            placeholder="Add tag..."
            className="px-2 py-1 border rounded-md text-sm bg-background"
            autoFocus
          />
        ) : (
          <Button
            onClick={() => setShowInput(true)}
            variant="ghost"
            size="sm"
            className="h-7"
          >
            <Plus className="h-3 w-3" />
          </Button>
        )}
      </div>

      {/* Suggested Tags */}
      {suggestedTags.length > 0 && (
        <div>
          <p className="text-xs text-muted-foreground mb-2">Suggestions:</p>
          <div className="flex flex-wrap gap-2">
            {suggestedTags.map((tag) => (
              <button
                key={tag}
                onClick={() => addTag(tag)}
                className="px-2 py-1 bg-muted hover:bg-accent rounded-full text-xs transition-colors"
              >
                +{tag}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}