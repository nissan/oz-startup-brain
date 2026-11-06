'use client';
import { useId, useState } from 'react';
import { Button } from '@/design-system/generated/bundle';

export interface Option<V extends string> {
  value: V;
  label: string;
}

interface Props<V extends string> {
  field: string;
  legend: string;
  help: string;
  options: Option<V>[];
  value: V | undefined;
  onSave: (value: V | undefined) => void;
  onCancel: () => void;
}

/**
 * Inline editor for one confirmed-context field. "Not set" means the planner may ask about it once;
 * "Unknown" is an explicit answer the planner must respect and never ask about again (SC22). The
 * difference is shown in words, not inferred.
 */
export function ContextEditor<V extends string>({ field, legend, help, options, value, onSave, onCancel }: Props<V>) {
  const [draft, setDraft] = useState<V | ''>(value ?? '');
  const name = useId();
  const save = () => onSave(draft === '' ? undefined : draft);
  return (
    <form
      className="context-editor"
      onSubmit={(e) => {
        e.preventDefault();
        save();
      }}
    >
      <fieldset style={{ border: 0, padding: 0, margin: 0, display: 'contents' }}>
        <legend className="context-editor__legend">{legend}</legend>
        <p className="section__caption" style={{ margin: 0 }}>
          {help}
        </p>
        <div className="context-editor__options" role="radiogroup" aria-label={legend}>
          <label className="context-editor__option">
            <input type="radio" name={name} value="" checked={draft === ''} onChange={() => setDraft('')} />
            Not set (the planner may ask once)
          </label>
          {options.map((o) => (
            <label key={o.value} className="context-editor__option">
              <input type="radio" name={name} value={o.value} checked={draft === o.value} onChange={() => setDraft(o.value)} />
              {o.label}
            </label>
          ))}
        </div>
      </fieldset>
      <div className="context-editor__actions">
        <Button variant="primary" onClick={save}>
          Save {field.toLowerCase()}
        </Button>
        <Button onClick={onCancel}>Cancel</Button>
      </div>
    </form>
  );
}
