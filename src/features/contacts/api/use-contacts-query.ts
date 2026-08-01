import { useInfiniteQuery, keepPreviousData } from '@tanstack/react-query'
import { apiClient } from '@/lib/api/client'
import { toApiError } from '@/lib/api/errors'
import type { components } from '@/lib/api/schema'

type Contact = components['schemas']['Contact']
type PaginatedContactList = components['schemas']['PaginatedContactList']

// `search`/`on_lain_dain` aren't declared as formal OpenApiParameters on
// the backend (undocumented but functional — see apps/contacts/views.py's
// ContactListView.get_queryset), so openapi-fetch's generated query type
// doesn't include them. The cast below is deliberate, not a typo.
interface ContactsQueryParams {
  cursor?: string
  search?: string
  on_lain_dain?: 'true' | 'false'
}

async function fetchContactsPage(
  cursor: string | undefined,
  search: string | undefined,
  onLainDain: boolean,
): Promise<PaginatedContactList> {
  const query: ContactsQueryParams = { on_lain_dain: onLainDain ? 'true' : 'false' }
  if (cursor) query.cursor = cursor
  if (search) query.search = search

  const { data, error } = await apiClient.GET('/api/contacts/', {
    // Cast to a plain string record, not `any` — see ContactsQueryParams
    // comment above: search/on_lain_dain/cursor are real, functional query
    // params the generated type just doesn't know about.
    params: { query: query as Record<string, string> },
  })
  if (error) throw toApiError(error)
  return data
}

function cursorFromUrl(url: string | null | undefined): string | undefined {
  if (!url) return undefined
  return new URL(url).searchParams.get('cursor') ?? undefined
}

/**
 * One category's synced contacts, paginated independently — on-app and
 * invite-only are two separate queries (via the backend's existing
 * `on_lain_dain` filter), each with its own cursor, rather than one mixed
 * feed split client-side. That matters for infinite scroll specifically:
 * with a single mixed feed ordered by display_name, an on-app contact
 * sorting later alphabetically wouldn't appear in its section until
 * enough pages had loaded to reach it — surprising the user with it
 * "appearing" only after scrolling past and back. Two independently
 * paginated lists can't do that; each one loads and grows predictably.
 */
export function useContactsQuery(onLainDain: boolean, search?: string) {
  const query = useInfiniteQuery({
    // 'list' distinguishes this from any pre-existing persisted cache
    // under the old plain ['contacts', search] key (this used to be a
    // flat useQuery<Contact[]>, and the query cache survives across app
    // restarts — see src/lib/query-persister-storage.ts). Reusing that key
    // for the new {pages, pageParams} infinite-query shape would hydrate
    // stale data with no `.pages` array and crash on `hasNextPage`.
    // Still starts with 'contacts' so useContactSyncMutation's
    // `invalidateQueries({queryKey: ['contacts']})` still matches both.
    queryKey: ['contacts', 'list', onLainDain, search ?? ''],
    queryFn: ({ pageParam }: { pageParam: string | undefined }) =>
      fetchContactsPage(pageParam, search, onLainDain),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => cursorFromUrl(lastPage.next),
    // Each keystroke changes `search` and so the whole query key — without
    // this, every keystroke would flash the list empty instead of keeping
    // the previous results visible until the new ones land.
    placeholderData: keepPreviousData,
  })

  const contacts: Contact[] = query.data?.pages.flatMap((page) => page.results) ?? []

  return {
    contacts,
    isLoading: query.isLoading,
    isFetchingNextPage: query.isFetchingNextPage,
    hasNextPage: !!query.hasNextPage,
    fetchNextPage: () => {
      void query.fetchNextPage()
    },
    error: query.error,
  }
}
