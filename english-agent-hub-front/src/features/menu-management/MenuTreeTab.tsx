"use client";

import { useState, useMemo, useCallback, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  DndContext, closestCenter, PointerSensor, KeyboardSensor,
  useSensor, useSensors, DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy,
  useSortable, arrayMove,
} from "@dnd-kit/sortable";
import { restrictToVerticalAxis, restrictToWindowEdges } from "@dnd-kit/modifiers";
import { CSS } from "@dnd-kit/utilities";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronRight, ExternalLink, Eye, EyeOff, GripVertical, Plus, Trash2 } from "lucide-react";
import { menuApi, type UpdateMenuBody } from "@/entities/menu/api/menuApi";
import type { MenuRecord, MenuItem } from "@/entities/menu/model/types";
import { toast, toastError } from "@/shared/lib/toast";
import { Switch } from "@/shared/ui/Switch";
import { MenuFormDialog } from "./MenuFormDialog";

function buildTree(flat: MenuRecord[]): MenuItem[] {
  const map = new Map<number, MenuItem>();
  flat.forEach((m) => map.set(m.id, { ...m, children: [] }));
  const roots: MenuItem[] = [];
  map.forEach((item) => {
    if (item.parentId === null) roots.push(item);
    else map.get(item.parentId!)?.children.push(item);
  });
  const sort = (items: MenuItem[]) => {
    items.sort((a, b) => a.displayOrder - b.displayOrder);
    items.forEach((i) => sort(i.children));
  };
  sort(roots);
  return roots;
}

function toUpdateBody(m: MenuRecord): UpdateMenuBody {
  return {
    parentId: m.parentId,
    label: m.label,
    labelKey: m.labelKey,
    path: m.path,
    icon: m.icon,
    isExternal: m.isExternal,
    requiredRole: m.requiredRole,
    requiredPermission: m.requiredPermission,
    visible: m.visible,
    displayOrder: m.displayOrder,
  };
}

function collectDescendantIds(flat: MenuRecord[], parentId: number): number[] {
  const children = flat.filter((m) => m.parentId === parentId);
  return children.flatMap((child) => [
    child.id,
    ...collectDescendantIds(flat, child.id),
  ]);
}

function flattenTreeForSelect(items: MenuItem[], depth = 0): Array<{ menu: MenuItem; depth: number }> {
  return items.flatMap((item) => [
    { menu: item, depth },
    ...flattenTreeForSelect(item.children, depth + 1),
  ]);
}

