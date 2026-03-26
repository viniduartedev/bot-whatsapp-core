import type { ReactNode } from 'react';

export interface DataTableColumn<T> {
  id: string;
  header: string;
  cell: (item: T) => ReactNode;
}

interface DataTableProps<T> {
  items: T[];
  columns: DataTableColumn<T>[];
  getRowKey: (item: T) => string;
  caption: string;
}

export function DataTable<T>({ items, columns, getRowKey, caption }: DataTableProps<T>) {
  return (
    <div className="table-shell">
      <table className="ops-table">
        <caption className="sr-only">{caption}</caption>
        <thead>
          <tr>
            {columns.map((column) => (
              <th key={column.id} scope="col">
                {column.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {items.map((item) => (
            <tr key={getRowKey(item)}>
              {columns.map((column) => (
                <td key={column.id}>{column.cell(item)}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
