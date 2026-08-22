'use client'

import React from 'react'
import { ShieldCheck, ShieldAlert, FileText, Trash2, CheckCircle2, Lock } from 'lucide-react'
import { usePrivacyStore } from '@/stores/privacyStore'

export const AuditLogTab: React.FC = () => {
  const { auditLogs, clearAuditLogs, currentRole, currentIntent } = usePrivacyStore()

  return (
    <div className="space-y-4 font-sans text-[#111111] p-1">
      
      {/* Header Info */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-200">
        <div className="space-y-0.5 text-left">
          <div className="flex items-center gap-2 font-mono font-bold text-xs text-[#2563EB] uppercase">
            <ShieldCheck size={16} />
            <span>AEGIS PRIVACY AUDIT TRAIL</span>
          </div>
          <p className="text-xs text-slate-500 font-normal">
            Real-time access log recording role, context, intent, and field revelations.
          </p>
        </div>

        {auditLogs.length > 0 && (
          <button
            onClick={clearAuditLogs}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 font-mono text-xs font-bold transition-all cursor-pointer"
          >
            <Trash2 size={13} />
            <span>Clear Logs</span>
          </button>
        )}
      </div>

      {/* Audit Log Entries Table */}
      {auditLogs.length === 0 ? (
        <div className="p-8 text-center bg-slate-50 rounded-2xl border border-slate-200 text-slate-400 font-mono text-xs space-y-2">
          <FileText size={28} className="mx-auto text-slate-300" />
          <p>No privacy access events recorded yet.</p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-slate-200 shadow-2xs bg-white">
          <table className="w-full text-left font-mono text-xs border-collapse">
            <thead>
              <tr className="bg-slate-100/90 text-slate-600 border-b border-slate-200 font-bold uppercase text-[10px] tracking-wider">
                <th className="p-3">Time</th>
                <th className="p-3">Role</th>
                <th className="p-3">Intent</th>
                <th className="p-3">Context</th>
                <th className="p-3">Field</th>
                <th className="p-3">Tier</th>
                <th className="p-3 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {auditLogs.map((log) => (
                <tr key={log.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="p-3 text-slate-400 font-medium whitespace-nowrap">{log.timestamp}</td>
                  <td className="p-3 font-bold text-[#111111]">{log.role}</td>
                  <td className="p-3 font-medium text-amber-700">{log.intent}</td>
                  <td className="p-3 text-slate-600 font-bold">{log.context}</td>
                  <td className="p-3 font-semibold text-[#2563EB] max-w-[200px] truncate" title={log.field}>
                    {log.field}
                  </td>
                  <td className="p-3">
                    <span
                      className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase ${
                        log.classification === 'RESTRICTED'
                          ? 'bg-purple-100 text-purple-700 border border-purple-300'
                          : log.classification === 'SENSITIVE'
                          ? 'bg-amber-100 text-amber-800 border border-amber-300'
                          : log.classification === 'OPERATIONAL'
                          ? 'bg-blue-100 text-blue-800 border border-blue-300'
                          : 'bg-slate-100 text-slate-700'
                      }`}
                    >
                      {log.classification}
                    </span>
                  </td>
                  <td className="p-3 text-center whitespace-nowrap">
                    {log.granted ? (
                      <span className="inline-flex items-center gap-1 text-emerald-700 font-bold text-[10px] bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-300">
                        <CheckCircle2 size={11} />
                        <span>UNLOCKED</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-amber-700 font-bold text-[10px] bg-amber-50 px-2 py-0.5 rounded-full border border-amber-300">
                        <Lock size={11} />
                        <span>REDACTED</span>
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

    </div>
  )
}