/* ── Detail Panel ─────────────────────────────── */
function DetailPanel({
  menu,
  allMenus,
  onSaved,
  onDeleted,
}: {
  menu: MenuRecord;
  allMenus: MenuRecord[];
  onSaved: () => void;
  onDeleted: () => void;
}) {
  const qc = useQueryClient();
  const [form, setForm] = useState<UpdateMenuBody>(toUpdateBody(menu));

  const set = <K extends keyof UpdateMenuBody>(k: K, v: UpdateMenuBody[K]) =>
    setForm((prev) => ({ ...prev, [k]: v }));

  const mutation = useMutation({
    mutationFn: () => menuApi.update(menu.id, form),
    onSuccess: () => {
      toast.success("저장되었습니다.");
      qc.invalidateQueries({ queryKey: ["menus"] });
      onSaved();
    },
    onError: (e) => toastError(e, "저장에 실패했습니다."),
  });

  const deleteMutation = useMutation({
    mutationFn: () => menuApi.delete(menu.id),
    onSuccess: () => {
      toast.success("삭제되었습니다.");
      qc.invalidateQueries({ queryKey: ["menus"] });
      onDeleted();
    },
    onError: (e) => toastError(e, "삭제에 실패했습니다."),
  });

  const handleDelete = () => {
    if (!confirm(`"${menu.label}" 메뉴를 삭제하시겠습니까?\n하위 메뉴가 있으면 삭제할 수 없습니다.`)) return;
    deleteMutation.mutate();
  };

  const blockedParentIds = new Set([
    menu.id,
    ...collectDescendantIds(allMenus, menu.id),
  ]);
  const parentOptions = flattenTreeForSelect(
    buildTree(allMenus.filter((m) => !blockedParentIds.has(m.id)))
  );

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between border-b border-border bg-muted/30 px-5 py-4">
        <div>
          <p className="font-mono text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">{menu.code}</p>
          <h3 className="mt-1 text-lg font-bold tracking-tight">{menu.label}</h3>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleDelete}
            disabled={deleteMutation.isPending}
            className="flex h-9 items-center gap-1.5 rounded-md border border-destructive/50 px-3 text-sm font-semibold text-destructive transition-colors hover:bg-destructive/10 disabled:opacity-60"
          >
            <Trash2 size={14} />
            삭제
          </button>
          <button
            onClick={() => mutation.mutate()}
            disabled={mutation.isPending}
            className="h-9 rounded-md bg-primary px-4 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-60"
          >
            {mutation.isPending ? "저장 중..." : "저장"}
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-5 py-5">
        <div className="grid max-w-5xl gap-3">
        <Field label="부모 메뉴">
          <select
            value={form.parentId ?? ""}
            onChange={(e) => set("parentId", e.target.value ? Number(e.target.value) : null)}
            className={inputCls}
          >
            <option value="">없음 (루트)</option>
            {parentOptions.map(({ menu: option, depth }) => (
              <option key={option.id} value={option.id}>
                {"　".repeat(depth)}
                {depth > 0 ? "└ " : ""}
                {option.label} ({option.code})
              </option>
            ))}
          </select>
        </Field>

        <Field label="레이블">
          <input
            value={form.label}
            onChange={(e) => set("label", e.target.value)}
            className={inputCls}
          />
        </Field>

        <Field label="i18n 키">
          <input
            value={form.labelKey ?? ""}
            onChange={(e) => set("labelKey", e.target.value || null)}
            placeholder="nav.dashboard"
            className={inputCls}
          />
        </Field>

        <Field label="경로 (URL)">
          <input
            value={form.path ?? ""}
            onChange={(e) => set("path", e.target.value || null)}
            placeholder="/dashboard"
            className={inputCls}
          />
        </Field>

        <Field label="아이콘">
          <input
            value={form.icon ?? ""}
            onChange={(e) => set("icon", e.target.value || null)}
            placeholder="LayoutDashboard"
            className={inputCls}
          />
        </Field>

        <Field label="필요 역할">
          <input
            value={form.requiredRole ?? ""}
            onChange={(e) => set("requiredRole", e.target.value || null)}
            placeholder="ROLE_ADMIN"
            className={inputCls}
          />
        </Field>

        <Field label="표시 순서">
          <input
            type="number"
            value={form.displayOrder}
            onChange={(e) => set("displayOrder", Number(e.target.value))}
            className={inputCls}
          />
        </Field>

        <ToggleField
          label="표시"
          description="꺼두면 헤더 메뉴에서 숨겨집니다."
          checked={form.visible}
          onCheckedChange={(checked) => set("visible", checked)}
        />
        <ToggleField
          label="외부 링크"
          description="새 탭 링크로 열어야 하는 외부 URL일 때 사용합니다."
          checked={form.isExternal}
          onCheckedChange={(checked) => set("isExternal", checked)}
        />
        </div>
      </div>
    </div>
  );
}

