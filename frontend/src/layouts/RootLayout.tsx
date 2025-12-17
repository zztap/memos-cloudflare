import { observer } from "mobx-react-lite";
import { Suspense, useEffect, useMemo, useState } from "react";
import { Outlet, useLocation, useSearchParams } from "react-router-dom";
import usePrevious from "react-use/lib/usePrevious";
import Navigation from "@/components/Navigation";
import useCurrentUser from "@/hooks/useCurrentUser";
import useResponsiveWidth from "@/hooks/useResponsiveWidth";
import Loading from "@/pages/Loading";
import { Routes } from "@/router";
import { workspaceStore } from "@/store/v2";
import memoFilterStore from "@/store/v2/memoFilter";
import { cn } from "@/utils";

const RootLayout = observer(() => {
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const { sm, lg } = useResponsiveWidth();
  const currentUser = useCurrentUser();
  const [initialized, setInitialized] = useState(false);
  const pathname = useMemo(() => location.pathname, [location.pathname]);
  const prevPathname = usePrevious(pathname);

  useEffect(() => {
    if (!currentUser) {
      if (workspaceStore.state.memoRelatedSetting.disallowPublicVisibility) {
        window.location.href = Routes.AUTH;
        return;
      } else if (([Routes.ROOT, Routes.RESOURCES, Routes.INBOX, Routes.ARCHIVED, Routes.SETTING] as string[]).includes(location.pathname)) {
        window.location.href = Routes.EXPLORE;
        return;
      }
    }
    setInitialized(true);
  }, []);

  useEffect(() => {
    if (prevPathname !== pathname && !searchParams.has("filter")) {
      memoFilterStore.removeFilter(() => true);
    }
  }, [prevPathname, pathname, searchParams]);

  return !initialized ? (
    <Loading />
  ) : (
    <div className={cn("w-full min-h-full flex flex-row justify-center items-start", sm ? "pl-16 lg:pl-56" : "")}>
      {sm && (
        <div
          className={cn(
            "group flex flex-col justify-start items-start fixed top-0 left-0 select-none border-r border-zinc-200 dark:border-zinc-800 h-full bg-zinc-100 dark:bg-zinc-800 dark:bg-opacity-40",
            "w-16 lg:w-56 px-2 transition-all duration-300",
          )}
        >
          <Navigation collapsed={!lg} />
        </div>
      )}
      <main className="w-full h-auto grow shrink flex flex-col justify-start items-center">
        <Suspense fallback={<Loading />}>
          <Outlet />
        </Suspense>
      </main>
    </div>
  );
});

export default RootLayout;
