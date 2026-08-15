const PLACEHOLDERS = 12;

export default function Loading() {
  return (
    <div
      className="flex flex-1 flex-col md:flex-row"
      role="status"
      aria-busy="true"
    >
      <span className="sr-only">Carregando ciclos</span>

      <aside
        aria-hidden="true"
        className="w-full shrink-0 border-b border-border bg-panel md:w-64 md:border-r md:border-b-0"
      >
        <div className="px-5 pt-5 pb-8">
          <div className="flex h-6 items-center">
            <div className="h-4 w-24 animate-pulse rounded bg-panel-sunken" />
          </div>
          {Array.from({ length: 3 }).map((_, group) => (
            <div key={group} className="border-b border-border py-4">
              <div className="mb-3 h-2.5 w-20 animate-pulse rounded bg-panel-sunken" />
              <div className="flex flex-col gap-2.5">
                {Array.from({ length: 4 }).map((_, row) => (
                  <div
                    key={row}
                    className="h-3 w-full animate-pulse rounded bg-panel-sunken"
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      </aside>

      <div className="flex-1 px-8 py-6">
        <div className="mb-5 flex h-4 items-baseline">
          <div className="h-3 w-28 animate-pulse rounded bg-panel-sunken" />
        </div>

        <div aria-hidden="true" className="flex flex-wrap gap-8">
          {Array.from({ length: PLACEHOLDERS }).map((_, i) => (
            <div
              key={i}
              className="w-[300px] rounded-2xl border b-border-card bg-panel px-4 py-3"
            >
              <div className="h-32.5 animate-pulse rounded-[5px] bg-panel-sunken" />
              <div className="mt-3 h-5 w-3/4 animate-pulse rounded bg-panel-sunken" />
              <div className="mt-2 h-3.5 w-1/2 animate-pulse rounded bg-panel-sunken" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
