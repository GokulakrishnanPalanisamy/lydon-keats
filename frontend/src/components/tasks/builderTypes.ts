export interface BuilderSubtask {
  key: string
  name: string
  description: string
  hours: string
  minutes: string
}

export interface BuilderTask {
  key: string
  /** Set for a task already saved in the database; absent for a new, unsaved draft. */
  id?: number
  name: string
  description: string
  work_tag_ids: number[]
  frequency_id: string
  technician_ids: number[]
  subtasks: BuilderSubtask[]
}
