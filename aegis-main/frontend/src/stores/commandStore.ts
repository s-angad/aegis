'use client'

import { create } from 'zustand'

export type Priority = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
export type DirectiveStatus = 'DRAFT' | 'OPEN' | 'IN_PROGRESS' | 'RESOLVED'
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
  isAutoDrafted?: boolean
}

export interface Task {
  id: string
  directiveId?: string
  title: string
  description: string
  targetSector: string
  assignedTo: string       // Profile ID (e.g. 'responder-unit12')
  assignedToName: string   // Responder Name (e.g. 'Officer Sarah Jenkins')
  assignedBy: string       // Commander Name (e.g. 'Capt. David Vance')
  status: TaskStatus
  createdAt: string
  updatedAt: string
}

interface CommandStore {
  directives: Directive[]
  tasks: Task[]
  
  issueDirective: (directive: Omit<Directive, 'id' | 'issuedAt' | 'status'>) => string
  approveDraftDirective: (id: string) => void
  dismissDraftDirective: (id: string) => void
  resolveDirective: (id: string) => void
  
  createTask: (task: Omit<Task, 'id' | 'createdAt' | 'updatedAt' | 'status'>) => string
  updateTaskStatus: (taskId: string, status: TaskStatus) => void
  
  checkSimulationAutoDrafts: (sector: string, riskLevel: string) => void
  resetCommandStore: () => void
}

const INITIAL_DIRECTIVES: Directive[] = [
  {
    id: 'DIR-01',
    title: 'Contain Sector 04 Water Surge & Execute Evacuation',
    description: 'Establish primary evacuation corridor R21 and deploy rescue boats to staging point near North Riverbank.',
    targetSector: 'Sector 04',
    priority: 'CRITICAL',
    issuedBy: 'Maria Chen',
    issuedAt: new Date(Date.now() - 15 * 60000).toLocaleTimeString(),
    status: 'IN_PROGRESS'
  },
  {
    id: 'DIR-02',
    title: 'Prepare Sector 07 Secondary Overflow Barriers',
    description: 'Pre-position water pumps and inspect bridge B02 structural integrity before predicted peak arrival.',
    targetSector: 'Sector 07',
    priority: 'HIGH',
    issuedBy: 'Maria Chen',
    issuedAt: new Date(Date.now() - 8 * 60000).toLocaleTimeString(),
    status: 'OPEN'
  }
]

const INITIAL_TASKS: Task[] = [
  {
    id: 'TSK-101',
    directiveId: 'DIR-01',
    title: 'Deploy Rescue Boat 02 to Sector 04 Staging',
    description: 'Position Boat 02 along evacuation route R21 to assist stranded residents near Riverfront Way.',
    targetSector: 'Sector 04',
    assignedTo: 'responder-unit12',
    assignedToName: 'Officer Sarah Jenkins',
    assignedBy: 'Capt. David Vance',
    status: 'ASSIGNED',
    createdAt: new Date(Date.now() - 10 * 60000).toLocaleTimeString(),
    updatedAt: new Date(Date.now() - 10 * 60000).toLocaleTimeString()
  },
  {
    id: 'TSK-102',
    directiveId: 'DIR-01',
    title: 'Scout North Bridge Bottleneck B01',
    description: 'Verify aerial recon reports of road obstruction and direct traffic to alternate bypass.',
    targetSector: 'Sector 04',
    assignedTo: 'responder-unit05',
    assignedToName: 'Officer Marcus Ruiz',
    assignedBy: 'Capt. David Vance',
    status: 'ASSIGNED',
    createdAt: new Date(Date.now() - 5 * 60000).toLocaleTimeString(),
    updatedAt: new Date(Date.now() - 5 * 60000).toLocaleTimeString()
  }
]

