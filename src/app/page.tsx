"use client";

import { useState } from "react";

type User = {
  id: string;
  email: string;
  name: string | null;
  role: "USER" | "ADMIN";
  planCode: "FREE" | "PRO";
  createdAt: string;
  _count?: { projects: number };
};

type Project = {
  id: string;
  name: string;
  status: string;
  updatedAt: string;
  sourceImageName: string | null;
  user: { email: string; name: string | null; planCode: string };
  palette: { name: string; brand: string; version: string };
  _count: { versions: number; exports: number };
};

type Palette = {
  id: string;
  brand: string;
  series: string;
  version: string;
  name: string;
  isActive: boolean;
  _count: { colors: number; projects: number; versions: number };
};

type ExportFile = {
  id: string;
  type: string;
  status: string;
  fileName: string;
  error: string | null;
  createdAt: string;
  completedAt: string | null;
  project: {
    id: string;
    name: string;
    user: { email: string; name: string | null; planCode: string };
  };
};

type Overview = {
  users: number;
  projects: number;
  versions: number;
  exports: number;
  palettes: number;
  failedExports: number;
};

type ApiResult<T> = {
  ok: boolean;
  data?: T;
  error?: { message: string };
};

async function api<T>(path: string, init?: RequestInit) {
  const response = await fetch(`/api/product${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...init?.headers,
    },
  });
  const result = (await response.json()) as ApiResult<T>;
  if (!response.ok || !result.ok) {
    throw new Error(result.error?.message ?? "请求失败。");
  }
  return result.data as T;
}

export default function AdminHome() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("请使用管理员账号登录。");
  const [overview, setOverview] = useState<Overview | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [palettes, setPalettes] = useState<Palette[]>([]);
  const [exports, setExports] = useState<ExportFile[]>([]);
  const [health, setHealth] = useState<"unknown" | "ok" | "failed">("unknown");
  const [isBusy, setIsBusy] = useState(false);

  async function loadDashboard() {
    const [overviewData, usersData, projectsData, palettesData, exportsData] = await Promise.all([
      api<{ users: number; projects: number; versions: number; exports: number; palettes: number; failedExports: number }>("/api/admin/overview"),
      api<{ users: User[] }>("/api/admin/users"),
      api<{ projects: Project[] }>("/api/admin/projects"),
      api<{ palettes: Palette[] }>("/api/admin/palettes"),
      api<{ exports: ExportFile[] }>("/api/admin/exports"),
    ]);
    setOverview(overviewData);
    setUsers(usersData.users);
    setProjects(projectsData.projects);
    setPalettes(palettesData.palettes);
    setExports(exportsData.exports);
    await checkHealth();
  }

  async function checkHealth() {
    try {
      await api("/api/health");
      await api("/api/ready");
      setHealth("ok");
    } catch {
      setHealth("failed");
    }
  }

  async function login() {
    setIsBusy(true);
    try {
      await api("/api/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      });
      await loadDashboard();
      setMessage("后台数据已加载。");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "登录失败。");
    } finally {
      setIsBusy(false);
    }
  }

  async function updateUser(userId: string, patch: Partial<Pick<User, "role" | "planCode">>) {
    setIsBusy(true);
    try {
      await api("/api/admin/users", {
        method: "PATCH",
        body: JSON.stringify({ userId, ...patch }),
      });
      await loadDashboard();
      setMessage("用户权限已更新。");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "更新失败。");
    } finally {
      setIsBusy(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#f4f1ea] text-[#1d1b17]">
      <header className="border-b border-[#ded7c7] bg-[#fbfaf6] px-6 py-4">
        <div className="mx-auto flex max-w-7xl flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="font-mono text-xs uppercase tracking-[0.24em] text-[#746b5d]">Coco Pixel</p>
            <h1 className="text-2xl font-semibold tracking-tight">后台管理系统</h1>
          </div>
          <button className="h-10 rounded-md border border-[#c9bfae] px-4 text-sm font-medium" onClick={loadDashboard} disabled={isBusy}>
            刷新数据
          </button>
        </div>
      </header>

      <div className="mx-auto grid max-w-7xl gap-5 px-6 py-5 xl:grid-cols-[320px_1fr]">
        <aside className="space-y-4">
          <section className="rounded-lg border border-[#ded7c7] bg-[#fbfaf6] p-4">
            <h2 className="text-sm font-semibold">管理员登录</h2>
            <div className="mt-3 space-y-3">
              <input className="h-10 w-full rounded-md border border-[#c9bfae] bg-white px-3 text-sm" placeholder="管理员邮箱" value={email} onChange={(event) => setEmail(event.target.value)} />
              <input className="h-10 w-full rounded-md border border-[#c9bfae] bg-white px-3 text-sm" placeholder="密码" type="password" value={password} onChange={(event) => setPassword(event.target.value)} />
              <button className="h-10 w-full rounded-md bg-[#1d1b17] text-sm font-semibold text-white" onClick={login} disabled={isBusy}>
                登录并加载
              </button>
              <p className="text-xs leading-5 text-[#746b5d]">{message}</p>
            </div>
          </section>

          <section className="rounded-lg border border-[#ded7c7] bg-[#fbfaf6] p-4">
            <h2 className="text-sm font-semibold">系统概览</h2>
            <p className="mt-2 text-xs text-[#746b5d]">
              服务状态：{health === "ok" ? "可用" : health === "failed" ? "异常" : "未检测"}
            </p>
            <div className="mt-3 grid grid-cols-2 gap-2">
              {[
                ["用户", overview?.users ?? 0],
                ["项目", overview?.projects ?? 0],
                ["版本", overview?.versions ?? 0],
                ["导出", overview?.exports ?? 0],
                ["色卡", overview?.palettes ?? 0],
                ["失败导出", overview?.failedExports ?? 0],
              ].map(([label, value]) => (
                <div key={label} className="rounded-md bg-white p-3">
                  <p className="text-lg font-semibold">{value}</p>
                  <p className="text-xs text-[#746b5d]">{label}</p>
                </div>
              ))}
            </div>
          </section>
        </aside>

        <section className="space-y-5">
          <section className="rounded-lg border border-[#ded7c7] bg-[#fbfaf6] p-4">
            <h2 className="text-sm font-semibold">用户与权限</h2>
            <div className="mt-3 overflow-auto">
              <table className="w-full min-w-[760px] border-collapse text-sm">
                <thead className="text-left text-xs text-[#746b5d]">
                  <tr>
                    <th className="border-b border-[#ded7c7] py-2">用户</th>
                    <th className="border-b border-[#ded7c7] py-2">角色</th>
                    <th className="border-b border-[#ded7c7] py-2">套餐</th>
                    <th className="border-b border-[#ded7c7] py-2">项目</th>
                    <th className="border-b border-[#ded7c7] py-2">操作</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user) => (
                    <tr key={user.id}>
                      <td className="border-b border-[#eee7da] py-2">
                        <p className="font-medium">{user.email}</p>
                        <p className="text-xs text-[#746b5d]">{user.name || "未命名"}</p>
                      </td>
                      <td className="border-b border-[#eee7da] py-2">{user.role}</td>
                      <td className="border-b border-[#eee7da] py-2">{user.planCode}</td>
                      <td className="border-b border-[#eee7da] py-2">{user._count?.projects ?? 0}</td>
                      <td className="space-x-2 border-b border-[#eee7da] py-2">
                        <button className="rounded border border-[#c9bfae] px-2 py-1 text-xs" onClick={() => updateUser(user.id, { planCode: user.planCode === "PRO" ? "FREE" : "PRO" })}>
                          切换套餐
                        </button>
                        <button className="rounded border border-[#c9bfae] px-2 py-1 text-xs" onClick={() => updateUser(user.id, { role: user.role === "ADMIN" ? "USER" : "ADMIN" })}>
                          切换角色
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <section className="grid gap-5 xl:grid-cols-2">
            <div className="rounded-lg border border-[#ded7c7] bg-[#fbfaf6] p-4">
              <h2 className="text-sm font-semibold">最近项目</h2>
              <div className="mt-3 max-h-96 space-y-2 overflow-auto">
                {projects.map((project) => (
                  <div key={project.id} className="rounded-md bg-white p-3 text-sm">
                    <p className="font-semibold">{project.name}</p>
                    <p className="mt-1 text-xs text-[#746b5d]">{project.user.email} · {project.palette.name}</p>
                    <p className="mt-1 text-xs text-[#746b5d]">{project.status} · {project._count.versions} 版本 · {project._count.exports} 导出</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-lg border border-[#ded7c7] bg-[#fbfaf6] p-4">
              <h2 className="text-sm font-semibold">色卡版本</h2>
              <div className="mt-3 max-h-96 space-y-2 overflow-auto">
                {palettes.map((palette) => (
                  <div key={palette.id} className="rounded-md bg-white p-3 text-sm">
                    <p className="font-semibold">{palette.name}</p>
                    <p className="mt-1 text-xs text-[#746b5d]">{palette.brand} / {palette.series} / {palette.version}</p>
                    <p className="mt-1 text-xs text-[#746b5d]">{palette._count.colors} 色 · {palette._count.projects} 项目 · {palette.isActive ? "启用" : "停用"}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>

          <section className="rounded-lg border border-[#ded7c7] bg-[#fbfaf6] p-4">
            <h2 className="text-sm font-semibold">导出队列</h2>
            <div className="mt-3 overflow-auto">
              <table className="w-full min-w-[760px] border-collapse text-sm">
                <thead className="text-left text-xs text-[#746b5d]">
                  <tr>
                    <th className="border-b border-[#ded7c7] py-2">文件</th>
                    <th className="border-b border-[#ded7c7] py-2">项目</th>
                    <th className="border-b border-[#ded7c7] py-2">用户</th>
                    <th className="border-b border-[#ded7c7] py-2">状态</th>
                    <th className="border-b border-[#ded7c7] py-2">错误</th>
                  </tr>
                </thead>
                <tbody>
                  {exports.map((item) => (
                    <tr key={item.id}>
                      <td className="border-b border-[#eee7da] py-2">
                        <p className="font-medium">{item.fileName}</p>
                        <p className="text-xs text-[#746b5d]">{item.type} · {new Date(item.createdAt).toLocaleString("zh-CN")}</p>
                      </td>
                      <td className="border-b border-[#eee7da] py-2">{item.project.name}</td>
                      <td className="border-b border-[#eee7da] py-2">{item.project.user.email}</td>
                      <td className="border-b border-[#eee7da] py-2">{item.status}</td>
                      <td className="border-b border-[#eee7da] py-2">{item.error || "-"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </section>
      </div>
    </main>
  );
}
