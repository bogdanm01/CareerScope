import { useEffect, useRef, useState } from 'react';
import type { Key } from '@heroui/react';
import { ComboBox, Input, Label, ListBox } from '@heroui/react';
import { getSkills, type Skill } from '../lib/skills-api';

type SkillAutocompleteProps = {
  label: string;
  placeholder?: string;
  selectedSkill: Skill | null;
  excludeIds?: number[];
  resetKey?: number;
  onSelect: (skill: Skill | null) => void;
  onResultsChange?: (count: number) => void;
};

export const SkillAutocomplete = ({
  label,
  placeholder = 'Search skills',
  selectedSkill,
  excludeIds = [],
  resetKey = 0,
  onSelect,
  onResultsChange,
}: SkillAutocompleteProps) => {
  const requestIdRef = useRef(0);
  const [query, setQuery] = useState('');
  const [options, setOptions] = useState<Skill[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setQuery('');
    setOptions([]);
    onSelect(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resetKey]);

  useEffect(() => {
    let cancelled = false;
    const currentRequestId = ++requestIdRef.current;
    setLoading(true);
    const timer = window.setTimeout(async () => {
      try {
        const response = await getSkills(query.trim() ? { search: query.trim() } : undefined);
        if (cancelled || currentRequestId !== requestIdRef.current) {
          return;
        }

        const filtered = excludeIds.length > 0 ? response.data.filter((skill) => !excludeIds.includes(skill.id)) : response.data;
        setOptions(filtered);
        onResultsChange?.(filtered.length);
      } catch {
        if (!cancelled && currentRequestId === requestIdRef.current) {
          setOptions([]);
          onResultsChange?.(0);
        }
      } finally {
        if (!cancelled && currentRequestId === requestIdRef.current) {
          setLoading(false);
        }
      }
    }, 220);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [excludeIds, onResultsChange, query]);

  const handleSelect = (key: Key | null) => {
    if (key === null) {
      onSelect(null);
      return;
    }

    const skillId = Number(key);
    const skill = options.find((option) => option.id === skillId) ?? null;
    if (skill) {
      setQuery(skill.name);
    }
    onSelect(skill);
  };

  return (
    <ComboBox
      className="grid gap-2"
      selectedKey={selectedSkill ? String(selectedSkill.id) : null}
      inputValue={query}
      onInputChange={(value) => {
        setQuery(value);
        onSelect(null);
      }}
      onSelectionChange={handleSelect}
      allowsEmptyCollection
      fullWidth
    >
      <Label className="text-sm text-foreground-600">{label}</Label>

      <ComboBox.InputGroup className="flex items-center gap-2">
        <Input placeholder={placeholder} autoComplete="off" />
        <ComboBox.Trigger />
      </ComboBox.InputGroup>

      <ComboBox.Popover>
        <ListBox aria-label={`${label} suggestions`} className="max-h-64 overflow-auto py-2">
          {loading ? (
            <div className="px-4 py-3 text-sm text-foreground-500">Loading skills...</div>
          ) : options.length === 0 ? (
            <div className="px-4 py-3 text-sm text-foreground-500">No skills found.</div>
          ) : (
            options.map((skill) => (
              <ListBox.Item key={skill.id} id={String(skill.id)} textValue={skill.name}>
                <div className="grid gap-0.5 px-4 py-3 text-left text-sm">
                  <span className="block font-medium text-foreground">{skill.name}</span>
                  <span className="block text-xs text-foreground-500">{skill.category.name}</span>
                </div>
              </ListBox.Item>
            ))
          )}
        </ListBox>
      </ComboBox.Popover>
    </ComboBox>
  );
};
