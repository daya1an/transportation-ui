import { useState } from 'react'
import ErrorPanel from '../../components/ErrorPanel'
import {
  useExplorerColumns,
  useExplorerSample,
  useExplorerTables,
} from '../../hooks/queries'
import PageHeader from '../../layout/PageHeader'
import { ColumnsPanel } from './ColumnsPanel'
import { SamplePanel } from './SamplePanel'
import { TableList } from './TableList'

function tableKeyOf(item) {
  return item?.key ?? item?.city ?? item?.id ?? item?.name ?? ''
}

function tableNameOf(item) {
  return item?.table ?? item?.table_name ?? item?.full_name ?? item?.label ?? ''
}

export default function ExplorerPage() {
  const [selectedKey, setSelectedKey] = useState(null)
  const [limit, setLimit] = useState(25)

  const tablesQuery = useExplorerTables()
  const tables = Array.isArray(tablesQuery.data)
    ? tablesQuery.data
    : tablesQuery.data?.tables ?? tablesQuery.data?.items ?? []

  const firstKey = tables.length > 0 ? tableKeyOf(tables[0]) : null
  const activeKey =
    selectedKey && tables.some((t) => tableKeyOf(t) === selectedKey)
      ? selectedKey
      : firstKey
  const activeTable = tables.find((t) => tableKeyOf(t) === activeKey) ?? null
  const activeTableName = activeTable ? tableNameOf(activeTable) : undefined

  const hasSelection = Boolean(activeKey)
  const columnsQuery = useExplorerColumns(activeKey, { enabled: hasSelection })
  const sampleQuery = useExplorerSample(activeKey, limit, { enabled: hasSelection })

  const columns = Array.isArray(columnsQuery.data)
    ? columnsQuery.data
    : columnsQuery.data?.columns ?? columnsQuery.data?.items ?? []

  const sampleRows = Array.isArray(sampleQuery.data)
    ? sampleQuery.data
    : sampleQuery.data?.rows ?? sampleQuery.data?.items ?? []

  const sampleColumns =
    sampleQuery.data?.columns ?? (Array.isArray(sampleRows[0]) ? columns : [])

  const tablesLoading = tablesQuery.isPending
  const columnsLoading = tablesLoading || (hasSelection && columnsQuery.isPending)
  const columnsRefreshing = columnsQuery.isFetching && !columnsQuery.isPending
  const sampleLoading = tablesLoading || (hasSelection && sampleQuery.isPending)
  const sampleRefreshing = sampleQuery.isFetching && !sampleQuery.isPending

  return (
    <div className="space-y-5">
      <PageHeader
        overline="Data"
        title="Table explorer"
        subtitle="Inspect gold trip tables, column schemas and sample rows."
      />

      {tablesQuery.isError ? (
        <ErrorPanel
          title="Could not load tables"
          error={tablesQuery.error}
          onRetry={() => tablesQuery.refetch()}
        />
      ) : (
        <div className="grid gap-4 lg:grid-cols-12">
          <div className="min-w-0 lg:col-span-4 xl:col-span-3">
            <TableList
              tables={tables}
              selectedKey={activeKey}
              onSelect={setSelectedKey}
              loading={tablesLoading}
            />
          </div>

          <div className="min-w-0 space-y-5 lg:col-span-8 xl:col-span-9">
            <ColumnsPanel
              columns={columns}
              tableName={activeTableName}
              loading={columnsLoading}
              refreshing={columnsRefreshing}
              error={columnsQuery.isError ? columnsQuery.error : null}
              onRetry={() => columnsQuery.refetch()}
            />

            <SamplePanel
              rows={sampleRows}
              columns={sampleColumns}
              tableName={activeTableName}
              limit={limit}
              onLimitChange={setLimit}
              loading={sampleLoading}
              refreshing={sampleRefreshing}
              error={sampleQuery.isError ? sampleQuery.error : null}
              onRetry={() => sampleQuery.refetch()}
            />
          </div>
        </div>
      )}
    </div>
  )
}