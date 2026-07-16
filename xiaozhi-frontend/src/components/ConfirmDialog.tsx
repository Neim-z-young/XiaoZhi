import { useState, useEffect } from 'react';

interface ConfirmationItem {
  confirmId: string;
  toolName: string;
  args: any;
}

interface ConfirmDialogProps {
  pendingConfirmations: ConfirmationItem[];
  onApprove: (confirmId: string) => void;
  onReject: (confirmId: string) => void;
}

export function ConfirmDialog({ pendingConfirmations, onApprove, onReject }: ConfirmDialogProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  if (pendingConfirmations.length === 0) {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 w-96 bg-surface-light border border-border rounded-xl shadow-lg overflow-hidden z-50">
      <div className="p-3 bg-warning/20 border-b border-border">
        <h3 className="font-semibold text-warning">待确认操作</h3>
        <p className="text-sm text-textMuted">{pendingConfirmations.length} 个操作需要确认</p>
      </div>
      
      <div className="max-h-64 overflow-y-auto">
        {pendingConfirmations.map((item) => (
          <div key={item.confirmId} className="border-b border-border last:border-b-0">
            <div
              className="p-3 cursor-pointer hover:bg-surface-lighter transition-colors"
              onClick={() => setExpandedId(expandedId === item.confirmId ? null : item.confirmId)}
            >
              <div className="flex items-center justify-between">
                <span className="font-medium text-textPrimary">{item.toolName}</span>
                <span className="text-xs text-textMuted">
                  {expandedId === item.confirmId ? '点击收起' : '点击展开'}
                </span>
              </div>
            </div>
            
            {expandedId === item.confirmId && (
              <div className="px-3 pb-3">
                <div className="bg-surface rounded-lg p-3 mb-3">
                  <p className="text-xs text-textMuted mb-1">参数详情:</p>
                  <pre className="text-sm text-textPrimary overflow-x-auto">
                    {JSON.stringify(item.args, null, 2)}
                  </pre>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => onApprove(item.confirmId)}
                    className="flex-1 px-3 py-2 bg-success text-white rounded-lg hover:bg-success/80 transition-colors text-sm"
                  >
                    批准
                  </button>
                  <button
                    onClick={() => onReject(item.confirmId)}
                    className="flex-1 px-3 py-2 bg-error text-white rounded-lg hover:bg-error/80 transition-colors text-sm"
                  >
                    拒绝
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
