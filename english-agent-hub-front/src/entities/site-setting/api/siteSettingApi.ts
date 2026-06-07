import { api } from "@/shared/api/axios";
import type { SiteSetting } from "../model/types";

export type UpdateSiteSettingBody = {
  heroImageUrl: string | null;
  introTitle: string;
  introSubtitle: string;
};

export const siteSettingApi = {
  get: () => api.get<SiteSetting>("/api/site-settings").then((r) => r.data),
  update: (body: UpdateSiteSettingBody) =>
    api.put<SiteSetting>("/api/site-settings", body).then((r) => r.data),
};
