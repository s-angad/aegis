'use client'

import { create } from 'zustand'

export type Priority = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
export type DirectiveStatus = 'OPEN' | 'IN_PROGRESS' | 'RESOLVED'
export type TaskStatus = 'ASSIGNED' | 'ACKNOWLEDGED' | 'IN_PROGRESS' | 'COMPLETE'

export interface Directive {
  id: string
  title: string
  description: string
  targetSector: string
  priority: Priority
  issuedBy: string
  issuedAt: string
  status: DirectiveStatus
}

export interface Task {
  id: string
  directiveId: string | null
  title: string
  description: string
  assignedTo: string      // responder name, e.g. "Unit 12"
  assignedBy: string      // commander name, e.g. "Commander — Sector 04"
  status: TaskStatus
  createdAt: string
  updatedAt: string
}

interface CommandStore {
  directives: Directive[]
  tasks: Task[]
  issueDirective: (d: Omit<Directive, 'id' | 'issuedAt' | 'status'>) => void
  createTask: (t: Omit<Task, 'id' | 'status' | 'createdAt' | 'updatedAt'>) => void
  updateTaskStatus: (taskId: string, status: TaskStatus) => void
  updateDirectiveStatus: (directiveId: string, status: DirectiveStatus) => void
}

const INITIAL_DIRECTIVES: Directive[] = [
  {
    id: 'DIR-01',
    title: 'Contain Sector 04 flooding, prioritize evacuation',
    description: 'Establish primary evacuation corridor R21 and deploy rescue boats to staging point.',
    targetSector: '04',
    priority: 'HIGH',
    issuedBy: 'Maria Chen',
    issuedAt: new Date(Date.now() - 15 * 60000).toLocaleTimeString(),
    status: 'OPEN'
  }
]

const INITIAL_TASKS: Task[] = []

export const useCommandStore = create<CommandStore>((set, get) => ({
  directives: INITIAL_DIRECTIVES,
  tasks: INITIAL_TASKS,

  issueDirective: (d) => {
    const id = `DIR-0${get().directives.length + 1}`
    const newDirective: Directive = {
      ...d,
      id,
      issuedAt: new Date().toLocaleTimeString(),
      status: 'OPEN'
    }

    set((state) => ({
      directives: [newDirective, ...state.directives]
    }))
  },

  createTask: (t) => {
    const id = `TSK-${100 + get().tasks.length + 1}`
    const newTask: Task = {
      ...t,
      id,
      status: 'ASSIGNED',
      createdAt: new Date().toLocaleTimeString(),
      updatedAt: new Date().toLocaleTimeString()
    }

    set((state) => {
      // If linked to a directive, set directive status to IN_PROGRESS if currently OPEN
      const updatedDirectives = t.directiveId
        ? state.directives.map((dir) =>
            dir.id === t.directiveId && dir.status === 'OPEN'
              ? { ...dir, status: 'IN_PROGRESS' as DirectiveStatus }
              : dir
          )
        : state.directives

      return {
        tasks: [newTask, ...state.tasks],
        directives: updatedDirectives
      }
    })
  },

  updateTaskStatus: (taskId, status) => {
    set((state) => {
      const updatedTasks = state.tasks.map((t) =>
        t.id === taskId ? { ...t, status, updatedAt: new Date().toLocaleTimeString() } : t
      )

      // Auto check if all tasks for a directive are COMPLETE
      const targetTask = updatedTasks.find((t) => t.id === taskId)
      let updatedDirectives = state.directives

      if (targetTask && targetTask.directiveId) {
        const dirTasks = updatedTasks.filter((t) => t.directiveId === targetTask.directiveId)
        const allComplete = dirTasks.length > 0 && dirTasks.every((t) => t.status === 'COMPLETE')

        if (allComplete) {
          updatedDirectives = state.directives.map((d) =>
            d.id === targetTask.directiveId ? { ...d, status: 'RESOLVED' as DirectiveStatus } : d
          )
        }
      }

      return {
        tasks: updatedTasks,
        directives: updatedDirectives
      }
    })
  },

  updateDirectiveStatus: (directiveId, status) => {
    set((state) => ({
      directives: state.directives.map((d) =>
        d.id === directiveId ? { ...d, status } : d
      )
    }))
  }
}))
