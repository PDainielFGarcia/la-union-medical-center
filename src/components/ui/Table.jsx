import { EmptyState } from './EmptyState'

export function Table({ columns, rows = [], rowKey = 'id', empty = 'No records found.' }) {
  if (!rows.length) {
    return <EmptyState title={empty} />
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full text-sm">
        <thead>
          <tr className="text-left text-xs font-semibold tracking-wider text-slate-500 border-b border-slate-200">
            {columns.map((column) => (
              <th key={column.key} className="px-3 py-3 whitespace-nowrap">
                {column.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row[rowKey]} className="border-b border-slate-100 last:border-0 hover:bg-slate-50">
              {columns.map((column) => (
                <td key={column.key} className="px-3 py-3 align-middle text-slate-700">
                  {column.render ? column.render(row) : row[column.key] || '—'}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