/* ── Sortable Tree Item ───────────────────────── */
function TreeNode({
  item,
  depth,
  selected,
  openMap,
  onSelect,
  onToggle,
}: {
  item: MenuItem;
  depth: number;
  selected: number | null;
  openMap: Record<number, boolean>;
  onSelect: (m: MenuRecord) => void;
  onToggle: (id: number) => void;
}) {
  const isOpen = !!openMap[item.id];
  const hasChildren = item.children.length > 0;
  const isSelected = selected === item.id;

  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: item.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  };

  return (
    <div ref={setNodeRef} style={style}>
      <motion.div
        whileHover={{ x: 1 }}
        onClick={() => {
          onSelect(item);
          if (hasChildren) onToggle(item.id);
        }}
        className={`group flex cursor-pointer items-center gap-2 rounded-md border px-2 py-2 text-sm transition-colors ${
          isSelected
            ? "border-primary bg-primary text-primary-foreground"
            : "border-transparent text-muted-foreground hover:border-border hover:bg-background hover:text-foreground"
        }`}
        style={{ paddingLeft: `${depth * 16 + 8}px` }}
      >
        <div
          {...attributes}
          {...listeners}
          onClick={(e) => e.stopPropagation()}
          className={`cursor-grab rounded p-0.5 transition-opacity active:cursor-grabbing ${
            isSelected ? "opacity-80" : "opacity-30 group-hover:opacity-80"
          }`}
        >
          <GripVertical size={14} />
        </div>

        {hasChildren ? (
          <motion.div animate={{ rotate: isOpen ? 90 : 0 }} transition={{ duration: 0.15 }}>
            <ChevronRight size={14} className="shrink-0 opacity-50" />
          </motion.div>
        ) : (
          <span className="w-3.5 shrink-0" />
        )}

        <span className="min-w-0 flex-1">
          <span className="block truncate font-semibold">{item.label}</span>
          {item.path && (
            <span className={`block truncate font-mono text-[10px] ${
              isSelected ? "text-primary-foreground/70" : "text-muted-foreground/70"
            }`}>
              {item.path}
            </span>
          )}
        </span>

        {item.requiredRole && (
          <span className={`shrink-0 rounded px-1.5 py-0.5 font-mono text-[10px] ${
            isSelected
              ? "bg-primary-foreground/15 text-primary-foreground"
              : "bg-amber-500/15 text-amber-700"
          }`}>
            {item.requiredRole.replace("ROLE_", "")}
          </span>
        )}

        {item.isExternal && <ExternalLink className="h-3.5 w-3.5 shrink-0 opacity-60" />}
        {item.visible ? (
          <Eye className="h-3.5 w-3.5 shrink-0 opacity-60" />
        ) : (
          <EyeOff className="h-3.5 w-3.5 shrink-0 text-destructive" />
        )}
      </motion.div>

      <AnimatePresence initial={false}>
        {isOpen && hasChildren && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.18 }}
            className="overflow-hidden"
          >
            <SortableContext
              items={item.children.map((c) => c.id)}
              strategy={verticalListSortingStrategy}
            >
              {item.children.map((child) => (
                <TreeNode
                  key={child.id}
                  item={child}
                  depth={depth + 1}
                  selected={selected}
                  openMap={openMap}
                  onSelect={onSelect}
                  onToggle={onToggle}
                />
              ))}
            </SortableContext>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ── Main Component ───────────────────────────── */
