import { useState } from 'react'
import MultiSelectDropdown from '../ui/MultiSelectDropdown'
import { ChevronDownIcon, CloseIcon, PlusIcon, RepeatIcon, TrashIcon } from '../icons/Icons'
import { formatTotalMinutes } from '../../utils/formatDuration'
import type { Frequency, TechnicianSummary, WorkTag } from '../../types'
import type { BuilderSubtask, BuilderTask } from './builderTypes'

function subtaskMinutes(subtask: BuilderSubtask): number {
  return (Number(subtask.hours) || 0) * 60 + (Number(subtask.minutes) || 0)
}

export default function TaskBuilderTaskCard({
  task,
  taskIndex,
  workTags,
  frequencies,
  technicians,
  errors,
  onChange,
  onRemove,
  onAddSubtask,
  onUpdateSubtask,
  onRemoveSubtask,
  onResetSubtask,
}: {
  task: BuilderTask
  taskIndex: number
  workTags: WorkTag[]
  frequencies: Frequency[]
  technicians: TechnicianSummary[]
  errors: Record<string, string[]>
  onChange: (patch: Partial<BuilderTask>) => void
  onRemove: () => void
  onAddSubtask: () => void
  onUpdateSubtask: (subtaskKey: string, patch: Partial<BuilderTask['subtasks'][number]>) => void
  onRemoveSubtask: (subtaskKey: string) => void
  onResetSubtask: (subtaskKey: string) => void
}) {
  const taskNumber = taskIndex + 1
  const totalMinutes = task.subtasks.reduce((sum, subtask) => sum + subtaskMinutes(subtask), 0)

  // New drafts open ready for input; already-saved tasks start collapsed so
  // a long list stays scannable.
  const [expanded, setExpanded] = useState(!task.id)

  const hasErrors = Object.keys(errors).some((key) => key.startsWith(`tasks.${taskIndex}.`))

  // A task with active validation errors always stays open — otherwise a
  // save attempt could surface errors inside a collapsed, invisible section.
  const isOpen = expanded || hasErrors

  function fieldError(field: string): string | undefined {
    return errors[`tasks.${taskIndex}.${field}`]?.[0]
  }

  function subtaskFieldError(subtaskIndex: number, field: string): string | undefined {
    return errors[`tasks.${taskIndex}.subtasks.${subtaskIndex}.${field}`]?.[0]
  }

  return (
    <section className="task-builder-section">
      <div className="task-builder-section-heading">
        <h3 className="task-builder-section-title">
          <span className="task-builder-number">{taskNumber}.</span> Task{task.name ? `: ${task.name}` : ''}
        </h3>

        <div className="task-builder-section-heading-actions">
          <span className="task-builder-time-badge">{formatTotalMinutes(totalMinutes)}</span>
          <button
            type="button"
            className="task-builder-icon-btn task-builder-icon-btn-remove"
            onClick={onRemove}
            title="Delete this task"
            aria-label="Delete this task"
          >
            <TrashIcon />
          </button>
          <button
            type="button"
            className="task-builder-icon-btn task-builder-icon-btn-toggle"
            onClick={() => setExpanded((value) => !value)}
            aria-expanded={isOpen}
            title={isOpen ? 'Collapse this task' : 'Expand this task'}
            aria-label={isOpen ? 'Collapse this task' : 'Expand this task'}
          >
            <span className={`task-builder-chevron${isOpen ? ' task-builder-chevron-up' : ''}`}>
              <ChevronDownIcon />
            </span>
          </button>
        </div>
      </div>

      {isOpen && (
        <>
          <div className="modal-form task-builder-fields">
            <label>
              Name
              <input value={task.name} onChange={(event) => onChange({ name: event.target.value })} required />
              {fieldError('name') && <span className="field-error">{fieldError('name')}</span>}
            </label>

            <div className="task-builder-total-time" title="Calculated automatically from this task's subtasks">
              Total Estimated Time <strong>{formatTotalMinutes(totalMinutes)}</strong>
            </div>

            <label>
              Description
              <textarea
                value={task.description}
                onChange={(event) => onChange({ description: event.target.value })}
                rows={3}
                required
              />
              {fieldError('description') && <span className="field-error">{fieldError('description')}</span>}
            </label>

            <label>
              Work Tags
              <MultiSelectDropdown
                options={workTags.map((tag) => ({ id: tag.id, label: tag.name }))}
                selectedIds={task.work_tag_ids}
                onChange={(ids) => onChange({ work_tag_ids: ids })}
                placeholder="Select Work Tags"
                emptyMessage="No work tags yet — create one from the Work Tags page first."
              />
            </label>

            <label>
              Frequency
              <select
                value={task.frequency_id}
                onChange={(event) => onChange({ frequency_id: event.target.value })}
                required
              >
                <option value="" disabled>
                  {frequencies.length === 0 ? 'No frequencies yet' : 'Select a frequency'}
                </option>
                {frequencies.map((frequency) => (
                  <option key={frequency.id} value={frequency.id}>
                    {frequency.name}
                  </option>
                ))}
              </select>
              {fieldError('frequency_id') && <span className="field-error">{fieldError('frequency_id')}</span>}
            </label>

            <label>
              Assign Technicians
              <MultiSelectDropdown
                options={technicians.map((technician) => ({ id: technician.id, label: technician.name }))}
                selectedIds={task.technician_ids}
                onChange={(ids) => onChange({ technician_ids: ids })}
                placeholder="Select Technicians"
                emptyMessage="No technicians in your organization yet — assign one from the Technicians page first."
              />
              {fieldError('technician_ids') && <span className="field-error">{fieldError('technician_ids')}</span>}
            </label>
          </div>

          <div className="task-builder-subtasks">
            {fieldError('subtasks') && <span className="field-error">{fieldError('subtasks')}</span>}

            {task.subtasks.map((subtask, subtaskIndex) => (
              <div key={subtask.key} className="subtask-form-card">
                <div className="subtask-form-card-header">
                  <span className="subtask-form-card-title">
                    {taskNumber}.{subtaskIndex + 1} Subtask
                  </span>
                  <div className="task-builder-row-actions">
                    <button
                      type="button"
                      className="task-builder-icon-btn task-builder-icon-btn-add"
                      onClick={onAddSubtask}
                      title="Add Subtask"
                      aria-label="Add Subtask"
                    >
                      <PlusIcon />
                    </button>
                    <button
                      type="button"
                      className="task-builder-icon-btn task-builder-icon-btn-reset"
                      onClick={() => onResetSubtask(subtask.key)}
                      title="Reset this subtask"
                      aria-label="Reset this subtask"
                    >
                      <RepeatIcon />
                    </button>
                    <button
                      type="button"
                      className="task-builder-icon-btn task-builder-icon-btn-remove"
                      onClick={() => onRemoveSubtask(subtask.key)}
                      disabled={task.subtasks.length <= 1}
                      title={task.subtasks.length > 1 ? 'Remove this subtask' : 'At least one subtask is required'}
                      aria-label="Remove this subtask"
                    >
                      <CloseIcon />
                    </button>
                  </div>
                </div>

                <input
                  className="subtask-form-name"
                  placeholder="Subtask name"
                  value={subtask.name}
                  onChange={(event) => onUpdateSubtask(subtask.key, { name: event.target.value })}
                  required
                />
                {subtaskFieldError(subtaskIndex, 'name') && (
                  <span className="field-error">{subtaskFieldError(subtaskIndex, 'name')}</span>
                )}

                <input
                  className="subtask-form-description"
                  placeholder="Description (optional)"
                  value={subtask.description}
                  onChange={(event) => onUpdateSubtask(subtask.key, { description: event.target.value })}
                />
                {subtaskFieldError(subtaskIndex, 'description') && (
                  <span className="field-error">{subtaskFieldError(subtaskIndex, 'description')}</span>
                )}

                <div className="subtask-form-time-row">
                  <label className="subtask-form-time-field">
                    Hours
                    <input
                      type="number"
                      min={0}
                      value={subtask.hours}
                      onChange={(event) => onUpdateSubtask(subtask.key, { hours: event.target.value })}
                    />
                  </label>
                  <label className="subtask-form-time-field">
                    Minutes
                    <input
                      type="number"
                      min={0}
                      max={59}
                      value={subtask.minutes}
                      onChange={(event) => onUpdateSubtask(subtask.key, { minutes: event.target.value })}
                    />
                  </label>
                </div>
                {subtaskFieldError(subtaskIndex, 'estimated_time') && (
                  <span className="field-error">{subtaskFieldError(subtaskIndex, 'estimated_time')}</span>
                )}
              </div>
            ))}
          </div>
        </>
      )}
    </section>
  )
}