export const useCommandStore = create<CommandStore>((set, get) => ({
  directives: INITIAL_DIRECTIVES,
  tasks: INITIAL_TASKS,

  issueDirective: (directiveData) => {
    const id = `DIR-0${get().directives.length + 1}`
    const newDirective: Directive = {
      ...directiveData,
      id,
      issuedAt: new Date().toLocaleTimeString(),
      status: 'OPEN'
    }

    set((state) => ({
      directives: [newDirective, ...state.directives]
    }))

    return id
  },

  approveDraftDirective: (id) => {
    set((state) => ({
      directives: state.directives.map((d) =>
        d.id === id ? { ...d, status: 'OPEN', isAutoDrafted: false, issuedAt: new Date().toLocaleTimeString() } : d
      )
    }))
  },

  dismissDraftDirective: (id) => {
    set((state) => ({
      directives: state.directives.filter((d) => d.id !== id)
    }))
  },

  resolveDirective: (id) => {
    set((state) => ({
      directives: state.directives.map((d) =>
        d.id === id ? { ...d, status: 'RESOLVED' } : d
      )
    }))
  },

  createTask: (taskData) => {
    const id = `TSK-${100 + get().tasks.length + 1}`
    const newTask: Task = {
      ...taskData,
      id,
      status: 'ASSIGNED',
      createdAt: new Date().toLocaleTimeString(),
      updatedAt: new Date().toLocaleTimeString()
    }

    set((state) => {
      // If linked to a directive, ensure directive is IN_PROGRESS
      const updatedDirectives = taskData.directiveId
        ? state.directives.map((d) =>
            d.id === taskData.directiveId && d.status === 'OPEN'
              ? { ...d, status: 'IN_PROGRESS' as DirectiveStatus }
              : d
          )
        : state.directives

      return {
        tasks: [newTask, ...state.tasks],
        directives: updatedDirectives
      }
    })

    return id
  },

  updateTaskStatus: (taskId, status) => {
    set((state) => {
      const updatedTasks = state.tasks.map((t) =>
        t.id === taskId ? { ...t, status, updatedAt: new Date().toLocaleTimeString() } : t
      )

      // Auto-check if all tasks for a directive are COMPLETE
      const updatedTask = updatedTasks.find((t) => t.id === taskId)
      let updatedDirectives = state.directives

      if (updatedTask && updatedTask.directiveId) {
        const dirTasks = updatedTasks.filter((t) => t.directiveId === updatedTask.directiveId)
        const allComplete = dirTasks.length > 0 && dirTasks.every((t) => t.status === 'COMPLETE')

        if (allComplete) {
          updatedDirectives = state.directives.map((d) =>
            d.id === updatedTask.directiveId ? { ...d, status: 'RESOLVED' } : d
          )
        }
      }

      return {
        tasks: updatedTasks,
        directives: updatedDirectives
      }
    })
  },

  checkSimulationAutoDrafts: (sector, riskLevel) => {
    // Prevent duplicate draft creation
    const existing = get().directives.find(
      (d) => d.targetSector === sector && (d.status === 'DRAFT' || d.status === 'OPEN' || d.status === 'IN_PROGRESS')
    )

    if (!existing && (riskLevel === 'HIGH' || riskLevel === 'CRITICAL')) {
      const draft: Directive = {
        id: `DIR-DRAFT-${Math.random().toString(36).substring(2, 6).toUpperCase()}`,
        title: `Auto-Draft: Priority Intervention for ${sector}`,
        description: `Simulation telemetry indicates severe flood surge in ${sector}. Immediate evacuation corridor assembly recommended.`,
        targetSector: sector,
        priority: 'CRITICAL',
        issuedBy: 'AEGIS OODA Sentinel (Auto-Draft)',
        issuedAt: new Date().toLocaleTimeString(),
        status: 'DRAFT',
        isAutoDrafted: true
      }

      set((state) => ({
        directives: [draft, ...state.directives]
      }))
    }
  },

  resetCommandStore: () => set({ directives: INITIAL_DIRECTIVES, tasks: INITIAL_TASKS })
}))
