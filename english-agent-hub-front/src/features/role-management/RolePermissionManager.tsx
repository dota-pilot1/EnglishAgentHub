"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { roleApi } from "@/entities/user/api/roleApi";
import { permissionApi } from "@/entities/permission/api/permissionApi";
import { toast, toastError } from "@/shared/lib/toast";
import { RoleManageDialog } from "./RoleManageDialog";
import { UserRoleDialog } from "@/features/user-management/UserRoleDialog";
import type { Role } from "@/entities/user/model/types";
import type { Permission } from "@/entities/permission/model/types";

export function RolePermissionManager() {
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [checkedIds, setCheckedIds] = useState<Set<number>>(new Set());
  const [manageOpen, setManageOpen] = useState(false);
  const [userRoleOpen, setUserRoleOpen] = useState(false);
  const qc = useQueryClient();

  const { data: roles = [], isLoading: rolesLoading } = useQuery({
    queryKey: ["roles"],
    queryFn: roleApi.list,
  });

  const { data: allPermissions = [], isLoading: permsLoading } = useQuery({
    queryKey: ["permissions"],
    queryFn: () => permissionApi.list(),
  });

  const { data: rolePermissions = [] } = useQuery({
    queryKey: ["role-permissions", selectedRole?.id],
    queryFn: () => roleApi.getPermissions(selectedRole!.id),
    enabled: !!selectedRole,
  });

  const permissionIdKey = rolePermissions.map((p) => p.id).sort().join(",");
  useEffect(() => {
    setCheckedIds(new Set(rolePermissions.map((p) => p.id)));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [permissionIdKey]);

  const saveMutation = useMutation({
    mutationFn: () => roleApi.setPermissions(selectedRole!.id, [...checkedIds]),
    onSuccess: () => {
      toast.success("권한이 저장되었습니다.");
      qc.invalidateQueries({ queryKey: ["role-permissions", selectedRole?.id] });
    },
    onError: (e) => toastError(e, "저장에 실패했습니다."),
  });

  const toggle = (id: number) => {
    setCheckedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const toggleAll = (perms: Permission[]) => {
    const ids = perms.map((p) => p.id);
    const allChecked = ids.every((id) => checkedIds.has(id));
    setCheckedIds((prev) => {
      const next = new Set(prev);
      ids.forEach((id) => {
        if (allChecked) {
          next.delete(id);
        } else {
          next.add(id);
        }
      });
      return next;
    });
  };

  const grouped = allPermissions.reduce<Record<string, Permission[]>>((acc, p) => {
    const key = p.category?.code ?? "기타";
    (acc[key] = acc[key] ?? []).push(p);
    return acc;
  }, {});

  const isDirty =
    selectedRole &&
    (checkedIds.size !== rolePermissions.length ||
      [...checkedIds].some((id) => !rolePermissions.find((p) => p.id === id)));

  return (
    <>
      <div className="flex gap-0 rounded-lg border border-border overflow-hidden min-h-[640px]">
        {/* Left: Role list */}
        <aside className="w-56 shrink-0 border-r border-border bg-muted/30 flex flex-col">
          <div className="flex h-12 items-center justify-between px-4 border-b border-border shrink-0">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">역할 목록</p>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setUserRoleOpen(true)}
                title="유저 롤 설정"
                className="rounded-md px-2 py-1 text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-accent transition-colors border border-input"
              >
                유저 롤
              </button>
              <button
                onClick={() => setManageOpen(true)}
                title="역할 관리"
                className="rounded-md p-1.5 text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </button>
            </div>
          </div>
          {rolesLoading ? (
            <p className="px-3 py-3 text-sm text-muted-foreground">로딩 중...</p>
          ) : (
            <ul className="flex-1 overflow-y-auto">
              {roles.map((role) => {
                const isSelected = selectedRole?.id === role.id;
                return (
                  <li key={role.id} className={`border-b border-border/50 last:border-0 ${isSelected ? "bg-primary text-primary-foreground" : "hover:bg-accent"}`}>
                    <button
                      onClick={() => setSelectedRole(role)}
                      className="w-full text-left px-4 py-2.5"
                    >
                      <div className="flex items-center gap-1.5">
                        <span className="text-sm font-medium truncate">{role.name}</span>
                        {role.systemRole && (
                          <span className={`shrink-0 text-[9px] font-bold px-1 py-px rounded ${isSelected ? "bg-primary-foreground/20 text-primary-foreground/80" : "bg-muted-foreground/20 text-muted-foreground"}`}>
                            S
                          </span>
                        )}
                      </div>
                      <span className={`block text-xs font-mono truncate mt-0.5 ${isSelected ? "text-primary-foreground/70" : "text-muted-foreground"}`}>
                        {role.code}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </aside>

        {/* Right: Permission checkboxes */}
        <div className="flex-1 flex flex-col min-w-0">
          {!selectedRole ? (
            <div className="flex flex-1 items-center justify-center text-sm text-muted-foreground">
              왼쪽에서 역할을 선택하세요
            </div>
          ) : (
            <>
              <div className="flex h-12 items-center justify-between px-4 border-b border-border shrink-0">
                <div>
                  <span className="font-semibold">{selectedRole.name}</span>
                  <span className="ml-2 font-mono text-xs text-muted-foreground">{selectedRole.code}</span>
                </div>
                <button
                  onClick={() => saveMutation.mutate()}
                  disabled={!isDirty || saveMutation.isPending}
                  className="rounded-md bg-primary text-primary-foreground px-4 py-1.5 text-sm font-medium hover:opacity-90 disabled:opacity-40 transition-opacity"
                >
                  {saveMutation.isPending ? "저장 중..." : "저장"}
                </button>
              </div>

              {permsLoading ? (
                <p className="px-4 py-4 text-sm text-muted-foreground">로딩 중...</p>
              ) : (
                <div className="flex-1 overflow-y-auto px-4 py-4 space-y-6">
                  {Object.entries(grouped).map(([categoryCode, perms]) => {
                    const allChecked = perms.every((p) => checkedIds.has(p.id));
                    const someChecked = perms.some((p) => checkedIds.has(p.id));
                    return (
                      <div key={categoryCode}>
                        <div className="flex items-center gap-2 mb-2">
                          <input
                            type="checkbox"
                            id={`cat-${categoryCode}`}
                            checked={allChecked}
                            ref={(el) => { if (el) el.indeterminate = someChecked && !allChecked; }}
                            onChange={() => toggleAll(perms)}
                            className="h-4 w-4 rounded border-input accent-primary cursor-pointer"
                          />
                          <label
                            htmlFor={`cat-${categoryCode}`}
                            className="text-xs font-semibold uppercase tracking-wider text-muted-foreground cursor-pointer select-none"
                          >
                            {perms[0]?.category?.name ?? categoryCode}
                          </label>
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-1 pl-6">
                          {perms.map((p) => (
                            <label
                              key={p.id}
                              className="flex items-start gap-2 rounded-md px-3 py-2 hover:bg-accent cursor-pointer transition-colors"
                            >
                              <input
                                type="checkbox"
                                checked={checkedIds.has(p.id)}
                                onChange={() => toggle(p.id)}
                                className="mt-0.5 h-4 w-4 rounded border-input accent-primary cursor-pointer"
                              />
                              <div>
                                <p className="text-sm font-medium leading-none">{p.name}</p>
                                <p className="text-xs font-mono text-muted-foreground mt-0.5">{p.code}</p>
                              </div>
                            </label>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </>
          )}
        </div>
      </div>

      <RoleManageDialog
        open={manageOpen}
        roles={roles}
        onClose={() => setManageOpen(false)}
      />

      <UserRoleDialog
        open={userRoleOpen}
        onClose={() => setUserRoleOpen(false)}
      />
    </>
  );
}
