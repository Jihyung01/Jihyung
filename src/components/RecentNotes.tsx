import { FileText, Link, Microphone, Hash, Calendar } from '@phosphor-icons/react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import { Badge } from './ui/badge'
import { Button } from './ui/button'

interface Note {
  id: number
  title: string
  content: string
  created_at: string
  tags: string[]
  type?: string
  url?: string
}

interface RecentNotesProps {
  notes: Note[]
  className?: string
}

export function RecentNotes({ notes, className }: RecentNotesProps) {
  const recentNotes = notes.slice(0, 5)

  const getTypeIcon = (type?: string) => {
    switch (type) {
      case 'url': return <Link className="h-4 w-4" />
      case 'audio': return <Microphone className="h-4 w-4" />
      default: return <FileText className="h-4 w-4" />
    }
  }

  const getTypeColor = (type?: string) => {
    switch (type) {
      case 'url': return 'text-blue-600'
      case 'audio': return 'text-green-600'
      default: return 'text-gray-600'
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / (1000 * 60))
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

    if (diffMins < 1) return '방금 전'
    if (diffMins < 60) return `${diffMins}분 전`
    if (diffHours < 24) return `${diffHours}시간 전`
    if (diffDays < 7) return `${diffDays}일 전`
    
    return date.toLocaleDateString('ko-KR', {
      month: 'short',
      day: 'numeric'
    })
  }

  const truncateContent = (content: string, maxLength: number = 100) => {
    if (content.length <= maxLength) return content
    return content.slice(0, maxLength) + '...'
  }

  if (recentNotes.length === 0) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            최근 노트
          </CardTitle>
          <CardDescription>최근에 추가된 노트들이 여기 표시됩니다</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium text-foreground mb-2">아직 노트가 없습니다</h3>
            <p className="text-muted-foreground mb-4">
              Alt+C를 눌러 첫 번째 노트를 작성해보세요
            </p>
            <Button variant="outline" size="sm">
              노트 작성하기
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" />
              최근 노트
            </CardTitle>
            <CardDescription>
              총 {notes.length}개의 노트 중 최근 {recentNotes.length}개
            </CardDescription>
          </div>
          <Button variant="outline" size="sm">
            전체 보기
          </Button>
        </div>
      </CardHeader>

      <CardContent>
        <div className="space-y-4">
          {recentNotes.map((note) => (
            <div
              key={note.id}
              className="group p-4 rounded-lg border border-border hover:border-primary/50 hover:shadow-sm transition-all cursor-pointer"
            >
              <div className="flex items-start gap-3">
                <div className={`${getTypeColor(note.type)} mt-1`}>
                  {getTypeIcon(note.type)}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <h3 className="font-medium text-foreground truncate group-hover:text-primary transition-colors">
                      {note.title}
                    </h3>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground whitespace-nowrap">
                      <Calendar className="h-3 w-3" />
                      {formatDate(note.created_at)}
                    </div>
                  </div>
                  
                  <p className="text-sm text-muted-foreground leading-relaxed mb-3">
                    {truncateContent(note.content)}
                  </p>
                  
                  {(note.tags.length > 0 || note.url) && (
                    <div className="flex items-center gap-2 flex-wrap">
                      {note.tags.map((tag) => (
                        <Badge
                          key={tag}
                          variant="secondary"
                          className="text-xs gap-1"
                        >
                          <Hash className="h-3 w-3" />
                          {tag}
                        </Badge>
                      ))}
                      
                      {note.url && (
                        <Badge variant="outline" className="text-xs gap-1">
                          <Link className="h-3 w-3" />
                          링크
                        </Badge>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {notes.length > 5 && (
          <div className="mt-4 pt-4 border-t border-border">
            <Button variant="ghost" className="w-full text-sm text-muted-foreground hover:text-foreground">
              {notes.length - 5}개 더 보기
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}