// Categorized, searchable, multi-select technical skills picker.
// Props: value = array of skill display names (profile.currentSkills), onChange(names, selections)
// where selections = [{ id, name, category }] (unique ids). Driven entirely by data/skillCatalog.js.
function SkillPicker({ value, onChange }) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(() => {
    const o = {}; SKILL_CATEGORIES.forEach(c => { if (c.defaultOpen) o[c.id] = true; }); return o;
  });

  const selections = useMemo(() => dedupeSelections(value), [value]);
  const selectedIds = useMemo(() => { const m = {}; selections.forEach(s => { m[s.id] = true; }); return m; }, [selections]);

  const commit = (list) => onChange(list.map(s => s.name), list);
  const toggleId = (id) => {
    if (selectedIds[id]) commit(selections.filter(s => s.id !== id));
    else commit([...selections, selectionFromId(id)]);
  };
  const addIds = (ids) => commit([...selections, ...ids.filter(id => !selectedIds[id]).map(selectionFromId)]);
  const removeIds = (ids) => { const drop = {}; ids.forEach(i => { drop[i] = 1; }); commit(selections.filter(s => !drop[s.id])); };
  const addCustom = (text) => {
    const name = text.trim(); if (!name) return;
    commit(dedupeSelections([...selections, name])); setQuery("");
  };

  const q = query.trim();
  const results = useMemo(() => searchSkills(q), [q]);
  const exact = q && SKILL_ID_BY_NAME[normSkill(q)];

  const renderChip = (id, showMeta) => {
    const d = SKILL_DEFS[id]; const on = !!selectedIds[id];
    const cats = (SKILL_CATS_BY_ID[id] || []).map(c => c.name);
    return (
      <button key={id} type="button" aria-pressed={on} onClick={() => toggleId(id)} data-skill-id={id}
        className={`skill-chip ${on ? "is-on" : "text-mute hover:text-ink"} inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm text-left`}>
        {on && <Icon name="check" size={13} className="text-cyan shrink-0" strokeWidth={2.5} />}
        <span>{d.name}</span>
        {showMeta && <span className="text-[10px] uppercase tracking-wide text-mute/80 font-mono ml-0.5">{SKILL_KIND_LABEL[d.kind]}</span>}
        {showMeta && cats.length > 0 && <span className="hidden sm:inline text-[10px] text-mute/60">· {cats[0]}{cats.length > 1 ? ` +${cats.length - 1}` : ""}</span>}
      </button>
    );
  };

  const catById = {}; SKILL_CATEGORIES.forEach(c => { catById[c.id] = c; });
  const total = selections.length;

  return (
    <div className="space-y-4" data-testid="skill-picker">
      {/* Search */}
      <div className="relative">
        <Icon name="search" size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-mute" />
        <input value={query} onChange={e => setQuery(e.target.value)} aria-label="Search skills"
          placeholder="Search programming languages, frameworks, tools and technologies..."
          className="w-full bg-panel2 border border-line rounded-xl pl-10 pr-10 py-3 text-sm text-ink placeholder:text-mute/60 focus:border-indigo/60 transition-colors" />
        {query && (
          <button type="button" aria-label="Clear search" onClick={() => setQuery("")}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-mute hover:text-ink"><Icon name="x" size={15} /></button>
        )}
      </div>

      {/* Selected tray */}
      <div className="glass rounded-2xl p-4 border border-line">
        <div className="flex items-center justify-between gap-3 mb-2">
          <div className="text-sm font-medium" data-testid="skill-count">
            <span className="text-cyan font-mono">{total}</span> skill{total === 1 ? "" : "s"} selected
          </div>
          {total > 0 && (
            <button type="button" onClick={() => commit([])} className="text-xs text-mute hover:text-bad transition-colors">Clear all</button>
          )}
        </div>
        {total === 0 ? (
          <p className="text-xs text-mute">Nothing selected yet — pick any that apply. There's no minimum or maximum.</p>
        ) : (
          <div className="flex flex-wrap gap-2 skill-scroll !max-h-40" data-testid="skill-tray">
            {selections.map(s => (
              <span key={s.id} className="skill-pop inline-flex items-center gap-1 pl-3 pr-1.5 py-1 rounded-full text-sm bg-indigo/20 border border-indigo/50 text-white">
                {s.name}
                <button type="button" aria-label={`Remove ${s.name}`} data-remove={s.id}
                  onClick={() => commit(selections.filter(x => x.id !== s.id))}
                  className="w-5 h-5 rounded-full inline-flex items-center justify-center text-mute hover:text-white hover:bg-white/10">
                  <Icon name="x" size={12} strokeWidth={2.5} />
                </button>
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Search results */}
      {q ? (
        <div className="space-y-4" data-testid="skill-results">
          {results.direct.length === 0 && results.related.length === 0 && (
            <p className="text-sm text-mute">No skills match “{q}”.</p>
          )}
          {results.direct.length > 0 && (
            <div>
              <div className="text-xs font-mono text-cyan mb-2">MATCHES · {results.direct.length}</div>
              <div className="flex flex-wrap gap-2">{results.direct.map(id => renderChip(id, true))}</div>
            </div>
          )}
          {results.related.length > 0 && (
            <div>
              <div className="text-xs font-mono text-mute mb-2">RELATED TO “{q.toUpperCase()}” · {results.related.length}</div>
              <div className="flex flex-wrap gap-2">{results.related.map(id => renderChip(id, true))}</div>
            </div>
          )}
          {!exact && (
            <button type="button" onClick={() => addCustom(q)} data-testid="add-custom"
              className="inline-flex items-center gap-2 text-sm text-cyan hover:text-ink transition-colors">
              <Icon name="plus" size={14} /> Add “{q}” as a custom skill
            </button>
          )}
        </div>
      ) : (
        /* Categories */
        <div className="space-y-3">
          {SKILL_CATEGORIES.map(cat => {
            const isOpen = !!open[cat.id];
            const count = cat.skills.filter(id => selectedIds[id]).length;
            const allOn = count === cat.skills.length;
            return (
              <div key={cat.id} className={`glass rounded-2xl border transition-colors ${count ? "border-indigo/30" : "border-line"} ${cat.defaultOpen ? "shadow-glow" : ""}`}>
                <button type="button" aria-expanded={isOpen} data-cat={cat.id}
                  onClick={() => setOpen(o => ({ ...o, [cat.id]: !o[cat.id] }))}
                  className="w-full flex items-center gap-3 px-4 py-3 text-left">
                  <span className="w-8 h-8 rounded-lg bg-indigo/15 text-indigo inline-flex items-center justify-center shrink-0"><Icon name={cat.icon} size={16} /></span>
                  <span className="min-w-0 flex-1">
                    <span className="block font-display font-medium text-sm md:text-base truncate">{cat.name}</span>
                    <span className="block text-xs text-mute truncate">{cat.description}</span>
                  </span>
                  <span className={`text-xs font-mono px-2 py-0.5 rounded-full shrink-0 ${count ? "bg-cyan/15 text-cyan" : "bg-white/5 text-mute"}`}>{count}/{cat.skills.length}</span>
                  <Icon name="chevron-down" size={16} className={`text-mute shrink-0 transition-transform ${isOpen ? "rotate-180" : ""}`} />
                </button>
                <div className={`skill-acc ${isOpen ? "open" : ""}`} aria-hidden={!isOpen}>
                  <div>
                    <div className="px-4 pb-4">
                      <div className="flex items-center gap-4 mb-3 text-xs">
                        <button type="button" disabled={allOn} onClick={() => addIds(cat.skills)} data-selectall={cat.id}
                          className="text-cyan hover:text-ink disabled:opacity-40 disabled:cursor-not-allowed transition-colors">Select all</button>
                        <button type="button" disabled={!count} onClick={() => removeIds(cat.skills)} data-clearcat={cat.id}
                          className="text-mute hover:text-bad disabled:opacity-40 disabled:cursor-not-allowed transition-colors">Clear</button>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {isOpen && cat.skills.map(id => renderChip(id, false))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
