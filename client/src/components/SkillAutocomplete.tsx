import { useEffect, useRef, useState } from 'react';
import type { Key } from '@heroui/react';
import { ComboBox, Input, Label, ListBox } from '@heroui/react';
import { getSkillCategories, getSkills, type Skill, type SkillCategory } from '../lib/skills-api';

type SkillAutocompleteProps = {
  label: string;
  placeholder?: string;
  selectedSkill: Skill | null;
  excludeIds?: number[];
  categoryId?: number | null;
  categoryName?: string | null;
  showCategoryFilter?: boolean;
  resetKey?: number;
  onSelect: (skill: Skill | null) => void;
  onResultsChange?: (count: number) => void;
};

export const SkillAutocomplete = ({
  label,
  placeholder = 'Search skills',
  selectedSkill,
  excludeIds = [],
  categoryId,
  categoryName,
  showCategoryFilter = true,
  resetKey = 0,
  onSelect,
  onResultsChange,
}: SkillAutocompleteProps) => {
  const requestIdRef = useRef(0);
  const [query, setQuery] = useState('');
  const [options, setOptions] = useState<Skill[]>([]);
  const [categories, setCategories] = useState<SkillCategory[]>([]);
  const [internalCategoryId, setInternalCategoryId] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const isCategoryControlled = categoryId !== undefined;
  const selectedCategoryId = isCategoryControlled ? categoryId : internalCategoryId;
  const activeCategory = isCategoryControlled
    ? categoryName
      ? { name: categoryName }
      : null
    : categories.find((category) => category.id === selectedCategoryId);

  useEffect(() => {
    let cancelled = false;

    const loadCategories = async () => {
      try {
        const response = await getSkillCategories();
        if (!cancelled) {
          setCategories(response.data);
        }
      } catch {
        if (!cancelled) {
          setCategories([]);
        }
      }
    };

    if (showCategoryFilter) {
      void loadCategories();
    }

    return () => {
      cancelled = true;
    };
  }, [showCategoryFilter]);

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
        const trimmedQuery = query.trim();
        const requestQuery = {
          categoryId: selectedCategoryId,
          search: trimmedQuery.length >= 2 ? trimmedQuery : undefined,
        };
        const response = await getSkills(requestQuery);
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
  }, [excludeIds, onResultsChange, query, selectedCategoryId]);

  useEffect(() => {
    setQuery('');
    onSelect(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCategoryId]);

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
      className="grid gap-3"
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
      <Label className="text-sm font-medium text-foreground-700">{label}</Label>

      {showCategoryFilter && (
        <div className="grid gap-3 rounded-xl border border-divider bg-content2 p-3">
          <div className="flex items-center justify-between gap-3">
            <span className="text-xs font-medium uppercase tracking-[0.14em] text-foreground-500">Category</span>
            <span className="text-xs text-foreground-500">{activeCategory?.name ?? 'All skills'}</span>
          </div>
          <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
            <button
              type="button"
              className={[
                'shrink-0 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors',
                selectedCategoryId === null
                  ? 'border-[#181d26] bg-[#181d26] text-white'
                  : 'border-divider bg-content1 text-foreground-600 hover:border-foreground/30',
              ].join(' ')}
              onClick={() => {
                setInternalCategoryId(null);
                setQuery('');
                onSelect(null);
              }}
            >
              All
            </button>
            {categories.map((category) => (
              <button
                key={category.id}
                type="button"
                className={[
                  'shrink-0 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors',
                  selectedCategoryId === category.id
                    ? 'border-[#181d26] bg-[#181d26] text-white'
                    : 'border-divider bg-content1 text-foreground-600 hover:border-foreground/30',
                ].join(' ')}
                onClick={() => {
                  setInternalCategoryId(category.id);
                  setQuery('');
                  onSelect(null);
                }}
              >
                {category.name}
              </button>
            ))}
          </div>
        </div>
      )}

      <ComboBox.InputGroup className="flex items-center gap-2">
        <Input placeholder={activeCategory ? `Search skills in "${activeCategory.name}"...` : placeholder} autoComplete="off" />
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
                <div className="grid gap-1 px-4 py-3 text-left text-sm">
                  <div className="flex items-center justify-between gap-3">
                    <span className="block font-medium text-foreground">{skill.name}</span>
                    <span className="shrink-0 rounded-full bg-content2 px-2 py-1 text-[11px] text-foreground-500">{skill.category.name}</span>
                  </div>
                  {skill.description && <span className="line-clamp-2 block text-xs leading-5 text-foreground-500">{skill.description}</span>}
                </div>
              </ListBox.Item>
            ))
          )}
        </ListBox>
      </ComboBox.Popover>
    </ComboBox>
  );
};
