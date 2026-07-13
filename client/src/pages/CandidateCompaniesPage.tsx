import { useEffect, useMemo, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Button, Input } from '@heroui/react';
import { BriefcaseBusiness, Building2, CalendarDays, ChevronLeft, ChevronRight, MapPin, RotateCcw, Search, UsersRound } from 'lucide-react';
import { getCompanies, type PublicCompanyListItem } from '../lib/companies-api';
import type { ApiPagination } from '../lib/panel-api';
import { getCompanyLogoUrl } from '../lib/company-logo';

const pageSize = 12;

const formatOpenPositions = (count: number) => {
  if (count === 1) {
    return '1 open position';
  }

  return `${count} open positions`;
};

const getInitials = (name: string) =>
  name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('');

export const CandidateCompaniesPage = () => {
  const location = useLocation();
  const [companies, setCompanies] = useState<PublicCompanyListItem[]>([]);
  const [pagination, setPagination] = useState<ApiPagination | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchDraft, setSearchDraft] = useState('');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const backTo = useMemo(() => encodeURIComponent(`${location.pathname}${location.search}`), [location.pathname, location.search]);

  useEffect(() => {
    let mounted = true;

    const loadCompanies = async () => {
      setLoading(true);
      setError(null);

      try {
        const trimmedSearch = search.trim();
        const response = await getCompanies({
          page: currentPage,
          limit: pageSize,
          search: trimmedSearch.length >= 2 ? trimmedSearch : undefined,
        });

        if (!mounted) {
          return;
        }

        setCompanies(response.data);
        setPagination(response.pagination ?? null);
      } catch (loadError) {
        if (mounted) {
          setCompanies([]);
          setPagination(null);
          setError(loadError instanceof Error ? loadError.message : 'Unable to load companies');
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    void loadCompanies();

    return () => {
      mounted = false;
    };
  }, [currentPage, search]);

  useEffect(() => {
    const nextSearch = searchDraft.trim().length >= 2 ? searchDraft.trim() : '';

    if (nextSearch === search) {
      return;
    }

    const timer = window.setTimeout(() => {
      setCurrentPage(1);
      setSearch(nextSearch);
    }, 350);

    return () => window.clearTimeout(timer);
  }, [search, searchDraft]);

  const clearSearch = () => {
    setSearchDraft('');
    setSearch('');
    setCurrentPage(1);
  };

  return (
    <div className="grid gap-8">
      <section className="p-0">
        <div className="mb-6">
          <h2 className="text-4xl leading-[1.15] text-foreground">Browse companies</h2>
          <p className="mt-3 max-w-2xl text-sm leading-7 text-foreground-500">
            Explore approved companies and see how many active roles they have open.
          </p>
        </div>

        <form
          className="mb-6 grid grid-cols-[minmax(0,1fr)_40px] gap-3"
          onSubmit={(event) => {
            event.preventDefault();
            setCurrentPage(1);
            setSearch(searchDraft.trim().length >= 2 ? searchDraft.trim() : '');
          }}
        >
          <label className="relative block">
            <span className="sr-only">Search companies</span>
            <Search aria-hidden="true" className="pointer-events-none absolute left-3 top-1/2 z-10 h-4 w-4 -translate-y-1/2 text-foreground-500" />
            <Input
              aria-label="Search companies"
              className="h-10 rounded-lg pl-9 text-sm"
              fullWidth
              placeholder="Search by company name (2+ characters)"
              value={searchDraft}
              onChange={(event) => setSearchDraft(event.target.value)}
            />
          </label>
          <Button
            isIconOnly
            aria-label="Reset company search"
            type="button"
            variant="ghost"
            className="h-10 w-10 min-w-10 border border-divider text-foreground-500"
            isDisabled={!searchDraft && !search}
            onPress={clearSearch}
          >
            <RotateCcw aria-hidden="true" className="h-4 w-4" strokeWidth={1.8} />
          </Button>
        </form>

        {error && (
          <div className="mb-4 rounded-xl border border-danger/20 bg-danger/10 p-4 text-sm text-danger-700">
            {error}
          </div>
        )}

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {loading ? (
            <div className="rounded-xl border border-divider bg-content2 p-6 text-sm text-foreground-500 md:col-span-2 xl:col-span-3">
              Loading companies...
            </div>
          ) : companies.length === 0 ? (
            <div className="rounded-xl border border-dashed border-divider bg-content2 p-6 text-sm text-foreground-500 md:col-span-2 xl:col-span-3">
              No companies found.
            </div>
          ) : (
            companies.map((company) => {
              const logoUrl = getCompanyLogoUrl(company.logoUrl, company.websiteUrl);

              return (
                <article key={company.id} className="flex min-h-72 flex-col rounded-xl border border-divider bg-content1 p-5">
                  <div className="flex min-w-0 items-start gap-3">
                    <div className="flex h-14 w-11 shrink-0 items-center justify-start overflow-hidden rounded-xl text-sm font-semibold text-[#181d26]">
                      {logoUrl ? (
                        <img
                          alt={`${company.name} logo`}
                          className="h-11 w-11 object-contain"
                          src={logoUrl}
                        />
                      ) : (
                        <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#f5e9d4]">
                          {getInitials(company.name) || <Building2 aria-hidden="true" className="h-6 w-6" strokeWidth={1.7} />}
                        </span>
                      )}
                    </div>

                    <div className="min-w-0 flex-1">
                      <h3 className="truncate text-lg font-medium text-foreground">{company.name}</h3>
                      {company.websiteUrl ? (
                        <a
                          className="block truncate text-sm leading-5 text-foreground-500 underline-offset-4 hover:underline"
                          href={company.websiteUrl}
                          rel="noreferrer"
                          target="_blank"
                        >
                          {company.websiteUrl}
                        </a>
                      ) : (
                        <p className="truncate text-sm leading-5 text-foreground-500">
                          No website provided.
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="mt-5 grid gap-2 text-sm text-foreground-500">
                    <span className="text-status-success inline-flex items-center gap-2 font-medium">
                      <BriefcaseBusiness aria-hidden="true" className="h-4 w-4" strokeWidth={1.7} />
                      {formatOpenPositions(company.openPositionsCount)}
                    </span>
                    {company.numberOfEmployees && (
                      <span className="inline-flex items-center gap-2">
                        <UsersRound aria-hidden="true" className="h-4 w-4" strokeWidth={1.7} />
                        {company.numberOfEmployees} employees
                      </span>
                    )}
                    {company.foundingYear && (
                      <span className="inline-flex items-center gap-2">
                        <CalendarDays aria-hidden="true" className="h-4 w-4" strokeWidth={1.7} />
                        Founded {company.foundingYear}
                      </span>
                    )}
                    {company.address && (
                      <span className="inline-flex min-w-0 items-start gap-2">
                        <MapPin aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0" strokeWidth={1.7} />
                        <span className="min-w-0 break-words leading-6">{company.address}</span>
                      </span>
                    )}
                  </div>

                  <div className="mt-auto pt-5">
                    <Link
                      className="hover-brand inline-flex items-center justify-center rounded-lg bg-brand px-4 py-2 text-sm font-medium text-brand-foreground"
                      to={`/companies/${company.id}?backTo=${backTo}`}
                    >
                      View company
                    </Link>
                  </div>
                </article>
              );
            })
          )}
        </div>

        {pagination && pagination.totalPages > 1 && (
          <div className="mt-6 flex items-center justify-between gap-3 border-t border-divider pt-4">
            <span className="text-sm text-foreground-500">
              Page {pagination.currentPage} of {pagination.totalPages}
            </span>
            <div className="flex items-center gap-2">
              <Button
                isIconOnly
                aria-label="Previous page"
                type="button"
                variant="secondary"
                isDisabled={pagination.currentPage <= 1}
                onPress={() => setCurrentPage((page) => Math.max(1, page - 1))}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                isIconOnly
                aria-label="Next page"
                type="button"
                variant="secondary"
                isDisabled={pagination.currentPage >= pagination.totalPages}
                onPress={() => setCurrentPage((page) => Math.min(pagination.totalPages, page + 1))}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </section>
    </div>
  );
};