export function MenuTreeTab() {
  const qc = useQueryClient();
  const [selected, setSelected] = useState<MenuRecord | null>(null);
  const [openMap, setOpenMap] = useState<Record<number, boolean>>({});
  const [localFlat, setLocalFlat] = useState<MenuRecord[] | null>(null);
  const [createOpen, setCreateOpen] = useState(false);

  const { data: serverMenus = [], isLoading } = useQuery<MenuRecord[]>({
    queryKey: ["menus"],
    queryFn: menuApi.getAll,
  });

  useEffect(() => {
    setLocalFlat(serverMenus);
  }, [serverMenus]);

  const flat: MenuRecord[] = localFlat ?? serverMenus;
  const tree = useMemo(() => buildTree(flat), [flat]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const saveMutation = useMutation({
    mutationFn: (items: MenuRecord[]) =>
      Promise.all(items.map((m) => menuApi.update(m.id, toUpdateBody(m)))),
    onSuccess: () => {
      toast.success("순서가 저장되었습니다.");
      qc.invalidateQueries({ queryKey: ["menus"] });
    },
    onError: (e) => toastError(e, "순서 저장에 실패했습니다."),
  });

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;
      if (!over || active.id === over.id) return;

      const activeId = Number(active.id);
      const overId = Number(over.id);
      const activeItem = flat.find((m) => m.id === activeId);
      if (!activeItem) return;

      const parentId = activeItem.parentId;
      const siblings = flat
        .filter((m) => m.parentId === parentId)
        .sort((a, b) => a.displayOrder - b.displayOrder);

      const oldIdx = siblings.findIndex((m) => m.id === activeId);
      const newIdx = siblings.findIndex((m) => m.id === overId);
      if (oldIdx === -1 || newIdx === -1) return;

      const reordered = arrayMove(siblings, oldIdx, newIdx).map((m, i) => ({
        ...m,
        displayOrder: i,
      }));

      const updated = flat.map((m) => {
        const r = reordered.find((r) => r.id === m.id);
        return r ?? m;
      });

      setLocalFlat(updated);
      saveMutation.mutate(reordered);
    },
    [flat, saveMutation]
  );

  const toggleOpen = useCallback((id: number) => {
    setOpenMap((prev) => ({ ...prev, [id]: !prev[id] }));
  }, []);

  if (isLoading) return <p className="text-sm text-muted-foreground p-4">로딩 중...</p>;

  return (
    <div className="grid h-[640px] gap-4 xl:grid-cols-[360px_minmax(0,1fr)]">
      {/* Left: Tree */}
      <div className="flex min-w-0 flex-col overflow-hidden rounded-lg border border-border bg-background">
        <div className="flex items-center justify-between border-b border-border bg-muted/35 px-4 py-3">
          <div>
            <h2 className="text-sm font-bold">메뉴 트리</h2>
            <p className="mt-0.5 text-xs text-muted-foreground">드래그로 같은 부모 안의 순서를 변경합니다.</p>
          </div>
          <button
            onClick={() => setCreateOpen(true)}
            className="flex h-8 items-center gap-1 rounded-md bg-primary px-2.5 text-xs font-semibold text-primary-foreground hover:opacity-90"
          >
            <Plus size={12} />
            추가
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-2 space-y-0.5">
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
            modifiers={[restrictToVerticalAxis, restrictToWindowEdges]}
          >
            <SortableContext items={tree.map((i) => i.id)} strategy={verticalListSortingStrategy}>
              {tree.map((item) => (
                <TreeNode
                  key={item.id}
                  item={item}
                  depth={0}
                  selected={selected?.id ?? null}
                  openMap={openMap}
                  onSelect={setSelected}
                  onToggle={toggleOpen}
                />
              ))}
            </SortableContext>
          </DndContext>
        </div>
        {saveMutation.isPending && (
          <div className="px-3 py-1.5 border-t border-border text-xs text-muted-foreground animate-pulse">
            순서 저장 중...
          </div>
        )}
      </div>

      {/* Right: Detail */}
      <div className="min-w-0 overflow-hidden rounded-lg border border-border bg-background">
        {selected ? (
          <DetailPanel
            key={selected.id}
            menu={selected}
            allMenus={flat}
            onSaved={() => setSelected(null)}
            onDeleted={() => setSelected(null)}
          />
        ) : (
          <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
            왼쪽 메뉴를 선택하면 상세 설정을 편집할 수 있습니다.
          </div>
        )}
      </div>

      {createOpen && (
        <MenuFormDialog
          target="new"
          menus={flat}
          onClose={() => setCreateOpen(false)}
        />
      )}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-[8rem_minmax(0,1fr)] items-center gap-4">
      <label className="text-right text-xs font-semibold text-muted-foreground">{label}</label>
      <div className="min-w-0">{children}</div>
    </div>
  );
}

function ToggleField({
  label,
  description,
  checked,
  onCheckedChange,
}: {
  label: string;
  description: string;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
}) {
  return (
    <div className="grid grid-cols-[8rem_minmax(0,1fr)] items-center gap-4">
      <span className="text-right text-xs font-semibold text-muted-foreground">{label}</span>
      <div className="flex items-center justify-between rounded-md border border-border bg-muted/20 px-3 py-2.5">
        <div>
          <p className="text-sm font-semibold text-foreground">{checked ? "켜짐" : "꺼짐"}</p>
          <p className="mt-0.5 text-xs text-muted-foreground">{description}</p>
        </div>
        <Switch
          checked={checked}
          onCheckedChange={onCheckedChange}
          aria-label={label}
        />
      </div>
    </div>
  );
}

const inputCls =
  "h-10 w-full rounded-md border border-input bg-background px-3 text-sm outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-ring/30";
